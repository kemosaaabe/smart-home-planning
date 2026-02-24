import { type FC, useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import { ProjectCard, initProjects, type Project } from '@/entities/Project';
import styles from './styles.module.scss';

export const ProjectsList: FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(initProjects());
  }, []);

  if (projects.length === 0) {
    return (
      <div className={styles.empty}>
        <FolderOpen className={styles.emptyIcon} />
        <p className={styles.emptyText}>У вас пока нет проектов</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
};
