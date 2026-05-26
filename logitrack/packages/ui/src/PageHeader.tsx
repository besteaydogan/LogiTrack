import type { ReactNode } from 'react';

import './PageHeader.css';

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, description, actions, eyebrow = 'Phase 2' }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <p className="page-header__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}
