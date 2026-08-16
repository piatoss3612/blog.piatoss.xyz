// 글마다 공유 카드를 하나씩 만든다 → /og/<id>.jpg
// 이미지는 저장소에 없다. 빌드가 src/lib/og.ts의 템플릿으로 찍어내 dist에만 남긴다.
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderPostCard } from "../../lib/og";

export async function getStaticPaths() {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { id: post.id },
    props: { title: post.data.title, category: post.data.category },
  }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderPostCard(props.title as string, props.category as string), {
    headers: { "Content-Type": "image/jpeg" },
  });
