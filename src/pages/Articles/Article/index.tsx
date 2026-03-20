import { type FC } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { Layout } from '@/widgets/layout';
import { Breadcrumbs } from '@/shared/ui';
import { getArticleBySlug } from '@/entities/Article';
import { formatArticleRichText } from '@/shared/lib';
import styles from './styles.module.scss';

dayjs.locale('ru');

export const ArticlePage: FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Статьи', href: '/articles' },
    { label: article.title },
  ];

  return (
    <Layout>
      <article className={styles.page}>
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.hero}>
          <img
            className={styles.heroImg}
            src={article.coverImage}
            alt=""
            width={800}
            height={400}
          />
        </div>
        <div className={styles.meta}>
          {dayjs(article.publishedAt).format('D MMMM YYYY')} · читать ~{' '}
          {article.readTimeMinutes} мин
        </div>
        <h1 className={styles.title}>{article.title}</h1>
        <div className={styles.body}>
          {article.blocks.map((block, index) => {
            if (block.type === 'h2') {
              return <h2 key={index}>{block.text}</h2>;
            }
            if (block.type === 'p') {
              return <p key={index}>{formatArticleRichText(block.text)}</p>;
            }
            if (block.type === 'ul') {
              return (
                <ul key={index}>
                  {block.items.map((item, j) => (
                    <li key={j}>{formatArticleRichText(item)}</li>
                  ))}
                </ul>
              );
            }
            return null;
          })}
        </div>
        <Link to="/articles" className={styles.back}>
          ← Все статьи
        </Link>
      </article>
    </Layout>
  );
};
