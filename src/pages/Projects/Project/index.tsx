import { type FC, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/widgets/layout';
import { Breadcrumbs } from '@/shared/ui';
import { getProjects } from '@/entities/Project';
import { getProjectBreadcrumbs } from '@/widgets/Project';
import styles from './styles.module.scss';

export const ProjectPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id != null ? Number(id) : NaN;
  const project = getProjects().find((p) => p.id === projectId);
  const projectName = project?.name ?? 'Проект';

  const breadcrumbs = useMemo(
    () => getProjectBreadcrumbs(projectName),
    [projectName]
  );

  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>{projectName}</h1>
      </div>
    </Layout>
  );
};
