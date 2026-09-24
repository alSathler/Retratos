"""Local assistant for adding a photograph to this Astro site.

Run after installing Pillow:  py -m pip install -r requirements-photo-publisher.txt
Then:                         py photo_publisher.py
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import threading
import tkinter as tk
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from PIL import ExifTags, Image, ImageOps, ImageTk
try:
    from pillow_heif import register_heif_opener
except ImportError:  # JPEG/PNG/WebP remain usable when HEIC support is not installed.
    register_heif_opener = None


# The packaged app lives beside the project files; during normal Python use,
# the source file itself occupies that same location.
ROOT = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
ASSET_DIR = ROOT / "assets" / "images"
CONTENT_DIR = ROOT / "src" / "content" / "panoramas"
FULL_DIR = ROOT / "public" / "images" / "full"
DISPLAY_WIDTH = 2000
USER_AGENT = "personal-photo-journal/1.0 (local desktop tool)"
MONTHS_PT = (
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
)

if register_heif_opener:
    register_heif_opener()


def quoted(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def number(value) -> float:
    return float(value.numerator) / float(value.denominator) if hasattr(value, "numerator") else float(value)


def gps_decimal(values, reference) -> float:
    degrees, minutes, seconds = (number(item) for item in values)
    result = degrees + minutes / 60 + seconds / 3600
    return -result if str(reference).upper() in {"S", "W"} else result


def read_photo_metadata(path: Path) -> dict[str, str]:
    with Image.open(path) as source:
        exif = source.getexif()
        values = {ExifTags.TAGS.get(key, key): value for key, value in exif.items()}
        # With JPEGs from iPhone, Pillow may expose GPSInfo as an integer
        # pointer in the top-level EXIF table. get_ifd resolves that pointer.
        try:
            gps_info = exif.get_ifd(34853)  # GPSInfo EXIF tag
        except (KeyError, TypeError, AttributeError):
            gps_info = values.get("GPSInfo", {})
        if not hasattr(gps_info, "items"):
            gps_info = {}
        gps = {ExifTags.GPSTAGS.get(key, key): value for key, value in gps_info.items()}
        date = str(values.get("DateTimeOriginal") or values.get("DateTime") or "")
        result = {"date": "", "latitude": "", "longitude": ""}
        if date:
            try:
                result["date"] = datetime.strptime(date, "%Y:%m:%d %H:%M:%S").date().isoformat()
            except ValueError:
                pass
        if "GPSLatitude" in gps and "GPSLongitude" in gps:
            result["latitude"] = f"{gps_decimal(gps['GPSLatitude'], gps.get('GPSLatitudeRef', 'N')):.6f}"
            result["longitude"] = f"{gps_decimal(gps['GPSLongitude'], gps.get('GPSLongitudeRef', 'E')):.6f}"
        return result


class Publisher(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Adicionar foto ao diário do explorador")
        self.minsize(790, 820)
        self.source: Path | None = None
        self.preview_image = None
        self.last_entry_paths: list[Path] = []
        self.vars = {name: tk.StringVar() for name in ("title", "title_en", "slug", "date", "country", "country_en", "latitude", "longitude", "alt", "alt_en")}
        self.date_day = tk.StringVar()
        self.date_month = tk.StringVar()
        self.date_year = tk.StringVar()
        self.vars["date"].trace_add("write", self._sync_date_parts_from_iso)
        self.include_full = tk.BooleanVar(value=False)
        self.status = tk.StringVar(value="Escolha uma foto para começar.")
        self._build()

    def _build(self):
        outer = ttk.Frame(self, padding=18)
        outer.grid(sticky="nsew")
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)
        outer.columnconfigure(1, weight=1)
        outer.rowconfigure(1, weight=1)

        ttk.Button(outer, text="Escolher foto…", command=self.choose).grid(row=0, column=0, sticky="w")
        self.file_label = ttk.Label(outer, text="Nenhum arquivo selecionado")
        self.file_label.grid(row=0, column=1, sticky="w", padx=(14, 0))
        self.preview = ttk.Label(outer, text="A prévia aparecerá aqui", anchor="center")
        self.preview.grid(row=1, column=0, sticky="nsew", pady=(16, 0), padx=(0, 18))

        form = ttk.Frame(outer)
        form.grid(row=1, column=1, sticky="nsew", pady=(16, 0))
        form.columnconfigure(1, weight=1)
        fields = [("Título (PT-BR)", "title"), ("Título (inglês)", "title_en"), ("Slug / endereço", "slug"), ("Data", "date"), ("País (PT-BR)", "country"), ("País (inglês)", "country_en"), ("Latitude", "latitude"), ("Longitude", "longitude"), ("Descrição da imagem (PT-BR)", "alt"), ("Descrição da imagem (inglês)", "alt_en")]
        for row, (label, key) in enumerate(fields):
            ttk.Label(form, text=label).grid(row=row, column=0, sticky="w", pady=4)
            if key == "date":
                self._build_date_input(form, row)
            else:
                ttk.Entry(form, textvariable=self.vars[key], width=42).grid(row=row, column=1, sticky="ew", pady=4)
        ttk.Button(form, text="Buscar país/cidade pelo GPS", command=self.reverse_geocode).grid(row=len(fields), column=1, sticky="w", pady=(8, 12))
        ttk.Label(form, text="Comentário").grid(row=len(fields) + 1, column=0, sticky="nw", pady=4)
        self.comment = tk.Text(form, height=9, width=42, wrap="word")
        self.comment.grid(row=len(fields) + 1, column=1, sticky="nsew", pady=4)
        ttk.Label(form, text="Comentário (inglês)").grid(row=len(fields) + 2, column=0, sticky="nw", pady=4)
        self.comment_en = tk.Text(form, height=7, width=42, wrap="word")
        self.comment_en.grid(row=len(fields) + 2, column=1, sticky="nsew", pady=4)
        ttk.Checkbutton(form, text="Criar também arquivo WebP de resolução total", variable=self.include_full).grid(row=len(fields) + 3, column=1, sticky="w", pady=8)
        actions = ttk.Frame(form)
        actions.grid(row=len(fields) + 4, column=1, sticky="e", pady=(8, 0))
        self.github_button = ttk.Button(actions, text="Publicar no GitHub", command=self.publish_to_github, state="disabled")
        self.github_button.grid(row=0, column=0, padx=(0, 8))
        ttk.Button(actions, text="Preparar no projeto", command=self.publish).grid(row=0, column=1)
        ttk.Label(outer, textvariable=self.status, wraplength=730).grid(row=2, column=0, columnspan=2, sticky="w", pady=(15, 0))

    def _build_date_input(self, parent, row: int):
        frame = ttk.Frame(parent)
        frame.grid(row=row, column=1, sticky="w", pady=4)
        year_limit = datetime.now().year + 1
        day = ttk.Spinbox(frame, from_=1, to=31, width=4, textvariable=self.date_day)
        month = ttk.Combobox(frame, values=MONTHS_PT, width=11, textvariable=self.date_month, state="readonly")
        year = ttk.Spinbox(frame, from_=1900, to=year_limit, width=6, textvariable=self.date_year)
        day.grid(row=0, column=0)
        ttk.Label(frame, text="de").grid(row=0, column=1, padx=4)
        month.grid(row=0, column=2)
        ttk.Label(frame, text="de").grid(row=0, column=3, padx=4)
        year.grid(row=0, column=4)
        ttk.Button(frame, text="Hoje", command=self._set_today).grid(row=0, column=5, padx=(8, 0))
        for control in (day, month, year):
            control.bind("<FocusOut>", self._sync_iso_from_date_parts)
            control.bind("<Return>", self._sync_iso_from_date_parts)
        month.bind("<<ComboboxSelected>>", self._sync_iso_from_date_parts)

    def _set_today(self):
        today = datetime.now().date()
        self.vars["date"].set(today.isoformat())

    def _sync_date_parts_from_iso(self, *_):
        value = self.vars["date"].get().strip()
        try:
            date = datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            return
        self.date_day.set(str(date.day))
        self.date_month.set(MONTHS_PT[date.month - 1])
        self.date_year.set(str(date.year))

    def _sync_iso_from_date_parts(self, *_):
        try:
            self._date_from_parts()
        except ValueError:
            # Keep partial typing intact; publish will explain invalid dates.
            pass

    def _date_from_parts(self) -> str:
        day, month, year = self.date_day.get().strip(), self.date_month.get().strip(), self.date_year.get().strip()
        if not any((day, month, year)):
            return ""
        if not all((day, month, year)):
            raise ValueError("Complete dia, mês e ano da data.")
        if month not in MONTHS_PT:
            raise ValueError("Escolha um mês válido.")
        try:
            value = datetime(int(year), MONTHS_PT.index(month) + 1, int(day)).date().isoformat()
        except ValueError as error:
            raise ValueError("Informe uma data válida.") from error
        self.vars["date"].set(value)
        return value

    def choose(self):
        name = filedialog.askopenfilename(filetypes=[("Fotos", "*.jpg *.jpeg *.png *.webp *.heic *.heif *.JPG *.JPEG *.PNG *.WEBP *.HEIC *.HEIF"), ("Todos", "*.*")])
        if not name:
            return
        self.source = Path(name)
        try:
            metadata = read_photo_metadata(self.source)
            for key, value in metadata.items():
                if value:
                    self.vars[key].set(value)
            stem = self.source.stem.replace("_", " ").replace("-", " ")
            self.vars["slug"].set(slugify(stem))
            self.vars["title"].set(stem.title())
            self.vars["alt"].set(f"Fotografia: {stem}")
            self._show_preview()
            self.file_label.config(text=self.source.name)
            self.status.set("EXIF lido. Revise os campos antes de publicar.")
        except Exception as error:
            messagebox.showerror("Não foi possível abrir a foto", str(error))

    def _show_preview(self):
        with Image.open(self.source) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((340, 500))
            self.preview_image = ImageTk.PhotoImage(image)
        self.preview.configure(image=self.preview_image, text="")

    def reverse_geocode(self):
        try:
            lat, lon = float(self.vars["latitude"].get()), float(self.vars["longitude"].get())
        except ValueError:
            messagebox.showwarning("GPS ausente", "Informe latitude e longitude, ou escolha uma foto que tenha GPS no EXIF.")
            return
        self.status.set("Consultando OpenStreetMap…")
        threading.Thread(target=self._geocode_request, args=(lat, lon), daemon=True).start()

    def _geocode_request(self, lat: float, lon: float):
        try:
            query = urllib.parse.urlencode({"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 10, "addressdetails": 1})
            request = urllib.request.Request(f"https://nominatim.openstreetmap.org/reverse?{query}", headers={"User-Agent": USER_AGENT, "Accept-Language": "pt"})
            with urllib.request.urlopen(request, timeout=15) as response:
                address = json.load(response).get("address", {})
            country = address.get("country", "")
            city = address.get("city") or address.get("town") or address.get("village") or ""
            self.after(0, lambda: self._apply_place(country, city))
        except Exception as error:
            self.after(0, lambda: self.status.set(f"Não foi possível consultar o local: {error}"))

    def _apply_place(self, country: str, city: str):
        if country:
            self.vars["country"].set(slugify(country))
        if city and not self.vars["title"].get().strip():
            self.vars["title"].set(city)
        self.status.set(f"Sugestão encontrada: {city + ', ' if city else ''}{country}. Você pode editar tudo.")

    def publish(self):
        if not self.source:
            messagebox.showwarning("Falta uma foto", "Escolha uma foto primeiro.")
            return
        values = {key: var.get().strip() for key, var in self.vars.items()}
        values["slug"] = slugify(values["slug"])
        try:
            values["date"] = self._date_from_parts()
        except ValueError as error:
            messagebox.showwarning("Data inválida", str(error))
            return
        if not all(values[key] for key in ("title", "title_en", "slug", "date", "country", "country_en", "alt", "alt_en")):
            messagebox.showwarning("Campos obrigatórios", "Preencha os campos em PT-BR e inglês, além de slug, data e país.")
            return
        try:
            datetime.strptime(values["date"], "%Y-%m-%d")
            lat = float(values["latitude"]) if values["latitude"] else None
            lon = float(values["longitude"]) if values["longitude"] else None
            if (lat is None) != (lon is None):
                raise ValueError("Preencha latitude e longitude juntas, ou deixe ambas vazias.")
            self._write_entry(values, lat, lon)
        except Exception as error:
            messagebox.showerror("Não foi possível publicar", str(error))

    def _write_entry(self, values: dict[str, str], lat: float | None, lon: float | None):
        ASSET_DIR.mkdir(parents=True, exist_ok=True)
        CONTENT_DIR.mkdir(parents=True, exist_ok=True)
        FULL_DIR.mkdir(parents=True, exist_ok=True)
        image_path = ASSET_DIR / f"{values['slug']}.webp"
        entry_path = CONTENT_DIR / f"{values['slug']}.md"
        full_path = FULL_DIR / f"{values['slug']}.webp"
        if entry_path.exists() or image_path.exists():
            raise FileExistsError(f"Já existe uma entrada ou imagem com o slug “{values['slug']}”.")
        with Image.open(self.source) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            original_width, original_height = image.size
            display = image.copy()
            if display.width > DISPLAY_WIDTH:
                display.thumbnail((DISPLAY_WIDTH, 100000))
            display.save(image_path, "WEBP", quality=88, method=6)
            full_block = ""
            if self.include_full.get():
                image.save(full_path, "WEBP", quality=92, method=6)
                full_block = f"full:\n  src: /images/full/{values['slug']}.webp\n  width: {original_width}\n  height: {original_height}\n"
        coordinates = "" if lat is None else f"latitude: {lat}\nlongitude: {lon}\n"
        comment = self.comment.get("1.0", "end-1c").strip()
        comment_en = self.comment_en.get("1.0", "end-1c").strip()
        markdown = f"---\ntitle: {quoted(values['title'])}\ntitleEn: {quoted(values['title_en'])}\ncountry: {quoted(values['country'])}\ncountryEn: {quoted(values['country_en'])}\ndate: {quoted(values['date'])}\n{coordinates}image: ../../../assets/images/{values['slug']}.webp\n{full_block}alt: {quoted(values['alt'])}\naltEn: {quoted(values['alt_en'])}\n"
        if comment_en:
            markdown += f"noteEn: {quoted(comment_en)}\n"
        markdown += "---\n"
        if comment:
            markdown += f"\n{comment}\n"
        entry_path.write_text(markdown, encoding="utf-8")
        self.last_entry_paths = [image_path, entry_path]
        if self.include_full.get():
            self.last_entry_paths.append(full_path)
        self.github_button.state(["!disabled"])
        self.status.set(f"Pronto: {entry_path.relative_to(ROOT)} e {image_path.relative_to(ROOT)}")
        messagebox.showinfo("Foto adicionada", "Os arquivos foram criados. Clique em ‘Publicar no GitHub’ para enviar o diário ao site.")

    def publish_to_github(self):
        if not self.last_entry_paths:
            messagebox.showwarning("Nenhuma entrada nova", "Primeiro prepare uma foto neste programa. Depois ela poderá ser enviada ao GitHub.")
            return
        self.github_button.state(["disabled"])
        self.status.set("Enviando a entrada ao GitHub…")
        threading.Thread(target=self._git_publish, daemon=True).start()

    def _git_publish(self):
        safe_root = f"safe.directory={ROOT.as_posix()}"
        base = ["git", "-c", safe_root]
        relative_paths = [str(path.relative_to(ROOT)) for path in self.last_entry_paths]
        title = self.vars["title"].get().strip() or "nova entrada"
        try:
            subprocess.run(base + ["add", "--", *relative_paths], cwd=ROOT, check=True, capture_output=True, text=True)
            staged = subprocess.run(base + ["diff", "--cached", "--quiet"], cwd=ROOT, capture_output=True, text=True)
            if staged.returncode == 0:
                raise RuntimeError("Não há arquivos novos para enviar.")
            if staged.returncode != 1:
                raise RuntimeError(staged.stderr.strip() or "Não foi possível conferir os arquivos preparados.")
            subprocess.run(base + ["commit", "-m", f"Adiciona {title}"], cwd=ROOT, check=True, capture_output=True, text=True)
            subprocess.run(base + ["push"], cwd=ROOT, check=True, capture_output=True, text=True)
        except (OSError, subprocess.CalledProcessError, RuntimeError) as error:
            details = error.stderr.strip() if isinstance(error, subprocess.CalledProcessError) else str(error)
            self.after(0, lambda: self._git_finished(False, details))
            return
        self.after(0, lambda: self._git_finished(True, ""))

    def _git_finished(self, success: bool, details: str):
        self.github_button.state(["!disabled"])
        if success:
            self.status.set("Enviado ao GitHub. O Pages atualizará em alguns minutos.")
            messagebox.showinfo("Publicado", "A entrada foi enviada ao GitHub. O site será atualizado automaticamente em alguns minutos.")
        else:
            self.status.set("Não foi possível enviar ao GitHub.")
            messagebox.showerror("Falha ao publicar no GitHub", details or "Confira sua conexão e autenticação do GitHub.")


if __name__ == "__main__":
    Publisher().mainloop()
