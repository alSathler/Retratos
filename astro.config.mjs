import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
    site: "https://4gray.github.io",
    base: "/panoramas",
    trailingSlash: "never",
    build: {
        format: "file",
    },
    integrations: [sitemap()],
    image: {
        responsiveStyles: true,
    },
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    api: "modern-compiler",
                },
            },
        },
    },
});
