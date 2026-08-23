import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import vitesseDark from "@shikijs/themes/vitesse-dark";
import {
  rehypeCallout,
  rehypeFigures,
  rehypeHeadingAnchors,
  rehypeLazyImages,
  rehypeTableWrap,
  rehypeYouTube,
} from "./src/lib/rehype.mjs";
import { postLastmod } from "./src/lib/sitemap-lastmod.mjs";

// vitesse-dark의 구두점(#666666, 3.3:1)·주석(3.9:1)·따옴표(2.3:1)는 4.5:1에 못 미친다.
// 주석은 저자가 코드를 설명하려고 쓴 문장이라 제일 먼저 읽혀야 하는데 제일 먼저 사라졌다.
const CODE_COLOR_FIX = {
  "#666666": "#8a8a8a",
  "#758575dd": "#7f8f7f",
  "#c98a7d77": "#c98a7dcc",
};
const codeTheme = JSON.parse(
  JSON.stringify(vitesseDark).replace(/#(?:666666|758575dd|c98a7d77)\b/gi, (hex) => CODE_COLOR_FIX[hex.toLowerCase()]),
);

export default defineConfig({
  site: "https://blog.piatoss.xyz",
  // 혼잣말은 검색에 노출하지 않는다 — sitemap에서 빼고, 페이지 자체에도 noindex를 붙인다.
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/notes"),
      // 글에는 lastmod를 준다. 목록 페이지는 무엇을 기준으로 삼을지가 애매해서 비운다 —
      // 없는 편이 틀린 날짜보다 낫다.
      serialize: (item) => {
        const lastmod = postLastmod().get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  markdown: {
    // 순서가 곧 계약이다.
    // - rehypeHeadingIds를 앞에 직접 세우는 건 Astro가 붙이는 id가 사용자 플러그인 **뒤에** 오기 때문이다.
    //   앵커가 href로 쓸 id가 그 전에 있어야 한다. Astro 것은 이미 있는 id를 덮지 않으니 뒤에서 또 돌아도 같다.
    // - rehypeFigures는 rehypeYouTube 뒤에 온다. 앞에 두면 <p><a><img></a></p>가 figure로 먼저 감싸져
    //   유튜브 링크 문단 판정에서 빠진다.
    // - rehypeCallout은 blockquote를 aside로 바꾸므로 blockquote를 보는 것이 뒤에 오면 안 된다.
    rehypePlugins: [
      rehypeHeadingIds,
      rehypeHeadingAnchors,
      rehypeLazyImages,
      rehypeYouTube,
      rehypeFigures,
      rehypeTableWrap,
      rehypeCallout,
    ],
    shikiConfig: {
      theme: codeTheme,
      wrap: false,
    },
  },
});
