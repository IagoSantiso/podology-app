// ─────────────────────────────────────────────────────────────
// CLIENT SCREENS part 3 — profile, history
// ─────────────────────────────────────────────────────────────

// ── 8. PROFILE / mi cuenta ─────────────────────────────────
function ProfileScreen({ nav }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="pad" style={{ flex: 1, paddingTop: 16 }}>
        {/* identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <Avatar name="María Fernández" size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 700 }}>María Fernández</div>
            <div className="muted" style={{ fontSize: 13 }}>maria.f@email.com</div>
          </div>
          <button className="icon-btn" onClick={() => nav('home')}><Icons.logout size={18} /></button>
        </div>

        {/* next appointment */}
        <div className="eyebrow" style={{ marginBottom: 11 }}>Próxima cita</div>
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ width: 70, background: 'var(--primary)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: .85 }}>JUN</div>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>9</div>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: .85 }}>mar</div>
            </div>
            <div style={{ flex: 1, padding: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Quiropodia general</div>
              <div className="row-between" style={{ marginBottom: 0 }}>
                <div className="muted" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.clock size={14} />09:30 · 45 min</div>
                <StatusPill status="confirmed" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 13 }}>
                <Btn size="sm" variant="ghost">Reprogramar</Btn>
                <Btn size="sm" variant="danger">Cancelar</Btn>
              </div>
            </div>
          </div>
        </div>

        {/* quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          <button className="list-row" onClick={() => nav('history')}>
            <div className="avatar" style={{ width: 38, height: 38, background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icons.note size={19} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Historial de visitas</div>
              <div className="muted" style={{ fontSize: 12.5 }}>Tus tratamientos y notas</div>
            </div>
            <Icons.chevR size={18} className="muted" />
          </button>
          <button className="list-row" onClick={() => nav('bonos')}>
            <div className="avatar" style={{ width: 38, height: 38, background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icons.gift size={19} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Mis bonos</div>
              <div className="muted" style={{ fontSize: 12.5 }}>1 activo · 3 sesiones restantes</div>
            </div>
            <Icons.chevR size={18} className="muted" />
          </button>
          <button className="list-row">
            <div className="avatar" style={{ width: 38, height: 38, background: 'var(--field)', color: 'var(--ink-2)' }}><Icons.settings size={19} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Datos y notificaciones</div>
              <div className="muted" style={{ fontSize: 12.5 }}>Editar perfil y avisos</div>
            </div>
            <Icons.chevR size={18} className="muted" />
          </button>
        </div>

        <Btn full variant="secondary" icon={Icons.plus} onClick={() => nav('select')}>Pedir otra cita</Btn>
      </div>
      <ClientTabs active="profile" nav={nav} />
    </div>
  );
}

// ── 9. HISTORY ─────────────────────────────────────────────
function HistoryScreen({ nav }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader title="Historial de visitas" onBack={() => nav('profile')} />
      <div className="pad" style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          <div className="stat">
            <div className="stat-num" style={{ color: 'var(--primary)' }}>14</div>
            <div className="stat-label">Visitas totales</div>
          </div>
          <div className="stat">
            <div className="stat-num" style={{ color: 'var(--accent)' }}>3 años</div>
            <div className="stat-label">Cuidándote</div>
          </div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 13 }}>Tratamientos anteriores</div>
        <div style={{ position: 'relative', paddingLeft: 26 }}>
          <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: 'var(--line)' }} />
          {MY_VISITS.map((v, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{ position: 'absolute', left: -26, top: 4, width: 16, height: 16, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : 'var(--card)', border: '2px solid ' + (i === 0 ? 'var(--primary)' : 'var(--line)') }} />
              <div className="card card-pad">
                <div className="row-between" style={{ alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.service}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{v.date}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{v.price}€</span>
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--primary-tint)', borderRadius: 11 }}>
                  <Icons.note size={15} className="" />
                  <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-2)' }}>{v.notes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
window.HistoryScreen = HistoryScreen;
