import { type FC } from 'react';
import { features } from '../../constants';
import styles from './styles.module.scss';

export const FeaturesSection: FC = () => {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className={styles.card}>
                <div className={styles.iconWrapper}>
                  <Icon className={styles.icon} />
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
