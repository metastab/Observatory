import React from 'react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="state-container" role="alert">
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal-high)', fontSize: '0.8rem' }}>
        [ ERROR // DIAGNOSTIC_FAULT ]
      </span>
      <h3 className="state-title">Data Stream Disconnected</h3>
      <p className="state-desc">{message}</p>
      {onRetry && (
        <button className="btn-retry" onClick={onRetry}>
          [ RETRY TELEMETRY QUERY ]
        </button>
      )}
    </div>
  );
};

export const LoadingState: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="registry-list" aria-busy="true" aria-label="Acquiring observation telemetry">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-record" />
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{ message?: string; onAction?: () => void; actionLabel?: string }> = ({
  message = 'No records found in registry.',
  onAction,
  actionLabel = 'REFRESH',
}) => {
  return (
    <div className="state-container">
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>[ 00 // VOID ]</span>
      <h3 className="state-title">No Monitored Systems</h3>
      <p className="state-desc">{message}</p>
      {onAction && (
        <button className="btn-retry" onClick={onAction}>
          [ {actionLabel} ]
        </button>
      )}
    </div>
  );
};
