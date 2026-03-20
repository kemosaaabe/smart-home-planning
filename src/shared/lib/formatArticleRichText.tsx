import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Превращает **жирный** и [ссылки](/path) */
export function formatArticleRichText(text: string): ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return segments.map((segment, i) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={i}>{segment.slice(2, -2)}</strong>;
    }
    const linkMatch = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      return (
        <Link key={i} to={href}>
          {label}
        </Link>
      );
    }
    return <Fragment key={i}>{segment}</Fragment>;
  });
}
