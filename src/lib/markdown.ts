import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";

/** Render user-authored Markdown without allowing raw HTML injection. */
export function renderMarkdown(value: string): string {
    return micromark(value, {
        extensions: [gfm()],
        htmlExtensions: [gfmHtml()],
    });
}
