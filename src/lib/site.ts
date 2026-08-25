export const SITE = {
  title: "piatoss.log",
  tagline: "wallets and strange little interfaces.",
  url: "https://blog.piatoss.xyz",
  portfolio: "https://piatoss.xyz",
  github: "https://github.com/piatoss3612",
};

// Tistory 카테고리(한글 포함) → URL slug 매핑.
// 새 카테고리를 추가하면 여기에 등록한다. 등록하지 않으면 "etc"로 묶인다.
export const CATEGORY_SLUGS: Record<string, string> = {
  AI: "ai",
  Solidity: "solidity",
  Go: "go",
  Rust: "rust",
  블록체인: "blockchain",
  "생각 정리": "thoughts",
  "개발 부스러기": "scraps",
  "교육 과정": "education",
};

export const CATEGORY_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([name, slug]) => [slug, name]),
);

export function mainCategory(category: string): string {
  const main = (category || "").split("/")[0].trim();
  return main || "etc";
}

export function categorySlug(category: string): string {
  return CATEGORY_SLUGS[mainCategory(category)] ?? "etc";
}

// 카테고리 페이지에서는 제목이 이미 상위 분류다. 행마다 그걸 되풀이하면 200줄이 같은 말을 한다.
// 하위 분류가 없는 글(예: "Solidity")은 빈 문자열을 돌려주고 호출부가 칩을 생략한다.
export function subCategory(category: string): string {
  const rest = (category || "").split("/").slice(1).join("/").trim();
  return rest;
}
