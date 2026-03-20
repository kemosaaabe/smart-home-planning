import { articles } from './articles';
import type { Article } from './types';

export function getAllArticles(): Article[] {
  return [...articles];
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export { articles } from './articles';
export type { Article, ArticleBlock } from './types';
