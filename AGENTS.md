# piatoss.log

blog.piatoss.xyz. Astro 정적 블로그.

디자인 판단(색·아트·레이아웃·타이포)은 **DESIGN.md**가 기준이다. 이 문서는 코드와 운영만 다룬다.

## 스택

Astro 5 정적 출력 + Pagefind 검색. UI 프레임워크·CSS 라이브러리 없이 `src/styles/global.css` 하나로 간다. 런타임 의존성은 `medium-zoom` 뿐이고 나머지는 빌드 도구다.

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 빌드해서 GitHub Pages에 올린다. **로컬 배포 명령은 없다.**

- **AWS 자격증명을 다시 들이지 말 것.** S3 + CloudFront에서 옮긴 이유가 배포에 액세스 키가 필요했고 키가 유출되면 비용에 상한이 없다는 것이었다. Pages는 키 없이 푸시로 배포된다. DNS 레코드 하나만 `piatoss.xyz/terraform/blog.tf`에 남아 있다.
- 커스텀 도메인은 저장소 Settings → Pages에 저장돼 있다. Actions 배포에서는 이쪽이 실제 설정이고 `public/CNAME`은 사본이다.
- 인증서는 GitHub이 Let's Encrypt로 직접 발급한다. 도메인을 다시 붙일 일이 있으면 **DNS가 Pages를 가리킨 뒤에** 커스텀 도메인을 설정한다. 순서를 뒤집으면 검증에 실패하고 자동으로 재시도하지 않는다.
- `scripts/`만 바뀐 푸시는 배포되지 않는다(`paths-ignore`). 그 경로를 고치고도 재배포가 필요하면 Actions에서 `workflow_dispatch`로 돌린다.

## 콘텐츠

컬렉션 둘을 섞지 않는다. 스키마는 `src/content.config.ts`가 강제한다.

**posts** (`src/content/posts/`) — `tistoryId`가 있으면 티스토리 이관분(209편), 없으면 이 블로그에서 쓴 글이다. 이 한 필드가 사이트 전체의 분기 기준이다.

| | 이관분 | 고유 글 |
|---|---|---|
| 목록 | `/archive` (연도별) | `/writing` |
| RSS | 제외 | 포함 |
| 이전·다음 탐색 | 이관분끼리만 | 고유 글끼리만 |

**notes** (`src/content/notes/`) — 조각. 제목이 없어도 된다. `noindex`이고 sitemap·RSS·홈에서 빠진다.

`description`은 검색 결과와 공유 카드에 그대로 나간다. 본문에서 잘라 붙이지 말고 사람이 읽을 문장으로 쓴다(70~100자). 이관분 209편은 원래 본문을 160자에서 자른 것이었고 전부 다시 썼다.

## 이미지

글 이미지는 `public/posts/<id>/img/`에 있고 마크다운에서 절대경로로 참조한다. Astro 이미지 파이프라인 밖이라 `astro.config.mjs`의 `rehypeLazyImages`가 `loading`·`decoding`을 붙인다. 같은 파일의 `rehypeYouTube`는 유튜브 링크만 있는 문단을 임베드로 바꾼다 — `.md`에서 컴포넌트를 못 쓰기 때문이다.

## 공유 카드 (OG)

글마다 `/og/<id>.jpg`가 빌드 때 만들어진다. **이미지는 저장소에 없다.** 관리 대상은 배경 아트 한 장(`src/assets/og/background.jpg`)과 템플릿 하나(`src/lib/og.ts`)뿐이고, 글을 새로 쓰면 카드도 따라 생긴다.

파이프라인은 satori(레이아웃 → SVG) → resvg(→ PNG) → sharp(→ JPEG)다. 손대기 전에 알아야 할 것:

- **satori는 woff2를 못 읽는다.** 폰트는 TTF 서브셋이고 `scripts/prep-og-font.mjs`로 다시 만든다. 범위가 KS X 1001 상용 2,350자라 그 밖의 음절은 두부(□)가 된다. 한글 음절 전체를 넣으면 서브셋이 원본과 같아져서(2,722KB → 2,552KB) 의미가 없다.
- **제목에 `word-break: keep-all`이 빠지면** 한글이 음절 중간에서 끊긴다(`비트/코인`).
- **`src/lib/og.ts`의 에셋 경로는 cwd 기준이다.** `import.meta.url`을 쓰면 빌드가 이 모듈을 `dist/chunks/`로 번들해서 상대경로가 dist 안쪽을 가리킨다.
- **satori는 oklch를 모른다.** `global.css` 팔레트를 쓰려면 hex로 옮겨야 한다. 옮겨둔 값이 `og.ts`의 `COLOR`에 있다.
- 전부 JPEG인 건 용량 때문이다. 픽셀아트를 PNG로 두면 장당 300KB가 넘어 dist에 60MB가 붙는다.

## 명령

```
make dev      # 개발 서버
make build    # astro build + pagefind 색인
npm run preview
```

`scripts/`의 나머지는 일회성 도구다. `convert-tistory.mjs`는 티스토리 백업을 마크다운으로 옮긴 변환기고, `prep-skill-post-images.mjs`는 특정 글의 Notion 스크린샷을 가공한다. 빌드는 둘 다 읽지 않는다.

## 코드 규약

- 주석은 한국어로, **무엇이 아니라 왜**를 쓴다. 특히 되돌리기 쉬워 보이는 결정에는 되돌리면 안 되는 이유를 남긴다.
- 코드가 이미 말하는 것을 반복하는 주석은 쓰지 않는다.
- 카피는 간결하고 담백하게. 뺄 수 있으면 뺀다.
