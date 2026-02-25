import { type FC, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ProjectForm, useProjectFormStore } from '@/widgets/Project';
import { Header } from '../Header';
import styles from './styles.module.scss';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const { isOpen, editProject, setOpen } = useProjectFormStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      editProject: state.editProject,
      setOpen: state.setOpen,
    }))
  );

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <ProjectForm
        key={isOpen ? (editProject?.id ?? 'new') : 'closed'}
        open={isOpen}
        onOpenChange={setOpen}
        project={editProject}
      />
    </div>
  );
};
