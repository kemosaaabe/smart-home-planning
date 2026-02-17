import { type FC, type ReactNode } from 'react';
import { Header } from '../Header';
import styles from './styles.module.scss';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
    </div>
  );
};
