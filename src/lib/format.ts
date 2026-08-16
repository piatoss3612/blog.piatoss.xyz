// 날짜 표시는 빌드 머신이 아니라 한국 시간을 기준으로 한다.
// 로컬 시간(getFullYear 등)을 쓰면 CI(UTC)와 내 맥(KST)에서 결과가 갈린다.
const KST = "Asia/Seoul";

// en-CA는 YYYY-MM-DD로 준다. 그룹 키로도 쓰고 나머지 표기도 여기서 파생시킨다.
const ymdFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 한국 시간 기준 YYYY-MM-DD. 같은 날짜끼리 묶을 때 쓰는 키다. */
export function dayKey(d: Date): string {
  return ymdFormat.format(d);
}

export function dateDot(d: Date): string {
  return dayKey(d).replace(/-/g, ".");
}

export function dateKorean(d: Date): string {
  const [y, m, day] = dayKey(d).split("-");
  return `${Number(y)}년 ${Number(m)}월 ${Number(day)}일`;
}

// 한국어 기준 분당 500자로 러프하게 계산한다. 정밀할 필요 없음 — 감각용.
export function readingMinutes(body: string | undefined): number {
  const chars = (body ?? "").replace(/```[\s\S]*?```/g, "").replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}
