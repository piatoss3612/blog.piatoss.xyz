import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string().default(""),
    description: z.string().default(""),
    tistoryId: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

// 조각: 정리해서 내놓는 글이 아니라 정리되기 전의 말.
// posts와 섞지 않으려고 컬렉션 자체를 분리한다. 제목은 없어도 된다.
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    date: z.coerce.date(),
    // 하루에 여러 개를 올릴 때 순서와 구분을 만드는 값. 한국 시간 HH:MM.
    //
    // date에 시각을 같이 적지 않는 이유: YAML은 오프셋이나 초가 없는 시각을
    // 문자열로 넘기고, 그러면 z.coerce.date()가 빌드 머신 타임존으로 해석한다.
    // 내 맥(KST)에서는 맞고 CI(UTC)에서는 9시간 밀려 다른 날짜로 넘어간다.
    // 필드를 나누면 이 파싱을 아예 타지 않고, 시각이 있는지도 추측하지 않아도 된다.
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time은 HH:MM (한국 시간)이어야 한다")
      .optional(),
    title: z.string().optional(),
    // 발췌 조각의 출처. 이 필드가 있으면 본문을 내 말이 아니라 옮겨 적은 말로 렌더한다.
    // 출처를 본문에 손으로 적지 않는 이유: 목록과 단독 페이지에서 모양이 갈리고,
    // 나중에 책별로 모으려 할 때 본문에서 다시 긁어내야 한다.
    //
    // 한 덩어리 문자열이 아니라 쪼개 두는 이유도 같다. 문자열로 두면 낫표를 손으로
    // 치게 되고(겹낫표『』와 홑낫표「」는 헷갈린다), 책별로 모을 때 그 문자열을
    // 도로 파싱해야 한다. 표기는 notes.ts의 citation()이 만든다.
    source: z
      .object({
        author: z.string(),
        // 단행본 제목. 단편집·시집이면 그 책 이름이 여기 온다.
        book: z.string(),
        // 그 책 안의 한 편(단편·시·수록글). 단행본 전체에서 옮겼으면 비운다.
        work: z.string().optional(),
        translator: z.string().optional(),
      })
      // 필드 이름을 잘못 적으면 조용히 버려지고 라벨만 사라진다. 빌드를 세운다.
      .strict()
      .optional(),
    // 발췌에 덧붙이는 내 말. 옮긴 말과 섞이면 누가 한 말인지 흐려지므로 본문 밖에 둔다.
    // 프런트매터라 마크다운은 태우지 않는다. 문단은 빈 줄로만 가른다.
    comment: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, notes };
