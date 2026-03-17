import { type FC } from 'react';
import { DeviceCard, deviceList, type DeviceItem } from '@/entities/Device';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui';
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
  return (
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
  );
};
