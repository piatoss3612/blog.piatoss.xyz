import path from "node:path";
import sharp from "sharp";

// 마크다운 rehype 플러그인 모음.
// astro.config.mjs에 두면 설정 파일이 플러그인 본문으로 덮여서 무엇이 켜져 있는지 한눈에 안 보인다.
// 플러그인이 늘어날 자리라 파일을 갈랐다. config는 import와 배열 순서만 갖는다.
//
// 주의: 사용자 rehype 플러그인은 Astro의 `rehypeRaw`보다 **먼저** 돈다.
// 그래서 티스토리 이관분에 남아 있는 raw `<img>`·`<table>`은 아직 element가 아니라 raw 노드이고
// 아래 플러그인들이 걷는 트리에 잡히지 않는다. 그쪽은 마크다운 소스에서 고쳐야 한다.

const isWhitespace = (node) => node.type === "text" && node.value.trim() === "";

// 공백 텍스트를 뺀 실제 자식들. 마크다운은 태그 사이에 개행 텍스트 노드를 남긴다
const meaningfulChildren = (node) => (node.children || []).filter((c) => !isWhitespace(c));

function walk(node, visit) {
  visit(node);
  (node.children || []).forEach((child) => walk(child, visit));
}

// public/ 아래 절대경로 이미지의 실제 픽셀 크기. 같은 그림이 여러 글에 쓰여도 한 번만 읽는다
const dimensionCache = new Map();

async function dimensions(src) {
  // 외부 URL(`//`, `https://`)과 상대경로는 빌드 시점에 파일을 짚을 수 없다
  if (!src.startsWith("/") || src.startsWith("//")) return null;

  const key = src.replace(/[?#].*$/, "");
  if (dimensionCache.has(key)) return dimensionCache.get(key);

  let size = null;
  try {
    // og.ts와 같은 이유로 cwd 기준이다 — 이 모듈은 빌드 때 dist/chunks/로 번들되므로
    // import.meta.url을 쓰면 상대경로가 dist 안쪽을 가리킨다.
    const file = path.join(process.cwd(), "public", decodeURIComponent(key));
    const meta = await sharp(file).metadata();
    if (meta.width && meta.height) size = { width: meta.width, height: meta.height };
  } catch {
    // 파일이 없거나 sharp가 못 읽는 형식이면 치수만 포기한다. 빌드를 세울 일은 아니다
    size = null;
  }

  dimensionCache.set(key, size);
  return size;
}

// public/ 절대경로 이미지는 Astro 이미지 파이프라인 밖이라 직접 속성을 붙인다.
// lazy·decoding은 로딩 비용, width·height는 레이아웃 이동(CLS) 때문이다 —
// 치수가 없으면 그림이 도착하는 순간 아래 문단이 통째로 밀린다.
export function rehypeLazyImages() {
  return async (tree) => {
    const images = [];
    walk(tree, (node) => {
      if (node.type === "element" && node.tagName === "img") images.push(node);
    });

    await Promise.all(
      images.map(async (node) => {
        node.properties.loading ??= "lazy";
        node.properties.decoding ??= "async";
        // alt가 없으면 스크린리더가 파일명을 읽는다. 장식용이라는 뜻으로 빈 문자열을 명시한다
        node.properties.alt ??= "";

        if (node.properties.width == null && node.properties.height == null) {
          const size = await dimensions(String(node.properties.src ?? ""));
          if (size) {
            node.properties.width = size.width;
            node.properties.height = size.height;
          }
        }
      }),
    );
  };
}

// 헤딩마다 그 절로 가는 링크를 붙인다. 긴 기술 글에서 "이 부분"을 가리킬 수단이 없었다.
// 평소에는 안 보이고 hover·focus에서만 뜬다(.note-permalink와 같은 어법).
//
// `#` 기호를 자식 텍스트가 아니라 CSS ::before로 그리는 이유:
// Astro의 rehypeHeadingIds는 이 플러그인 **뒤에** 한 번 더 돌면서 헤딩의 텍스트 노드를 모아
// `headings` 목록(목차가 쓴다)을 만든다. 여기에 텍스트로 `#`을 넣으면 목차 제목이 "제목#"이 된다.
export function rehypeHeadingAnchors() {
  const LEVELS = new Set(["h2", "h3", "h4"]);

  return (tree) => {
    walk(tree, (node) => {
      if (node.type !== "element" || !LEVELS.has(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== "string" || id === "") return;

      node.children.push({
        type: "element",
        tagName: "a",
        properties: {
          className: ["heading-anchor"],
          href: `#${id}`,
          ariaLabel: "이 절로 가는 링크",
        },
        children: [],
      });
    });
  };
}

// 그림 하나만 든 문단을 figure로 올리고 alt를 캡션으로 쓴다.
// 이관분 대부분은 스크린샷 아래에 설명이 없어서 본문 문단과 그림이 같은 층으로 읽혔다.
// alt가 비어 있으면 캡션 없이 감싸기만 한다 — 없는 설명을 지어내지 않는다.
export function rehypeFigures() {
  // <p><a href><img></a></p> 형태(원본 크기로 여는 링크)도 같은 그림 한 장이다
  const soleImage = (node) => {
    if (node.type !== "element") return null;
    if (node.tagName === "img") return node;
    if (node.tagName !== "a") return null;
    const inner = meaningfulChildren(node);
    return inner.length === 1 && inner[0].type === "element" && inner[0].tagName === "img"
      ? inner[0]
      : null;
  };

  return (tree) => {
    walk(tree, (node) => {
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element" || child.tagName !== "p") continue;

        const only = meaningfulChildren(child);
        if (only.length !== 1) continue;

        const img = soleImage(only[0]);
        if (!img) continue;

        const caption = String(img.properties?.alt ?? "").trim();
        const figureChildren = [only[0]];
        if (caption) {
          figureChildren.push({
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [{ type: "text", value: caption }],
          });
        }

        children[i] = {
          type: "element",
          tagName: "figure",
          properties: {},
          children: figureChildren,
        };
      }
    });
  };
}

// 유튜브 링크만 홀로 있는 문단을 임베드로 바꾼다. .md라 컴포넌트를 못 쓰므로
// 본문에는 URL 한 줄만 적고 변환은 여기서 한다.
// nocookie 도메인 + lazy 로딩 — 추적을 줄이고 스크롤 전까지 로드하지 않는다.
export function rehypeYouTube() {
  const ID = /^[A-Za-z0-9_-]{11}$/;

  const videoId = (href) => {
    let u;
    try {
      u = new URL(href);
    } catch {
      return null;
    }
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname === "youtube.com" || u.hostname.endsWith(".youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.slice("/embed/".length);
    }
    return null;
  };

  const embed = (id) => ({
    type: "element",
    tagName: "div",
    properties: { className: ["yt-embed"] },
    children: [
      {
        type: "element",
        tagName: "iframe",
        properties: {
          src: `https://www.youtube-nocookie.com/embed/${id}`,
          title: "YouTube video",
          loading: "lazy",
          referrerPolicy: "strict-origin-when-cross-origin",
          allow: "accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowFullScreen: true,
        },
        children: [],
      },
    ],
  });

  return (tree) => {
    const walkTree = (node) => {
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element") continue;
        if (child.tagName === "p") {
          const meaningful = meaningfulChildren(child);
          if (meaningful.length === 1 && meaningful[0].tagName === "a") {
            const id = videoId(String(meaningful[0].properties?.href ?? ""));
            if (id && ID.test(id)) {
              children[i] = embed(id);
              continue;
            }
          }
        }
        walkTree(child);
      }
    };
    walkTree(tree);
  };
}

// 표는 44rem 안에 안 들어가는 일이 많다(이관분 코드 표·비교표).
// table 자신에게 overflow-x를 주려면 display:block이 필요한데, 그러면 셀 폭 계산이 사라져
// 열이 내용에 맞게 벌어지지 않는다. 그래서 스크롤은 래퍼가 맡고 table은 table로 되돌린다.
// tabindex/role은 키보드만 쓰는 사람이 가로 스크롤 영역에 들어갈 수 있게 하려고 붙인다.
export function rehypeTableWrap() {
  return (tree) => {
    walk(tree, (node) => {
      // 이미 감싼 표를 또 감싸지 않는다 — walk가 새로 만든 래퍼 안으로도 들어간다
      const className = node.properties?.className;
      if (Array.isArray(className) && className.includes("table-wrap")) return;

      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element" || child.tagName !== "table") continue;

        children[i] = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["table-wrap"],
            tabIndex: 0,
            role: "region",
            ariaLabel: "표",
          },
          children: [child],
        };
      }
    });
  };
}

// 본문에 끼워 넣은 곁말(참고·주의)은 인용이 아닌데 마크다운에 담을 그릇이 blockquote뿐이라
// 옮겨 적은 말과 같은 모양으로 렌더됐다. 리드 기호/단어로 알아보고 aside로 갈라낸다.
//
// 기호를 본문에 남기지 않는 이유: 표식은 이제 왼쪽 보더와 서체가 말한다.
// 리드가 없는 blockquote(진짜 인용, 발췌)는 그대로 둔다.
const CALLOUT_MARKERS = [
  [/^\u{1F4A1}\s*/u, "tip"],
  [/^⚠️?\s*/u, "warn"],
  [/^\u{1F4CC}\s*/u, "note"],
  [/^참고\s*:\s*/u, "note"],
  [/^주의\s*:\s*/u, "warn"],
  // 이관분에는 `> [참고]` 꼴로 라벨만 한 줄 세운 곁말이 있다(212 등).
  // 마크다운에서는 대괄호를 이스케이프해 두어 렌더 결과가 그냥 `[참고]` 텍스트다
  [/^\[\s*참고\s*\]\s*/u, "note"],
  [/^\[\s*주의\s*\]\s*/u, "warn"],
  [/^note\s*:\s*/iu, "note"],
  [/^tip\s*:\s*/iu, "tip"],
  [/^warning\s*:\s*/iu, "warn"],
];

export function rehypeCallout() {
  // 첫 문단 맨 앞에서만 찾는다. `> 💡 **제목**`처럼 뒤가 강조로 이어지는 형태가 있어서
  // 문단 전체 텍스트가 아니라 선두 텍스트만 본다.
  // 선두 텍스트 노드를 여러 개 이어 붙이는 이유: `\[참고\]`처럼 이스케이프가 섞이면
  // remark가 `[` / `참고` / `]`를 각각 다른 텍스트 노드로 남긴다. 첫 노드만 보면 `[`만 보인다.
  const takeKind = (paragraph) => {
    const kids = paragraph.children || [];
    let lead = "";
    let n = 0;
    while (n < kids.length && kids[n].type === "text") lead += kids[n++].value;
    if (lead === "") return null;

    for (const [marker, kind] of CALLOUT_MARKERS) {
      const hit = lead.match(marker);
      if (!hit) continue;

      let remaining = hit[0].length;
      for (let i = 0; i < n && remaining > 0; i++) {
        const take = Math.min(remaining, kids[i].value.length);
        kids[i].value = kids[i].value.slice(take);
        remaining -= take;
      }
      // 표식만 있던 텍스트 노드는 빈 채로 두면 앞에 공백이 남고,
      // `> [참고]  ` 처럼 라벨 뒤에 하드 브레이크가 오는 형태는 <br>까지 걷어내야
      // 곁말 첫 줄이 빈 줄로 시작하지 않는다
      while (kids.length) {
        const head = kids[0];
        if (head.type === "text" && head.value.trim() === "") kids.shift();
        else if (head.type === "element" && head.tagName === "br") kids.shift();
        else break;
      }
      return kind;
    }
    return null;
  };

  return (tree) => {
    walk(tree, (node) => {
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element" || child.tagName !== "blockquote") continue;

        const first = meaningfulChildren(child)[0];
        if (!first || first.type !== "element" || first.tagName !== "p") continue;

        const kind = takeKind(first);
        if (!kind) continue;

        children[i] = {
          type: "element",
          tagName: "aside",
          properties: { className: ["callout"], dataKind: kind },
          children: child.children,
        };
      }
    });
  };
}
