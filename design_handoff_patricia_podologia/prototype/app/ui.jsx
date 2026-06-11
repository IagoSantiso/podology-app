// ─────────────────────────────────────────────────────────────
// Shared UI — brand, device frame, primitives
// ─────────────────────────────────────────────────────────────

// ---- Brand mark: an arch (the foot's natural bridge) ----
function BrandMark({ size = 36, tone = 'solid' }) {
  const bg = tone === 'solid' ? 'var(--primary)' : 'var(--primary-soft)';
  const stroke = tone === 'solid' ? '#fff' : 'var(--primary)';
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: tone === 'solid' ? '0 3px 10px rgba(31,58,54,0.2)' : 'none',
    }}>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none"
        stroke={stroke} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16.5c0-5 3.6-9 8-9s8 4 8 9"/>
        <path d="M4 16.5h2M18 16.5h2"/>
      </svg>
    </div>
  );
}

// ---- Brand wordmark ----
function Logo({ size = 'md', color, sub = true, mark = true }) {
  const scale = { sm: 0.74, md: 1, lg: 1.55 }[size] || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 * scale }}>
      {mark && <BrandMark size={38 * scale} />}
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500,
          fontSize: 27 * scale, color: color || 'var(--ink)', letterSpacing: '-0.01em',
        }}>Patricia</div>
        {sub && <div style={{
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9.5 * scale,
          letterSpacing: '0.35em', textTransform: 'uppercase',
          color: color || 'var(--primary)', marginTop: 4 * scale, marginLeft: 1, opacity: color ? 0.85 : 1,
        }}>Podología</div>}
      </div>
    </div>
  );
}

// ---- Device frame ----
function PhoneFrame({ children, label, theme = 'client' }) {
  return (
    <div className="phone">
      <div className="phone-notch"><span className="notch-cam" /></div>
      <div className={`phone-screen theme-${theme}`}>
        <StatusBar dark={theme === 'admin'} />
        <div className="screen-scroll" data-screen-label={label}>{children}</div>
      </div>
      <div className="phone-home" />
    </div>
  );
}

function StatusBar({ dark }) {
  return (
    <div className="statusbar" style={dark ? { color: 'var(--ink)' } : null}>
      <span className="sb-time">9:41</span>
      <span className="sb-right">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="6.5" width="3" height="4.5" rx="1"/><rect x="4.6" y="4.3" width="3" height="6.7" rx="1"/><rect x="9.2" y="2.1" width="3" height="8.9" rx="1"/><rect x="13.8" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 4.3a11 11 0 0 1 15 0M3.5 7a7 7 0 0 1 10 0M6 9.6a3 3 0 0 1 5 0"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="1" y="1" width="21" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.4"/><rect x="3" y="3" width="16" height="6" rx="1" fill="currentColor"/><rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" fillOpacity="0.5"/></svg>
      </span>
    </div>
  );
}

// ---- Buttons ----
function Btn({ children, variant = 'primary', full, onClick, icon: I, size = 'md', disabled, style }) {
  return (
    <button className={`btn btn-${variant} btn-${size}${full ? ' btn-full' : ''}`} onClick={onClick} disabled={disabled} style={style}>
      {I && <I size={size === 'sm' ? 16 : 18} />}
      {children}
    </button>
  );
}

// ---- Status pill ----
function StatusPill({ status }) {
  const map = {
    confirmed: { label: 'Confirmada', cls: 'pill-info' },
    completed: { label: 'Atendida', cls: 'pill-ok' },
    cancelled: { label: 'Cancelada', cls: 'pill-off' },
  };
  const s = map[status] || map.confirmed;
  return <span className={`pill ${s.cls}`}>{s.label}</span>;
}

// ---- Avatar (initials) ----
function Avatar({ name, size = 42 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</div>;
}

// ---- In-screen header ----
function ScreenHeader({ title, onBack, right, sub }) {
  return (
    <div className="screen-head">
      {onBack ? <button className="icon-btn" onClick={onBack}><Icons.arrowL size={20} /></button> : <span style={{ width: 38 }} />}
      <div className="screen-head-mid">
        <h2 className="screen-head-title">{title}</h2>
        {sub && <div className="screen-head-sub">{sub}</div>}
      </div>
      {right || <span style={{ width: 38 }} />}
    </div>
  );
}

Object.assign(window, { BrandMark, Logo, PhoneFrame, StatusBar, Btn, StatusPill, Avatar, ScreenHeader });
