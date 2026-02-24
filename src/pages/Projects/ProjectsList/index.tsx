import { type FC } from 'react';
import { Plus } from 'lucide-react';
import { Layout } from '@/widgets/layout';
import { Breadcrumbs, Button } from '@/shared/ui';
import { ProjectsList, projectsListBreadcrumbs } from '@/widgets/Project';
import styles from './styles.module.scss';

export const ProjectsListPage: FC = () => {
  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={projectsListBreadcrumbs} />
        <div className={styles.header}>
          <h1 className={styles.title}>Мои проекты</h1>
          <Button className={styles.createButton}>
            <Plus className={styles.createButtonIcon} />
            <span className={styles.createButtonText}>Создать проект</span>
          </Button>
        </div>
        <ProjectsList />
      </div>
    </Layout>
  );
};
