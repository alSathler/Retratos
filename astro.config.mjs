import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
    site: "https://alsathler.github.io",
    base: "/Retratos",
    trailingSlash: "never",
    devToolbar: {
        enabled: false,
    },
    build: {
        format: "file",
    },
    integrations: [sitemap()],
    image: {
        responsiveStyles: true,
    },
    vite: {
        server: {
            watch: {
                ignored: ["**/.atlas-browser-check/**", "**/.atlas-browser-check2/**"],
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: "modern-compiler",
                },
            },
        },
    },
});
