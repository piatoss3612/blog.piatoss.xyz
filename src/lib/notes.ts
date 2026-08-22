import type { CollectionEntry } from "astro:content";
import { dateDot, dayKey } from "./format";

type Note = CollectionEntry<"notes">;

// 시각이 없는 조각은 그날의 맨 아래로 보낸다. 언제 썼는지 모르는 걸
// 시각이 박힌 것들 사이에 끼워 넣으면 순서가 거짓말이 된다.
const sortKey = (note: Note) => `${dayKey(note.data.date)}T${note.data.time ?? "00:00"}`;

/** 최신 순. 같은 날·같은 시각이면 id로 갈라서 빌드마다 순서가 흔들리지 않게 한다. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => sortKey(b).localeCompare(sortKey(a)) || b.id.localeCompare(a.id));
}

export type NoteDay = { key: string; date: Date; notes: Note[] };

/** 한국 시간 기준으로 같은 날짜끼리 묶는다. 목록은 날짜 헤딩 하나에 조각 여럿 구조다. */
export function groupByDay(notes: Note[]): NoteDay[] {
  const days: NoteDay[] = [];
  for (const note of sortNotes(notes)) {
    const key = dayKey(note.data.date);
    const last = days.at(-1);
    if (last?.key === key) last.notes.push(note);
    else days.push({ key, date: note.data.date, notes: [note] });
  }
  return days;
}

/** <time datetime="">에 넣을 값. 시각이 있으면 오프셋까지 붙여 정확한 순간을 가리킨다. */
export function noteDatetime(note: Note): string {
  const day = dayKey(note.data.date);
  return note.data.time ? `${day}T${note.data.time}:00+09:00` : day;
}

type Source = NonNullable<Note["data"]["source"]>;

/**
 * 출처 한 줄. 단행본은 겹낫표『』, 그 안의 한 편은 홑낫표「」다.
 * 손으로 치면 어긋나고 어긋난 건 목록에서 바로 티가 나므로 여기서만 붙인다.
 */
export function citation(source: Source): string {
  const work = source.work ? `「${source.work}」, ` : "";
  const translator = source.translator ? ` (${source.translator} 옮김)` : "";
  return `${source.author}, ${work}『${source.book}』${translator}`;
}

/**
 * 탭과 공유 링크에 뜨는 이름. 발췌는 날짜만 보여 주면 무엇을 옮긴 건지 알 수 없다.
 * 화면에는 제목으로 띄우지 않는다 — 출처는 인용 아래에 오는 게 책의 모양이다.
 */
export function sourceTitle(source: Source): string {
  const work = source.work ? `「${source.work}」` : `『${source.book}』`;
  return `${work} — ${source.author}`;
}

/** 주석 문단. 프런트매터 문자열이라 마크다운을 태우지 않고 빈 줄로만 나눈다. */
export function commentParagraphs(note: Note): string[] {
  return note.data.comment?.trim().split(/\n\s*\n/) ?? [];
}

/** 사람이 읽는 식별자. 같은 날 조각이 여럿일 때 서로 구분되어야 해서 시각을 붙인다. */
export function noteLabel(note: Note): string {
  const day = dateDot(note.data.date);
  return note.data.time ? `${day} ${note.data.time}` : day;
}
