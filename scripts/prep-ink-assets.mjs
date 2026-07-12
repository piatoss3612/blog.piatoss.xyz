// docs/concept/ink-theme-raster/의 원본 PNG를 웹 배포용 webp로 변환해 public/ink/에 배치한다.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("docs/concept/ink-theme-raster");
const OUT = path.resolve("public/ink");
fs.mkdirSync(OUT, { recursive: true });

const jobs = [
  { src: "hero-banner.png", out: "hero.webp", width: 1915, quality: 82 },
  { src: "footer-parade-banner.png", out: "parade.webp", width: 1913, quality: 82 },
  { src: "lantern.png", out: "lantern.webp", width: 280, quality: 84 },
  { src: "seal-stamp.png", out: "seal.webp", width: 220, quality: 84 },
  { src: "squirrel-spirit.png", out: "squirrel.webp", width: 360, quality: 84 },
  { src: "scroll-ledger.png", out: "scroll.webp", width: 480, quality: 84 },
];

for (const j of jobs) {
  const input = path.join(SRC, j.src);
  const output = path.join(OUT, j.out);
  await sharp(input).resize({ width: j.width, withoutEnlargement: true }).webp({ quality: j.quality }).toFile(output);
  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`${j.out} ${kb}KB`);
}

// OG 커버 (1200×630): 히어로 배너에서 소나무~구미호 구간을 잘라낸다
await sharp(path.join(SRC, "hero-banner.png"))
  .extract({ left: 250, top: 0, width: 1564, height: 821 })
  .resize(1200, 630)
  .jpeg({ quality: 86 })
  .toFile(path.resolve("public/og-cover.jpg"));
console.log("og-cover.jpg", Math.round(fs.statSync(path.resolve("public/og-cover.jpg")).size / 1024) + "KB");
