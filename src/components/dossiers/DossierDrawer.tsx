import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBriefingStore } from '../../lib/research/briefingStore';
import ResearchDossier from '../research/ResearchDossier';

interface Props {
  runId: string | null;
  onClose: () => void;
}

export function DossierDrawer({ runId, onClose }: Props) {
  const briefing = useBriefingStore((s) => (runId ? s.briefings[runId] : undefined));

  // Track the element that was focused before opening, to restore on close
  const returnFocusRef = useRef<Element | null>(null);
  // Ref to the drawer panel for focus trapping
  const drawerRef = useRef<HTMLDivElement>(null);

  const isOpen = runId !== null;

  // Capture return-focus target when drawer opens
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement;
      // Move focus into the drawer after render
      requestAnimationFrame(() => {
        drawerRef.current?.focus();
      });
    } else {
      // Restore focus when drawer closes
      if (returnFocusRef.current && returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
        returnFocusRef.current = null;
      }
    }
  }, [isOpen]);

  // Esc key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
      // Focus trap: intercept Tab key
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusableList = Array.from(focusable);
        if (focusableList.length === 0) return;
        const first = focusableList[0];
        const last = focusableList[focusableList.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const drawerTransition = prefersReducedMotion
    ? {}
    : {
        animation: 'lumina-drawer-slidein 0.28s cubic-bezier(.33,0,.2,1) both',
      };

  const label = briefing?.target
    ? `${briefing.target} dossier`
    : 'Dossier';

  const drawerContent = (
    <>
      {/* Inject keyframe once */}
      <style>{`
        @keyframes lumina-drawer-slidein {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lumina-drawer-panel { animation: none !important; }
        }
      `}</style>

      {/* Scrim */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,32,0.40)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 200,
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="lumina-drawer-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 820,
          maxWidth: '100vw',
          background: '#F6F8FB',
          boxShadow: '-24px 0 70px rgba(15,23,38,.34)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 201,
          outline: 'none',
          ...drawerTransition,
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 13,
            padding: '18px 26px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E6EBF2',
            flex: 'none',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="font-display"
              style={{ fontSize: 19, fontWeight: 600, color: '#0F172A' }}
            >
              {briefing?.target ? `${briefing.target} · dossier` : 'Dossier'}
            </div>
          </div>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dossier"
            style={{
              width: 38,
              height: 38,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #E6EBF2',
              borderRadius: 9,
              cursor: 'pointer',
              color: '#475569',
              padding: 0,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#C7D2E4';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E6EBF2';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '26px 30px 40px',
          }}
        >
          {briefing ? (
            <ResearchDossier briefing={briefing} />
          ) : (
            <p style={{ color: '#475569', fontSize: 14 }}>Dossier not found.</p>
          )}
        </div>
      </div>
    </>
  );

  // Portal to document.body so the drawer escapes any ancestor stacking context
  // (e.g. the sticky app Header) and sits above it at its declared z-index.
  // Guard for SSR environments even though this is a Vite/browser-only app.
  if (typeof document === 'undefined') return drawerContent;
  return createPortal(drawerContent, document.body);
}

export default DossierDrawer;
