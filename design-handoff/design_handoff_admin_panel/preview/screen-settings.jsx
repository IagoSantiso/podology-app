// Settings mockup — 3 destacados + avanzado plegable
// Mirrors src/app/admin/settings/page.tsx state & types.

const { useState: useStateSet } = React;

function SettingsScreen({ accent }) {
  const gold = accent || TOKENS.gold;
  const [cfg, setCfg] = useStateSet(CONFIG);
  const [openAdv, setOpenAdv] = useStateSet(false);
  const padX = 20;

  return (
    <div style={{ background: TOKENS.bg, color: TOKENS.cream, fontFamily: TOKENS.sans, paddingBottom: 100, minHeight: '100%' }}>
      <BrandBar subtitle="Ajustes" />

      <div style={{ padding: `18px ${padX}px 0`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontWeight: 400, fontSize: 32, lineHeight: 1, color: TOKENS.cream }}>
            Ajustes
          </div>
          <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 14, color: TOKENS.muted, marginTop: 6 }}>
            Lo esencial primero
          </div>
        </div>
        <button style={{
          background: 'transparent', border: 'none', color: TOKENS.muted, fontSize: 11,
          cursor: 'pointer', padding: 6, textDecoration: 'underline', textDecorationColor: TOKENS.borderSoft,
          textUnderlineOffset: 3,
        }}>Cerrar sesión</button>
      </div>

      {/* ───────── ESENCIALES ───────── */}
      <div style={{ padding: `22px ${padX}px 0` }}>
        <SectionLabel accent="los 3 que más cambias">Esenciales</SectionLabel>

        {/* 1 — Teléfono */}
        <div style={{
          background: TOKENS.bgCard, border: `1px solid ${TOKENS.border}`,
          borderRadius: 12, padding: 16, marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{
              width: 24, height: 24, borderRadius: 4, background: TOKENS.goldDim,
              color: gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.phone()}</span>
            <span style={{ fontSize: 11, color: gold, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
              Tu teléfono
            </span>
          </div>
          <input value={cfg.barber_phone} onChange={e => setCfg(c => ({...c, barber_phone: e.target.value}))}
            style={bigInput}/>
          <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 8, fontFamily: TOKENS.display, fontStyle: 'italic' }}>
            Recibirás un SMS la noche anterior si tienes citas el día siguiente.
          </div>
        </div>

        {/* 2 — Margen alarma */}
        <div style={{
          background: TOKENS.bgCard, border: `1px solid ${TOKENS.border}`,
          borderRadius: 12, padding: 16, marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              width: 24, height: 24, borderRadius: 4, background: TOKENS.goldDim,
              color: gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.bell()}</span>
            <span style={{ fontSize: 11, color: gold, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
              Margen de alarma
            </span>
          </div>
          <div style={{ fontSize: 12, color: TOKENS.muted, marginBottom: 12, lineHeight: 1.45 }}>
            Cuánto antes de la primera cita quieres recibir el aviso por la mañana.
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {[30, 45, 60, 90, 120].map(m => {
              const on = cfg.alarm_margin_minutes === m;
              return (
                <button key={m} onClick={() => setCfg(c => ({...c, alarm_margin_minutes: m}))}
                  style={{
                    flex: '1 1 0', minWidth: 55, padding: '11px 0', borderRadius: 7,
                    background: on ? TOKENS.goldDim : 'transparent',
                    border: `1px solid ${on ? gold : TOKENS.border}`,
                    color: on ? gold : TOKENS.cream,
                    fontFamily: TOKENS.sans, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  }}>
                  <span style={{ fontFamily: TOKENS.display, fontSize: 16, fontWeight: 600 }}>{m}</span>
                  <span style={{ fontSize: 9, color: on ? gold : TOKENS.muted, marginLeft: 2 }}>min</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 — Mensaje retraso */}
        <div style={{
          background: TOKENS.bgCard, border: `1px solid ${TOKENS.border}`,
          borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              width: 24, height: 24, borderRadius: 4, background: TOKENS.goldDim,
              color: gold, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{Icon.scissors(13, gold)}</span>
            <span style={{ fontSize: 11, color: gold, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>
              Mensaje de retraso
            </span>
          </div>
          <div style={{ fontSize: 12, color: TOKENS.muted, marginBottom: 12, lineHeight: 1.45 }}>
            Plantilla WhatsApp cuando avisas que llegarás tarde.
          </div>
          <textarea value={cfg.delay_message_template}
            onChange={e => setCfg(c => ({...c, delay_message_template: e.target.value}))}
            rows={4}
            style={{
              ...bigInput, fontSize: 12.5, resize: 'none', lineHeight: 1.55,
              fontFamily: TOKENS.sans,
            }}/>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {['nombre','minutos','hora_nueva'].map(v => (
              <span key={v} style={{
                padding: '4px 8px', borderRadius: 4, fontSize: 10.5,
                background: TOKENS.bgInput, border: `1px solid ${TOKENS.border}`,
                color: gold, fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}>{'{'}{v}{'}'}</span>
            ))}
          </div>
        </div>

        {/* Save */}
        <button style={{
          marginTop: 16, width: '100%', padding: '14px',
          background: gold, color: '#0a0a0a', border: 'none', borderRadius: 9,
          fontFamily: TOKENS.sans, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          letterSpacing: '0.03em',
        }}>
          Guardar cambios
        </button>
      </div>

      {/* ───────── AVANZADO ───────── */}
      <div style={{ padding: `28px ${padX}px 0` }}>
        <button onClick={() => setOpenAdv(o => !o)}
          style={{
            width: '100%', background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 0 14px', cursor: 'pointer',
            borderBottom: `1px solid ${TOKENS.borderSoft}`,
          }}>
          <span style={{ fontSize: 10, color: TOKENS.muted, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700 }}>
            Configuración avanzada
          </span>
          <span style={{
            display: 'inline-flex', color: TOKENS.muted, transform: openAdv ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}>{Icon.caretDown()}</span>
        </button>

        {openAdv && <AdvancedSettings cfg={cfg} setCfg={setCfg} gold={gold} />}
      </div>

      <AdminNav active="settings" />
    </div>
  );
}

const bigInput = {
  width: '100%', padding: '14px 16px', background: TOKENS.bgInput,
  border: `1px solid ${TOKENS.border}`, borderRadius: 8,
  color: TOKENS.cream, fontFamily: TOKENS.sans, fontSize: 14,
  outline: 'none', boxSizing: 'border-box', fontWeight: 500,
};

function AdvancedSettings({ cfg, setCfg, gold }) {
  return (
    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <AdvSection title="Negocio">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
          padding: '12px', background: TOKENS.bgInput, borderRadius: 8, border: `1px solid ${TOKENS.borderSoft}`,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 6, background: TOKENS.bg,
            border: `1px solid ${TOKENS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: gold,
          }}>{Icon.scissors(22, gold)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: TOKENS.cream, fontWeight: 500 }}>Logo del negocio</div>
            <div style={{ fontSize: 10.5, color: TOKENS.muted, marginTop: 2 }}>PNG · 256×256 recomendado</div>
          </div>
          <button style={{
            padding: '7px 11px', background: 'transparent',
            border: `1px solid ${gold}`, borderRadius: 5, color: gold,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>Subir</button>
        </div>
        <SettingsField label="Nombre del negocio">
          <input value={cfg.business_name} onChange={e => setCfg(c => ({...c, business_name: e.target.value}))} style={smallInput}/>
        </SettingsField>
        <SettingsField label="Dirección">
          <input value={cfg.business_address} onChange={e => setCfg(c => ({...c, business_address: e.target.value}))} style={smallInput}/>
        </SettingsField>
      </AdvSection>

      <AdvSection title="Datos personales">
        <SettingsField label="Email del propietario">
          <input type="email" value={cfg.owner_email} onChange={e => setCfg(c => ({...c, owner_email: e.target.value}))} style={smallInput}/>
        </SettingsField>
      </AdvSection>

      <AdvSection title="Recordatorios al cliente">
        <ChipGroup label="Reagendar hasta" suffix="h antes" value={cfg.reschedule_cutoff_hours}
          options={[1,2,3,4,6,12,24]}
          onChange={v => setCfg(c => ({...c, reschedule_cutoff_hours: v}))} gold={gold}/>
        <ChipGroup label="Primer recordatorio" suffix="h antes" value={cfg.reminder_first_hours}
          options={[6,12,24,48]}
          onChange={v => setCfg(c => ({...c, reminder_first_hours: v}))} gold={gold}/>
        <ChipGroup label="Segundo recordatorio" suffix="h antes" value={cfg.reminder_second_hours}
          options={[1,2,3,4]}
          onChange={v => setCfg(c => ({...c, reminder_second_hours: v}))} gold={gold}/>
      </AdvSection>

      <AdvSection title="Notificaciones push">
        <div style={{
          padding: '12px', background: TOKENS.bgCard, border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: TOKENS.green, display: 'inline-block' }}/>
          <div style={{ flex: 1, fontSize: 12, color: TOKENS.cream }}>
            Activas en este dispositivo
          </div>
        </div>
      </AdvSection>

      <AdvSection title="Cambiar contraseña">
        <SettingsField label="Nueva contraseña"><input type="password" placeholder="Mín. 4 caracteres" style={smallInput}/></SettingsField>
        <SettingsField label="Repetir"><input type="password" style={smallInput}/></SettingsField>
        <button style={{
          width: '100%', padding: '10px',
          background: 'transparent', border: `1px solid ${TOKENS.border}`,
          borderRadius: 7, color: TOKENS.cream, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Cambiar contraseña</button>
      </AdvSection>
    </div>
  );
}

function AdvSection({ title, children }) {
  return (
    <div>
      <SectionLabel rule={true}>{title}</SectionLabel>
      <div style={{
        background: TOKENS.bgCard, border: `1px solid ${TOKENS.borderSoft}`,
        borderRadius: 10, padding: 14,
      }}>
        {children}
      </div>
    </div>
  );
}

function SettingsField({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9.5, color: TOKENS.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function ChipGroup({ label, suffix, value, options, onChange, gold }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11.5, color: TOKENS.cream, fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map(o => {
          const on = value === o;
          return (
            <button key={o} onClick={() => onChange?.(o)}
              style={{
                padding: '7px 10px', borderRadius: 5,
                background: on ? TOKENS.goldDim : 'transparent',
                border: `1px solid ${on ? gold : TOKENS.border}`,
                color: on ? gold : TOKENS.cream,
                fontFamily: TOKENS.sans, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
              }}>
              {o}<span style={{ fontSize: 9, color: on ? gold : TOKENS.muted, marginLeft: 2 }}>{suffix.replace(' antes','').replace('h','h')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const smallInput = {
  width: '100%', padding: '10px 12px', background: TOKENS.bgInput,
  border: `1px solid ${TOKENS.border}`, borderRadius: 6,
  color: TOKENS.cream, fontFamily: TOKENS.sans, fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};

Object.assign(window, { SettingsScreen });
