// ─────────────────────────────────────────────────────────────
// ADMIN SCREENS part 2 — appointment detail, clients
// ─────────────────────────────────────────────────────────────
const { useState } = React;

// ── ADMIN 2. APPOINTMENT DETAIL ────────────────────────────
function ApptScreen({ nav }) {
  const a = APPOINTMENTS[1]; // Antonio Ruiz
  const svc = svcById(a.service);
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader title="Detalle de cita" onBack={() => nav('dashboard')}
        right={<button className="icon-btn"><Icons.edit size={18} /></button>} />
      <div className="pad" style={{ flex: 1, paddingTop: 4 }}>
        {/* client card */}
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <Avatar name={a.name} size={52} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{a.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{a.phone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <Btn size="sm" variant="secondary" icon={Icons.phone} full>Llamar</Btn>
            <Btn size="sm" variant="secondary" icon={Icons.mail} full>Mensaje</Btn>
          </div>
        </div>

        {/* appointment facts */}
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div className="row-between" style={{ marginBottom: 14 }}>
            <span className="eyebrow">Cita de hoy</span>
            <StatusPill status="confirmed" />
          </div>
          <DetailRow label="Tratamiento" value={svc.name} />
          <div className="hr" style={{ margin: '12px 0' }} />
          <DetailRow label="Hora" value={`${a.time} – ${a.end}`} />
          <div className="hr" style={{ margin: '12px 0' }} />
          <DetailRow label="Precio" value={`${svc.price}€`} />
        </div>

        {/* clinical note */}
        <div className="eyebrow" style={{ marginBottom: 10 }}>Nota de la sesión</div>
        <textarea className="input" rows="3" placeholder="Anota observaciones del tratamiento…"
          defaultValue="Reborde lateral del primer dedo, dolor leve. Revisar evolución en 3 semanas." style={{ resize: 'none', lineHeight: 1.5 }} />
      </div>

      <div className="screen-footer">
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="danger" full onClick={() => nav('dashboard')}>No se presentó</Btn>
          <Btn full icon={Icons.check} onClick={() => nav('dashboard')}>Marcar atendida</Btn>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN 3. CLIENTS ───────────────────────────────────────
function ClientsScreen({ nav }) {
  const [sel, setSel] = useState(null);
  if (sel != null) return <ClientDetail client={CLIENTS[sel]} back={() => setSel(null)} />;

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="pad" style={{ paddingTop: 14, paddingBottom: 8 }}>
        <h1 className="display" style={{ fontSize: 27, marginBottom: 14 }}>Clientes</h1>
        <div className="input-icon"><Icons.search size={18} /><input className="input" placeholder="Buscar por nombre o teléfono" /></div>
      </div>
      <div className="pad" style={{ flex: 1, paddingTop: 6 }}>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>{CLIENTS.length} pacientes</span>
          <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>A–Z</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {CLIENTS.map((c, i) => (
            <button key={i} className="list-row" onClick={() => setSel(i)}>
              <Avatar name={c.name} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{c.name}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{c.phone}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{c.visits} visitas</div>
                {c.account ? <span className="pill pill-info" style={{ fontSize: 10, marginTop: 3 }}>Con cuenta</span> : <span className="pill pill-off" style={{ fontSize: 10, marginTop: 3 }}>Invitado</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
      <AdminTabs active="clients" nav={nav} />
    </div>
  );
}

function ClientDetail({ client, back }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader title="Ficha de paciente" onBack={back} />
      <div className="pad" style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Avatar name={client.name} size={68} /></div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{client.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>{client.email}</div>
          <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginTop: 14 }}>
            <Btn size="sm" variant="secondary" icon={Icons.phone}>Llamar</Btn>
            <Btn size="sm" variant="primary" icon={Icons.plus}>Nueva cita</Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 22 }}>
          <div className="stat" style={{ padding: 12, textAlign: 'center' }}><div className="stat-num" style={{ fontSize: 21 }}>{client.visits}</div><div className="stat-label">Visitas</div></div>
          <div className="stat" style={{ padding: 12, textAlign: 'center' }}><div className="stat-num" style={{ fontSize: 21, color: 'var(--ok)' }}>{client.completed}</div><div className="stat-label">Atendidas</div></div>
          <div className="stat" style={{ padding: 12, textAlign: 'center' }}><div className="stat-num" style={{ fontSize: 21, color: 'var(--primary)' }}>{client.history.length}</div><div className="stat-label">Recientes</div></div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 12 }}>Historial</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {client.history.map((h, i) => (
            <div key={i} className="card card-pad" style={{ padding: 14 }}>
              <div className="row-between">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{h.service}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{h.date} · {h.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{h.price}€</div>
                  <StatusPill status={h.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ApptScreen = ApptScreen;
window.ClientsScreen = ClientsScreen;
