import { type FC } from 'react';
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ProjectsListPage, ProjectPage } from '@/pages/Projects';
import { ArticlePage, ArticlesListPage } from '@/pages/Articles';
import { TutorialPage } from '@/pages/Tutorial';

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
  {
    path: '/articles',
    element: <ArticlesListPage />,
  },
  {
    path: '/articles/:slug',
    element: <ArticlePage />,
  },
  {
    path: '/tutorial',
    element: <TutorialPage />,
  },
]);

export const RouterProvider: FC = () => {
  return <ReactRouterProvider router={router} />;
};
