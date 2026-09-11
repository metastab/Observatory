import React, { useState, useEffect, useCallback } from 'react';
import type { Project, Update, OperatorSession } from '../types';
import { calculatePulse, calculate7DayActivity } from '../utils/pulse';
import { fetchProjectUpdates, publishProjectUpdate, deleteProjectUpdate } from '../lib/supabase';
import { ProjectHeader } from './ProjectHeader';
import { ActivityPulseVisualizer } from './ActivityPulseVisualizer';
import { UpdateComposer } from './UpdateComposer';
import { ActivityFeed } from './ActivityFeed';
import { AuthModal } from './AuthModal';
import { ErrorState } from './States';

interface ProjectDashboardProps {
  project: Project;
  activeOperator: OperatorSession | null;
  onAuthenticate: (targetContributor: string, password: string) => Promise<void>;
  onBack: () => void;
  onUpdatePublishedOverall: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  activeOperator,
  onAuthenticate,
  onBack,
  onUpdatePublishedOverall,
}) => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newestUpdateId, setNewestUpdateId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authModalTarget, setAuthModalTarget] = useState<string | null>(null);

  const loadUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjectUpdates(project.id);
      setUpdates(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load project updates';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const handleSelectContributor = (contributorName: string) => {
    // If not authenticated as this contributor, prompt for password
    if (!activeOperator || activeOperator.contributorName.toLowerCase() !== contributorName.toLowerCase()) {
      setAuthModalTarget(contributorName);
    }
  };

  const handlePublish = async (contributorName: string, content: string) => {
    try {
      setIsSubmitting(true);
      const newUpdate = await publishProjectUpdate(project.id, contributorName, content);
      
      // Update local state immediately
      setUpdates((prev) => [newUpdate, ...prev]);
      setNewestUpdateId(newUpdate.id);
      
      // Trigger dispatch toast
      setToastMessage(`DISPATCH RECORDED: [ ${contributorName.toUpperCase()} ] // SIGNAL UPDATED.`);
      setTimeout(() => setToastMessage(null), 3500);

      // Notify parent to refresh overview stats
      onUpdatePublishedOverall();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not publish update';
      alert(`Transmission fault: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    await deleteProjectUpdate(updateId, activeOperator?.contributorName);
    setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    setToastMessage('OBSERVATION PURGED: Record successfully deleted.');
    setTimeout(() => setToastMessage(null), 3500);
    onUpdatePublishedOverall();
  };

  if (error) {
    return (
      <div className="observation-chamber">
        <button className="btn-back-registry" onClick={onBack}>
          &lt; RETURN TO REGISTRY
        </button>
        <ErrorState message={error} onRetry={loadUpdates} />
      </div>
    );
  }

  // Calculate live pulse and 7-day activity directly from current project update timestamps
  const pulse = calculatePulse(updates);
  const recentDaysActivity = calculate7DayActivity(updates);

  return (
    <div className="observation-chamber">
      <ProjectHeader
        project={project}
        pulse={pulse}
        updateCount={updates.length}
        onBack={onBack}
      />

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          // CONNECTING TELEMETRY SENSORS TO SYSTEM CHAMBER...
        </div>
      ) : (
        <div className="chamber-grid">
          {/* PRIMARY VISUAL FEATURE: Observatory Signal Instrument */}
          <div className="chamber-left-col">
            <ActivityPulseVisualizer
              pulse={pulse}
              recentDaysActivity={recentDaysActivity}
              contributors={project.contributors}
            />
          </div>

          {/* PRIMARY INFORMATION FEATURE & COMPOSER */}
          <div className="chamber-right-col">
            <UpdateComposer
              contributors={project.contributors}
              authenticatedOperator={activeOperator?.contributorName || null}
              isSubmitting={isSubmitting}
              onSelectContributor={handleSelectContributor}
              onPublish={handlePublish}
            />

            <ActivityFeed
              updates={updates}
              currentOperator={activeOperator?.contributorName || null}
              currentUserId={activeOperator?.userId || null}
              newestUpdateId={newestUpdateId}
              onDeleteUpdate={handleDeleteUpdate}
            />
          </div>
        </div>
      )}

      {/* Password Authorization Modal */}
      {authModalTarget && (
        <AuthModal
          isOpen={Boolean(authModalTarget)}
          targetContributor={authModalTarget}
          currentOperator={activeOperator?.contributorName || null}
          onClose={() => setAuthModalTarget(null)}
          onAuthorize={async (password) => {
            await onAuthenticate(authModalTarget, password);
            setAuthModalTarget(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <span style={{ color: 'var(--signal-high)' }}>●</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
