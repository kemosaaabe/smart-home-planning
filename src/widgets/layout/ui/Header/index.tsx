import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
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
          <Link to="/articles" className={styles.navLink}>
            Статьи
          </Link>
          <Link to="/projects" className={styles.navLink}>
            Проекты
          </Link>
        </nav>
      </div>
    </header>
  );
};
