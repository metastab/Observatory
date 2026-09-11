import React from 'react';
import type { ProjectWithStats } from '../types';

interface ProjectCardProps {
  project: ProjectWithStats;
  index: number;
  onSelect: (projectId: string) => void;
}

/**
 * Procedurally generate an SVG oscilloscope / seismograph wave
 * responding to project pulse metrics and recent activity distribution.
 */
function renderSeismographPath(score: number, updates7d: number, level: string): string {
  const width = 240;
  const height = 36;
  const mid = height / 2;
  const points: [number, number][] = [];
  const steps = 40;

  // Base amplitude and frequency tied to score and recent updates
  const amp = level === 'dormant' ? 1.5 : Math.min(15, 3 + (score / 100) * 12);
  const freq = level === 'dormant' ? 0.05 : 0.15 + (updates7d * 0.04);

  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    // Harmonic wave with slight chaotic pulse center
    const envelope = Math.sin((i / steps) * Math.PI); // tapering at edges
    const wave = Math.sin(i * freq * 3.5) * Math.cos(i * 0.7);
    const spike = (i === 24 || i === 25) && level === 'high' ? -amp * 1.3 : 0;
    const y = mid + (wave * amp * envelope) + spike;
    points.push([x, Math.max(2, Math.min(height - 2, y))]);
  }

  return points.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, index, onSelect }) => {
  const { pulse, contributors, updateCount } = project;
  const indexStr = String(index + 1).padStart(3, '0');

  const signalColor =
    pulse.level === 'high'
      ? 'var(--signal-high)'
      : pulse.level === 'medium'
      ? 'var(--signal-medium)'
      : pulse.level === 'low'
      ? 'var(--signal-low)'
      : 'var(--signal-dormant)';

  const wavePath = renderSeismographPath(pulse.score, pulse.updates7d, pulse.level);

  return (
    <article
      className="project-record"
      onClick={() => onSelect(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(project.id);
        }
      }}
      aria-label={`Open project observation chamber for ${project.name}`}
    >
      {/* Col 1: Index Stamp */}
      <div className="record-index-col">
        <span className="record-num">/{indexStr}</span>
        <span className="record-tag">[ {project.status || 'ACTIVE'} ]</span>
      </div>

      {/* Col 2: Identity & Description */}
      <div className="record-main-col">
        <div className="record-title-row">
          <h2 className="record-title">{project.name}</h2>
        </div>
        <p className="record-desc">{project.description}</p>
        <div className="record-contributors-line">
          CREW // [ {contributors.join(' • ')} ]
        </div>
      </div>

      {/* Col 3: Seismograph Waveform Signal */}
      <div className="record-signal-col">
        <div className="signal-meta-row">
          <span style={{ color: signalColor, fontWeight: 600 }}>
            {pulse.label.toUpperCase()}
          </span>
          <span>{pulse.score}% SIGNAL VELOCITY</span>
        </div>
        <div className="signal-svg-box">
          <svg
            viewBox="0 0 240 36"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            {/* Grid baseline */}
            <line
              x1="0"
              y1="18"
              x2="240"
              y2="18"
              stroke="rgba(237, 234, 226, 0.06)"
              strokeDasharray="2 3"
            />
            {/* Dynamic Seismograph trace */}
            <path
              d={wavePath}
              fill="none"
              stroke={signalColor}
              strokeWidth={pulse.level === 'high' ? 1.5 : 1.2}
            />
          </svg>
        </div>
      </div>

      {/* Col 4: Diagnostic Metadata */}
      <div className="record-stats-col">
        <span className="stat-metric-stamp">
          {updateCount} {updateCount === 1 ? 'OBSERVATION' : 'OBSERVATIONS'}
        </span>
        <span className="stat-time-stamp">
          CONTACT: {pulse.lastUpdateRelative.toUpperCase()}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginTop: 4,
          }}
        >
          [ INSPECT → ]
        </span>
      </div>
    </article>
  );
};
