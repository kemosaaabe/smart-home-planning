import { type FC } from 'react';
import styles from './styles.module.scss';

export const AboutSection: FC = () => {
  return (
    <section className={styles.about}>
      <div className={styles.container}>
        <p className={styles.text}>
          Данное приложение разработано в рамках магистерской диссертации как
          инструмент для проектирования и обучения работе с системой «Умный
          дом». Приложение предоставляет интерактивную среду для создания
          проектов умных домов, визуализации планировок и изучения возможностей
          современных систем автоматизации жилых помещений.
        </p>
      </div>
    </section>
  );
};
