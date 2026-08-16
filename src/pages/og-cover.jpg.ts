// 글이 아닌 페이지(홈·목록·소개)가 쓰는 공통 커버 → /og-cover.jpg
//
// 예전에는 public/og-cover.jpg에 손으로 캡처한 파일을 두고 scripts/og-cover.html을
// 소스로 삼았는데, 그 HTML이 참조하던 배경(public/dreamcore/)이 테마 교체 때 지워져
// 다시 렌더할 수 없는 상태였다. 이제 글 카드와 같은 템플릿에서 나온다.
// 경로를 그대로 둔 건 이미 공유된 링크의 카드가 깨지지 않게 하려는 것.
import type { APIRoute } from "astro";
import { renderSiteCover } from "../lib/og";

export const GET: APIRoute = async () =>
  new Response(await renderSiteCover("만들고 부수고 다시 고치는 사람의 기록"), {
    headers: { "Content-Type": "image/jpeg" },
  });
