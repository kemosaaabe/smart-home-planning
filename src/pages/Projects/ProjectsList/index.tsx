import { type FC } from 'react';
import { Plus } from 'lucide-react';
import { Layout } from '@/widgets/layout';
import { Button } from '@/shared/ui';
import { ProjectsList } from '@/widgets/Project/ui/ProjectsList';
import styles from './styles.module.scss';

export const ProjectsListPage: FC = () => {
  return (
    <Layout>
      <div className={styles.page}>
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
