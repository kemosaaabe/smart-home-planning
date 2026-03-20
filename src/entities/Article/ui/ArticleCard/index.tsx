import { type FC } from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { type Article } from '@/entities/Article/model/types';
import { formatArticleRichText } from '@/shared/lib';
import styles from './styles.module.scss';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: FC<ArticleCardProps> = ({ article }) => {
  return (
    <Link to={`/articles/${article.slug}`} className={styles.card}>
      <div className={styles.coverWrap}>
        <img
          className={styles.cover}
          src={article.coverImage}
          alt=""
          width={800}
          height={400}
          loading="lazy"
        />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          {dayjs(article.publishedAt).format('D MMMM YYYY')} ·{' '}
          {article.readTimeMinutes} мин
        </div>
        <h2 className={styles.cardTitle}>{article.title}</h2>
        <p className={styles.excerpt}>{formatArticleRichText(article.excerpt)}</p>
        <span className={styles.readMore}>Читать →</span>
      </div>
    </Link>
  );
};
