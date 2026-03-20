import { type FC, useState } from 'react';
import { DeviceCard, deviceList, type DeviceItem } from '@/entities/Device';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import styles from './styles.module.scss';

export interface DeviceListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: DeviceItem) => void;
}

export const DeviceListModal: FC<DeviceListModalProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const [infoItem, setInfoItem] = useState<DeviceItem | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={styles.content}>
          <div className={styles.wrapper}>
            <DialogHeader>
              <DialogTitle>Умные устройства</DialogTitle>
            </DialogHeader>
            <div className={styles.grid}>
              {deviceList.map((item) => (
                <DeviceCard
                  key={item.id}
                  item={item}
                  onInfoClick={setInfoItem}
                  onClick={() => {
                    onSelect(item);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={infoItem != null} onOpenChange={(value) => !value && setInfoItem(null)}>
        <DialogContent className={styles.infoContent}>
          <DialogHeader>
            <DialogTitle>{infoItem?.name}</DialogTitle>
            <DialogDescription className={styles.infoDescription}>
              {infoItem?.description}
            </DialogDescription>
          </DialogHeader>
          <div className={styles.infoBlock}>
            <h4 className={styles.infoBlockTitle}>Где лучше размещать</h4>
            <p className={styles.infoBlockText}>{infoItem?.placementTips}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
