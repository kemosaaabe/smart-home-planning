import { type FC } from 'react';
import { features } from '../../constants';
import styles from './styles.module.scss';

export const FeaturesSection: FC = () => {
  return (
    <section className={styles.features}>
      <div className={styles.stripHead}>
        <h2 className={styles.stripTitle}>Возможности</h2>
        <p className={styles.stripHint}>листайте →</p>
      </div>
      <div className={styles.scrollWrap}>
        <div className={styles.scroll}>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const n = String(index + 1).padStart(2, '0');
            return (
              <article key={index} className={styles.card}>
                <span className={styles.index}>{n}</span>
                <div className={styles.iconWrap}>
                  <Icon className={styles.icon} strokeWidth={2} />
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
