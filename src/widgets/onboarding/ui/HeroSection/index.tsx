import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib';
import { buttonVariants } from '@/shared/ui';
import styles from './styles.module.scss';

export const HeroSection: FC = () => {
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
          <Link to="/projects" className={cn(buttonVariants({ size: 'lg' }))}>
            Создать проект
          </Link>
          <Link
            to="/projects"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            Перейти к проектам
          </Link>
        </div>
      </div>
    </section>
  );
};
