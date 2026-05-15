// Schedule mockup — weekly availability + vacation ranges + holidays
// Mirrors src/app/admin/schedule/page.tsx state & types.

const { useState: useStateSch } = React;

function ScheduleScreen({ accent }) {
  const gold = accent || TOKENS.gold;
  const [rows, setRows] = useStateSch(AVAILABILITY);
  const [vacations, setVacations] = useStateSch(VACATIONS);
  const [holidays, setHolidays] = useStateSch(HOLIDAYS);
  const [tab, setTab] = useStateSch('week');
  const [newVac, setNewVac] = useStateSch(null);
  const padX = 20;

  const updateRow = (id, patch) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  return (
    <div style={{ background: TOKENS.bg, color: TOKENS.cream, fontFamily: TOKENS.sans, paddingBottom: 100, minHeight: '100%' }}>
      <BrandBar subtitle="Horario" />

      <div style={{ padding: `18px ${padX}px 0` }}>
        <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontWeight: 400, fontSize: 32, lineHeight: 1, color: TOKENS.cream }}>
          Horario
        </div>
        <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 14, color: TOKENS.muted, marginTop: 6 }}>
          Disponibilidad, vacaciones y festivos
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: `18px ${padX}px 0`, display: 'flex', gap: 18, borderBottom: `1px solid ${TOKENS.borderSoft}` }}>
        {[
          { k: 'week', l: 'Semana' },
          { k: 'vac',  l: 'Vacaciones' },
          { k: 'fest', l: 'Festivos' },
        ].map(t => {
          const is = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '8px 0 10px', position: 'relative',
                color: is ? gold : TOKENS.muted,
                fontFamily: TOKENS.sans, fontWeight: 600, fontSize: 12,
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
              {t.l}
              {is && <span style={{
                position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: gold,
              }}/>}
            </button>
          );
        })}
      </div>

      {tab === 'week' && (
        <WeekTab rows={rows} updateRow={updateRow} gold={gold} padX={padX} />
      )}
      {tab === 'vac' && (
        <VacationsTab vacations={vacations} setVacations={setVacations} newVac={newVac} setNewVac={setNewVac} gold={gold} padX={padX} />
      )}
      {tab === 'fest' && (
        <HolidaysTab holidays={holidays} setHolidays={setHolidays} gold={gold} padX={padX} />
      )}

      <AdminNav active="schedule" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WEEK TAB
// ─────────────────────────────────────────────────────────────
function WeekTab({ rows, updateRow, gold, padX }) {
  const orderedDays = [1,2,3,4,5,6,0]; // Lun..Dom

  return (
    <div style={{ padding: `20px ${padX}px 0` }}>
      <SectionLabel accent="se aplica cada semana">Semana tipo</SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orderedDays.map(d => {
          const row = rows.find(r => r.day_of_week === d);
          if (!row) return null;
          const active = row.is_active;
          return (
            <div key={row.id} style={{
              background: TOKENS.bgCard, borderRadius: 10,
              border: `1px solid ${active ? TOKENS.border : TOKENS.borderSoft}`,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: active ? 1 : 0.55, transition: 'opacity 0.2s',
            }}>
              <Switch on={active} onChange={v => updateRow(row.id, { is_active: v })}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: TOKENS.display, fontWeight: 600, fontSize: 16, color: active ? TOKENS.cream : TOKENS.muted, lineHeight: 1 }}>
                  {DAY_NAMES_LONG[row.day_of_week]}
                </div>
                {active ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <TimeInput value={fmt(row.start_time)} onChange={v => updateRow(row.id, { start_time: v + ':00' })}/>
                    <span style={{ color: TOKENS.muted, fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 13 }}>a</span>
                    <TimeInput value={fmt(row.end_time)} onChange={v => updateRow(row.id, { end_time: v + ':00' })}/>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: TOKENS.mutedDim, marginTop: 4, fontStyle: 'italic', fontFamily: TOKENS.display }}>
                    cerrado
                  </div>
                )}
              </div>
              {active && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: TOKENS.display, fontWeight: 600, fontSize: 18, color: gold, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {(() => {
                      const [sh, sm] = fmt(row.start_time).split(':').map(Number);
                      const [eh, em] = fmt(row.end_time).split(':').map(Number);
                      const mins = (eh*60+em) - (sh*60+sm);
                      return `${Math.floor(mins/60)}`;
                    })()}<span style={{ fontSize: 11, color: TOKENS.muted, marginLeft: 2 }}>h</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button style={{
        marginTop: 14, width: '100%', padding: '13px',
        background: gold, color: '#0a0a0a', border: 'none', borderRadius: 8,
        fontFamily: TOKENS.sans, fontWeight: 600, fontSize: 13, cursor: 'pointer',
        letterSpacing: '0.04em',
      }}>
        Guardar horario
      </button>

      {/* Visual summary */}
      <div style={{ marginTop: 22, padding: '14px 14px 12px', background: TOKENS.bgCard, border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 10 }}>
        <div style={{ fontSize: 9.5, color: TOKENS.muted, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
          Total semanal
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: TOKENS.display, fontSize: 36, fontWeight: 600, color: gold, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {(() => {
              return rows.filter(r => r.is_active).reduce((s, r) => {
                const [sh, sm] = fmt(r.start_time).split(':').map(Number);
                const [eh, em] = fmt(r.end_time).split(':').map(Number);
                return s + ((eh*60+em) - (sh*60+sm));
              }, 0) / 60;
            })()}
          </span>
          <span style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 16, color: TOKENS.muted }}>horas</span>
          <span style={{ flex: 1 }}/>
          <span style={{ fontSize: 11, color: TOKENS.muted }}>
            {rows.filter(r => r.is_active).length} días abiertos
          </span>
        </div>
      </div>
    </div>
  );
}

function TimeInput({ value, onChange }) {
  return (
    <input type="time" value={value || ''} onChange={e => onChange?.(e.target.value)}
      style={{
        background: TOKENS.bgInput, border: `1px solid ${TOKENS.border}`,
        borderRadius: 5, padding: '6px 8px', color: TOKENS.cream,
        fontFamily: TOKENS.sans, fontSize: 12.5, fontVariantNumeric: 'tabular-nums',
        outline: 'none', width: 88,
        colorScheme: 'dark',
      }}/>
  );
}

// ─────────────────────────────────────────────────────────────
// VACATIONS TAB — date ranges
// ─────────────────────────────────────────────────────────────
function VacationsTab({ vacations, setVacations, newVac, setNewVac, gold, padX }) {
  const fmtRange = (s, e) => {
    const a = new Date(s + 'T00:00:00');
    const b = new Date(e + 'T00:00:00');
    const sameMonth = a.getMonth() === b.getMonth();
    return sameMonth
      ? `${a.getDate()}–${b.getDate()} ${MONTH_NAMES[a.getMonth()]}`
      : `${a.getDate()} ${MONTH_NAMES[a.getMonth()].slice(0,3)} – ${b.getDate()} ${MONTH_NAMES[b.getMonth()].slice(0,3)}`;
  };

  const dayCount = (s, e) => {
    return Math.round((new Date(e) - new Date(s))/(1000*60*60*24)) + 1;
  };

  return (
    <div style={{ padding: `20px ${padX}px 0` }}>
      <SectionLabel accent="cierra rangos completos">Vacaciones</SectionLabel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {vacations.map(v => (
          <div key={v.id} style={{
            background: TOKENS.bgCard, borderRadius: 10, padding: '14px',
            border: `1px solid ${TOKENS.border}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 4, alignSelf: 'stretch', borderRadius: 2, background: gold,
            }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 18, color: TOKENS.cream, lineHeight: 1.1 }}>
                {fmtRange(v.start_date, v.end_date)}
              </div>
              <div style={{ fontSize: 11.5, color: TOKENS.muted, marginTop: 3 }}>
                {v.reason} · <span style={{ color: gold }}>{dayCount(v.start_date, v.end_date)} días</span>
              </div>
            </div>
            <button onClick={() => setVacations(prev => prev.filter(x => x.id !== v.id))}
              style={{ background: 'transparent', border: 'none', color: TOKENS.muted, cursor: 'pointer', padding: 6 }}>
              {Icon.trash(14)}
            </button>
          </div>
        ))}
        {vacations.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: TOKENS.muted, fontFamily: TOKENS.display, fontStyle: 'italic', border: `1px dashed ${TOKENS.borderSoft}`, borderRadius: 10 }}>
            Sin vacaciones programadas
          </div>
        )}
      </div>

      {/* Add form */}
      <div style={{
        marginTop: 14, padding: '14px',
        background: TOKENS.bgCard, border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 10,
      }}>
        <div style={{ fontSize: 9.5, color: TOKENS.muted, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
          Añadir rango
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <Field label="Desde">
            <input type="date" defaultValue="2026-12-23" style={inputStyleSch}/>
          </Field>
          <Field label="Hasta">
            <input type="date" defaultValue="2026-12-30" style={inputStyleSch}/>
          </Field>
        </div>
        <Field label="Motivo (opcional)">
          <input placeholder="Navidades, formación, descanso..." style={inputStyleSch}/>
        </Field>
        <button style={{
          marginTop: 6, width: '100%', padding: '11px',
          background: 'transparent', border: `1px solid ${gold}`, borderRadius: 7,
          color: gold, fontFamily: TOKENS.sans, fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {Icon.plus()} Añadir vacaciones
        </button>
      </div>
    </div>
  );
}

const inputStyleSch = {
  width: '100%', padding: '9px 11px', background: TOKENS.bgInput,
  border: `1px solid ${TOKENS.border}`, borderRadius: 5,
  color: TOKENS.cream, fontFamily: TOKENS.sans, fontSize: 12.5, outline: 'none',
  boxSizing: 'border-box', colorScheme: 'dark',
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: TOKENS.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOLIDAYS TAB
// ─────────────────────────────────────────────────────────────
function HolidaysTab({ holidays, setHolidays, gold, padX }) {
  const nationals = [
    { holiday_date: '2026-01-01', name: 'Año Nuevo' },
    { holiday_date: '2026-01-06', name: 'Día de Reyes' },
    { holiday_date: '2026-04-03', name: 'Viernes Santo' },
    { holiday_date: '2026-05-01', name: 'Día del Trabajador' },
    { holiday_date: '2026-08-15', name: 'Asunción de la Virgen' },
    { holiday_date: '2026-10-12', name: 'Día de la Hispanidad' },
    { holiday_date: '2026-11-01', name: 'Todos los Santos' },
    { holiday_date: '2026-12-06', name: 'Día de la Constitución' },
    { holiday_date: '2026-12-08', name: 'Inmaculada Concepción' },
    { holiday_date: '2026-12-25', name: 'Navidad' },
  ];
  const isOn = d => holidays.some(h => h.holiday_date === d);
  const toggle = h => {
    setHolidays(prev =>
      prev.some(x => x.holiday_date === h.holiday_date)
        ? prev.filter(x => x.holiday_date !== h.holiday_date)
        : [...prev, { ...h, is_national: true, id: h.holiday_date }]
    );
  };
  const fmtDate = d => {
    const dt = new Date(d + 'T00:00:00');
    return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0,3)}`;
  };
  const locals = holidays.filter(h => !h.is_national);

  return (
    <div style={{ padding: `20px ${padX}px 0` }}>
      <SectionLabel accent="España, 2026">Nacionales</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {nationals.map(h => {
          const on = isOn(h.holiday_date);
          return (
            <button key={h.holiday_date} onClick={() => toggle(h)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '10px 4px', display: 'flex', alignItems: 'center', gap: 14,
                borderBottom: `1px solid ${TOKENS.borderSoft}`,
                textAlign: 'left',
              }}>
              <span style={{
                fontFamily: TOKENS.display, fontWeight: 600, fontSize: 14, color: on ? gold : TOKENS.muted,
                width: 56, fontVariantNumeric: 'tabular-nums',
              }}>
                {fmtDate(h.holiday_date)}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: on ? TOKENS.cream : TOKENS.muted, fontWeight: on ? 500 : 400 }}>
                {h.name}
              </span>
              <Switch on={on} onChange={() => toggle(h)} size={16}/>
            </button>
          );
        })}
      </div>

      <div style={{ height: 22 }}/>

      <SectionLabel accent="añade los de tu municipio">Locales</SectionLabel>

      {locals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {locals.map(h => (
            <div key={h.holiday_date} style={{
              background: TOKENS.bgCard, borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${TOKENS.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontFamily: TOKENS.display, fontWeight: 600, fontSize: 13, color: gold, width: 56, fontVariantNumeric: 'tabular-nums' }}>
                {fmtDate(h.holiday_date)}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: TOKENS.cream }}>{h.name}</span>
              <button onClick={() => setHolidays(prev => prev.filter(x => x.holiday_date !== h.holiday_date))}
                style={{ background: 'transparent', border: 'none', color: TOKENS.muted, cursor: 'pointer', padding: 4 }}>
                {Icon.x(13)}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: TOKENS.bgCard, border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 8, marginBottom: 10 }}>
          <Field label="Fecha">
            <input type="date" style={inputStyleSch}/>
          </Field>
          <Field label="Nombre">
            <input placeholder="San Roque, Patrón…" style={inputStyleSch}/>
          </Field>
        </div>
        <button style={{
          width: '100%', padding: '10px',
          background: 'transparent', border: `1px solid ${gold}`, borderRadius: 6,
          color: gold, fontFamily: TOKENS.sans, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {Icon.plus()} Añadir festivo local
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ScheduleScreen });
