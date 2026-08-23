// sitemap의 lastmod를 글 프런트매터에서 읽는다.
//
// astro.config는 astro:content를 못 쓴다(설정을 읽는 시점에 컬렉션이 아직 없다).
// 그래서 마크다운 프런트매터를 직접 읽는다 — 필요한 건 date와 updated 두 줄뿐이라
// YAML 파서를 새로 들이지 않는다.
//
// 값을 Date로 파싱하지 않고 앞 10글자만 자르는 이유: 프런트매터의 날짜는 KST로 적혀
// 있고(전부 +09:00), Date로 바꿔 다시 포맷하면 CI(UTC)에서 하루가 밀린다.
// 문자열 그대로 두면 빌드 머신 타임존을 아예 타지 않는다.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const POSTS_DIR = "src/content/posts";

function frontmatterDate(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(\\S+)`, "m"));
  return match ? match[1].replace(/^["']|["']$/g, "").slice(0, 10) : undefined;
}

/** URL 경로(`/posts/<id>/`) → lastmod(YYYY-MM-DD). 빌드마다 한 번만 읽는다. */
let cache;

export function postLastmod() {
  if (cache) return cache;
  cache = new Map();
  for (const file of readdirSync(POSTS_DIR)) {
    if (!file.endsWith(".md")) continue;
    const raw = readFileSync(join(POSTS_DIR, file), "utf8");
    const end = raw.indexOf("\n---", 3);
    const head = end === -1 ? raw : raw.slice(0, end + 1);
    const lastmod = frontmatterDate(head, "updated") ?? frontmatterDate(head, "date");
    if (lastmod) cache.set(`/posts/${file.slice(0, -3)}/`, lastmod);
  }
  return cache;
}
