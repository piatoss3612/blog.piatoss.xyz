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

/** 주석 문단. 프런트매터 문자열이라 마크다운을 태우지 않고 빈 줄로만 나눈다. */
export function commentParagraphs(note: Note): string[] {
  return note.data.comment?.trim().split(/\n\s*\n/) ?? [];
}

/** 사람이 읽는 식별자. 같은 날 조각이 여럿일 때 서로 구분되어야 해서 시각을 붙인다. */
export function noteLabel(note: Note): string {
  const day = dateDot(note.data.date);
  return note.data.time ? `${day} ${note.data.time}` : day;
}
