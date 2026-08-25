import rss from "@astrojs/rss";
import { getCollection, render } from "astro:content";
import { experimental_AstroContainer } from "astro/container";
import { SITE } from "../lib/site";

// 본문 HTML은 마크다운 소스가 아니라 렌더된 결과여야 한다(코드 하이라이트·figure·표 래퍼가
// 전부 rehype 단계에서 붙는다). Astro 5에서 페이지 밖에서 그 결과를 얻는 길은 컨테이너 API뿐이다.
const container = await experimental_AstroContainer.create();

// 피드 리더는 사이트 밖에서 문서를 연다 — 루트 상대경로는 리더의 도메인을 가리킨다.
// 이미지가 /posts/<id>/img/... 형태라 이걸 안 고치면 그림이 전부 깨진다.
const absolutize = (html) => html.replace(/(src|href)="\/(?!\/)/g, `$1="${SITE.url}/`);

// 헤딩 앵커(#)는 그 문서 안에서만 뜻이 있다. 피드에 그대로 실으면 절 제목마다 갈 곳 없는
// # 하나가 붙는다. 만드는 쪽은 src/lib/rehype.mjs의 rehypeHeadingAnchors다.
const stripAnchors = (html) => html.replace(/<a class="heading-anchor"[^>]*>[\s\S]*?<\/a>/g, "");

export async function GET(context) {
  // 티스토리에서 옮긴 글은 피드에 넣지 않는다 — 구독자에게는 이 블로그에서 쓴 글만 나간다.
  const posts = (
    await getCollection("posts", ({ data }) => !data.draft && data.tistoryId === undefined)
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const items = await Promise.all(
    posts.slice(0, 30).map(async (post) => {
      const { Content } = await render(post);
      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        content: stripAnchors(absolutize(await container.renderToString(Content))),
        link: `/posts/${post.id}/`,
      };
    }),
  );
  return rss({
    title: SITE.title,
    // 피드 스펙상 필수값. 사이트 공통 소개문은 없으니 태그라인을 쓴다
    description: SITE.tagline,
    site: context.site,
    items,
    customData: "<language>ko</language>",
  });
}
