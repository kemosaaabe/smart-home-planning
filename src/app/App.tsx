import { type FC } from 'react';
import { AppProviders } from './providers';
import '@/app/styles/globals.scss';

export const App: FC = () => {
  return <AppProviders />;
};
