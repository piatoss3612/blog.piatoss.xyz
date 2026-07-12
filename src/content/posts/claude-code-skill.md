---
title: "Claude Code 데스크탑 앱으로 나만의 스킬 만들기"
date: 2026-07-12T18:00:00+09:00
category: "AI"
description: "CLI 없이 데스크탑 앱만으로 Claude Code 스킬을 만들고 등록하고 사용하는 전 과정. 스킬이 왜 필요한지, CLAUDE.md와는 뭐가 다른지부터 skill-creator로 실제 스킬을 빚어내는 과정까지."
---

> 원래 사내 공유용으로 만들었던 자료를 다듬어 올립니다. 스크린샷은 **2026년 2월 데스크탑 앱 기준**이라 지금 UI와 조금 다를 수 있지만, 흐름 자체는 그대로 유효합니다. CLI가 부담스러워서 Claude Code를 미뤄왔다면 — 이 글은 터미널 없이 데스크탑 앱만으로 진행합니다.

시작 전에 상단 메뉴 바에서 업데이트부터 확인해 주세요. 이 글의 기능들은 최신 버전 기준입니다.

![Claude 메뉴에서 Check for Updates](/posts/claude-code-skill/img/01-check-updates.webp)

## 0. 스킬을 왜 쓰나

Claude는 매 대화(세션)마다 처음부터 판단합니다. "PR 리뷰해줘"라고 하면 그때그때 다르게 행동하고, 같은 실수를 반복하고, 중요한 체크포인트를 빠뜨립니다.

**스킬은 "이 상황에서는 이렇게 행동하라"는 전문 절차를 파일로 캡처한 것**입니다.

일반 프롬프트로 "PR 리뷰해줘"라고 하면 Claude가 즉흥적으로 판단해서 매번 다른 결과가 나오지만, 스킬을 사용하면 항상 동일한 체크리스트를 실행하고 아키텍처/보안/패턴 순서로 체계적으로 검토합니다.

스킬을 만드는 이유:

- **반복 작업** — 같은 절차를 반복 실행할 때 매번 설명하지 않아도 됩니다
- **전문 지식 보존** — 팀 컨벤션이 에이전트에 내재화됩니다
- **복잡한 워크플로우** — 단계 누락 없이 일관되게 실행됩니다
- **역할 분리** — 스킬마다 다른 전문가 페르소나를 부여할 수 있습니다

한 줄 요약: **스킬은 "내가 이 작업을 어떻게 해주길 원하는지"를 Claude에게 한 번만 가르치는 방법입니다.**

> 💡 **CLAUDE.md와 뭐가 다른가?**
>
> - **CLAUDE.md** → 매 대화마다 자동 로드. 코드 컨벤션, 금지사항 등 항상 유효한 배경 지식
> - **스킬** → 호출할 때만 로드. 릴리즈 절차, 리뷰 체크리스트 등 특정 작업의 절차
>
> CLAUDE.md = 회사 규정집(항상 적용), 스킬 = 업무 매뉴얼(해당 업무 시 꺼내봄).
>
> 스킬이 없으면 CLAUDE.md에 모든 걸 다 넣어야 하는데, 그러면 관련 없는 정보까지 항상 로드되어 컨텍스트가 낭비됩니다.

## 1. skill-creator 활성화

데스크탑 앱 왼쪽 사이드바 상단에 **Customize** 메뉴가 있습니다. Customize를 클릭한 뒤 사이드바에서 **Skills**를 선택합니다. (참고로 Scheduled도 생겨서 루틴 작업 자동화도 가능해졌습니다.)

![사이드바의 Customize 메뉴](/posts/claude-code-skill/img/02-customize-sidebar.webp)

![Customize에서 Skills 선택](/posts/claude-code-skill/img/03-customize-skills.webp)

설정에서 접근하는 방법도 있습니다:

1. 왼쪽 하단 계정 정보 클릭
2. 설정(Settings)
3. 기능(Capabilities)
4. 하단 Skills
5. 'Go to Customize' 클릭

![계정 메뉴](/posts/claude-code-skill/img/04-account-menu.webp)

![Settings의 Capabilities 탭](/posts/claude-code-skill/img/05-settings-capabilities.webp)

Customize 페이지에서 **Examples → skill-creator**를 찾아 스위치를 켜서 활성화합니다. skill-creator는 기본 제공 스킬이지만, 구성지고 견고한 스킬을 만들기에 충분히 강력합니다.

![skill-creator 활성화](/posts/claude-code-skill/img/06-skill-creator-toggle.webp)

그다음 홈으로 돌아가서 상단 탭에서 **Cowork**를 선택하고 작업할 디렉토리를 지정합니다.

![Cowork에서 디렉토리 선택](/posts/claude-code-skill/img/07-cowork-directory.webp)

## 2. 리서치 계획 세우기, 그리고 실행

예시로 점성학 분석(썬/문/라이징) 스킬을 만들어 보겠습니다. 만들고 싶은 스킬에 대한 리서치를 먼저 진행하는데, 바로 "리서치해 줘"라고 지시하기보다 **리서치 계획을 먼저 세우는 것이 중요합니다.**

계획을 먼저 세우는 이유: 충분한 맥락 없이, 혹은 모호한 요청 상태에서 즉시 실행하면 AI는 주어진 맥락 안에서 찾은 정보로 적당히 둘러대거나 헛짓거리를 하게 됩니다. 계획 단계의 질의응답을 거치면서 **사용자 자신이 원하는 것을 구체화**하고, AI 응답의 사실성과 정확도를 끌어올려야 합니다. 구체적인 소스를 구조적으로 분해해서 어디부터 살펴볼지 정한 다음 조사하는 것도 좋은 방법입니다.

![리서치 계획 요청](/posts/claude-code-skill/img/08-research-plan-prompt.webp)

계획을 세우는 과정에서 AI가 이렇게 요구사항을 구체화해 옵니다:

![요구사항 구체화 질문 1](/posts/claude-code-skill/img/09-plan-questions-1.webp)

![요구사항 구체화 질문 2](/posts/claude-code-skill/img/10-plan-questions-2.webp)

계획은 가능하면 **파일로 저장해 달라고** 요청하세요. 세션이 오류로 중단되어 새 세션으로 옮겨야 할 때, 계획 파일만 넘겨주면 작업을 바로 이어갈 수 있습니다. 확장자는 `.txt` 또는 `.md`(강력 추천).

![계획을 파일로 저장](/posts/claude-code-skill/img/11-plan-save-file.webp)

계획을 실행하라고 지시하면 알아서 잘 진행해 줍니다. 리서치 결과도 가능하면 파일로 저장해 두세요.

![리서치 실행](/posts/claude-code-skill/img/12-research-run.webp)

## 3. 스킬 만들기

이제 1번에서 활성화한 skill-creator로 스킬을 만들 차례입니다. "~에 대한 스킬을 만들어줘"만으로도 대개 충분하지만, 혹시 모를 삑사리에 대비해 **"skill-creator 스킬을 사용해서 스킬을 만들어 줘"라고 명시**하는 것이 베스트입니다.

그러면 AI가 스킬의 존재를 먼저 확인합니다:

![skill-creator 스킬 확인](/posts/claude-code-skill/img/13-skill-check.webp)

여기서도 리서치와 마찬가지로 계획을 먼저 세웁니다. 물론 원하는 것을 분명하게 전달할 수 있다면 바로 실행 단계로 넘어가도 됩니다. 계획이 그럴싸하면 그대로 실행하고, 아니라면 수정 요청을 반복해서 계획을 완성합니다.

![스킬 제작 계획](/posts/claude-code-skill/img/14-skill-plan.webp)

작업이 완료되면 Cowork 시작 시 지정한 로컬 디렉토리에 `[skill-name]` 디렉토리가 생기고, 그 안에 `SKILL.md` 파일과 참조 파일들이 담긴 `references` 디렉토리가 들어 있습니다.

![생성된 스킬 디렉토리](/posts/claude-code-skill/img/15-skill-output-dir.webp)

![SKILL.md와 references 구조](/posts/claude-code-skill/img/16-skill-files.webp)

이렇게 만들어진 스킬 디렉토리를 그대로 **zip으로 압축**한 뒤:

1. Customize → Skills에서 **+** 아이콘 클릭
2. **Upload a skill** 선택
3. zip 파일을 드래그 앤 드롭하거나 클릭해서 업로드

![스킬 업로드](/posts/claude-code-skill/img/17-upload-skill.webp)

My Skills 항목에 방금 만든 스킬이 등록됩니다.

![My Skills에 등록된 스킬](/posts/claude-code-skill/img/18-my-skills.webp)

## 4. 만든 스킬 사용하기

이제 스킬을 바로 호출해서 사용하면 됩니다.

![스킬 사용 — 분석 문서가 생성된 모습](/posts/claude-code-skill/img/19-use-skill.webp)

반복 작업이나 구체적인 절차가 필요한 작업을 스킬로 만들어 놓고, **Scheduled tasks로 주기적으로 실행**하는 조합도 가능해 보입니다.

![Scheduled 메뉴](/posts/claude-code-skill/img/20-scheduled.webp)

## 더 깊이 파고 싶다면

Anthropic이 공개한 스킬 제작 가이드 문서가 있습니다:

- [The Complete Guide to Building Skills for Claude (PDF)](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)

이 문서를 기반으로 `skill-bestpractice` 스킬을 하나 만들어 두고 — ① skill-creator로 만들고 ② skill-bestpractice로 검증하는 2단 구성으로 가져가는 것도 괜찮은 방법입니다.

스킬은 한 번 만들어 두면 "내가 원하는 방식"이 세션이 바뀌어도 유지된다는 점에서, 프롬프트를 잘 쓰는 것과는 다른 종류의 레버리지입니다. 반복해서 시키는 일이 하나라도 있다면, 그게 첫 스킬 후보입니다.
