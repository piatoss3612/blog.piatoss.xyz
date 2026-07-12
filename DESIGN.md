# piatoss.log — DESIGN.md

> 이 문서가 블로그의 디자인 단일 기준(source of truth)이다.
> 아트 제작(사람/AI 불문), 테마 구현, 리뷰는 전부 이 문서를 기준으로 판정한다.

## 1. 정체성

- **이름**: piatoss.log — "장부(ledger)에 기록을 남긴다"는 메타포.
- **내용물**: 날것의 경험 기록. 다듬어진 튜토리얼보다 1차 경험(회고, 삽질기, 생각)이 중심.
  기술 아카이브(티스토리 이식 212편)를 품되, 앞으로의 글은 에세이 비중이 커진다.
- **역할 구분**: piatoss.xyz(포트폴리오)가 "세계"라면, 블로그는 그 세계 안의 **"읽는 방"** —
  장식은 절제하고 색·온도·소품만 세계관에서 상속한다.
- **타이포 원칙**: 제목·에세이는 세리프(Noto Serif KR) = 기록의 결. UI·기술 본문은
  산세리프(Outfit + Pretendard). 에세이(`생각 정리`)는 본문까지 세리프 + 넉넉한 행간.

## 2. 테마 구조 — 밤과 먹의 이중주

토글로 전환되는 두 세계. 서로의 라이트/다크 모드가 아니라 **같은 세계의 밤과 낮**.

| | 🌙 밤 (기본, 현행) | 🖌 먹 (라이트, 신규) |
|---|---|---|
| 세계관 | 야간 숲의 랜턴 불빛, 픽셀 디오라마 | 한지 위의 수묵, 정령들의 산수 |
| 바탕 | 웜 오프블랙 `oklch(0.10 0.01 60)` | 와시/한지 크림 `#f2ebdc` |
| 액센트 | 랜턴 앰버 | 주홍(朱) — 낙관·초롱에만 |
| 재질 | 픽셀아트 스프라이트 | 갈필 붓선 + 먹 워시 |
| 구현 | `:root` 기본 토큰 | `[data-theme="ink"]` 토큰 오버라이드 |

## 3. 먹(墨) 테마 아트 디렉션

### 3.1 핵심 원칙

1. **동양적(범동양), 일본풍 아님.** 누라리횬의 손자에서 가져오는 것은
   "요괴/정령의 존재감 + 거친 붓의 기세"라는 **정서**이지 일본 문화 기호가 아니다.
   - 금지: 기모노 무늬, 가사오바케(우산요괴), 로쿠로쿠비, 초롱·족자의 일본 문자, 도리이, 사무라이 소품
   - 사용: 산수화 어휘(능선·소나무·안개·붓 원 달), 도깨비 뿔, 구미호, 갓/도포 느낌의 두루뭉술한 복식, 낙관 도장
2. **거친 붓, 마른 붓.** 매끈한 벡터 선은 실격. 필압에 따라 굵기가 변하고,
   끝이 갈라지고, 마른 붓이 긁힌 자국이 남아야 한다. 먹 번짐(워시)은 윤곽을 살짝 넘는다.
3. **여백의 미.** 화면을 채우지 않는다. 비운 자리가 구도의 절반이다.
4. **귀엽되 모호하지 않게.** 캐릭터는 얼굴·표정·정체가 또렷해야 한다.
   실루엣 블롭 금지. "이게 뭐지?"가 아니라 "얘 좋다"가 나와야 한다.

### 3.2 캐릭터 어휘

- **작은 정령들**: 만두처럼 둥근 몸, 점 눈, 작은 뿔, 수수한 도포. 표정 제각각(감은 눈, 웃음, 뚱함).
- **수호령**: 뿔 달린 크고 복슬복슬한 흰 존재. 무리의 닻. 온화한 표정.
- **구미호**: 이마에 주홍 점. 꼬리 아홉은 바람에 날리는 비단처럼 **몸 뒤로 수평으로 흐른다**
  (부채꼴·공작 깃털 금지). 원경 실루엣으로 쓸 때 가장 아름답다.
- **다람쥐 정령** (마스코트, 밤 테마 다람쥐의 먹 버전): 뾰족 귀 + 몸보다 큰 붓터치 꼬리 +
  도토리 + 이마 주홍 점.
- 표정과 자세로 개성을 주되, 선 밀도는 낮게 — 획 몇 개로 완성되는 경제성.

### 3.3 재질 기준 (판정 테스트 포함)

- **200% 줌 테스트**: 어떤 윤곽선도 균일 굵기의 매끈한 선이면 안 된다.
- 채움은 플랫 화이트 금지 — 옅은 회색 워시 2~3톤으로 종이 위에 앉힌다.
- 광택 금지: 하이라이트 타원, 유리 반사, 그라디언트 광은 전부 실격 (초롱은 무광 한지).
- 먹 스플래터는 소량, 발/꼬리 근처에만.

### 3.4 색 규칙

- **주홍은 문장부호다.** 뷰포트당 눈에 띄는 주홍 최대 2곳 (낙관, 초롱, 이마 점 중에서).
- 위계는 색이 아니라 먹 농담(濃淡)과 여백으로 만든다.
- 남색 워시는 원경 안개 전용, 항상 저채도·저불투명.

## 4. 팔레트 토큰

`[data-theme="ink"]` 오버라이드 (자세한 근거: `docs/concept/ink-theme/palette.md`):

```css
--sl-bg: #f2ebdc;            /* 한지 크림 */
--sl-bg-raised: #fbf7ed;
--sl-text: #211f1b;          /* 젖은 먹 */
--sl-text-muted: #5f5a51;    /* 가라앉은 먹 */
--sl-muted: #9c9487;         /* 마른 붓 잔흔 */
--sl-accent: #b83a2c;        /* 주홍(朱) */
--sl-accent-strong: #8f2b22;
--sl-accent-dim: #d58576;
--sl-card-bg: rgba(255, 252, 244, 0.76);
--sl-card-border: rgba(52, 47, 40, 0.22);
--sl-card-border-dim: rgba(52, 47, 40, 0.12);
--sl-indigo-wash: rgba(75, 85, 113, 0.12);  /* 원경 안개 전용 */
```

## 5. 에셋 슬롯 매핑

| 슬롯 | 밤 테마 (현행) | 먹 테마 |
|---|---|---|
| 히어로 밴드 (1672×941) | 픽셀 밤하늘 + 장부 | 산수: 붓 달 + 능선 + 소나무 + 원경 구미호 |
| 푸터 스트립 (1920×705) | 랜턴길 + 다람쥐 | 정령 행렬 (수호령 + 홍초롱 하나) |
| 기록 오브제 (~512×340) | 장부+깃펜 | 두루마리+붓 |
| 매달린 등 | 체인 랜턴 | 무광 홍초롱 (문자 없음) |
| 마스코트 | 픽셀 다람쥐 | 다람쥐 정령 |
| 글 끝 오너먼트 | 장부 | 낙관 도장 (주홍 "p") |
| 구분선 | ✦ ✦ ✦ | 먹 스플래터 획 |

## 6. 레퍼런스

`docs/concept/refs/` (유저 제공 — 이 문서의 3.1~3.4는 전부 여기서 도출):

- `ref1-fox-spirits.png` — **선의 기준**: 또렷한 먹 윤곽 + 개성 있는 정령 무리, 구미호 이마의 주홍 문양.
- `ref2-spirit-gathering.png` — **구도·캐릭터의 기준**: 둥근 눈 정령들의 밤 모임, 복슬 수호령, 젖은 먹의 온기.
- `ref3-fine-line-portrait.png` — **정교함의 상한선**: 극세선과 옅은 워시. 주제가 아니라 완성도의 기준.

안티 레퍼런스: 플랫 카툰/스티커 일러스트, 균일 벡터 아웃라인, 광택 하이라이트,
클립아트풍 대칭 구도, 주홍 남발.

## 7. 제작 매체 노트 (2026-07-12 현재 상태)

- 현재 `docs/concept/ink-theme/`의 아트는 **절차적 SVG** (Codex 4패스 + 수동 필터 보정).
  구도·캐릭터·팔레트 검증용으로는 충분하나, ref1~3 수준의 회화 질감(먹 번짐, 종이 흡수,
  붓 압력)은 벡터 필터의 천장에 막혀 있다.
- **프로덕션 경로 옵션**:
  - (a) 래스터 페인팅 생성 (이미지 모델) → 아래 §8 프롬프트 사용 → webp로 슬롯에 배치.
    질감 최상, 파일 큼, 수정 비용 중간.
  - (b) 현 SVG 유지·보정: 가볍고 선명하고 테마 토큰과 연동 가능. 질감 타협.
  - (c) 하이브리드 (권장): 대형 장면(히어로·푸터)은 래스터 페인팅, 소형 스프라이트
    (낙관·오너먼트·구분선)는 SVG.

## 8. 래스터 생성용 프롬프트 (슬롯별)

공통 스타일 블록 (모든 프롬프트 앞에 붙임):

> East Asian ink-wash painting (sumi-e / 수묵화) on warm cream hanji paper, rough dry-brush
> strokes with visible bristle marks and ink bleed, layered translucent gray washes, generous
> negative space, a single vermillion red accent used sparingly, storybook charm with clearly
> defined characters. NOT Japanese-specific: no kimono patterns, no kanji, no torii.
> No glossy highlights, no flat cartoon outlines, no anime style.

- **히어로 (와이드 1672×941)**: "A vast misty ink landscape: a huge rough brush-circle moon,
  layered mountain ridges dissolving into mist, one asymmetrical pine on the left; far away on
  a ridge, a small nine-tailed fox walks in silhouette, its nine tails streaming horizontally
  behind it like wind-blown silk, a tiny vermillion dot on its forehead."
- **푸터 행렬 (와이드 1920×705)**: "A night gathering of eleven small ink-spirit creatures along
  the bottom edge: round dumpling-like bodies, dot eyes, tiny dokkaebi horns, humble robes,
  varied heights and expressions; one large fluffy horned guardian spirit anchors the center;
  one small spirit carries the only glowing vermillion paper lantern (no writing on it)."
- **마스코트 다람쥐 정령 (투명배경 스프라이트)**: "A small squirrel spirit in ink-brush style:
  pointed tufted ears, an oversized sweeping brush-stroke tail larger than its body, holding a
  tiny acorn, round expressive eyes, a small vermillion dot on its forehead."
- **두루마리 (투명배경)**: "An open paper scroll with a calligraphy brush resting across it,
  a few gestural illegible ink strokes on the paper."
- **홍초롱 (투명배경)**: "A plain round paper lantern in ink outline, matte hanji texture,
  warm muted vermillion glow from within, hanging from a simple cord, no writing."
- **낙관 (투명배경)**: "A square vermillion seal stamp impression with a stylized abstract 'p'
  glyph, rough stamped edges with slight ink starvation."

## 9. 남은 결정

- [ ] 먹 테마 아트의 프로덕션 매체 확정 (§7의 a/b/c)
- [ ] `data-theme="ink"` 토글 구현 (헤더 버튼 + localStorage + 슬롯 스왑)
- [ ] git init + 이터레이션마다 커밋 (v1·v2 아트를 덮어써서 유실한 전례)
