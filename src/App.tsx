import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Project, Update, ProjectWithStats, OperatorSession } from './types';
import { fetchProjects, fetchAllUpdates } from './lib/supabase';
import { calculatePulse, calculate7DayActivity } from './utils/pulse';
import {
  authenticateOperator,
  signOutOperator,
  getInitialOperator,
  subscribeAuthState,
} from './lib/auth';
import { Navbar } from './components/Navbar';
import { ProjectList } from './components/ProjectList';
import { ProjectDashboard } from './components/ProjectDashboard';
import { OperatorWidget } from './components/OperatorWidget';
import { LoadingState, ErrorState, EmptyState } from './components/States';

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUpdates, setAllUpdates] = useState<Update[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeOperator, setActiveOperator] = useState<OperatorSession | null>(null);

  // Restore authenticated session on mount and listen to state changes
  useEffect(() => {
    getInitialOperator().then((session) => {
      if (session) setActiveOperator(session);
    });

    const unsubscribe = subscribeAuthState((session) => {
      setActiveOperator(session);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load projects and updates from backend/demo layer
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedProjects, fetchedUpdates] = await Promise.all([
        fetchProjects(),
        fetchAllUpdates(),
      ]);
      setProjects(fetchedProjects);
      setAllUpdates(fetchedUpdates);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while loading data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute live project statistics (pulse, counts, 7-day sparklines)
  const projectsWithStats: ProjectWithStats[] = useMemo(() => {
    return projects.map((project) => {
      const projectUpdates = allUpdates.filter((u) => u.project_id === project.id);
      const pulse = calculatePulse(projectUpdates);
      const recentDaysActivity = calculate7DayActivity(projectUpdates);

      return {
        ...project,
        updateCount: projectUpdates.length,
        pulse,
        recentDaysActivity,
        latestUpdate: projectUpdates[0],
      };
    });
  }, [projects, allUpdates]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Handle when a new update is published inside an individual project
  const handleUpdatePublishedOverall = () => {
    fetchAllUpdates()
      .then((updatedList) => setAllUpdates(updatedList))
      .catch((err) => console.error('Failed to refresh updates list:', err));
  };

  const handleAuthenticate = async (targetContributor: string, password: string) => {
    const session = await authenticateOperator(targetContributor, password);
    setActiveOperator(session);
  };

  const handleSignOut = async () => {
    await signOutOperator();
    setActiveOperator(null);
  };

  return (
    <div className="app-container">
      <Navbar
        onGoHome={() => setSelectedProjectId(null)}
        activeProjectCount={projects.length}
      />

      <main className="main-content">
        {loading ? (
          <div style={{ paddingTop: 20 }}>
            <div
              style={{
                marginBottom: 20,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
              }}
            >
              // INITIALIZING OBSERVATORY TELEMETRY STREAM...
            </div>
            <LoadingState count={4} />
          </div>
        ) : error ? (
          <div style={{ paddingTop: 30 }}>
            <ErrorState message={error} onRetry={loadData} />
          </div>
        ) : selectedProject ? (
          <ProjectDashboard
            project={selectedProject}
            activeOperator={activeOperator}
            onAuthenticate={handleAuthenticate}
            onBack={() => setSelectedProjectId(null)}
            onUpdatePublishedOverall={handleUpdatePublishedOverall}
          />
        ) : projects.length === 0 ? (
          <div style={{ paddingTop: 20 }}>
            <EmptyState
              message="No project chambers currently registered in the database. Execute the seed script in supabase/schema.sql or docs/supabase.md in your Supabase SQL editor to initialize."
              onAction={loadData}
              actionLabel="RELOAD TELEMETRY"
            />
          </div>
        ) : (
          <ProjectList
            projects={projectsWithStats}
            onSelectProject={(id) => setSelectedProjectId(id)}
          />
        )}
      </main>

      {/* Persistent Operator Password Resetter Widget (Bottom-Right Edge) */}
      <OperatorWidget
        session={activeOperator}
        availableContributors={
          selectedProject?.contributors ||
          projects[0]?.contributors ||
          ['metastab', 'sneha', 'shivam', 'ankit', 'rounak']
        }
        onSignOut={handleSignOut}
      />
    </div>
  );
}

export default App;
