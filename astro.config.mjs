import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
    integrations: [svelte(), sitemap(), tailwind()],
    markdown: {
        shikiConfig: {
            theme: "nord",
        },
    },
    site: "https://openboxing.org",
});