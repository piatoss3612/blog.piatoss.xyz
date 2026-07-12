// Tistory 공식 백업(글별 HTML + img/)을 Astro content collection Markdown으로 변환한다.
// 사용법: node scripts/convert-tistory.mjs <백업 루트 디렉토리>
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import turndownPluginGfm from "turndown-plugin-gfm";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error("백업 루트 디렉토리를 인자로 넘겨주세요.");
  process.exit(1);
}

const OUT_CONTENT = path.resolve("src/content/posts");
const OUT_PUBLIC = path.resolve("public/posts");
fs.mkdirSync(OUT_CONTENT, { recursive: true });
fs.mkdirSync(OUT_PUBLIC, { recursive: true });

// Tistory 에디터는 코드 언어를 자동 추측해서 엉뚱한 클래스(angelscript, oxygene 등)를
// 붙이는 경우가 많다. data-ke-language가 있으면 신뢰하고, class는 화이트리스트만 통과.
const LANG_WHITELIST = new Set([
  "go", "javascript", "js", "typescript", "ts", "solidity", "rust", "python",
  "bash", "shell", "sh", "zsh", "yaml", "yml", "json", "sql", "java", "c",
  "cpp", "csharp", "html", "css", "scss", "dockerfile", "docker", "toml",
  "jsx", "tsx", "graphql", "diff", "makefile", "proto", "text", "plaintext",
]);
const LANG_ALIASES = { js: "javascript", ts: "typescript", sh: "bash", yml: "yaml", docker: "dockerfile" };

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  hr: "---",
});
td.use(turndownPluginGfm.gfm);

td.addRule("tistoryPre", {
  filter: (node) => node.nodeName === "PRE",
  replacement: (_content, node) => {
    const dk = (node.getAttribute("data-ke-language") || "").toLowerCase();
    const cls = (node.getAttribute("class") || "").split(/\s+/)[0].toLowerCase();
    let lang = "";
    if (LANG_WHITELIST.has(dk)) lang = dk;
    else if (LANG_WHITELIST.has(cls)) lang = cls;
    lang = LANG_ALIASES[lang] ?? lang;
    const text = (node.textContent || "").replace(/\n+$/, "");
    // Tistory 에디터가 Solidity를 go 등으로 오태깅하는 사례가 많아 내용 기반으로 정정
    if (/pragma solidity|SPDX-License-Identifier|\babstract contract\b|\bcontract\s+\w+\s+is\b/.test(text)) {
      lang = "solidity";
    }
    const fence = text.includes("```") ? "````" : "```";
    return `\n\n${fence}${lang}\n${text}\n${fence}\n\n`;
  },
});

function yamlQuote(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function encodePath(p) {
  return p.split("/").map(encodeURIComponent).join("/");
}

const report = { ok: [], failed: [], externalImages: [], iframes: [] };

const dirs = fs
  .readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
  .map((d) => d.name)
  .sort((a, b) => Number(a) - Number(b));

for (const id of dirs) {
  const dir = path.join(SRC, id);
  try {
    const htmlFile = fs.readdirSync(dir).find((f) => f.endsWith(".html"));
    if (!htmlFile) throw new Error("HTML 파일 없음");
    const $ = cheerio.load(fs.readFileSync(path.join(dir, htmlFile), "utf-8"));

    const title = $(".title-article").first().text().trim() || $("title").text().trim() || `무제 ${id}`;
    const category = $(".box-info .category").first().text().trim();
    const rawDate = $(".box-info .date").first().text().trim(); // "2023-06-30 15:31:00"
    const isoDate = rawDate ? rawDate.replace(" ", "T") + "+09:00" : "1970-01-01T00:00:00+09:00";

    const content = $(".contents_style").first();
    if (!content.length) throw new Error("contents_style 없음");

    // 이미지: figure/lightbox 래퍼를 벗기고 로컬 경로를 /posts/{id}/... 절대경로로 재작성
    content.find("figure").each((_, el) => {
      const fig = $(el);
      const img = fig.find("img").first();
      if (!img.length) { fig.remove(); return; }
      const caption = fig.find("figcaption").text().trim();
      if (caption) img.attr("alt", caption);
      fig.replaceWith($("<p></p>").append(img));
    });
    content.find("img").each((_, el) => {
      const img = $(el);
      let src = img.attr("src") || "";
      if (src.startsWith("./")) src = src.slice(2);
      if (src.startsWith("img/")) {
        img.attr("src", "/posts/" + id + "/" + encodePath(src));
      } else if (/^https?:\/\//.test(src)) {
        report.externalImages.push(`${id}: ${src}`);
      }
    });

    const iframeCount = content.find("iframe").length;
    if (iframeCount) report.iframes.push(`${id}: iframe ${iframeCount}개`);

    let markdown = td.turndown(content.html() || "");
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    const plain = content.text().replace(/\s+/g, " ").trim();
    const description = plain.slice(0, 160);

    const fm = [
      "---",
      `title: ${yamlQuote(title)}`,
      `date: ${isoDate}`,
      `category: ${yamlQuote(category)}`,
      `description: ${yamlQuote(description)}`,
      `tistoryId: ${Number(id)}`,
      "---",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(OUT_CONTENT, `${id}.md`), fm + markdown + "\n");

    // 이미지 디렉토리 복사
    const imgDir = path.join(dir, "img");
    if (fs.existsSync(imgDir)) {
      fs.cpSync(imgDir, path.join(OUT_PUBLIC, id, "img"), { recursive: true });
    }
    report.ok.push(id);
  } catch (e) {
    report.failed.push(`${id}: ${e.message}`);
  }
}

console.log(`변환 완료: ${report.ok.length}개 성공, ${report.failed.length}개 실패`);
if (report.failed.length) console.log("실패 목록:\n" + report.failed.join("\n"));
if (report.externalImages.length)
  console.log(`외부(비로컬) 이미지 ${report.externalImages.length}건:\n` + report.externalImages.slice(0, 20).join("\n"));
if (report.iframes.length) console.log(`iframe 포함 글:\n` + report.iframes.join("\n"));
