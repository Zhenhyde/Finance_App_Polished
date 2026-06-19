import type { ModalData } from '../types';

interface Props {
  modal: ModalData;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PreviewModal({ modal, onClose, onConfirm }: Props) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(4,7,10,.66)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>{modal.title}</h3>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Review the changes before applying.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          {modal.lines.map((ln, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ln.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'IBM Plex Mono'", fontSize: 13 }}>
                {ln.from && <span style={{ color: 'var(--text-muted)' }}>{ln.from}</span>}
                {ln.from && <span style={{ color: 'var(--border-hover)' }}>→</span>}
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{ln.to}</span>
              </span>
            </div>
          ))}
        </div>
        {modal.note && (
          <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-hover)', borderRadius: 8, padding: '10px 12px', marginBottom: 16, lineHeight: 1.5 }}>
            {modal.note}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="ghost-btn-sm" onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={onConfirm}>{modal.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
