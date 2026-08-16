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
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, notes };
