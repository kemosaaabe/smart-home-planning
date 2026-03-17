import { type FC } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui';
import { FurnitureCard, furnitureList, type FurnitureItem } from '@/entities/Furniture';
import styles from './styles.module.scss';

export interface FurnitureListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: FurnitureItem) => void;
}

export const FurnitureListModal: FC<FurnitureListModalProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <div className={styles.wrapper}>
          <DialogHeader>
            <DialogTitle>Мебель</DialogTitle>
          </DialogHeader>
          <div className={styles.grid}>
            {furnitureList.map((item) => (
              <FurnitureCard
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
