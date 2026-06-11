// ─────────────────────────────────────────────────────────────
// CLIENT SCREENS part 2 — confirm, success, bonos, profile, history
// ─────────────────────────────────────────────────────────────

function fmtDate(dayIdx) {
  const d = new Date(2026, 5, 9 + dayIdx);
  const dows = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return `${dows[d.getDay()]} ${d.getDate()} de junio`;
}

// ── 5. CONFIRM ─────────────────────────────────────────────
function ConfirmScreen({ nav, flow }) {
  const svc = svcById(flow.service) || SERVICES[0];
  const time = flow.slot || '10:30';
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader title="Confirmar cita" onBack={() => nav('select')} />
      <div className="pad" style={{ flex: 1, paddingTop: 4 }}>
        <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '20px 20px 18px', background: 'linear-gradient(135deg, var(--primary), var(--primary-deep))', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', opacity: .8, marginBottom: 8 }}>Tu reserva</div>
            <div className="display" style={{ fontSize: 25, color: '#fff' }}>{svc.name}</div>
            <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5 }}><Icons.calendar size={16} />{fmtDate(flow.day ?? 2)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5 }}><Icons.clock size={16} />{time}</div>
            </div>
          </div>
          <div style={{ padding: 18 }}>
            <DetailRow label="Duración" value={`${svc.duration} minutos`} />
            <div className="hr" style={{ margin: '13px 0' }} />
            <DetailRow label="Profesional" value="Patricia · Podóloga col. 1842" />
            <div className="hr" style={{ margin: '13px 0' }} />
            <DetailRow label="Lugar" value="Calle Mayor 24, planta baja" />
            <div className="hr" style={{ margin: '13px 0' }} />
            <div className="row-between">
              <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 21, fontWeight: 800, color: 'var(--primary)' }}>{svc.price}€</span>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Pago en la clínica · efectivo o tarjeta</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--warn-soft)', borderRadius: 13, color: 'var(--warn)' }}>
          <Icons.alert size={18} />
          <span style={{ fontSize: 12.5, lineHeight: 1.45, color: '#8a6420' }}>Si no puedes acudir, cancela con al menos 24h de antelación desde tu correo de confirmación.</span>
        </div>
      </div>
      <div className="screen-footer">
        <Btn full icon={Icons.checkCircle} onClick={() => nav('success')}>Confirmar cita</Btn>
      </div>
    </div>
  );
}
function DetailRow({ label, value }) {
  return (
    <div className="row-between">
      <span className="muted" style={{ fontSize: 13.5 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ── 6. SUCCESS ─────────────────────────────────────────────
function SuccessScreen({ nav, flow }) {
  const svc = svcById(flow.service) || SERVICES[0];
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', textAlign: 'center' }}>
      <div className="pad" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 92, height: 92, borderRadius: '50%', background: 'var(--ok-soft)', color: 'var(--ok)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, animation: 'screenIn .5s both',
        }}>
          <Icons.check size={46} />
        </div>
        <h1 className="display" style={{ fontSize: 30, whiteSpace: 'nowrap' }}>¡Cita confirmada!</h1>
        <p className="muted" style={{ fontSize: 14.5, maxWidth: 270, lineHeight: 1.5 }}>
          Te hemos enviado los detalles por correo. Patricia te espera.
        </p>

        <div className="card card-pad" style={{ width: '100%', marginTop: 22, textAlign: 'left' }}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="avatar" style={{ width: 42, height: 42, background: 'var(--primary-soft)', color: 'var(--primary)' }}><Icons.foot size={21} /></div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{svc.name}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{fmtDate(flow.day ?? 2)} · {flow.slot || '10:30'}</div>
              </div>
            </div>
            <StatusPill status="confirmed" />
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <Btn size="sm" variant="ghost" icon={Icons.calendar}>Añadir al calendario</Btn>
            <Btn size="sm" variant="ghost" icon={Icons.pin}>Cómo llegar</Btn>
          </div>
        </div>
      </div>
      <div className="screen-footer">
        <Btn full onClick={() => nav('profile')}>Ver mis citas</Btn>
        <button onClick={() => nav('home')} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--ink-3)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)', marginTop: 10 }}>Volver al inicio</button>
      </div>
    </div>
  );
}

// ── 7. BONOS ───────────────────────────────────────────────
function BonosScreen({ nav }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="pad" style={{ flex: 1, paddingTop: 14 }}>
        <div className="row-between" style={{ marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7, whiteSpace: 'nowrap' }}>Ahorra en tus sesiones</div>
            <h1 className="display" style={{ fontSize: 29 }}>Bonos</h1>
          </div>
          <button className="icon-btn" onClick={() => nav('home')}><Icons.x size={19} /></button>
        </div>

        {/* active bono */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 22, border: '1.5px solid var(--primary-soft)' }}>
          <div style={{ padding: '15px 18px', background: 'var(--primary-tint)' }}>
            <div className="row-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icons.spark size={17} className="" />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--primary-deep)', whiteSpace: 'nowrap' }}>Bono activo</span>
              </div>
              <span className="pill pill-ok">2 de 5 usadas</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 13 }}>
              {[1, 1, 0, 0, 0].map((u, i) => (
                <div key={i} style={{ flex: 1, height: 7, borderRadius: 4, background: u ? 'var(--primary)' : '#d3e3de' }} />
              ))}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 9 }}>Bono Quiropodia · caduca 30 nov 2026</div>
          </div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 13 }}>Comprar bono</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {BONOS.map((b, i) => (
            <div key={b.id} className="card card-pad" style={i === 2 ? { border: '1.5px solid var(--accent)', position: 'relative' } : null}>
              {i === 2 && <span className="pill" style={{ position: 'absolute', top: -10, right: 16, background: 'var(--accent)', color: '#fff' }}>Mejor valor</span>}
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{b.name}</div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{b.sessions} sesiones · {b.service}</div>
                  <div style={{ display: 'inline-flex', marginTop: 9, fontSize: 11.5, fontWeight: 700, color: 'var(--ok)', background: 'var(--ok-soft)', padding: '3px 9px', borderRadius: 8, whiteSpace: 'nowrap' }}>{b.save}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{b.price}€</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{(b.price / b.sessions).toFixed(0)}€/sesión</div>
                </div>
              </div>
              <Btn full size="sm" variant={i === 2 ? 'primary' : 'secondary'} style={{ marginTop: 14 }}>
                Comprar bono
              </Btn>
            </div>
          ))}
        </div>
      </div>
      <ClientTabs active="bonos" nav={nav} />
    </div>
  );
}

window.ConfirmScreen = ConfirmScreen;
window.SuccessScreen = SuccessScreen;
window.BonosScreen = BonosScreen;
window.fmtDate = fmtDate;
window.DetailRow = DetailRow;
