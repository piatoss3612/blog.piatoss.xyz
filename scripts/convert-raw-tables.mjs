// 티스토리에서 옮겨 온 글의 raw <table>을 GFM 파이프 표로 바꾸는 일회성 스크립트.
//
// 왜 필요한가: 사용자 rehype 플러그인(src/lib/rehype.mjs)은 Astro의 rehypeRaw보다 먼저 돌아
// 마크다운 안의 raw HTML을 hast 트리에서 보지 못한다. 그래서 raw <table> 안의 <img>에는
// loading/decoding·치수가 붙지 않고, 표에도 가로 스크롤 래퍼가 걸리지 않는다.
// 파이프 표로 옮겨 두면 그 전부가 파이프라인 안으로 들어온다.
//
// 빌드는 이 파일을 읽지 않는다. 한 번 돌리고 결과를 커밋하면 끝이다.
//
//   node scripts/convert-raw-tables.mjs --dry   # 변환 계획만 출력
//   node scripts/convert-raw-tables.mjs         # 파일에 반영

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const POSTS_DIR = "src/content/posts";
const DRY = process.argv.includes("--dry");

// 셀 안의 <br>은 파이프 표가 줄바꿈을 못 담기 때문에 raw <br>로 남긴다.
// turndown의 기본 br 규칙은 "공백 둘 + 개행"이라 표 안에서 흔적 없이 사라진다.
// 자리표시자로 받아 두었다가 마지막에 <br>로 되돌린다.
const BR = "\u0001";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

turndown.addRule("cellBreak", {
  filter: "br",
  replacement: () => BR,
});

// 티스토리 에디터가 심은 인라인 스타일 껍데기. 안쪽 내용만 남긴다.
turndown.addRule("unwrapSpan", {
  filter: ["span", "font"],
  replacement: (content) => content,
});

// 셀 안 이미지는 캡션을 붙일 자리가 없으므로 alt를 비운 채 옮긴다.
// width/height는 버린다 — rehypeLazyImages가 public/의 실제 파일에서 다시 넣는다.
turndown.addRule("cellImage", {
  filter: "img",
  replacement: (_content, node) => {
    const src = node.getAttribute("src");
    if (!src) return "";
    const alt = (node.getAttribute("alt") || "").replace(/[[\]|]/g, "");
    return `![${alt}](${src})`;
  },
});

/** 셀 하나를 한 줄짜리 마크다운으로 접는다. */
function cellToMarkdown($, el) {
  const html = $.html($(el).contents());
  return turndown
    .turndown(html)
    .replace(/\u00a0/g, " ") // &nbsp;
    // 원본이 &lt;address&gt;로 이스케이프해 둔 꺾쇠는 cheerio가 문자로 풀어 준다.
    // 그대로 두면 마크다운이 <address>를 진짜 태그로 읽어 셀이 통째로 사라진다.
    .replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"))
    .replace(/\n+/g, BR) // 문단 경계도 줄바꿈으로 본다
    .replace(/\|/g, "\\|")
    .split(BR)
    .map((s) => s.trim())
    .filter(Boolean)
    .join("<br>")
    .trim();
}

/** 표 하나를 행 배열로 편다. */
function parseTable($, table) {
  const rows = [];
  $(table)
    .find("tr")
    .each((_, tr) => {
      const cells = [];
      $(tr)
        .children("td, th")
        .each((__, cell) => {
          cells.push({
            header: cell.tagName.toLowerCase() === "th",
            span: Number($(cell).attr("colspan") || 1),
            rowspan: Number($(cell).attr("rowspan") || 1),
            md: cellToMarkdown($, cell),
          });
        });
      if (cells.length) rows.push(cells);
    });
  return rows;
}

function buildPipeTable(rows) {
  // 열 수는 가장 긴 행에 맞춘다. 짧은 행은 빈 셀로 채운다.
  const width = Math.max(...rows.map((r) => r.length));

  // 첫 행이 th가 아니어도 헤더로 승격한다 — GFM 표에는 헤더 없는 형태가 없다.
  const [head, ...body] = rows;
  const line = (cells) => {
    const out = cells.map((c) => c.md || " ");
    while (out.length < width) out.push(" ");
    return `| ${out.join(" | ")} |`;
  };

  return [
    line(head),
    `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
    ...body.map(line),
  ].join("\n");
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
const report = [];
let converted = 0;
let skipped = 0;

for (const file of files.sort((a, b) => parseInt(a) - parseInt(b))) {
  const path = join(POSTS_DIR, file);
  const src = readFileSync(path, "utf8");
  if (!src.includes("<table")) continue;

  let index = 0;
  const out = src.replace(/<table[\s\S]*?<\/table>/g, (block) => {
    index += 1;
    const id = `${file} #${index}`;
    const $ = cheerio.load(block, null, false);
    const table = $("table").first();

    // 표 안에 또 표가 있으면 위 정규식이 블록을 잘못 잘랐다는 뜻이다.
    if ($("table").length > 1) {
      report.push({ id, action: "skip", why: "중첩 표" });
      skipped += 1;
      return block;
    }

    const rows = parseTable($, table);
    if (!rows.length) {
      report.push({ id, action: "skip", why: "행 없음" });
      skipped += 1;
      return block;
    }

    // 병합 셀은 파이프 표로 옮길 수 없다. 원본 HTML 그대로 둔다.
    if (rows.flat().some((c) => c.span > 1 || c.rowspan > 1)) {
      report.push({ id, action: "skip", why: "colspan/rowspan" });
      skipped += 1;
      return block;
    }

    // 셀에 블록 요소(코드 블록·목록)가 있으면 한 줄로 접을 수 없다.
    if ($(table).find("pre, ul, ol, table, blockquote, h1, h2, h3, h4").length) {
      report.push({ id, action: "skip", why: "셀에 블록 요소" });
      skipped += 1;
      return block;
    }

    const widths = [...new Set(rows.map((r) => r.length))];
    const md = buildPipeTable(rows);
    report.push({
      id,
      action: "convert",
      rows: rows.length,
      cols: widths.join("/"),
      ragged: widths.length > 1,
      header: rows[0].every((c) => c.header) ? "th" : "첫 행 승격",
      images: (md.match(/!\[/g) || []).length,
    });
    converted += 1;
    return md;
  });

  if (!DRY && out !== src) writeFileSync(path, out);
}

for (const r of report) {
  if (r.action === "skip") {
    console.log(`SKIP    ${r.id.padEnd(12)} ${r.why}`);
  } else {
    console.log(
      `CONVERT ${r.id.padEnd(12)} ${String(r.rows).padStart(3)}행 ${r.cols.padEnd(5)}열 ` +
        `${r.header.padEnd(9)} 이미지 ${String(r.images).padStart(2)}` +
        (r.ragged ? "  <- 행마다 셀 수 다름" : ""),
    );
  }
}
console.log(`\n변환 ${converted}, 건너뜀 ${skipped}${DRY ? " (dry run)" : ""}`);
