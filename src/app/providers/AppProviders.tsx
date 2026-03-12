import { type FC } from 'react';
import { TooltipProvider } from '@/shared/ui';
import { QueryProvider } from './query';
import { RouterProvider } from './router';
import { ThemeProvider } from './theme';

export const AppProviders: FC = () => {
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <QueryProvider>
          <RouterProvider />
        </QueryProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
};
