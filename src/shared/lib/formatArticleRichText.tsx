import { Fragment, type ReactNode } from 'react';

/** Превращает **жирный** в <strong> */
export function formatArticleRichText(text: string): ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, i) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={i}>{segment.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{segment}</Fragment>;
  });
}
