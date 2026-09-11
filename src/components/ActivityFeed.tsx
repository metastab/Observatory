import React, { useState } from 'react';
import type { Update } from '../types';
import { formatRelativeTime } from '../utils/pulse';

interface ActivityFeedProps {
  updates: Update[];
  currentOperator: string | null;
  currentUserId?: string | null;
  newestUpdateId?: string | null;
  onDeleteUpdate?: (updateId: string) => Promise<void>;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  updates,
  currentOperator,
  currentUserId,
  newestUpdateId,
  onDeleteUpdate,
}) => {
  const [deletingRecord, setDeletingRecord] = useState<Update | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deletingRecord || !onDeleteUpdate || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onDeleteUpdate(deletingRecord.id);
      setDeletingRecord(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete record.';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (updates.length === 0) {
    return (
      <div className="journal-card">
        <div className="journal-header">
          <div className="journal-title">
            <span>●</span>
            <span>FIELD JOURNAL // CHRONOLOGICAL STREAM</span>
          </div>
          <span className="journal-counter">[ 00 ENTRIES ]</span>
        </div>
        <div
          style={{
            padding: '36px 16px',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          // NO OBSERVATION TRANSMISSIONS LOGGED YET FOR THIS SYSTEM.
        </div>
      </div>
    );
  }

  return (
    <div className="journal-card">
      <div className="journal-header">
        <div className="journal-title">
          <span>●</span>
          <span>FIELD JOURNAL // CHRONOLOGICAL STREAM</span>
        </div>
        <span className="journal-counter">
          [ {String(updates.length).padStart(2, '0')} ENTRIES ]
        </span>
      </div>

      <div className="journal-stream">
        {updates.map((update, idx) => {
          const isJustAdded = update.id === newestUpdateId;
          const relativeTime = formatRelativeTime(update.created_at);
          const seqIndex = String(updates.length - idx).padStart(3, '0');

          // Extract raw time if valid date
          const dateObj = new Date(update.created_at);
          const timeStr = !isNaN(dateObj.getTime())
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '00:00:00';

          // Determine ownership
          const isOwned = Boolean(
            (currentUserId && update.author_id && update.author_id === currentUserId) ||
            (currentOperator && update.contributor_name.toLowerCase() === currentOperator.toLowerCase())
          );

          // 30-minute self-deletion check
          const ageMs = Date.now() - (dateObj.getTime() || 0);
          const isWithin30Mins = ageMs <= 30 * 60 * 1000;

          return (
            <div
              key={update.id}
              className={`journal-entry ${isJustAdded ? 'just-added' : ''}`}
            >
              <div className="journal-entry-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>REC/{seqIndex}</span>
                  <span style={{ color: 'var(--border-strong)' }}>•</span>
                  <span className="entry-author-tag">[ {update.contributor_name} ]</span>

                  {/* 30-Minute Self Deletion UI */}
                  {isOwned && isWithin30Mins && onDeleteUpdate && (
                    <button
                      type="button"
                      className="btn-delete-record"
                      onClick={() => setDeletingRecord(update)}
                      title="Delete this observation record (Available within 30m of creation)"
                    >
                      [ DELETE RECORD ]
                    </button>
                  )}

                  {isOwned && !isWithin30Mins && (
                    <span className="tag-locked-record" title="Record locked: 30-minute edit window has expired">
                      [ LOCKED RECORD ]
                    </span>
                  )}
                </div>

                <div className="entry-timestamp-tag">
                  <span>{timeStr}</span>
                  <span style={{ margin: '0 6px', opacity: 0.5 }}>//</span>
                  <span style={{ color: isJustAdded ? 'var(--signal-high)' : 'inherit' }}>
                    {relativeTime.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="journal-entry-body">
                &ldquo;{update.content}&rdquo;
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Deletion */}
      {deletingRecord && (
        <div
          className="modal-overlay animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeletingRecord(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="auth-terminal-modal">
            <div className="modal-header-strip">
              <span className="modal-title">
                ! CONFIRM OBSERVATION REMOVAL
              </span>
              <button
                className="btn-modal-close"
                onClick={() => setDeletingRecord(null)}
                disabled={isDeleting}
              >
                [ × ]
              </button>
            </div>

            <div className="delete-warning-box">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                Permanently purge observation record by [{deletingRecord.contributor_name.toUpperCase()}]?
              </p>
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 12,
                }}
              >
                &ldquo;{deletingRecord.content}&rdquo;
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--signal-high)' }}>
                NOTICE: Database RLS enforces that records older than 30 minutes cannot be deleted.
              </p>
            </div>

            {deleteError && (
              <div className="auth-error-block" role="alert">
                <span>!</span>
                <span>{deleteError}</span>
              </div>
            )}

            <div className="modal-actions-strip">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeletingRecord(null)}
                disabled={isDeleting}
              >
                [ CANCEL ]
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? '[ PURGING... ]' : '[ > CONFIRM DELETE ]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
