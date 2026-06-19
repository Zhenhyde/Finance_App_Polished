import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface AbbrTooltipProps {
  text: string;
  full: string;
  desc?: string;
}

export default function AbbrTooltip({ text, full, desc }: AbbrTooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
    setShow(true);
  };

  const tooltip = show ? createPortal(
    <div style={{
      position: 'fixed',
      top: pos.top,
      left: pos.left,
      transform: 'translate(-50%, -100%)',
      zIndex: 99999,
      background: 'var(--border-hover)',
      color: 'var(--text-main)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      lineHeight: 1.5,
      maxWidth: 300,
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
      opacity: show ? 1 : 0,
      transition: 'opacity 150ms ease',
    }}>
      <div style={{ fontWeight: 700, marginBottom: desc ? 4 : 0 }}>{full}</div>
      {desc && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{desc}</div>}
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        bottom: -5,
        left: '50%',
        marginLeft: -5,
        width: 0, height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid var(--border-hover)',
      }} />
    </div>,
    document.body
  ) : null;

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
        style={{
          borderBottom: '1px dotted var(--text-muted)',
          cursor: 'help',
          display: 'inline',
        }}
      >
        {text}
      </span>
      {tooltip}
    </>
  );
}

export { AbbrTooltip };
