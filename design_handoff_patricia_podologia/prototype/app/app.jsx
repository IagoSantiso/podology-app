// ─────────────────────────────────────────────────────────────
// APP SHELL — role switch, screen rail, router
// ─────────────────────────────────────────────────────────────
const { useState: useS, useEffect: useE } = React;

const CLIENT_SCREENS = [
  { id: 'home', label: 'Inicio', icon: Icons.foot, group: 'Reserva' },
  { id: 'login', label: 'Acceder', icon: Icons.user, group: 'Reserva' },
  { id: 'select', label: 'Elegir cita', icon: Icons.calendar, group: 'Reserva' },
  { id: 'guest', label: 'Tus datos', icon: Icons.edit, group: 'Reserva' },
  { id: 'confirm', label: 'Confirmar', icon: Icons.checkCircle, group: 'Reserva' },
  { id: 'success', label: 'Cita hecha', icon: Icons.check, group: 'Reserva' },
  { id: 'bonos', label: 'Bonos', icon: Icons.gift, group: 'Mi cuenta' },
  { id: 'profile', label: 'Mi cuenta', icon: Icons.user, group: 'Mi cuenta' },
  { id: 'history', label: 'Historial', icon: Icons.note, group: 'Mi cuenta' },
];

const ADMIN_SCREENS = [
  { id: 'adminlogin', label: 'Acceso Patricia', icon: Icons.shield, group: 'Acceso' },
  { id: 'dashboard', label: 'Agenda del día', icon: Icons.calendar, group: 'Gestión' },
  { id: 'appt', label: 'Detalle de cita', icon: Icons.clock, group: 'Gestión' },
  { id: 'clients', label: 'Clientes', icon: Icons.user, group: 'Gestión' },
  { id: 'schedule', label: 'Mi horario', icon: Icons.clock, group: 'Configuración' },
  { id: 'settings', label: 'Ajustes', icon: Icons.settings, group: 'Configuración' },
];

function renderClient(id, nav, flow, setFlow) {
  switch (id) {
    case 'home': return <HomeScreen nav={nav} />;
    case 'login': return <LoginScreen nav={nav} role="client" />;
    case 'select': return <SelectScreen nav={nav} flow={flow} setFlow={setFlow} />;
    case 'guest': return <GuestScreen nav={nav} flow={flow} setFlow={setFlow} />;
    case 'confirm': return <ConfirmScreen nav={nav} flow={flow} />;
    case 'success': return <SuccessScreen nav={nav} flow={flow} />;
    case 'bonos': return <BonosScreen nav={nav} />;
    case 'profile': return <ProfileScreen nav={nav} />;
    case 'history': return <HistoryScreen nav={nav} />;
    default: return <HomeScreen nav={nav} />;
  }
}
function renderAdmin(id, nav) {
  switch (id) {
    case 'adminlogin': return <LoginScreen nav={nav} role="admin" />;
    case 'dashboard': return <DashboardScreen nav={nav} />;
    case 'appt': return <ApptScreen nav={nav} />;
    case 'clients': return <ClientsScreen nav={nav} />;
    case 'schedule': return <ScheduleScreen nav={nav} />;
    case 'settings': return <SettingsScreen nav={nav} />;
    default: return <DashboardScreen nav={nav} />;
  }
}

const TWEAK_DEFAULTS = {
  palette: 'Cuidado teal',
  font: 'Newsreader + Hanken',
  radius: 'Medio',
};

function App() {
  const [mode, setMode] = useS('client');
  const [screen, setScreen] = useS('home');
  const [flow, setFlow] = useS({ service: 'quiropodia', day: 2, slot: '10:30' });
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply tweaks → CSS vars
  useE(() => {
    const r = document.documentElement.style;
    const P = PALETTES[tw.palette] || PALETTES['Cuidado teal'];
    r.setProperty('--primary', P.primary);
    r.setProperty('--primary-deep', P.deep);
    r.setProperty('--primary-soft', P.soft);
    r.setProperty('--primary-tint', P.tint);
    r.setProperty('--accent', P.accent);
    r.setProperty('--accent-soft', P.accentSoft);
    r.setProperty('--info', P.primary);
    r.setProperty('--info-soft', P.soft);
    const F = FONTS[tw.font] || FONTS['Newsreader + Hanken'];
    r.setProperty('--font-display', F.display);
    r.setProperty('--font-sans', F.sans);
    const rad = { Suave: ['24px', '30px', '15px'], Medio: ['20px', '26px', '13px'], Marcado: ['12px', '16px', '9px'] }[tw.radius] || ['20px', '26px', '13px'];
    r.setProperty('--radius', rad[0]); r.setProperty('--radius-lg', rad[1]); r.setProperty('--radius-sm', rad[2]);
  }, [tw]);

  const screens = mode === 'client' ? CLIENT_SCREENS : ADMIN_SCREENS;
  const nav = (id) => {
    setScreen(id);
    document.querySelector('.stage')?.scrollTo({ top: 0 });
  };

  const switchMode = (m) => {
    setMode(m);
    setScreen(m === 'client' ? 'home' : 'dashboard');
  };

  const render = mode === 'client'
    ? renderClient(screen, nav, flow, setFlow)
    : renderAdmin(screen, nav);

  // group rail
  const groups = [];
  screens.forEach(s => {
    let g = groups.find(x => x.name === s.group);
    if (!g) { g = { name: s.group, items: [] }; groups.push(g); }
    g.items.push(s);
  });

  return (
    <div className="app-shell">
      <header className="app-bar">
        <div className="app-bar-left">
          <Logo size="sm" />
          <span className="app-bar-title">Prototipo · {mode === 'client' ? 'App del paciente' : 'Panel de Patricia'}</span>
        </div>
        <div className="seg">
          <button className={mode === 'client' ? 'on' : ''} onClick={() => switchMode('client')}><Icons.user size={15} />Paciente</button>
          <button className={mode === 'admin' ? 'on' : ''} onClick={() => switchMode('admin')}><Icons.calendar size={15} />Patricia</button>
        </div>
      </header>

      <div className="shell-body">
        <aside className="rail">
          {groups.map(g => (
            <div className="rail-group" key={g.name}>
              <div className="rail-group-label">{g.name}</div>
              {g.items.map((s, i) => (
                <button key={s.id} className={`rail-item${screen === s.id ? ' on' : ''}`} onClick={() => nav(s.id)}>
                  <span className="rail-ic"><s.icon size={18} /></span>
                  {s.label}
                  <span className="rail-num">{String(screens.indexOf(s) + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          ))}
          <div style={{ padding: '14px 11px 0', borderTop: '1px solid var(--line)', marginTop: 6 }}>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
              Haz clic en los botones de cada pantalla para navegar el flujo real.
            </div>
          </div>
        </aside>

        <main className="stage">
          <div className="single-frame">
            <PhoneFrame label={`${mode}:${screen}`} theme={mode === 'admin' ? 'admin' : 'client'}>
              {render}
            </PhoneFrame>
          </div>
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Identidad visual" />
        <TweakSelect label="Paleta" value={tw.palette} options={Object.keys(PALETTES)} onChange={v => setTweak('palette', v)} />
        <TweakSelect label="Tipografía" value={tw.font} options={Object.keys(FONTS)} onChange={v => setTweak('font', v)} />
        <TweakSection label="Forma" />
        <TweakRadio label="Esquinas" value={tw.radius} options={['Suave', 'Medio', 'Marcado']} onChange={v => setTweak('radius', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
