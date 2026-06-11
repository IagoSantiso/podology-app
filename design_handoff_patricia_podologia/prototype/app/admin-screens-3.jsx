// ─────────────────────────────────────────────────────────────
// ADMIN SCREENS part 3 — schedule (horario), settings
// ─────────────────────────────────────────────────────────────
const { useState } = React;

// ── ADMIN 4. SCHEDULE / horario ────────────────────────────
function ScheduleScreen({ nav }) {
  const [tab, setTab] = useState('semana');
  const [days, setDays] = useState(AVAILABILITY);
  const toggle = (i) => setDays(ds => ds.map((d, j) => j === i ? { ...d, active: !d.active } : d));

  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="pad" style={{ paddingTop: 14, paddingBottom: 6 }}>
        <h1 className="display" style={{ fontSize: 27, marginBottom: 14 }}>Mi horario</h1>
        <div className="iseg">
          {[['semana', 'Semana'], ['festivos', 'Festivos'], ['vacaciones', 'Vacaciones']].map(([id, l]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)} style={{ padding: '8px 13px' }}>{l}</button>
          ))}
        </div>
      </div>

      <div className="pad" style={{ flex: 1, paddingTop: 8 }}>
        {tab === 'semana' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {days.map((d, i) => (
              <div key={i} className="card card-pad" style={{ padding: 15, opacity: d.active ? 1 : 0.7 }}>
                <div className="row-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => toggle(i)} style={{
                      width: 44, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: d.active ? 'var(--primary)' : '#d4ddda', position: 'relative', transition: 'all .2s',
                    }}>
                      <span style={{ position: 'absolute', top: 3, left: d.active ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                    </button>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{d.day}</div>
                  </div>
                  {d.active ? (
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{d.start} – {d.end}</div>
                  ) : <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Cerrado</div>}
                </div>
                {d.active && d.break && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, marginLeft: 56, color: 'var(--ink-3)', fontSize: 12.5 }}>
                    <Icons.clock size={14} />Descanso {d.break[0]} – {d.break[1]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'festivos' && (
          <div>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 16, lineHeight: 1.5 }}>Días en los que la clínica permanecerá cerrada. No se podrán reservar citas.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[['Lun 6 ene', 'Reyes'], ['Vie 1 may', 'Día del Trabajo'], ['Mar 15 ago', 'Asunción'], ['Jue 9 oct', 'Festivo local']].map((f, i) => (
                <div key={i} className="list-row" style={{ cursor: 'default' }}>
                  <div className="avatar" style={{ width: 38, height: 38, background: 'var(--danger-soft)', color: 'var(--danger)' }}><Icons.x size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{f[0]}</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{f[1]}</div>
                  </div>
                  <button className="icon-btn" style={{ width: 32, height: 32 }}><Icons.x size={15} /></button>
                </div>
              ))}
            </div>
            <Btn full variant="ghost" icon={Icons.plus} style={{ marginTop: 14 }}>Añadir festivo</Btn>
          </div>
        )}

        {tab === 'vacaciones' && (
          <div>
            <div className="card card-pad" style={{ background: 'var(--primary-tint)', border: '1px solid var(--primary-soft)', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div className="avatar" style={{ width: 42, height: 42, background: 'var(--primary)', color: '#fff' }}><Icons.calendar size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>Vacaciones de verano</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>10 – 24 agosto · 15 días</div>
                </div>
              </div>
            </div>
            <Btn full variant="ghost" icon={Icons.plus}>Programar ausencia</Btn>
          </div>
        )}
      </div>

      {tab === 'semana' && (
        <div className="screen-footer">
          <Btn full icon={Icons.check}>Guardar cambios</Btn>
        </div>
      )}
      <AdminTabs active="schedule" nav={nav} />
    </div>
  );
}

// ── ADMIN 5. SETTINGS / ajustes ────────────────────────────
function SettingsScreen({ nav }) {
  return (
    <div className="screen-anim" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="pad" style={{ paddingTop: 14, paddingBottom: 6 }}>
        <h1 className="display" style={{ fontSize: 27 }}>Ajustes</h1>
      </div>
      <div className="pad" style={{ flex: 1, paddingTop: 6 }}>
        {/* business identity */}
        <div className="card card-pad" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 13 }}>
          <BrandMark size={50} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Patricia Podología</div>
            <div className="muted" style={{ fontSize: 12.5 }}>Calle Mayor 24 · Centro</div>
          </div>
          <button className="icon-btn"><Icons.edit size={17} /></button>
        </div>

        <SettingsGroup title="Servicios y precios" items={[
          { ic: Icons.foot, label: 'Tratamientos', sub: `${SERVICES.length} servicios activos` },
          { ic: Icons.gift, label: 'Bonos', sub: `${BONOS.length} bonos publicados` },
          { ic: Icons.clock, label: 'Duración de citas', sub: 'Por defecto 45 min' },
        ]} />

        <SettingsGroup title="Reservas" items={[
          { ic: Icons.calendar, label: 'Antelación mínima', sub: '2 horas', toggle: false },
          { ic: Icons.bell, label: 'Recordatorios automáticos', sub: 'WhatsApp y correo', on: true },
          { ic: Icons.shield, label: 'Pago en clínica', sub: 'Sin depósito previo', on: true },
        ]} />

        <SettingsGroup title="Cuenta" items={[
          { ic: Icons.user, label: 'Perfil profesional', sub: 'Col. 1842' },
          { ic: Icons.note, label: 'Política de privacidad', sub: 'RGPD · datos de pacientes' },
        ]} />

        <button className="list-row" onClick={() => nav('home')} style={{ marginTop: 6, justifyContent: 'center', color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}>
          <Icons.logout size={18} /><span style={{ fontWeight: 700, fontSize: 14 }}>Cerrar sesión</span>
        </button>
      </div>
      <AdminTabs active="settings" nav={nav} />
    </div>
  );
}

function SettingsGroup({ title, items }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="eyebrow" style={{ marginBottom: 11 }}>{title}</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {items.map((it, i) => (
          <div key={i}>
            {i > 0 && <div className="hr" style={{ marginLeft: 60 }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px' }}>
              <div className="avatar" style={{ width: 36, height: 36, background: 'var(--primary-soft)', color: 'var(--primary)' }}><it.ic size={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{it.label}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{it.sub}</div>
              </div>
              {'on' in it ? (
                <div style={{ width: 44, height: 26, borderRadius: 999, background: it.on ? 'var(--primary)' : '#d4ddda', position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 3, left: it.on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </div>
              ) : <Icons.chevR size={18} className="muted" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ScheduleScreen = ScheduleScreen;
window.SettingsScreen = SettingsScreen;
