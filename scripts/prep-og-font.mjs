// OG 카드용 폰트 서브셋을 만든다. 결과는 src/assets/og/에 커밋된다.
//
// satori는 woff2를 못 읽어서 TTF가 필요한데, 한글 TTF 원본은 웨이트당 2.8MB다.
// 두 웨이트를 그대로 커밋하면 5.6MB라, 실제로 쓸 글리프만 남겨 잘라낸다.
//
// 사용법: node scripts/prep-og-font.mjs
// 폰트를 바꾸거나 갱신할 때만 다시 돌리면 된다. 빌드에는 관여하지 않는다.
import fs from "node:fs";
import path from "node:path";
import subsetFont from "subset-font";

// 사이트 본문과 같은 IBM Plex Sans KR. URL은 Google Fonts CSS API가 주는 정적 TTF.
// (버전이 올라 404가 나면 아래 CSS를 다시 조회해 URL을 갱신한다:
//  curl -s "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;700")
const SOURCES = {
  regular: "https://fonts.gstatic.com/s/ibmplexsanskr/v11/vEFK2-VJISZe3O_rc3ZVYh4aTwNO8tI.ttf",
  bold: "https://fonts.gstatic.com/s/ibmplexsanskr/v11/vEFN2-VJISZe3O_rc3ZVYh4aTwNOym6af7Y.ttf",
};

const OUT_DIR = path.resolve("src/assets/og");

function range(from, to) {
  let s = "";
  for (let n = from; n <= to; n++) s += String.fromCodePoint(n);
  return s;
}

// KS X 1001의 상용 한글 2,350자. 현대 한국어 표기는 사실상 전부 여기 들어간다.
// 유니코드 한글 음절 전체(11,172자)를 넣으면 서브셋이 원본과 같아져 의미가 없다
// — 실제로 재보니 2,722KB → 2,552KB로 6%밖에 안 줄었다.
// EUC-KR 바이트 순서로 뽑는다: 선두 0xB0~0xC8, 후행 0xA1~0xFE.
function ksx1001Hangul() {
  const bytes = [];
  for (let lead = 0xb0; lead <= 0xc8; lead++) {
    for (let trail = 0xa1; trail <= 0xfe; trail++) bytes.push(lead, trail);
  }
  return new TextDecoder("euc-kr").decode(new Uint8Array(bytes));
}

// 지금 글 제목에 쓰인 건 ASCII 74자 + 한글 314음절뿐이지만, 앞으로 쓸 글까지 감안한다.
const GLYPHS = [
  range(0x20, 0x7e), // ASCII
  range(0xa0, 0xff), // 라틴-1 보충 (é, ü 같은 것들)
  range(0x2010, 0x2027), // 대시, 따옴표, 말줄임표
  "→←↑↓×÷±°·…‰※",
  range(0x3000, 0x303f), // CJK 문장부호
  range(0x3130, 0x318f), // 호환 자모 (ㄱㄴㄷ, ㅋㅋ 같은 표기)
  ksx1001Hangul(),
].join("");

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [weight, url] of Object.entries(SOURCES)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${weight} 내려받기 실패: ${res.status} ${url}`);
  const original = Buffer.from(await res.arrayBuffer());

  const subset = await subsetFont(original, GLYPHS, { targetFormat: "truetype" });
  const out = path.join(OUT_DIR, `plex-kr-${weight}.ttf`);
  fs.writeFileSync(out, subset);

  const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
  console.log(`${weight}: ${kb(original.length)} → ${kb(subset.length)}  ${path.relative(process.cwd(), out)}`);
}
