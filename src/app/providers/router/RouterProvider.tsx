import { type FC } from 'react';
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ProjectsListPage, ProjectPage } from '@/pages/Projects';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/projects',
    element: <ProjectsListPage />,
  },
  {
    path: '/projects/:id',
    element: <ProjectPage />,
  },
]);

export const RouterProvider: FC = () => {
  return <ReactRouterProvider router={router} />;
};
