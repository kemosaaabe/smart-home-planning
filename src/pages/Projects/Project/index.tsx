import { type FC } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/widgets/layout';
import { getProjects } from '@/entities/Project';
import styles from './styles.module.scss';

export const ProjectPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id != null ? Number(id) : NaN;
  const project = getProjects().find((p) => p.id === projectId);

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>{project?.name ?? 'Проект'}</h1>
      </div>
    </Layout>
  );
};
