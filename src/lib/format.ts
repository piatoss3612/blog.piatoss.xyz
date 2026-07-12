export function dateDot(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function dateKorean(d: Date): string {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 한국어 기준 분당 500자로 러프하게 계산한다. 정밀할 필요 없음 — 감각용.
export function readingMinutes(body: string | undefined): number {
  const chars = (body ?? "").replace(/```[\s\S]*?```/g, "").replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}
