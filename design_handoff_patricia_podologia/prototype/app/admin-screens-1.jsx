// ─────────────────────────────────────────────────────────────
// ADMIN SCREENS — Patricia Podología (panel de Patricia)
// ─────────────────────────────────────────────────────────────
const { useState } = React;

// Bottom tab bar for admin
function AdminTabs({ active, nav }) {
  const tabs = [
    { id: 'dashboard', label: 'Agenda', icon: Icons.calendar },
    { id: 'clients', label: 'Clientes', icon: Icons.user },
    { id: 'schedule', label: 'Horario', icon: Icons.clock },
    { id: 'settings', label: 'Ajustes', icon: Icons.settings },
  ];
  return (
    <nav className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={`tab${active === t.id ? ' on' : ''}`} onClick={() => nav(t.id)}>
          <t.icon size={21} fill={active === t.id} />
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ── ADMIN 1. DASHBOARD / agenda del día ────────────────────
function DashboardScreen({ nav }) {
  const [view, setView] = useState('dia');
  const done = APPOINTMENTS.filter(a => a.status === 'completed').length;
  const active = APPOINTMENTS.filter(a => a.status !== 'cancelled');
  const revenue = active.filter(a => a.status === 'completed').reduce((s, a) => s + (svcById(a.service)?.price || 0), 0);

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="pad" style={{ paddingBottom: 8, paddingTop: 14 }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>Martes</div>
            <h1 className="display" style={{ fontSize: 27, whiteSpace: 'nowrap' }}>9 de junio</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" style={{ position: 'relative' }}><Icons.bell size={18} /><span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)' }} /></button>
            <button className="icon-btn" onClick={() => nav('clients')}><Icons.search size={18} /></button>
          </div>
        </div>

        {/* view switch */}
        <div className="iseg" style={{ marginBottom: 16 }}>
          {['dia', 'semana'].map(v => (
            <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'dia' ? 'Día' : 'Semana'}</button>
          ))}
        </div>

        {/* stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
          <div className="stat" style={{ padding: 12 }}><div className="stat-num" style={{ fontSize: 22 }}>{active.length}</div><div className="stat-label">Citas</div></div>
          <div className="stat" style={{ padding: 12 }}><div className="stat-num" style={{ fontSize: 22, color: 'var(--ok)' }}>{done}</div><div className="stat-label">Atendidas</div></div>
          <div className="stat" style={{ padding: 12 }}><div className="stat-num" style={{ fontSize: 22, color: 'var(--primary)' }}>{revenue}€</div><div className="stat-label">Facturado</div></div>
        </div>
      </div>

      {view === 'semana' ? <WeekView /> : (
        <div className="pad" style={{ flex: 1, paddingTop: 6 }}>
          {/* next-up banner */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 16, border: '1.5px solid var(--primary-soft)' }}>
            <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--primary-tint)' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 0 4px rgba(47,125,110,.18)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '.05em' }}>SIGUIENTE · 10:30</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Antonio Ruiz</div>
                <div className="muted" style={{ fontSize: 12.5 }}>Uña encarnada · 40 min</div>
              </div>
              <button className="icon-btn" style={{ background: '#fff' }}><Icons.phone size={17} /></button>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>Agenda del día</div>
          <div style={{ position: 'relative' }}>
            {active.map((a, i) => {
              const svc = svcById(a.service);
              return (
                <div key={a.id} style={{ display: 'flex', gap: 12, marginBottom: 11 }}>
                  <div style={{ width: 44, textAlign: 'right', flexShrink: 0, paddingTop: 13 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: a.status === 'completed' ? 'var(--ink-3)' : 'var(--ink)' }}>{a.time}</div>
                  </div>
                  <button className="card" style={{
                    flex: 1, padding: 14, textAlign: 'left', cursor: 'pointer', border: 'none',
                    borderLeft: '3px solid ' + (a.status === 'completed' ? 'var(--ok)' : a.next ? 'var(--primary)' : 'var(--primary-soft)'),
                    fontFamily: 'var(--font-sans)', opacity: a.status === 'completed' ? .7 : 1,
                  }} onClick={() => nav('appt')}>
                    <div className="row-between">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={a.name} size={36} />
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{a.name}</div>
                          <div className="muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{svc.name}</div>
                        </div>
                      </div>
                      {a.status === 'completed' ? <span style={{ color: 'var(--ok)' }}><Icons.checkCircle size={22} /></span> : <Icons.chevR size={18} className="muted" />}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => nav('appt')} style={{
        position: 'absolute', right: 18, bottom: 92, width: 56, height: 56, borderRadius: 18,
        background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', zIndex: 20,
        boxShadow: '0 8px 22px rgba(47,125,110,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.plus size={26} /></button>

      <AdminTabs active="dashboard" nav={nav} />
    </div>
  );
}

function WeekView() {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const max = Math.max(...WEEK_COUNTS);
  return (
    <div className="pad" style={{ flex: 1, paddingTop: 6 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>Citas esta semana</div>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, gap: 8 }}>
          {WEEK_COUNTS.map((c, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: c ? 'var(--ink)' : 'var(--ink-3)' }}>{c}</div>
              <div style={{
                width: '100%', height: max ? `${(c / max) * 88 + 6}px` : '6px', borderRadius: 8,
                background: i === 1 ? 'var(--primary)' : c ? 'var(--primary-soft)' : 'var(--line-2)',
              }} />
              <div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{days[i]}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[['Mié 10', 'Jornada completa', '4 citas · 09:00–18:00'], ['Jue 11', 'Día con más demanda', '6 citas · completo'], ['Vie 12', 'Jornada reducida', '5 citas · 09:00–15:00']].map((r, i) => (
          <div key={i} className="list-row" style={{ cursor: 'default' }}>
            <div className="avatar" style={{ width: 38, height: 38, background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icons.calendar size={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{r[0]} · {r[1]}</div>
              <div className="muted" style={{ fontSize: 12.5 }}>{r[2]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.AdminTabs = AdminTabs;
window.DashboardScreen = DashboardScreen;
