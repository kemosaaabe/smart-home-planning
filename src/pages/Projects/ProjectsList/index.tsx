import { type FC } from 'react';
import { Plus } from 'lucide-react';
import { Layout } from '@/widgets/layout';
import { Breadcrumbs, Button } from '@/shared/ui';
import {
  ProjectsList,
  projectsListBreadcrumbs,
  useProjectFormStore,
} from '@/widgets/Project';
import styles from './styles.module.scss';

export const ProjectsListPage: FC = () => {
  const openCreateProjectForm = useProjectFormStore((state) => state.open);

  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={projectsListBreadcrumbs} />
        <div className={styles.header}>
          <h1 className={styles.title}>Мои проекты</h1>
          <Button
            className={styles.createButton}
            onClick={openCreateProjectForm}
          >
            <Plus className={styles.createButtonIcon} />
            <span className={styles.createButtonText}>Создать проект</span>
          </Button>
        </div>
        <ProjectsList />
      </div>
    </Layout>
  );
};
