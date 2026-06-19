interface Props {
  label: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoBanner({ label, onUndo, onDismiss }: Props) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 60, display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', boxShadow: '0 10px 30px rgba(0,0,0,.45)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-main)' }}>Deleted <b>{label}</b></span>
      <button className="confirm-btn" onClick={onUndo}>Undo</button>
      <button onClick={onDismiss} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '2px 4px' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-main)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>×</button>
    </div>
  );
}
