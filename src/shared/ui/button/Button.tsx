import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-2 border-foreground text-sm font-bold uppercase tracking-wide transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-brutal hover:bg-primary/90',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground shadow-brutal hover:bg-destructive/90',
        outline:
          'border-foreground bg-background text-foreground shadow-brutal hover:bg-secondary hover:text-secondary-foreground',
        secondary:
          'border-foreground bg-secondary text-secondary-foreground shadow-brutal hover:opacity-90',
        ghost:
          'border-transparent shadow-none hover:border-foreground hover:bg-muted',
        link: 'border-transparent font-semibold text-primary shadow-none underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-10 text-sm',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
