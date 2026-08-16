// 웹폰트 서브셋을 만든다. 결과는 src/assets/fonts/에 커밋된다.
//
// 왜 자체 호스팅하나: 구글 폰트에서 받으면 @font-face 664개짜리 CSS가 gzip 107KB로
// 렌더를 막고, 한글 슬라이스가 글마다 새로 붙는다. 대표 글 한 페이지를 재보니
// CSS 107KB + 폰트 485KB에 요청 35개, 서드파티 origin 2개였다.
// 사이트에 실제로 쓰인 글자만 남기면 같은 페이지가 341KB에 요청 4개로 끝난다.
//
// 사용법:
//   node scripts/prep-fonts.mjs          서브셋 생성 (make fonts)
//   node scripts/prep-fonts.mjs --check   빠진 글자만 검사 (빌드가 호출)
//
// 서브셋이 "지금 쓰인 글자"에 정확히 맞춰져 있어서, 새 글에 없던 음절이 나오면
// 그 글자만 시스템 폰트로 빠진다. 그래서 빌드가 매번 --check로 확인한다.
import fs from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";

// 구글 폰트는 UA를 보고 포맷을 고른다. 최신 UA를 주면 한글을 unicode-range로 쪼갠
// woff2 조각 100여 개를 주는데, 우리는 통짜 원본이 필요해서 옛 UA로 TTF를 받는다.
const UA = "curl/8.0";

// 웨이트는 global.css가 실제로 쓰는 것만. 세 패밀리 모두 500은 쓰지 않고,
// Noto Serif KR 600도 쓰지 않는다(600은 .section-label이고 그건 sans다).
const FAMILIES = [
  { file: "outfit", family: "Outfit", weights: [400, 600, 700, 800] },
  { file: "plex-kr", family: "IBM Plex Sans KR", weights: [400, 700] },
  { file: "noto-serif-kr", family: "Noto Serif KR", weights: [400, 700] },
];

const OUT_DIR = path.resolve("src/assets/fonts");
const COVERAGE = path.join(OUT_DIR, "coverage.txt");
// 원본은 Noto Serif KR 하나가 13.7MB다. 매번 받지 않도록 캐시한다(.gitignore).
const CACHE_DIR = path.resolve(".font-cache");

function range(from, to) {
  let s = "";
  for (let n = from; n <= to; n++) s += String.fromCodePoint(n);
  return s;
}

// 화면에 뜰 수 있는 문자를 전부 긁는다. 과하게 넣는 쪽이 안전하고,
// 라틴은 어차피 웨이트당 12KB라 비용이 없다.
function siteChars() {
  const chars = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (p !== OUT_DIR) walk(p);
      } else if (/\.(md|astro|ts|css)$/.test(entry.name)) {
        for (const ch of fs.readFileSync(p, "utf8")) chars.add(ch);
      }
    }
  };
  walk(path.resolve("src"));
  return chars;
}

// 사이트에 아직 없더라도 넣어두는 기본 문자. 따옴표·대시·화살표처럼
// 글 쓰다 바로 튀어나오는 것들이라 이 정도는 미리 깔아둔다.
const BASELINE =
  range(0x20, 0x7e) + // ASCII
  range(0xa0, 0xff) + // 라틴-1 보충
  range(0x2010, 0x2027) + // 대시, 따옴표, 말줄임표
  "→←↑↓×÷±°·…‰※" +
  range(0x3000, 0x303f) + // CJK 문장부호
  range(0x3130, 0x318f); // 호환 자모 (ㄱㄴㄷ, ㅋㅋ)

const glyphSet = () => new Set([...BASELINE, ...siteChars()]);

// --check: 커밋된 서브셋이 지금 콘텐츠를 덮는지 본다.
if (process.argv.includes("--check")) {
  if (!fs.existsSync(COVERAGE)) {
    console.warn("[fonts] coverage.txt가 없다. `make fonts`를 한 번 돌려야 한다.");
    process.exit(0);
  }
  const covered = new Set(fs.readFileSync(COVERAGE, "utf8"));
  const missing = [...glyphSet()].filter((ch) => !covered.has(ch));
  if (missing.length) {
    // 빌드를 막지는 않는다. 빠진 글자는 시스템 폰트로 렌더되고 그건 배포를
    // 세울 만한 문제가 아니다 — 대신 눈에 띄게 남긴다.
    console.warn(
      `\n[fonts] 서브셋에 없는 글자 ${missing.length}개: ${missing.join("")}\n` +
        `[fonts] 이 글자들은 시스템 폰트로 렌더된다. \`make fonts\`로 서브셋을 다시 만들 것.\n`,
    );
  }
  process.exit(0);
}

async function sourceTtf(family, weight) {
  const cached = path.join(CACHE_DIR, `${family.replace(/ /g, "-")}-${weight}.ttf`);
  if (fs.existsSync(cached)) return fs.readFileSync(cached);

  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const css = await fetch(url, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const src = css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!src) throw new Error(`TTF URL을 못 찾았다: ${family} ${weight}\n${css}`);

  const res = await fetch(src, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`내려받기 실패: ${res.status} ${src}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cached, buf);
  return buf;
}

const glyphs = [...glyphSet()].join("");
fs.mkdirSync(OUT_DIR, { recursive: true });

const kb = (n) => `${(n / 1024).toFixed(0)}KB`.padStart(7);
let total = 0;

for (const { file, family, weights } of FAMILIES) {
  for (const weight of weights) {
    const original = await sourceTtf(family, weight);
    const subset = await subsetFont(original, glyphs, { targetFormat: "woff2" });
    const out = path.join(OUT_DIR, `${file}-${weight}.woff2`);
    fs.writeFileSync(out, subset);
    total += subset.length;
    console.log(`${`${file}-${weight}`.padEnd(20)} ${kb(original.length)} → ${kb(subset.length)}`);
  }
}

// --check가 읽는 커버리지 기록. 서브셋과 같은 커밋에 들어가야 의미가 있다.
fs.writeFileSync(COVERAGE, glyphs);
console.log(`\n합계 ${kb(total)} · 글자 ${glyphs.length}자`);
