import React, { useState, useEffect, useRef } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  targetContributor: string;
  currentOperator?: string | null;
  onClose: () => void;
  onAuthorize: (password: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  targetContributor,
  currentOperator,
  onClose,
  onAuthorize,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSwitching = Boolean(
    currentOperator &&
    currentOperator.toLowerCase() !== targetContributor.toLowerCase()
  );

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, targetContributor]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onAuthorize(password);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authorization rejected.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-terminal-modal">
        <div className="modal-header-strip">
          <span id="auth-modal-title" className="modal-title">
            ● AUTHORIZATION REQUIRED // OPERATOR ACCESS
          </span>
          <button
            className="btn-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            [ × ]
          </button>
        </div>

        {isSwitching ? (
          <div className="switch-operator-notice">
            <div className="switch-line">
              <span className="switch-label">CURRENT:</span>
              <span className="switch-val">[ {currentOperator?.toUpperCase()} ]</span>
            </div>
            <div className="switch-line">
              <span className="switch-label">REQUESTED:</span>
              <span className="switch-val highlight">[ {targetContributor.toUpperCase()} ]</span>
            </div>
            <p className="switch-hint">
              Enter password for [{targetContributor}] to switch operator identity.
            </p>
          </div>
        ) : (
          <div className="signature-display-box">
            <span className="sig-label">OPERATOR SIGNATURE:</span>
            <span className="sig-val">[ {targetContributor.toUpperCase()} ]</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-content">
          <label htmlFor="operator-password" className="auth-field-label">
            ENTER ACCESS PASSWORD:
          </label>

          <input
            id="operator-password"
            ref={inputRef}
            type="password"
            className="auth-password-input"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
          />

          {error && (
            <div className="auth-error-block" role="alert">
              <span>!</span>
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions-strip">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              [ CANCEL ]
            </button>

            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? '[ VERIFYING... ]' : '[ > AUTHORIZE ]'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
