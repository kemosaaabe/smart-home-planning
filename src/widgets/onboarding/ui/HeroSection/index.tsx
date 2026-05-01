import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/shared/ui';
import styles from './styles.module.scss';

export const HeroSection: FC = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroLeft}>
          <p className={styles.kicker}>Платформа · v3</p>
          <h1 className={styles.title}>
            <span className={styles.titleRow}>Умный дом</span>
            <span className={styles.titleRowAccent}>без схем</span>
            <span className={styles.titleRow}>на бумаге</span>
          </h1>
          <p className={styles.subtitle}>
            Проекты, комнаты и устройства в одном визуальном поле. Обучение
            встроено — не переключайтесь между вкладками и PDF.
          </p>
          <div className={styles.actions}>
            <Button size="lg" asChild>
              <Link to="/tutorial">Обучение</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/projects">Проекты</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/articles">Статьи</Link>
            </Button>
          </div>
        </div>

        <aside className={styles.heroRight} aria-hidden>
          <div className={styles.panel}>
            <div className={styles.panelTop}>
              <span className={styles.panelDot} />
              <span className={styles.panelDot} />
              <span className={styles.panelDot} />
              <span className={styles.panelTitle}>layout.grid</span>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Комнаты</span>
                <span className={styles.statValue}>12</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Устройства</span>
                <span className={styles.statValue}>48</span>
              </div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} />
              </div>
              <p className={styles.panelNote}>
                Сетка и привязка — как в CAD, только проще.
              </p>
            </div>
          </div>
          <Link to="/projects" className={styles.floatingLink}>
            Открыть редактор
            <ArrowUpRight className={styles.floatingIcon} strokeWidth={2.5} />
          </Link>
        </aside>
      </div>
    </section>
  );
};
