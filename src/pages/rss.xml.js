import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../lib/site";

export async function GET(context) {
  // 티스토리에서 옮긴 글은 피드에 넣지 않는다 — 구독자에게는 이 블로그에서 쓴 글만 나간다.
  const posts = (
    await getCollection("posts", ({ data }) => !data.draft && data.tistoryId === undefined)
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: posts.slice(0, 30).map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/posts/${post.id}/`,
    })),
    customData: "<language>ko</language>",
  });
}
