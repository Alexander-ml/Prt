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
  progress?: {
    segments: { count: number; color: string }[];
    total: number;
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
  progress,
  onClick,
}) => {
  const hasData = !!progress && progress.total > 0;

  return (
    <div
      className={`metric-card animate-fadeinup h-100 d-flex align-items-start gap-3 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default', minWidth: 0 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && e.key === 'Enter') onClick();
      }}
    >
      <div
        className={`metric-icon ${colorTheme} flex-shrink-0`}
        style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <i className={`bi ${icon}`} aria-hidden="true"></i>
      </div>

      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-1" style={{ minWidth: 0 }}>
          <p className="metric-label mb-0" style={{ minWidth: 0, wordBreak: 'break-word' }}>
            {title}
          </p>
          {trend && (
            <span
              className={`badge rounded-pill fw-semibold flex-shrink-0 ${
                trend.positive
                  ? 'bg-success-subtle text-success border border-success-subtle'
                  : 'bg-danger-subtle text-danger border border-danger-subtle'
              }`}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', whiteSpace: 'nowrap' }}
            >
              <i className={`bi bi-arrow-${trend.positive ? 'up' : 'down'}-short`} aria-hidden="true"></i>
              {trend.value}
            </span>
          )}
        </div>

        <span
          className="metric-value"
          style={{
            display: 'block',
            minWidth: 0,
            wordBreak: 'break-word',
            fontSize: 'clamp(1.1rem, 3.2vw, 1.4rem)',
            lineHeight: 1.2,
            marginTop: 2,
          }}
        >
          {value}
        </span>

        {subtitle && (
          <p className="metric-sub mb-0" style={{ minWidth: 0, wordBreak: 'break-word', marginTop: 2 }}>
            {subtitle}
          </p>
        )}

        {hasData && (
          <div style={{ marginTop: 10, minWidth: 0 }}>
            <div
              className="d-flex"
              style={{ height: 10, borderRadius: 99, overflow: 'hidden', background: 'rgba(0,0,0,0.06)' }}
            >
              {progress!.segments.map((seg, i) => {
                if (seg.count <= 0) return null;
                const isLastVisible =
                  progress!.segments.slice(i + 1).every(s => s.count <= 0);
                return (
                  <div
                    key={i}
                    style={{
                      flexGrow: seg.count,
                      flexBasis: 0,
                      background: seg.color,
                      borderRight: isLastVisible ? 'none' : '2px solid #fff',
                      transition: 'flex-grow 0.4s ease',
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
