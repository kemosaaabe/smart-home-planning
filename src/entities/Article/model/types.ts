export type ArticleBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  readTimeMinutes: number;
  publishedAt: string;
  blocks: ArticleBlock[];
}
