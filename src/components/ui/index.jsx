import React from 'react';

export function Button({ variant = 'primary', size, block, icon, children, ...props }) {
  const cls = ['btn', `btn-${variant}`];
  if (size === 'sm') cls.push('btn-sm');
  if (block) cls.push('btn-block');
  if (icon && !children) cls.push('btn-icon');
  return <button className={cls.join(' ')} {...props}>{children}</button>;
}

export function Badge({ variant = 'default', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function Card({ hover, children, className = '', ...props }) {
  return <div className={`card ${hover ? 'card-hover' : ''} ${className}`} {...props}>{children}</div>;
}

export function Spinner({ label }) {
  return (
    <div className="spinner-wrap flex-col gap-12">
      <div className="spinner" />
      {label && <div className="text-sec text-sm">{label}</div>}
    </div>
  );
}

export function Avatar({ src, name, size }) {
  const initials = (name || '').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const cls = ['avatar'];
  if (size === 'lg') cls.push('avatar-lg');
  if (src) return (
    <div className={cls.join(' ')} style={{ padding: 0, overflow: 'hidden' }}>
      <img src={src} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
  return <div className={cls.join(' ')}>{initials || '?'}</div>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty">
      {Icon && <Icon />}
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }}>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ fontSize: 18 }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Stars({ rating, size = 16 }) {
  const full = Math.floor(rating);
  return (
    <span className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < full ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}