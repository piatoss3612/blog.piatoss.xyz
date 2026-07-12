// Notion 익스포트 스크린샷을 공개용으로 가공한다:
// 사이드바(사내 대화 목록) 크롭, 계정 이메일/생년월일/성격분석 블러, webp 변환.
// 사용법: node scripts/prep-skill-post-images.mjs <notion 이미지 디렉토리>
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2];
const OUT = path.resolve("public/posts/claude-code-skill/img");
fs.mkdirSync(OUT, { recursive: true });

const S = (n) => path.join(SRC, n);

// 블러: 원본에서 영역 추출 → 강블러 → 합성
async function blurRegions(img, regions) {
  let pipeline = sharp(img);
  const composites = [];
  for (const r of regions) {
    const buf = await sharp(img).extract(r).blur(18).toBuffer();
    composites.push({ input: buf, left: r.left, top: r.top });
  }
  return pipeline.composite(composites);
}

const SIDEBAR = 295; // 1920px 풀스크린 기준 좌측 사이드바 폭

const jobs = [
  // [출력명, 원본, 처리]
  ["01-check-updates", "스크린샷_2026-02-25_오전_10.03.45.png", { crop: { left: 0, top: 0, width: 244, height: 228 } }],
  ["02-customize-sidebar", "스크린샷_2026-02-25_오전_8.57.13.png", {}],
  ["03-customize-skills", "스크린샷_2026-02-25_오전_9.56.09.png", {}],
  ["04-account-menu", "스크린샷_2026-02-25_오전_8.46.37.png", { blur: [{ left: 8, top: 6, width: 200, height: 28 }] }],
  ["05-settings-capabilities", "스크린샷_2026-02-25_오전_8.52.08.png", {}],
  ["06-skill-creator-toggle", "스크린샷_2026-02-25_오전_8.51.34.png", { cropSidebar: true }],
  ["07-cowork-directory", "스크린샷_2026-02-24_오후_11.23.41.png", { cropSidebar: true }],
  ["08-research-plan-prompt", "스크린샷_2026-02-24_오후_11.27.34.png", { cropSidebar: true }],
  ["09-plan-questions-1", "스크린샷_2026-02-24_오후_11.27.54.png", { cropSidebar: true }],
  ["10-plan-questions-2", "스크린샷_2026-02-24_오후_11.28.08.png", { cropSidebar: true }],
  ["11-plan-save-file", "스크린샷_2026-02-24_오후_11.28.44.png", { cropSidebar: true }],
  ["12-research-run", "스크린샷_2026-02-24_오후_11.37.44.png", { cropSidebar: true }],
  ["13-skill-check", "image.png", {}],
  ["14-skill-plan", "스크린샷_2026-02-24_오후_11.41.39.png", { cropSidebar: true }],
  ["15-skill-output-dir", "스크린샷_2026-02-25_오전_9.20.21.png", {}],
  ["16-skill-files", "스크린샷_2026-02-25_오전_9.21.19.png", {}],
  ["17-upload-skill", "스크린샷_2026-02-25_오전_9.27.49.png", {}],
  ["18-my-skills", "스크린샷_2026-02-25_오전_9.28.08.png", { cropSidebar: true }],
  [
    "19-use-skill",
    "스크린샷_2026-02-25_오전_12.04.55.png",
    {
      blur: [
        { left: 385, top: 128, width: 470, height: 52 }, // 생년월일 버블
        { left: 100, top: 515, width: 850, height: 310 }, // 좌측 별자리/성향 요약
        { left: 965, top: 100, width: 950, height: 975 }, // 우측 분석 문서 패널
      ],
    },
  ],
  ["20-scheduled", "스크린샷_2026-02-25_오전_9.34.09.png", {}],
];

for (const [out, srcName, opt] of jobs) {
  const src = S(srcName);
  if (!fs.existsSync(src)) {
    console.log(`MISSING: ${srcName}`);
    continue;
  }
  let img = src;
  let tmp = null;
  const meta = await sharp(src).metadata();

  if (opt.cropSidebar) {
    tmp = path.join(OUT, `.tmp-${out}.png`);
    await sharp(src)
      .extract({ left: SIDEBAR, top: 0, width: meta.width - SIDEBAR, height: meta.height })
      .toFile(tmp);
    img = tmp;
  } else if (opt.crop) {
    tmp = path.join(OUT, `.tmp-${out}.png`);
    await sharp(src).extract(opt.crop).toFile(tmp);
    img = tmp;
  }

  let pipeline;
  if (opt.blur) {
    pipeline = await blurRegions(img, opt.blur);
  } else {
    pipeline = sharp(img);
  }

  const dest = path.join(OUT, `${out}.webp`);
  await pipeline.webp({ quality: 84 }).toFile(dest);
  if (tmp && fs.existsSync(tmp)) fs.unlinkSync(tmp);
  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log(`${out}.webp ${kb}KB`);
}
