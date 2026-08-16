// 공유 카드(1200×630)를 빌드 때 찍어낸다.
//
// 왜 이렇게 만드나: 210개 글이 커버 한 장을 공유하면 어느 글을 공유해도 카드가 같다.
// 배경 아트 한 장과 이 템플릿만 관리하면 나머지는 빌드가 알아서 만든다.
//
// 파이프라인: satori(레이아웃 → SVG) → resvg(SVG → PNG) → sharp(PNG → JPEG).
// 마지막에 JPEG로 누르는 이유는 용량이다. 배경이 픽셀아트라 PNG로 두면 장당 300KB가
// 넘어 210장에 60MB가 붙는다. JPEG로는 장당 40KB 안쪽이다.
import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

// import.meta.url을 쓰면 안 된다 — 빌드가 이 모듈을 dist/chunks/로 번들해서
// 상대경로가 dist 안쪽을 가리키게 된다. 이 코드는 빌드 때만 돌고 astro dev/build
// 모두 프로젝트 루트에서 실행되므로 cwd를 기준으로 잡는다.
const asset = (name: string) => fs.readFileSync(path.resolve("src/assets/og", name));

const FONT_REGULAR = asset("plex-kr-regular.ttf");
const FONT_BOLD = asset("plex-kr-bold.ttf");
// satori는 로컬 파일을 못 읽어서 배경을 data URI로 심어야 한다. 한 번만 인코딩한다.
// 배경도 JPEG다 — 원본 PNG는 767KB인데 결과물이 어차피 JPEG라 q90으로 눌러도 손해가 없고,
// 210번 렌더링하는 동안 매번 디코딩하는 양이 46KB로 줄어든다.
const BACKGROUND = `data:image/jpeg;base64,${asset("background.jpg").toString("base64")}`;

const WIDTH = 1200;
const HEIGHT = 630;
// 텍스트가 놓이는 폭. 배경 아트는 오른쪽 등불에 초점이 있어 왼쪽을 비워 뒀다.
const TEXT_WIDTH = 660;

// global.css의 oklch 팔레트를 satori가 못 읽어서 hex로 옮긴 값들.
const COLOR = {
  bg: "#050302",
  amber: "#e0a55e", // --lantern-glow
  title: "#f2ece1",
  label: "#c9a173",
  muted: "#a99b89",
};

const CJK = /[㄰-㆏가-힣　-〿一-鿿]/;

// 한글은 한 글자가 폰트 크기만큼, 라틴은 그 절반쯤 차지한다.
// 제목 길이가 5자에서 76자까지 벌어져 있어 고정 크기로는 짧은 제목이 초라하고
// 긴 제목이 넘친다. 폭 예산으로 환산해서 크기를 정한다.
function textWeight(text: string): number {
  let w = 0;
  for (const ch of text) w += CJK.test(ch) ? 1 : 0.52;
  return w;
}

const MIN_SIZE = 34;
const MAX_SIZE = 62;
const MAX_LINES = 3;

function titleFontSize(title: string): number {
  const size = Math.floor((MAX_LINES * TEXT_WIDTH) / Math.max(textWeight(title), 1));
  return Math.max(MIN_SIZE, Math.min(MAX_SIZE, size));
}

// 최소 크기로도 세 줄을 넘기는 제목은 잘라낸다. 카드 밖으로 흘러나가는 것보다 낫다.
function clampTitle(title: string): string {
  const budget = (MAX_LINES * TEXT_WIDTH) / MIN_SIZE;
  if (textWeight(title) <= budget) return title;
  let w = 0;
  let out = "";
  for (const ch of title) {
    const next = w + (CJK.test(ch) ? 1 : 0.52);
    if (next > budget - 1) break;
    w = next;
    out += ch;
  }
  return `${out.trimEnd()}…`;
}

// satori는 JSX 대신 React 엘리먼트 모양의 평범한 객체를 받는다.
// .ts 파일이라 JSX를 쓸 수 없어 트리를 직접 조립한다.
type El = { type: string; props: Record<string, unknown> };
const div = (style: Record<string, unknown>, children?: unknown): El => ({
  type: "div",
  props: children === undefined ? { style } : { style, children },
});

const RULE = div({ width: 56, height: 4, backgroundColor: COLOR.amber });

const WORDMARK = div({ display: "flex", marginTop: 36, fontSize: 26, fontWeight: 700 }, [
  { type: "span", props: { style: { color: COLOR.muted }, children: "piatoss" } },
  { type: "span", props: { style: { color: COLOR.amber }, children: ".log" } },
]);

// 배경 + 왼쪽을 눌러 대비를 만드는 스크림 + 아래 정렬된 본문.
function shell(children: unknown[]): El {
  return div(
    { display: "flex", position: "relative", width: WIDTH, height: HEIGHT, backgroundColor: COLOR.bg },
    [
      {
        type: "img",
        props: {
          src: BACKGROUND,
          width: WIDTH,
          height: HEIGHT,
          style: { position: "absolute", top: 0, left: 0 },
        },
      },
      div({
        position: "absolute",
        top: 0,
        left: 0,
        width: WIDTH,
        height: HEIGHT,
        backgroundImage:
          "linear-gradient(90deg, rgba(5,3,2,0.93) 0%, rgba(5,3,2,0.82) 42%, rgba(5,3,2,0.35) 68%, rgba(5,3,2,0.08) 100%)",
      }),
      div(
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          position: "relative",
          width: WIDTH,
          height: HEIGHT,
          padding: "72px 76px",
        },
        children,
      ),
    ],
  );
}

function postCard(title: string, category: string): El {
  const clamped = clampTitle(title);
  return shell(
    [
      RULE,
      category
        ? div(
            { marginTop: 24, fontSize: 24, fontWeight: 400, letterSpacing: 1.5, color: COLOR.label },
            category,
          )
        : null,
      div(
        {
          marginTop: category ? 16 : 24,
          maxWidth: TEXT_WIDTH,
          fontSize: titleFontSize(clamped),
          fontWeight: 700,
          lineHeight: 1.24,
          color: COLOR.title,
          // 한글은 기본값이면 음절 아무 데서나 끊긴다("비트/코인").
          // keep-all이면 띄어쓰기에서만 끊는다.
          wordBreak: "keep-all",
        },
        clamped,
      ),
      WORDMARK,
    ].filter(Boolean),
  );
}

// 글이 아닌 페이지(홈·목록·소개)가 쓰는 사이트 공통 커버.
function siteCover(tagline: string): El {
  return shell([
    RULE,
    div({ display: "flex", marginTop: 26, fontSize: 88, fontWeight: 700, lineHeight: 1 }, [
      { type: "span", props: { style: { color: COLOR.title }, children: "piatoss" } },
      { type: "span", props: { style: { color: COLOR.amber }, children: ".log" } },
    ]),
    div(
      { marginTop: 26, maxWidth: TEXT_WIDTH, fontSize: 27, color: COLOR.muted, wordBreak: "keep-all" },
      tagline,
    ),
  ]);
}

async function toJpeg(node: El): Promise<Buffer> {
  const svg = await satori(node as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Plex", data: FONT_REGULAR, weight: 400, style: "normal" },
      { name: "Plex", data: FONT_BOLD, weight: 700, style: "normal" },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng();
  return sharp(png).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
}

export const renderPostCard = (title: string, category = "") => toJpeg(postCard(title, category));
export const renderSiteCover = (tagline: string) => toJpeg(siteCover(tagline));
