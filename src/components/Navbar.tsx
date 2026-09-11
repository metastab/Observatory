import React from 'react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  onGoHome: () => void;
  activeProjectCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onGoHome, activeProjectCount = 4 }) => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={onGoHome} title="Return to Project Registry">
          <div className="brand-glyph">⌖</div>
          <div className="brand-title-wrap">
            <span className="brand-title">THE OBSERVATORY</span>
            <span className="brand-meta">FIELD NOTEBOOK // PROJECT CADENCE</span>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="instrument-coord" title="Observatory Reference Coordinates">
            LOC // 32.6340° N • 75.0208° E
          </div>

          <div
            className="status-readout"
            title={
              isSupabaseConfigured
                ? 'Direct telemetry stream connected to PostgreSQL / Supabase'
                : 'Local observation mode active with browser cache persistence'
            }
          >
            {isSupabaseConfigured ? (
              <>
                <span className="status-dot-square live" />
                <span style={{ color: 'var(--text-primary)' }}>POSTGRES LIVE</span>
              </>
            ) : (
              <>
                <span className="status-dot-square demo" />
                <span style={{ color: 'var(--text-secondary)' }}>LOCAL INSTRUMENT</span>
              </>
            )}
          </div>

          <div
            className="status-readout"
            style={{ display: 'flex' }}
            title="Total registered project chambers"
          >
            <span style={{ color: 'var(--text-muted)' }}>PROJECTS:</span>
            <span style={{ color: 'var(--signal-high)', fontWeight: 700 }}>
              {String(activeProjectCount).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
