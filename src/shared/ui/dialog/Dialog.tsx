import { type FC, type ReactNode, type ReactElement, cloneElement, createContext, useContext, useState } from 'react';
import { cn } from '@/shared/lib';
import styles from './styles.module.scss';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(
  undefined
);

const useDialogContext = () => {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error('Dialog components must be used within Dialog');
  }

  return context;
};

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

const Dialog: FC<DialogProps> = ({
  open = false,
  onOpenChange,
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = onOpenChange !== undefined;
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;

  return (
    <DialogContext.Provider
      value={{ open: currentOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </DialogContext.Provider>
  );
};

interface DialogTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

const DialogTrigger: FC<DialogTriggerProps> = ({ children }) => {
  const { onOpenChange } = useDialogContext();

  if (typeof children === 'object' && children !== null && 'type' in children) {
    return cloneElement(children as ReactElement, {
      onClick: () => onOpenChange(true),
    });
  }

  return <>{children}</>;
};

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

const DialogContent: FC<DialogContentProps> = ({
  children,
  className,
}) => {
  const { open, onOpenChange } = useDialogContext();

  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(styles.content, className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

const DialogHeader: FC<DialogHeaderProps> = ({
  children,
  className,
}) => {
  return <div className={cn(styles.header, className)}>{children}</div>;
};

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

const DialogTitle: FC<DialogTitleProps> = ({ children, className }) => {
  return <h2 className={cn(styles.title, className)}>{children}</h2>;
};

interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

const DialogDescription: FC<DialogDescriptionProps> = ({
  children,
  className,
}) => {
  return <p className={cn(styles.description, className)}>{children}</p>;
};

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

const DialogFooter: FC<DialogFooterProps> = ({
  children,
  className,
}) => {
  return <div className={cn(styles.footer, className)}>{children}</div>;
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
