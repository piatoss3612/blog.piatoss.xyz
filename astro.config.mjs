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

export default defineConfig({
  site: "https://blog.piatoss.xyz",
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeLazyImages],
    shikiConfig: {
      theme: "vitesse-dark",
      wrap: false,
    },
  },
});
