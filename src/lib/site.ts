export const SITE = {
  title: "piatoss.log",
  tagline: "wallets, Zcash, and strange little interfaces — 날것의 기록",
  description:
    "piatoss(rowan)의 기록. 블록체인, 지갑, Zcash, Go — 그리고 만들고 부수면서 겪은 것들.",
  url: "https://blog.piatoss.xyz",
  portfolio: "https://piatoss.xyz",
};

// Tistory 카테고리(한글 포함) → URL slug 매핑.
// 새 카테고리를 추가하면 여기에 등록한다. 등록하지 않으면 "etc"로 묶인다.
export const CATEGORY_SLUGS: Record<string, string> = {
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
