import { type FC } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/providers/theme';
import styles from './styles.module.scss';

export const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      {isDark ? (
        <Sun className={styles.icon} aria-hidden />
      ) : (
        <Moon className={styles.icon} aria-hidden />
      )}
    </button>
  );
};
