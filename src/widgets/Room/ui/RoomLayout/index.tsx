import { type FC } from 'react';
import styles from './styles.module.scss';

export interface RoomLayoutProps {
  projectId?: number;
}

export const RoomLayout: FC<RoomLayoutProps> = () => {
  return <div className={styles.planning} aria-label="Область проектирования" />;
};
