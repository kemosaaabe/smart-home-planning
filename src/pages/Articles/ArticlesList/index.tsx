import { type FC } from 'react';
import { Layout } from '@/widgets/layout';
import { Breadcrumbs } from '@/shared/ui';
import { ArticlesList } from '@/widgets/Articles';
import styles from './styles.module.scss';

const breadcrumbs = [
  { label: 'Главная', href: '/' },
  { label: 'Статьи' },
];

export const ArticlesListPage: FC = () => {
  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={breadcrumbs} />
        <header className={styles.header}>
          <h1 className={styles.title}>Статьи и гайды</h1>
          <p className={styles.subtitle}>
            Принципы умных устройств и работа с планировщиком — коротко и по делу.
          </p>
        </header>
        <ArticlesList />
      </div>
    </Layout>
  );
};
