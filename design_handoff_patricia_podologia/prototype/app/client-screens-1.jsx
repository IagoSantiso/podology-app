// ─────────────────────────────────────────────────────────────
// CLIENT SCREENS — Patricia Podología
// nav(screen) advances the prototype; flow state lives in App
// ─────────────────────────────────────────────────────────────
const { useState } = React;

// Bottom tab bar shared by main client screens
function ClientTabs({ active, nav }) {
  const tabs = [
    { id: 'home', label: 'Reservar', icon: Icons.calendar },
    { id: 'bonos', label: 'Bonos', icon: Icons.gift },
    { id: 'profile', label: 'Mi cuenta', icon: Icons.user },
  ];
  return (
    <nav className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={`tab${active === t.id ? ' on' : ''}`} onClick={() => nav(t.id)}>
          <t.icon size={22} fill={active === t.id} />
          {t.label}
        </button>
      ))}
    </nav>
  );
}

// ── 1. HOME / landing ──────────────────────────────────────
function HomeScreen({ nav }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="pad" style={{ paddingTop: 14, flex: 1 }}>
        <div className="row-between" style={{ marginBottom: 26 }}>
          <Logo size="sm" />
          <button className="icon-btn" onClick={() => nav('login')}><Icons.user size={19} /></button>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Tu cita en un minuto</div>
          <h1 className="display" style={{ fontSize: 38, marginBottom: 14 }}>
            Cuida tus pies<br /><span className="display-it" style={{ color: 'var(--primary)' }}>con confianza</span>
          </h1>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 290 }}>
            Reserva con Patricia, podóloga colegiada. Tratamientos personalizados en un espacio tranquilo y cercano.
          </p>
        </div>

        {/* hero image placeholder */}
        <div style={{
          height: 168, borderRadius: 'var(--radius)', marginBottom: 24, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, var(--primary-soft), var(--accent-soft))', border: '1px solid var(--line)',
        }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', opacity: .5, flexDirection: 'column', gap: 8 }}>
            <Icons.foot size={46} />
            <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.04em' }}>Foto de la clínica</span>
          </div>
        </div>

        {/* primary CTA */}
        <Btn full icon={Icons.calendar} onClick={() => nav('select')}>Pedir cita</Btn>

        {/* quick info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginTop: 22 }}>
          <div className="card card-pad" style={{ padding: 14 }}>
            <Icons.pin size={18} className="" />
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 8 }}>Calle Mayor 24</div>
            <div className="muted" style={{ fontSize: 12 }}>Centro, planta baja</div>
          </div>
          <div className="card card-pad" style={{ padding: 14 }}>
            <Icons.clock size={18} />
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 8 }}>L–V · 9 a 20h</div>
            <div className="muted" style={{ fontSize: 12 }}>Viernes hasta 15h</div>
          </div>
        </div>

        <button className="list-row" style={{ marginTop: 11 }} onClick={() => nav('bonos')}>
          <div className="avatar" style={{ width: 40, height: 40, background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icons.gift size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Bonos con descuento</div>
            <div className="muted" style={{ fontSize: 12.5 }}>Ahorra hasta 50€ en sesiones</div>
          </div>
          <Icons.chevR size={18} className="muted" />
        </button>
      </div>

      <ClientTabs active="home" nav={nav} />
    </div>
  );
}

// ── 2. LOGIN ───────────────────────────────────────────────
function LoginScreen({ nav, role = 'client' }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader title="" onBack={() => nav('home')} />
      <div className="pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {role === 'admin' ? (
          <React.Fragment>
            <div style={{ textAlign: 'center', margin: '14px 0 30px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><BrandMark size={56} /></div>
              <h1 className="display" style={{ fontSize: 27, marginBottom: 6 }}>Acceso profesional</h1>
              <p className="muted" style={{ fontSize: 14 }}>Panel de gestión de Patricia</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <div>
                <label className="field-label">Correo electrónico</label>
                <div className="input-icon"><Icons.mail size={18} /><input className="input" defaultValue="patricia@podologia.es" /></div>
              </div>
              <div>
                <label className="field-label">Contraseña</label>
                <div className="input-icon"><Icons.shield size={18} /><input className="input" type="password" defaultValue="········" /></div>
              </div>
              <Btn full onClick={() => nav('dashboard')}>Entrar al panel</Btn>
              <button style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div style={{ textAlign: 'center', margin: '12px 0 22px' }}>
              <h1 className="display" style={{ fontSize: 28, marginBottom: 6 }}>Reserva tu cita</h1>
              <p className="muted" style={{ fontSize: 14 }}>Sin registro, en menos de un minuto</p>
            </div>

            {/* HERO — guest booking, the primary path */}
            <div className="card" style={{ overflow: 'hidden', border: '1.5px solid var(--primary)', boxShadow: '0 10px 28px rgba(47,125,110,0.16)' }}>
              <div style={{ padding: '20px 18px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 15 }}>
                  <div className="avatar" style={{ width: 46, height: 46, background: 'var(--primary)', color: '#fff' }}><Icons.calendar size={23} /></div>
                  <div style={{ lineHeight: 1.25 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 800 }}>Reservar como invitado</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>La forma más rápida de pedir cita</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {['Sin crear cuenta ni contraseña', 'Confirmación al instante por SMS', 'Solo tu nombre y teléfono'].map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--ink-2)' }}>
                      <span style={{ color: 'var(--ok)', display: 'flex' }}><Icons.checkCircle size={17} /></span>{t}
                    </div>
                  ))}
                </div>
                <Btn full icon={Icons.arrowR} onClick={() => nav('select')}>Reservar ahora</Btn>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0 18px' }}>
              <div className="hr" style={{ flex: 1 }} /><span className="muted" style={{ fontSize: 12 }}>¿Ya tienes cuenta?</span><div className="hr" style={{ flex: 1 }} />
            </div>

            {/* SECONDARY — quiet login for returning clients */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-icon"><Icons.mail size={18} /><input className="input" placeholder="Correo electrónico" defaultValue="maria.f@email.com" /></div>
              <div className="input-icon"><Icons.shield size={18} /><input className="input" type="password" placeholder="Contraseña" defaultValue="········" /></div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Btn variant="ghost" full onClick={() => nav('profile')}>Acceder a mi cuenta</Btn>
              </div>
              <button style={{ border: 'none', background: 'none', color: 'var(--ink-3)', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'center', padding: '2px 0' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

// ── 3. SELECT — service, date, time ────────────────────────
function SelectScreen({ nav, flow, setFlow }) {
  const [svc, setSvc] = useState(flow.service || null);
  const [day, setDay] = useState(flow.day ?? 2);
  const [slot, setSlot] = useState(flow.slot || null);

  const dates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(2026, 5, 9 + i);
    return { i, dow: DAYS_SHORT[d.getDay()], num: d.getDate(), month: MONTHS_SHORT[d.getMonth()], off: d.getDay() === 0 };
  });
  const ready = svc && slot != null && !dates[day]?.off;

  const proceed = () => {
    setFlow({ ...flow, service: svc, day, slot });
    nav('confirm');
  };

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader title="Pedir cita" onBack={() => nav('home')} />
      <div className="pad" style={{ flex: 1, paddingTop: 4 }}>
        {/* step 1: service */}
        <div className="eyebrow" style={{ marginBottom: 12 }}>1 · Elige tratamiento</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
          {SERVICES.slice(0, 4).map(s => (
            <button key={s.id} className="list-row" onClick={() => setSvc(s.id)}
              style={svc === s.id ? { borderColor: 'var(--primary)', background: 'var(--primary-tint)', boxShadow: 'var(--shadow-sm)' } : null}>
              <div className="avatar" style={{ width: 40, height: 40, background: svc === s.id ? 'var(--primary)' : 'var(--primary-soft)', color: svc === s.id ? '#fff' : 'var(--primary)' }}>
                <Icons.foot size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{s.name}</div>
                <div className="muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{s.price}€</div>
                <div className="muted" style={{ fontSize: 11.5 }}>{s.duration} min</div>
              </div>
            </button>
          ))}
        </div>

        {/* step 2: date */}
        <div className="eyebrow" style={{ marginBottom: 12 }}>2 · Elige día</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 24, marginLeft: -2, paddingLeft: 2 }}>
          {dates.map(d => (
            <button key={d.i} disabled={d.off} onClick={() => setDay(d.i)}
              style={{
                flexShrink: 0, width: 58, padding: '12px 0', borderRadius: 14, cursor: d.off ? 'not-allowed' : 'pointer',
                border: '1.5px solid ' + (day === d.i && !d.off ? 'var(--primary)' : 'var(--line)'),
                background: day === d.i && !d.off ? 'var(--primary)' : 'var(--card)',
                color: d.off ? 'var(--ink-3)' : day === d.i ? '#fff' : 'var(--ink)',
                opacity: d.off ? .45 : 1, fontFamily: 'var(--font-sans)', transition: 'all .15s',
              }}>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: .8 }}>{d.dow}</div>
              <div style={{ fontSize: 20, fontWeight: 800, margin: '2px 0' }}>{d.num}</div>
              <div style={{ fontSize: 10, opacity: .7 }}>{d.month}</div>
            </button>
          ))}
        </div>

        {/* step 3: time */}
        <div className="eyebrow" style={{ marginBottom: 12 }}>3 · Elige hora</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 9, marginBottom: 10 }}>
          {TIME_SLOTS.map((t, i) => {
            const taken = i === 2 || i === 6;
            return (
              <button key={t} className={`chip${slot === t ? ' on' : ''}`} disabled={taken}
                style={{ textAlign: 'center', padding: '11px 0' }} onClick={() => setSlot(t)}>{t}</button>
            );
          })}
        </div>
      </div>

      <div className="screen-footer">
        <Btn full icon={Icons.arrowR} disabled={!ready} onClick={proceed}>
          {ready ? 'Continuar' : 'Completa los 3 pasos'}
        </Btn>
      </div>
    </div>
  );
}

// ── 4. GUEST DATA ──────────────────────────────────────────
function GuestScreen({ nav, flow, setFlow }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <ScreenHeader title="Tus datos" onBack={() => nav('select')} sub="Para confirmar y recordarte la cita" />
      <div className="pad" style={{ flex: 1, paddingTop: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label className="field-label">Nombre y apellidos</label>
            <div className="input-icon"><Icons.user size={18} /><input className="input" placeholder="Tu nombre" defaultValue="" /></div>
          </div>
          <div>
            <label className="field-label">Teléfono</label>
            <div className="input-icon"><Icons.phone size={18} /><input className="input" placeholder="+34 600 000 000" /></div>
          </div>
          <div>
            <label className="field-label">Correo (opcional)</label>
            <div className="input-icon"><Icons.mail size={18} /><input className="input" placeholder="tucorreo@email.com" /></div>
          </div>
          <label style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '4px 2px', cursor: 'pointer' }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, border: '1.5px solid var(--primary)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', marginTop: 1 }}><Icons.check size={15} /></span>
            <span className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>Acepto la <span style={{ color: 'var(--primary)', fontWeight: 600 }}>política de privacidad</span> y el tratamiento de mis datos para gestionar la cita.</span>
          </label>
        </div>
      </div>
      <div className="screen-footer">
        <Btn full icon={Icons.arrowR} onClick={() => nav('confirm')}>Continuar</Btn>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.LoginScreen = LoginScreen;
window.SelectScreen = SelectScreen;
window.GuestScreen = GuestScreen;
window.ClientTabs = ClientTabs;
