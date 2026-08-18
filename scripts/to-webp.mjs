// public/에 떨어뜨린 png를 webp로 바꾸고 원본을 지운다.
// 사이트 이미지는 전부 webp고 마크다운은 /notes/foo.webp 같은 절대경로로 참조하므로,
// 스크린샷을 넣을 때마다 손으로 변환하지 않으려고 둔다.
// 사용법: node scripts/to-webp.mjs [경로...]   (기본 public/)
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const QUALITY = 84; // prep-skill-post-images.mjs와 같은 값

// 파비콘은 png여야 한다 — 사파리·안드로이드 홈화면이 webp를 안 받는다.
const KEEP = new Set([path.resolve("public/apple-touch-icon.png")]);

function collect(target) {
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) {
    console.error(`없는 경로: ${target}`);
    process.exitCode = 1;
    return [];
  }
  if (fs.statSync(abs).isFile()) return abs.toLowerCase().endsWith(".png") ? [abs] : [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .flatMap((e) => collect(path.join(abs, e.name)));
}

const targets = (process.argv.slice(2).length ? process.argv.slice(2) : ["public"])
  .flatMap(collect)
  .filter((f) => !KEEP.has(f))
  .sort();

if (!targets.length) {
  console.log("변환할 png가 없다.");
  process.exit();
}

const kb = (n) => Math.round(n / 1024);
const sitePath = (f) => {
  const rel = path.relative(path.resolve("public"), f);
  return rel.startsWith("..") ? f : `/${rel}`;
};

for (const src of targets) {
  const dest = src.replace(/\.png$/i, ".webp");
  if (fs.existsSync(dest)) {
    // 덮어쓰면 이미 배포된 이미지가 조용히 바뀐다. 어느 쪽을 남길지는 사람이 정한다.
    console.log(`SKIP ${sitePath(src)} — ${path.basename(dest)}가 이미 있다`);
    continue;
  }
  const before = fs.statSync(src).size;
  await sharp(src).webp({ quality: QUALITY }).toFile(dest);
  const after = fs.statSync(dest).size;
  fs.unlinkSync(src);
  console.log(`${sitePath(dest)}  ${kb(before)}KB → ${kb(after)}KB`);
}
