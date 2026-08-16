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
    title: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, notes };
