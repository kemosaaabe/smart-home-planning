import { type FC } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { FolderOpen } from 'lucide-react';
import { type Project } from '../../model/types';
import styles from './styles.module.scss';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const formattedDate = dayjs(project.updatedAt).format('DD.MM.YYYY HH:mm');

  return (
    <Link to={`/projects/${project.id}`} className={styles.card}>
      <FolderOpen className={styles.icon} aria-hidden />
      <h3 className={styles.name}>{project.name}</h3>
      {project.description != null && project.description !== '' ? (
        <p className={styles.description}>{project.description}</p>
      ) : (
        <div className={styles.spacer} />
      )}
      <p className={styles.updatedAt}>Изменён: {formattedDate}</p>
    </Link>
  );
};
