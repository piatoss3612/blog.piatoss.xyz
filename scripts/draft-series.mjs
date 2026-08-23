// 글 프런트매터에 series를 한 번에 써 넣는 일회성 도구. 빌드는 이 파일을 읽지 않는다.
//
// 자동 분류를 하지 않는 이유: 제목 접두사만 보면 [백준 / Go]·[Rust]처럼 "읽는 순서가 없는
// 묶음"까지 시리즈가 된다. 그래서 후보를 표로 뽑아 눈으로 고르고(SERIES), 고른 것만 쓴다.
//
//   node scripts/draft-series.mjs          # 후보 표 + 적용 대상 미리보기 (파일을 고치지 않는다)
//   node scripts/draft-series.mjs --apply  # 프런트매터에 series를 써 넣는다

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/content/posts";
const APPLY = process.argv.includes("--apply");

// 손으로 고른 시리즈. 여기 없는 묶음은 시리즈가 아니다.
//   order: "title"이면 제목에 박힌 번호(0. / - 1. / #1 / 1장)를 그대로 정렬 키로 쓴다.
//          "date"면 올린 순서대로 1..N. 책 따라 읽기·챌린지 풀이처럼 번호가 없지만
//          쓴 순서가 곧 읽는 순서인 것들이다.
const SERIES = [
  { name: "Ethernaut", order: "title", test: (t) => t.startsWith("[Ethernaut]") },
  { name: "Damn Vulnerable DeFi", order: "date", test: (t) => t.startsWith("[Damn Vulnerable DeFi]") },
  { name: "Uniswap V2", order: "date", test: (t) => t.startsWith("[Uniswap] V2") },
  { name: "SOLID in Go", order: "date", test: (t) => t.startsWith("[Go] SOLID in Go") },
  {
    name: "Polygon ID와 Websocket을 사용한 신원 인증",
    order: "title",
    test: (t) => t.startsWith("[Go] Polygon ID와 Websocket을 사용한 신원 인증"),
  },
  {
    name: "geth로 스마트 컨트랙트 배포하기",
    order: "title",
    test: (t) => t.startsWith("[Solidity+Go] geth로 스마트 컨트랙트 배포하기"),
  },
  { name: "밑바닥부터 시작하는 비트코인", order: "date", test: (t) => t.startsWith("밑바닥부터 시작하는 비트코인") },
  { name: "ERC-4337: 계정 추상화", order: "date", test: (t) => t.startsWith("ERC-4337: 계정 추상화") },
  {
    name: "Astar zkEVM & Yoki Origins 체험기",
    order: "title",
    test: (t) => t.startsWith("Astar zkEVM & Yoki Origins 체험기"),
  },
];

function frontmatter(raw) {
  if (!raw.startsWith("---\n")) return null;
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return null;
  return { body: raw.slice(4, end), start: 4, end: end + 1 };
}

function field(fm, key) {
  const m = fm.match(new RegExp(`^${key}: *(.*)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^"(.*)"$/, "$1");
}

const posts = readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const path = join(DIR, f);
    const raw = readFileSync(path, "utf8");
    const fm = frontmatter(raw);
    if (!fm) throw new Error(`프런트매터를 못 읽었다: ${path}`);
    return { id: f.replace(/\.md$/, ""), path, raw, fm, title: field(fm.body, "title") ?? "", date: field(fm.body, "date") ?? "" };
  })
  .sort((a, b) => a.date.localeCompare(b.date));

// ── 후보 표 ────────────────────────────────────────────────────────────────
// 제목 앞머리를 두 갈래로 본다: [대괄호] 접두사와, 구분자(" - " / " #" / ": ") 앞의 줄기.
function keys(title) {
  const out = new Set();
  const bracket = title.match(/^\[([^\]]+)\]/);
  if (bracket) out.add(`[${bracket[1].replace(/\s+/g, " ").trim()}]`);
  const stem = title.match(/^(.+?)(?: - | #|: )/);
  if (stem) out.add(stem[1].trim());
  return out;
}

const groups = new Map();
for (const p of posts) {
  for (const k of keys(p.title)) {
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
}

// 제목에서 번호를 뽑는다. 시리즈 이름을 떼고 남은 앞머리에서만 찾는다 —
// 제목 안쪽의 "V2"·"ERC-20" 같은 숫자를 번호로 오해하지 않으려고.
function titleNumber(title, name) {
  let rest = title.replace(/^\[[^\]]+\]\s*/, "");
  if (rest.startsWith(name)) rest = rest.slice(name.length);
  rest = rest.replace(/^\s*[-–—:·]?\s*/, "");
  const m = rest.match(/^#?(\d+)\s*(?:[.)]|장|편|주차|$)/);
  return m ? Number(m[1]) : null;
}

const picked = new Set(SERIES.map((s) => s.name));
console.log("\n## 후보 (3편 이상)\n");
console.log("| 접두사·줄기 | 편수 | 제목 번호 | 채택 |");
console.log("|---|---|---|---|");
for (const [k, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
  if (list.length < 3) continue;
  const chosen = SERIES.find((s) => list.every((p) => s.test(p.title)) && list.length === posts.filter((p) => s.test(p.title)).length);
  const numbered = list.filter((p) => titleNumber(p.title, chosen?.name ?? "") !== null).length;
  console.log(`| ${k} | ${list.length} | ${numbered}/${list.length} | ${chosen ? "예 — " + chosen.name : "아니오"} |`);
}

// ── 적용 대상 ──────────────────────────────────────────────────────────────
const assignments = new Map(); // id -> { name, order }
let failed = false;

console.log("\n## 적용 대상\n");
for (const s of SERIES) {
  const list = posts.filter((p) => s.test(p.title));
  if (list.length < 3) {
    console.log(`- ${s.name}: ${list.length}편 — 3편 미만이라 건너뛴다`);
    failed = true;
    continue;
  }
  let entries;
  if (s.order === "title") {
    entries = list.map((p) => ({ p, order: titleNumber(p.title, s.name) }));
    const missing = entries.filter((e) => e.order === null);
    if (missing.length) {
      console.log(`- ${s.name}: 번호를 못 읽은 글 ${missing.map((e) => e.p.id).join(", ")} — 적용하지 않는다`);
      failed = true;
      continue;
    }
    const seen = new Map();
    for (const e of entries) {
      if (seen.has(e.order)) {
        console.log(`- ${s.name}: order ${e.order}이 ${seen.get(e.order)}와 ${e.p.id}에 겹친다 — 적용하지 않는다`);
        failed = true;
      }
      seen.set(e.order, e.p.id);
    }
    if (seen.size !== entries.length) continue;
  } else {
    entries = list.map((p, i) => ({ p, order: i + 1 }));
  }
  entries.sort((a, b) => a.order - b.order);
  console.log(`- ${s.name}: ${entries.length}편 (order ${entries[0].order}~${entries.at(-1).order}, ${s.order === "title" ? "제목 번호" : "날짜순"})`);
  for (const e of entries) {
    if (assignments.has(e.p.id)) throw new Error(`${e.p.id}이 시리즈 둘에 걸린다`);
    assignments.set(e.p.id, { name: s.name, order: e.order });
    console.log(`    ${String(e.order).padStart(3)}  ${e.p.id}  ${e.p.title}`);
  }
}

if (!APPLY) {
  console.log(`\n(미리보기) --apply를 붙이면 ${assignments.size}편의 프런트매터를 고친다.${failed ? " 위의 경고를 먼저 볼 것." : ""}`);
  process.exit(0);
}

const yamlString = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

let written = 0;
for (const p of posts) {
  const a = assignments.get(p.id);
  if (!a) continue;
  // 이미 있는 series 블록은 통째로 걷어내고 다시 쓴다(여러 번 돌려도 같은 결과가 되게).
  const cleaned = p.fm.body.replace(/^series:\n(?:[ \t]+.*\n?)*/m, "");
  const block = `series:\n  name: ${yamlString(a.name)}\n  order: ${a.order}\n`;
  const next = p.raw.slice(0, p.fm.start) + cleaned.replace(/\n*$/, "\n") + block + p.raw.slice(p.fm.end);
  if (next !== p.raw) {
    writeFileSync(p.path, next);
    written += 1;
  }
}
console.log(`\n${written}편을 고쳤다.`);
