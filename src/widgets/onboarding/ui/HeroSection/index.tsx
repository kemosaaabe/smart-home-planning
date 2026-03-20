import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { useProjectFormStore } from '@/widgets/Project';
import styles from './styles.module.scss';

export const HeroSection: FC = () => {
  const openCreateProjectForm = useProjectFormStore((state) => state.open);

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Интерактивное проектирование систем «Умный дом»
        </h1>
        <p className={styles.subtitle}>
          Создавайте проекты, добавляйте комнаты и размещайте умные устройства
          в визуальном редакторе. Используйте обучающий режим для изучения
          возможностей системы.
        </p>
        <div className={styles.actions}>
          <Button size="lg" type="button" onClick={openCreateProjectForm}>
            Создать проект
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/projects">Перейти к проектам</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/articles">Статьи и гайды</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
