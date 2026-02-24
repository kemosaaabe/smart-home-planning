import { type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './Breadcrumb';

export interface BreadcrumbItemType {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-3">
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <BreadcrumbItem key={`${item.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator />}
              {item.href != null && !isLast ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
