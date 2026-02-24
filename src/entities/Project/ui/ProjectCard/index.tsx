import { type FC } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { type Project } from '../../model/types';
import styles from './styles.module.scss';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project }) => {
  const formattedDate = dayjs(project.updatedAt).format('DD.MM.YYYY HH:mm');

  return (
    <Link to={`/projects/${project.id}`} className={styles.card}>
      <h3 className={styles.name}>{project.name}</h3>
      <p className={styles.description}>
        {project.description ?? 'Нет описания'}
      </p>
      <p className={styles.updatedAt}>Изменён: {formattedDate}</p>
    </Link>
  );
};
