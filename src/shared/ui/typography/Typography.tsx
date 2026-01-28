import { type FC, type ReactNode } from 'react';
import { cn } from '@/shared/lib';
import styles from './styles.module.scss';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'bodyS' | 'bodyM' | 'bodyL';

export interface TypographyProps {
  variant: TypographyVariant;
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const Typography: FC<TypographyProps> = ({
  variant,
  children,
  className,
  as,
}) => {
  const Component = as || getDefaultTag(variant);

  return (
    <Component className={cn(styles[variant], className)}>{children}</Component>
  );
};

function getDefaultTag(variant: TypographyVariant): keyof JSX.IntrinsicElements {
  switch (variant) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
      return variant;
    case 'bodyS':
    case 'bodyM':
    case 'bodyL':
      return 'p';
    default:
      return 'p';
  }
}
