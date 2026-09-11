import React, { useState, useEffect } from 'react';

interface UpdateComposerProps {
  contributors: string[];
  authenticatedOperator: string | null;
  isSubmitting: boolean;
  onSelectContributor: (contributorName: string) => void;
  onPublish: (contributorName: string, content: string) => Promise<void>;
}

const QUICK_SNIPPETS = [
  'Synchronized regional taxonomy',
  'Resolved telemetry buffer latency',
  'Connected Postgres client queries',
  'Finished 3D terrain viewer blockout',
];

export const UpdateComposer: React.FC<UpdateComposerProps> = ({
  contributors,
  authenticatedOperator,
  isSubmitting,
  onSelectContributor,
  onPublish,
}) => {
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [content, setContent] = useState('');

  // Synchronize selection when authenticated operator changes
  useEffect(() => {
    if (authenticatedOperator && contributors.some((c) => c.toLowerCase() === authenticatedOperator.toLowerCase())) {
      const match = contributors.find((c) => c.toLowerCase() === authenticatedOperator.toLowerCase());
      setSelectedContributor(match || authenticatedOperator);
    } else {
      setSelectedContributor(null);
    }
  }, [authenticatedOperator, contributors]);

  const isUnlocked = Boolean(
    authenticatedOperator &&
    selectedContributor &&
    authenticatedOperator.toLowerCase() === selectedContributor.toLowerCase()
  );

  const handleContributorClick = (name: string) => {
    setSelectedContributor(name);
    onSelectContributor(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked || !selectedContributor || !content.trim() || isSubmitting) return;

    await onPublish(selectedContributor, content.trim());
    setContent('');
  };

  return (
    <div className="composer-terminal-card">
      {/* Contributor Identity Rack */}
      <div className="composer-top-label">
        <span>IDENTIFY CONTRIBUTOR // OPERATOR SIGNATURE</span>
        {isUnlocked ? (
          <span style={{ color: 'var(--signal-high)', fontWeight: 700 }}>
            ACTIVE OPERATOR: [ {authenticatedOperator?.toUpperCase()} ]
          </span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            [ AUTHORIZATION REQUIRED ]
          </span>
        )}
      </div>

      <div className="identity-bracket-list" role="group" aria-label="Select Contributor Signature">
        {contributors.map((name) => {
          const isSelected = selectedContributor?.toLowerCase() === name.toLowerCase();
          const isAuthenticatedForThis =
            authenticatedOperator?.toLowerCase() === name.toLowerCase();

          return (
            <button
              key={name}
              type="button"
              className={`identity-btn ${isSelected ? 'selected' : ''} ${isAuthenticatedForThis ? 'authenticated' : ''}`}
              onClick={() => handleContributorClick(name)}
              disabled={isSubmitting}
              aria-pressed={isSelected}
              title={
                isAuthenticatedForThis
                  ? `Authenticated as [${name}]`
                  : `Click to authorize as [${name}]`
              }
            >
              <span>
                {isAuthenticatedForThis ? '● ' : isSelected ? '> ' : ''}
                [ {name} ]
              </span>
            </button>
          );
        })}
      </div>

      {/* Observation Transmitter Form */}
      {isUnlocked && selectedContributor ? (
        <form onSubmit={handleSubmit} className="observation-form">
          <label
            htmlFor="observation-text"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
            }}
          >
            LOG NEW OBSERVATION // OPERATOR: {selectedContributor.toUpperCase()}
          </label>

          <textarea
            id="observation-text"
            className="observation-textarea"
            placeholder="// Enter technical milestone, commit details, or system progress..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            rows={2}
          />

          <div className="observation-snippets">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              QUICK_TAGS:
            </span>
            {QUICK_SNIPPETS.map((snippet) => (
              <button
                key={snippet}
                type="button"
                className="snippet-tag-btn"
                onClick={() => setContent(snippet)}
                disabled={isSubmitting}
              >
                + {snippet}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="btn-transmit"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? '[ TRANSMITTING... ]' : '[ > TRANSMIT OBSERVATION ]'}
          </button>
        </form>
      ) : (
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-base)',
            border: '1px dashed var(--border-card)',
            borderRadius: 'var(--radius-sharp)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          [ CLICK A CONTRIBUTOR SIGNATURE ABOVE TO ENTER ACCESS PASSWORD &amp; UNLOCK OBSERVATION TRANSMITTER ]
        </div>
      )}
    </div>
  );
};
