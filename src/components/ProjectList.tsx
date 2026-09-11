import React, { useState, useMemo } from 'react';
import type { ProjectWithStats } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  projects: ProjectWithStats[];
  onSelectProject: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPulse, setFilterPulse] = useState<string>('all');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contributors.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPulse = filterPulse === 'all' || p.pulse.level === filterPulse;

      return matchesSearch && matchesPulse;
    });
  }, [projects, searchTerm, filterPulse]);

  const highCount = projects.filter((p) => p.pulse.level === 'high').length;

  return (
    <div className="registry-view">
      {/* Editorial Registry Header */}
      <header className="registry-header">
        <div>
          <div className="registry-eyebrow">
            <span>● OBSERVATION CADENCE</span>
            <span>//</span>
            <span>FIELD REGISTRY</span>
          </div>
          <h1 className="registry-title">Current Observations</h1>
          <p className="registry-desc">
            Technical archive and continuous telemetry log tracking project development momentum,
            unfinished human experiments, and contributor dispatches.
          </p>
        </div>

        {/* Diagnostic Query & Bracket Filter Controls */}
        <div className="registry-controls">
          <div className="search-input-wrap">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--signal-high)' }}>
              &gt;
            </span>
            <input
              type="text"
              className="search-field"
              placeholder="SEARCH_PROJECTS_OR_CREW..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-bracket-group">
            {[
              { id: 'all', label: `ALL [${projects.length}]` },
              { id: 'high', label: `HIGH_MOMENTUM [${highCount}]` },
              { id: 'medium', label: 'STEADY' },
              { id: 'dormant', label: 'DORMANT' },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`bracket-btn ${filterPulse === id ? 'active' : ''}`}
                onClick={() => setFilterPulse(id)}
              >
                [ {label} ]
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Registry Record Rows */}
      {filteredProjects.length === 0 ? (
        <div className="state-container">
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--signal-high)' }}>[ 00 // NO_MATCH ]</span>
          <h3 className="state-title">No Observation Records Matched</h3>
          <p className="state-desc">
            No active project registry matches the query parameters. Reset filters to restore observatory field.
          </p>
          <button
            className="btn-retry"
            onClick={() => {
              setSearchTerm('');
              setFilterPulse('all');
            }}
          >
            [ RESTORE_DEFAULT_VIEW ]
          </button>
        </div>
      ) : (
        <section className="registry-list" aria-label="Monitored Projects List">
          {filteredProjects.map((project, idx) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={idx}
              onSelect={onSelectProject}
            />
          ))}
        </section>
      )}
    </div>
  );
};
