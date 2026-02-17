import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { cn } from '@/shared/lib';
import { buttonVariants } from '@/shared/ui';
import styles from './styles.module.scss';

export const Header: FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <Home className={styles.logoIcon} />
          Умный дом
        </Link>
        <nav className={styles.nav}>
          <Link to="/projects" className={styles.navLink}>
            Проекты
          </Link>
          <Link to="/projects" className={cn(buttonVariants())}>
            Начать проектирование
          </Link>
        </nav>
      </div>
    </header>
  );
};
