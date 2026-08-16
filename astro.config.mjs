import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// public/ 절대경로 이미지는 Astro 이미지 파이프라인 밖이라 직접 lazy 속성을 붙인다
function rehypeLazyImages() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === "element" && node.tagName === "img") {
        node.properties.loading ??= "lazy";
        node.properties.decoding ??= "async";
      }
      (node.children || []).forEach(walk);
    };
    walk(tree);
  };
}

// 유튜브 링크만 홀로 있는 문단을 임베드로 바꾼다. .md라 컴포넌트를 못 쓰므로
// 본문에는 URL 한 줄만 적고 변환은 여기서 한다.
// nocookie 도메인 + lazy 로딩 — 추적을 줄이고 스크롤 전까지 로드하지 않는다.
function rehypeYouTube() {
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
    const walk = (node) => {
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element") continue;
        if (child.tagName === "p") {
          const meaningful = (child.children || []).filter(
            (c) => !(c.type === "text" && c.value.trim() === ""),
          );
          if (meaningful.length === 1 && meaningful[0].tagName === "a") {
            const id = videoId(String(meaningful[0].properties?.href ?? ""));
            if (id && ID.test(id)) {
              children[i] = embed(id);
              continue;
            }
          }
        }
        walk(child);
      }
    };
    walk(tree);
  };
}

export default defineConfig({
  site: "https://blog.piatoss.xyz",
  // 혼잣말은 검색에 노출하지 않는다 — sitemap에서 빼고, 페이지 자체에도 noindex를 붙인다.
  integrations: [sitemap({ filter: (page) => !page.includes("/notes") })],
  markdown: {
    rehypePlugins: [rehypeLazyImages, rehypeYouTube],
    shikiConfig: {
      theme: "vitesse-dark",
      wrap: false,
    },
  },
});
