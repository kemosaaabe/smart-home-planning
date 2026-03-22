import { type FC, useEffect, useState } from 'react';
import { Plus, TriangleAlert } from 'lucide-react';
import { Layout } from '@/widgets/layout';
import { Breadcrumbs, Button } from '@/shared/ui';
import {
  ProjectsList,
  projectsListBreadcrumbs,
  useProjectFormStore,
} from '@/widgets/Project';
import { tutorialStorageKeys } from '@/features/tutorial';
import styles from './styles.module.scss';

export const ProjectsListPage: FC = () => {
  const openCreateProjectForm = useProjectFormStore((state) => state.open);
  const [showTutorialWarning, setShowTutorialWarning] = useState(false);

  useEffect(() => {
    const isCompleted =
      localStorage.getItem(tutorialStorageKeys.completed) === 'true';
    setShowTutorialWarning(!isCompleted);
  }, []);

  const dismissTutorialWarning = () => {
    localStorage.setItem(tutorialStorageKeys.completed, 'true');
    setShowTutorialWarning(false);
  };

  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={projectsListBreadcrumbs} />
        {showTutorialWarning && (
          <div className={styles.tutorialWarning} role="alert">
            <TriangleAlert
              className={styles.tutorialWarningIcon}
              aria-hidden
            />
            <div className={styles.tutorialWarningContent}>
              <p className={styles.tutorialWarningTitle}>
                Рекомендуем пройти обучающий режим
              </p>
              <p className={styles.tutorialWarningText}>
                Так вы быстрее освоите инструменты и начнете проектирование без
                ошибок.
              </p>
            </div>
            <div className={styles.tutorialWarningActions}>
              <Button variant="secondary" onClick={dismissTutorialWarning}>
                Убрать подсказку
              </Button>
            </div>
          </div>
        )}
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
