import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  colorTheme = 'indigo',
  trend,
  onClick,
}) => {
  return (
    <div
      className={`metric-card animate-fadeinup ${onClick ? 'cursor-pointer' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className={`metric-icon ${colorTheme}`}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="flex-grow-1 min-w-0">
        <p className="metric-label">{title}</p>
        <div className="d-flex align-items-baseline gap-2 flex-wrap">
          <span className="metric-value">{value}</span>
          {trend && (
            <span
              className={`badge rounded-pill fw-semibold ${
                trend.positive
                  ? 'bg-success-subtle text-success border border-success-subtle'
                  : 'bg-danger-subtle text-danger border border-danger-subtle'
              }`}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
            >
              <i className={`bi bi-arrow-${trend.positive ? 'up' : 'down'}-short`}></i>
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && <p className="metric-sub">{subtitle}</p>}
      </div>
    </div>
  );
};
