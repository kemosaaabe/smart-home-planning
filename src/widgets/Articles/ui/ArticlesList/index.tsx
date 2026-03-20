import { type FC } from 'react';
import { getAllArticles, ArticleCard } from '@/entities/Article';
import styles from './styles.module.scss';

export const ArticlesList: FC = () => {
  const list = getAllArticles();

  return (
    <div className={styles.grid}>
      {list.map((article) => (
        <ArticleCard key={article.slug} article={article} />
      ))}
    </div>
  );
};
