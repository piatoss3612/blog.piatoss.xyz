// docs/concept/ink-theme-raster/의 원본 PNG를 웹 배포용 webp로 변환해 public/ink/에 배치한다.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("docs/concept/ink-theme-raster");
const OUT = path.resolve("public/ink");
fs.mkdirSync(OUT, { recursive: true });

const jobs = [
  { src: "hero-banner-light.png", out: "hero.webp", width: 1915, quality: 82 },
  { src: "footer-parade-light.png", out: "parade.webp", width: 1913, quality: 82 },
  { src: "lantern-light.png", out: "lantern.webp", width: 280, quality: 84 },
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

// og-cover.jpg는 밤(기본) 테마 브랜드로 별도 관리 — scripts/og-cover.html 참고.
