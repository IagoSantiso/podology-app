// Main app — composes 3 mobile mockups inside an iOS frame design canvas
// + a tweaks panel for live customisation.

const { useState: useStateApp } = React;

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "accent": "#d4a853",
  "dayLabel": "Jueves"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(DEFAULT_TWEAKS);

  return (
    <div>
      <DesignCanvas
        title="Barbería Iglesias — Panel del barbero"
        subtitle="Redesign del admin sobre el código existente · Mobile-first · Lista por defecto + timeline opcional"
      >
        <DCSection id="screens" title="Pantallas">
          <DCArtboard id="dashboard" label="Dashboard — Agenda del día" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={true}>
              <DashboardScreen density={t.density} accent={t.accent} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="schedule" label="Horario — Semana + Vacaciones + Festivos" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={true}>
              <ScheduleScreen accent={t.accent} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="settings" label="Ajustes — 3 esenciales + Avanzado" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={true}>
              <SettingsScreen accent={t.accent} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="states" title="Estados del dashboard">
          <DCArtboard id="state-quiet" label="Día tranquilo (sin urgencia)" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={true}>
              <DashboardQuietState accent={t.accent} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="state-empty" label="Día vacío (descanso)" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={true}>
              <DashboardEmptyState accent={t.accent} />
            </IOSDevice>
          </DCArtboard>

          <DCArtboard id="state-delay" label="Modal · Avisar retraso" width={402} height={874}>
            <IOSDevice width={402} height={874} dark={true}>
              <DashboardWithModal accent={t.accent} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="notes" title="Notas para el desarrollador">
          <DCArtboard id="notes-card" label="Inconsistencias detectadas + scope del cambio" width={680} height={760}>
            <DesignNotes />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Apariencia">
          <TweakColor label="Acento dorado" value={t.accent}
            options={['#d4a853', '#c89b4a', '#e8c87a', '#b8763a']}
            onChange={v => setTweak('accent', v)}/>
          <TweakRadio label="Densidad de la lista" value={t.density}
            options={[
              { value: 'comfortable', label: 'Cómoda' },
              { value: 'compact', label: 'Compacta' },
            ]}
            onChange={v => setTweak('density', v)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Variant states — reuse DashboardScreen but tweak conditions
// ─────────────────────────────────────────────────────────────
function DashboardQuietState({ accent }) {
  // Override NOW briefly via a context-less approach: re-render dashboard with future "now"
  return <ScreenWithOverride now={new Date(2026,4,15,7,0)}><DashboardScreen accent={accent}/></ScreenWithOverride>;
}
function DashboardEmptyState({ accent }) {
  return <ScreenWithOverride appts={[]}><DashboardScreen accent={accent}/></ScreenWithOverride>;
}
function DashboardWithModal({ accent }) {
  return <ScreenWithOverride forceModal="delay"><DashboardScreen accent={accent}/></ScreenWithOverride>;
}

// quick override wrapper that monkey-patches globals before render of children
// (kept simple — these are display-only variations)
function ScreenWithOverride({ now, appts, forceModal, children }) {
  const prev = {};
  if (now) { prev.NOW = window.NOW; window.NOW = now; }
  if (appts) { prev.APPOINTMENTS = window.APPOINTMENTS; window.APPOINTMENTS = appts; }
  React.useEffect(() => () => {
    if (prev.NOW !== undefined) window.NOW = prev.NOW;
    if (prev.APPOINTMENTS !== undefined) window.APPOINTMENTS = prev.APPOINTMENTS;
  }, []);
  // Force-show modal via auto-click on first render
  React.useEffect(() => {
    if (!forceModal) return;
    setTimeout(() => {
      const btn = document.querySelector('[data-artboard="state-delay"] button');
      btn?.click();
    }, 50);
  }, [forceModal]);
  return children;
}

// ─────────────────────────────────────────────────────────────
// Design notes panel
// ─────────────────────────────────────────────────────────────
function DesignNotes() {
  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: '#fafaf7', color: '#2a2a2a',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      padding: '36px 38px', boxSizing: 'border-box',
    }}>
      <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: 28, color: '#0a0a0a', marginBottom: 4 }}>
        Notas del rediseño
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 24, fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic' }}>
        Lo que cambia, lo que conservo, y los puntos que vi en tu código.
      </div>

      <NoteSection title="Estética" tone="neutral">
        <p><b>Sistema visual:</b> mantengo los tokens que ya tienes en <code>globals.css</code> (gold #d4a853, cream #f5f0e8, bg #0a0a0a, border #2a2a2a). Aprovecho Playfair Display en cursiva para fechas, totales y acentos editoriales — eso es lo que aporta el "toque barbería clásica" sin caer en imágenes de bigotes.</p>
        <p><b>Ritmo:</b> small-caps doradas (10/600/0.18em) para etiquetas de sección con hairline lateral. Cifras siempre en Playfair tabular para que las horas estén alineadas y se lean rápido.</p>
        <p><b>Tipo:</b> el botón "Voy a llegar tarde" gana presencia por color (#e08344) y por el sufijo en cursiva "· avisar a Pablo" para sentirse menos botón corporativo.</p>
      </NoteSection>

      <NoteSection title="Inconsistencias que encontré" tone="warn">
        <p><b>1 · Bug del botón "Voy tarde".</b> En <code>dashboard/page.tsx</code> el handler hace <code>dayApts.find(a =&gt; a.status === 'confirmed')</code> — coge la <em>primera</em> cita confirmada del día, que a las 18:00 sigue siendo la de las 09:00 (ya pasada). Lo arreglo apuntando a la <em>siguiente</em> cita futura. Te dejo el patch comentado en <code>code/dashboard.tsx</code>.</p>
        <p><b>2 · Settings ≠ brief.</b> Tu brief pedía 3 campos; el código tiene 9+ secciones (logo, dirección, reagendar, recordatorios, push, contraseña…). Solución: hago los 3 que pediste destacados arriba y el resto plegado bajo "Configuración avanzada". No borro nada.</p>
        <p><b>3 · Vacaciones no existen.</b> Tu brief pedía "bloquear fechas concretas (vacaciones, festivos)". <code>blocked_slots</code> está en schema pero no usado por la UI; <code>holidays</code> sólo permite días sueltos. Añado tab <b>Vacaciones</b> para rangos (10–23 agosto). Necesitarás 1 endpoint nuevo o mapear a varias filas en <code>blocked_slots</code>.</p>
        <p><b>4 · Timeline vs lista.</b> Tu código actual es una timeline con slots de 30 min vacíos clicables; tu brief pide "lista ordenada por hora". Pongo lista como vista por defecto y un toggle pequeño arriba a la derecha para volver a timeline (un sólo botón, no rompe nada).</p>
        <p><b>5 · <code>'sinEmail@barberia.local'</code></b> como fallback al crear citas — funciona pero ensucia la DB y los emails de recordatorio. Considera <code>client_email NULL</code> en schema; si no, OK como está.</p>
      </NoteSection>

      <NoteSection title="Qué hago / qué no toco" tone="ok">
        <ul style={{ paddingLeft: 18, margin: '8px 0' }}>
          <li><b>Toco:</b> JSX y estilos Tailwind/inline en las 3 páginas.</li>
          <li><b>Conservo intacto:</b> tipos <code>Service</code>, <code>Appointment</code>, <code>AvailabilityRow</code>, <code>Holiday</code>, <code>Config</code>; rutas <code>/api/admin/*</code>; lógica de fetch/patch; modales de crear/completar/retraso; polling de 60s; permisos de notificaciones.</li>
          <li><b>Añado (opcional):</b> nueva sección Vacaciones (rangos). Si la incluyes, te dejo SQL de migración y handler nuevo abajo.</li>
        </ul>
      </NoteSection>

      <NoteSection title="Archivos a sustituir" tone="neutral">
        <p>En la carpeta <code>code/</code> de este proyecto tienes los <code>.tsx</code> listos para pegar:</p>
        <ul style={{ paddingLeft: 18, margin: '8px 0', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12 }}>
          <li>src/app/admin/dashboard/page.tsx</li>
          <li>src/app/admin/schedule/page.tsx</li>
          <li>src/app/admin/settings/page.tsx</li>
          <li>src/app/admin/_migration-vacations.sql  ← opcional</li>
        </ul>
        <p style={{ marginTop: 6, fontSize: 12, color: '#666' }}>No tocan <code>AdminNav.tsx</code> ni <code>globals.css</code>: los tokens ya existían.</p>
      </NoteSection>
    </div>
  );
}

function NoteSection({ title, tone, children }) {
  const colors = {
    neutral: { fg: '#0a0a0a', rule: '#d4a853' },
    warn:    { fg: '#7a3a10', rule: '#e08344' },
    ok:      { fg: '#1f4a1f', rule: '#5a8a5a' },
  }[tone];
  return (
    <div style={{ marginBottom: 22, paddingLeft: 14, borderLeft: `2px solid ${colors.rule}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.rule, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.55, color: colors.fg }}>
        {children}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
