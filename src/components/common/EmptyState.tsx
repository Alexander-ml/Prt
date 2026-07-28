import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'bi-inbox',
  title,
  description,
  action,
}) => {
  return (
    <div className="empty-state animate-fadein">
      <i className={`bi ${icon} empty-state-icon`}></i>
      <p className="empty-state-title">{title}</p>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
