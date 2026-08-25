import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://articles.kwon.ai",
  integrations: [
    mdx(),
    sitemap({
      filter: page => !page.includes("/private/"),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      wrap: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // Location-independent import for article components, so an MDX file
        // keeps resolving `@components/...` whether it lives in the private
        // sibling repo or gets published into src/data/articles/.
        "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      },
    },
  },
});
