// /llms.txt — 사람이 아니라 모델이 읽는 색인.
//
// public/llms.txt에 손으로 적어 두었더니 글을 쓸 때마다 편수와 연도가 어긋났다.
// 컬렉션에서 만들면 목록이 저절로 따라온다.
//
// 고유 글은 제목·설명·URL을 전부 싣고 이관분은 카테고리별 편수만 싣는다.
// 181편의 제목을 늘어놓으면 정작 앞으로 쓰는 글이 묻힌다.
// 조각(notes)은 noindex라 여기에도 싣지 않는다.
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE, mainCategory, categorySlug } from "../lib/site";
import { dayKey } from "../lib/format";

const abs = (path: string) => new URL(path, SITE.url).href;

export const GET: APIRoute = async () => {
  const posts = (await getCollection("posts", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  const own = posts.filter((post) => post.data.tistoryId === undefined);
  const archive = posts.filter((post) => post.data.tistoryId !== undefined);
  const archiveYears = archive.map((post) => dayKey(post.data.date).slice(0, 4)).sort();
  const firstArchiveYear = archiveYears[0];
  const lastArchiveYear = archiveYears.at(-1);

  const counts = new Map<string, { name: string; slug: string; count: number }>();
  for (const post of archive) {
    const slug = categorySlug(post.data.category);
    const entry = counts.get(slug) ?? { name: mainCategory(post.data.category), slug, count: 0 };
    entry.count += 1;
    counts.set(slug, entry);
  }
  const categories = [...counts.values()].sort((a, b) => b.count - a.count);

  const lines = [
    `# ${SITE.title}`,
    "",
    "> piatoss(Rowan)의 개인 블로그. 블록체인·지갑 엔지니어링(Zcash, Ethereum, Solidity, Go, Rust)과",
    `> AI 도구 사용 경험, 개인 회고를 한국어로 기록한다. 티스토리에서 이식한 ${firstArchiveYear}년~ 아카이브를 포함한다.`,
    "",
    `- 저자: Rowan (piatoss) — 암호화폐 지갑 회사의 엔지니어링 리드. 포트폴리오: ${SITE.portfolio}`,
    `- 이 블로그에서 쓴 글 ${own.length}편: ${abs("/writing/")}`,
    `- 티스토리에서 옮겨 온 아카이브 ${archive.length}편: ${abs("/archive/")}`,
    `- 카테고리: ${abs("/categories/")}`,
    `- RSS: ${abs("/rss.xml")}`,
    `- Sitemap: ${abs("/sitemap-index.xml")}`,
    "",
    "## 주요 주제",
    "",
    "- Zcash 프로토콜, FROST threshold signature, 지갑 엔지니어링 실전 경험",
    "- Solidity 보안 (Ethernaut 시리즈), EIP 분석 (EIP-7702 등)",
    "- Go/Rust 학습 기록, AI 도구(Claude Code 등) 활용 경험담과 회고",
    "",
    `## 이 블로그에서 쓴 글 (${own.length}편)`,
    "",
    ...own.map((post) => {
      const head = `- [${post.data.title}](${abs(`/posts/${post.id}/`)}) — ${dayKey(post.data.date)}`;
      return post.data.description ? `${head}. ${post.data.description}` : head;
    }),
    "",
    `## 아카이브 (${firstArchiveYear}~${lastArchiveYear}, ${archive.length}편)`,
    "",
    "티스토리에서 옮겨 온 글. 카테고리별 편수만 싣는다 — 전체 목록은 위 아카이브 링크에 있다.",
    "",
    ...categories.map((cat) => `- [${cat.name}](${abs(`/categories/${cat.slug}/`)}) — ${cat.count}편`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
