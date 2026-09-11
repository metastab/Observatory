import React, { useState, useEffect } from 'react';
import type { OperatorSession } from '../types';
import { updateContributorPassword } from '../lib/auth';

interface OperatorWidgetProps {
  session: OperatorSession | null;
  availableContributors?: string[];
  onSignOut: () => Promise<void>;
}

export const OperatorWidget: React.FC<OperatorWidgetProps> = ({
  session,
  availableContributors = ['metastab', 'sneha', 'shivam', 'ankit', 'rounak'],
  onSignOut,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [targetOperator, setTargetOperator] = useState<string>('metastab');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync target operator when active session changes
  useEffect(() => {
    if (session?.contributorName) {
      setTargetOperator(session.contributorName);
    }
  }, [session]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim() || !newPassword.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await updateContributorPassword(targetOperator, oldPassword, newPassword);
      setFeedback({
        type: 'success',
        message: `Key updated in database for [${targetOperator.toUpperCase()}].`,
      });
      setOldPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password in database.';
      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className={`operator-session-widget ${isExpanded ? 'expanded' : ''}`} aria-label="Password Resetter Widget">
      <div className="widget-header">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}
        >
          <span style={{ color: 'var(--signal-high)', fontSize: '0.75rem' }}>⚿</span>
          <span className="widget-title">KEY RESET // OPERATOR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {session ? (
            <span className="widget-status active">● {session.contributorName.toUpperCase()}</span>
          ) : (
            <span className="widget-status idle">○ NO SESSION</span>
          )}
          <button
            type="button"
            className="widget-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse widget' : 'Expand widget'}
          >
            {isExpanded ? '[ ▾ ]' : '[ ▴ ]'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="widget-expanded-body animate-fade-in">
          <form onSubmit={handleResetPassword} className="reset-key-form">
            {/* Operator Identifier Selection */}
            <div className="reset-field-group">
              <label className="reset-field-label">OPERATOR SIGNATURE:</label>
              {session ? (
                <div className="reset-active-name">
                  <span>[ {session.contributorName.toUpperCase()} ]</span>
                  <button
                    type="button"
                    className="btn-widget-signout"
                    onClick={() => onSignOut()}
                    title="Sign out of current operator session"
                  >
                    [ SIGN OUT ]
                  </button>
                </div>
              ) : (
                <select
                  className="reset-select"
                  value={targetOperator}
                  onChange={(e) => {
                    setTargetOperator(e.target.value);
                    setFeedback(null);
                  }}
                  disabled={isSubmitting}
                >
                  {availableContributors.map((name) => (
                    <option key={name} value={name}>
                      [ {name.toUpperCase()} ]
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Old Password Input */}
            <div className="reset-field-group">
              <label htmlFor="widget-old-password" className="reset-field-label">
                CURRENT ACCESS KEY:
              </label>
              <input
                id="widget-old-password"
                type="password"
                className="reset-input"
                placeholder="Current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
            </div>

            {/* New Password Input */}
            <div className="reset-field-group">
              <label htmlFor="widget-new-password" className="reset-field-label">
                NEW ACCESS KEY:
              </label>
              <input
                id="widget-new-password"
                type="password"
                className="reset-input"
                placeholder="New password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>

            {/* Feedback Message */}
            {feedback && (
              <div
                className={`reset-feedback-block ${feedback.type}`}
                role="alert"
              >
                <span>{feedback.type === 'success' ? '✓' : '!'}</span>
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-reset-submit"
              disabled={isSubmitting || !oldPassword.trim() || !newPassword.trim()}
            >
              {isSubmitting ? '[ UPDATING IN DB... ]' : '[ > UPDATE KEY IN DB ]'}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};
