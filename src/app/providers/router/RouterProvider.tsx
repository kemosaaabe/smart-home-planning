import { type FC } from 'react';
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
]);

export const RouterProvider: FC = () => {
  return <ReactRouterProvider router={router} />;
};
