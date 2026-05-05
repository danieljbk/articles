import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { toUrlSlug } from "@/utils/slug";

export async function GET(context: APIContext) {
  const articles = await getCollection("articles", ({ data }) => !data.draft);
  const sorted = articles.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()
  );

  return rss({
    title: "articles.kwon.ai",
    description: "Articles by Daniel Kwon.",
    site: context.site!,
    items: sorted.map(article => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.pubDate,
      link: `/${toUrlSlug(article.id)}/`,
      categories: article.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
