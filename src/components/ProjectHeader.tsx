import React from 'react';
import type { Project, PulseInfo } from '../types';

interface ProjectHeaderProps {
  project: Project;
  pulse: PulseInfo;
  updateCount: number;
  onBack: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  pulse,
  updateCount,
  onBack,
}) => {
  const signalColor =
    pulse.level === 'high'
      ? 'var(--signal-high)'
      : pulse.level === 'medium'
      ? 'var(--signal-medium)'
      : pulse.level === 'low'
      ? 'var(--signal-low)'
      : 'var(--signal-dormant)';

  return (
    <div className="chamber-header-section">
      <div className="chamber-nav-strip">
        <button className="btn-back-registry" onClick={onBack} aria-label="Return to Project Registry">
          <span>&lt;</span>
          <span>RETURN TO REGISTRY</span>
        </button>
        <span className="chamber-stamp">
          CHAMBER_REF // {project.id.toUpperCase().slice(0, 12)}
        </span>
      </div>

      <div className="chamber-header-block">
        <div className="chamber-seq-label">
          <span>● OBSERVATION UNIT</span>
          <span>//</span>
          <span>STATUS: [ {project.status?.toUpperCase() || 'ACTIVE'} ]</span>
        </div>

        <h1 className="chamber-title">{project.name}</h1>
        <p className="chamber-desc">{project.description}</p>

        {/* Technical Monospace Telemetry Strip */}
        <div className="chamber-telemetry-strip">
          <div className="telemetry-cell">
            <span className="telemetry-label">SIGNAL MOMENTUM</span>
            <div className="telemetry-val" style={{ color: signalColor }}>
              <span style={{ fontSize: '0.85rem' }}>●</span>
              <span>{pulse.label.toUpperCase()}</span>
            </div>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">TOTAL OBSERVATIONS</span>
            <div className="telemetry-val">
              <span>{String(updateCount).padStart(2, '0')}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOGS</span>
            </div>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">REGISTERED CREW</span>
            <div className="telemetry-val">
              <span>{String(project.contributors.length).padStart(2, '0')}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MEMBERS</span>
            </div>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">LAST RECORDED CONTACT</span>
            <div className="telemetry-val" style={{ fontSize: '0.92rem' }}>
              <span>{pulse.lastUpdateRelative.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
