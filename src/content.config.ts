import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const panoramas = defineCollection({
    loader: glob({ pattern: "*.md", base: "./src/content/panoramas" }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            country: z.string(),
            date: z.coerce.date(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
            image: image(),
            alt: z.string(),
        }),
});

export const collections = { panoramas };
