import { type FC } from 'react';
import { QueryProvider } from './query';
import { RouterProvider } from './router';
import { ThemeProvider } from './theme';

export const AppProviders: FC = () => {
  return (
    <ThemeProvider>
      <QueryProvider>
        <RouterProvider />
      </QueryProvider>
    </ThemeProvider>
  );
};
