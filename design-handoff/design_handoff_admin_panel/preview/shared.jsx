// Shared UI primitives + AdminNav recreated to match /src/components/admin/AdminNav.tsx

const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Icons (24px stroke)
// ─────────────────────────────────────────────────────────────
const Icon = {
  calendar: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={p.bold?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  users: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={p.bold?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  clock: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={p.bold?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  tag: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={p.bold?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  settings: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={p.bold?2.4:2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  plus: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  check: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  x: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  caretLeft: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>),
  caretRight: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>),
  caretDown: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  phone: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  scissors: (s=14, color='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  ),
  alert: (s=16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
  bell: (s=16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>),
  list: (s=16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>),
  grid: (s=16) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>),
  trash: (s=14) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>),
};

// ─────────────────────────────────────────────────────────────
// AdminNav — same shape, restyled with hairline rule + gold underline
// ─────────────────────────────────────────────────────────────
function AdminNav({ active='dashboard', onNav=()=>{} }) {
  const items = [
    { key: 'dashboard', label: 'Agenda',    Icon: Icon.calendar },
    { key: 'clients',   label: 'Clientes',  Icon: Icon.users },
    { key: 'schedule',  label: 'Horario',   Icon: Icon.clock },
    { key: 'comercial', label: 'Comercial', Icon: Icon.tag },
    { key: 'settings',  label: 'Ajustes',   Icon: Icon.settings },
  ];
  return (
    <nav style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${TOKENS.borderSoft}`,
      paddingBottom: 18, // home indicator clearance
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 520, margin: '0 auto', padding: '0 4px' }}>
        {items.map(({ key, label, Icon: I }) => {
          const is = key === active;
          return (
            <button key={key} onClick={() => onNav(key)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '10px 14px 6px', color: is ? TOKENS.gold : TOKENS.muted,
                position: 'relative',
                fontFamily: TOKENS.sans,
              }}>
              {is && <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 18, height: 2, background: TOKENS.gold,
              }}/>}
              <I bold={is} />
              <span style={{
                fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Toggle switch (matches existing schedule.tsx pattern)
// ─────────────────────────────────────────────────────────────
function Switch({ on, onChange, size=20 }) {
  const W = size * 1.85, H = size + 4;
  return (
    <button onClick={() => onChange?.(!on)}
      style={{
        position: 'relative', width: W, height: H, borderRadius: H,
        background: on ? TOKENS.gold : '#2a2a2a',
        border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        transition: 'background 0.2s',
      }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? W - size - 2 : 2,
        width: size, height: size, borderRadius: '50%',
        background: on ? '#0a0a0a' : '#f5f0e8',
        transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}/>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Section label — small caps, gold tracking, with hairline rule
// ─────────────────────────────────────────────────────────────
function SectionLabel({ children, rule = true, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 14px' }}>
      <span style={{
        fontFamily: TOKENS.sans, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: TOKENS.gold,
      }}>{children}</span>
      {accent && <span style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 13, color: TOKENS.muted }}>{accent}</span>}
      {rule && <span style={{ flex: 1, height: 1, background: TOKENS.borderSoft }}/>}
    </div>
  );
}

// Top brand strip — appears at top of every admin screen for identity
function BrandBar({ subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px 0', color: TOKENS.muted }}>
      <span style={{
        width: 26, height: 26, borderRadius: 2, border: `1px solid ${TOKENS.goldRim}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: TOKENS.gold,
      }}>{Icon.scissors(13, TOKENS.gold)}</span>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 14, color: TOKENS.cream, letterSpacing: '0.01em' }}>
          Iglesias
        </div>
        <div style={{ fontFamily: TOKENS.sans, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

// Helper to format HH:MM:SS → HH:MM
function fmt(t) { return (t||'').slice(0,5); }

Object.assign(window, { Icon, AdminNav, Switch, SectionLabel, BrandBar, fmt });
