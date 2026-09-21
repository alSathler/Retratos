import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const panoramas = defineCollection({
    loader: glob({ pattern: "*.md", base: "./src/content/panoramas" }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            titleEn: z.string().optional(),
            country: z.string(),
            countryEn: z.string().optional(),
            date: z.coerce.date(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
            image: image(),
            full: z
                .object({
                    src: z.string().regex(/^\/images\/full\/[a-z0-9-]+\.webp$/),
                    width: z.number().int().positive(),
                    height: z.number().int().positive(),
                })
                .optional(),
            alt: z.string(),
            altEn: z.string().optional(),
            noteEn: z.string().optional(),
        }),
});

export const collections = { panoramas };
