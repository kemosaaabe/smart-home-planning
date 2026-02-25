import { type FC, useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import {
  ProjectCard,
  getProjects,
  initProjects,
  type Project,
} from '@/entities/Project';
import { useProjectFormStore } from '@/widgets/Project/model/projectFormStore';
import styles from './styles.module.scss';

export const ProjectsList: FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => initProjects());
  const projectsVersion = useProjectFormStore((state) => state.projectsVersion);

  useEffect(() => {
    setProjects(getProjects());
  }, [projectsVersion]);

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
