// Dashboard mockup — list-based with optional timeline toggle
// Mirrors src/app/admin/dashboard/page.tsx state & types; only JSX/styles change.

const { useState: useStateDash, useMemo } = React;

function DashboardScreen({ density='comfortable', accent }) {
  const gold = accent || TOKENS.gold;
  const [selectedIdx, setSelectedIdx] = useStateDash(4); // Jueves
  const [view, setView] = useStateDash('list');
  const [openAptId, setOpenAptId] = useStateDash('a4'); // next confirmed unfolded
  const [delayModal, setDelayModal] = useStateDash(null);
  const [createModal, setCreateModal] = useStateDash(false);

  // Build week strip (Lun..Dom starting from Mon May 11 2026)
  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(2026, 4, 11 + i);
      const dStr = `2026-05-${String(11 + i).padStart(2,'0')}`;
      const count = i === 4 ? APPOINTMENTS.length : i === 3 ? 5 : i === 5 ? 6 : i === 1 ? 4 : i === 2 ? 3 : i === 0 ? 2 : 0;
      return { idx: i, date: day, dStr, count };
    });
  }, []);
  const todayIdx = 4;

  // Compute "next confirmed" appointment by NOW
  const sorted = [...APPOINTMENTS].sort((a,b) => a.start_time.localeCompare(b.start_time));
  const nowMin = NOW.getHours()*60 + NOW.getMinutes();
  const minutesOf = t => {
    const [h,m] = t.split(':').map(Number); return h*60 + m;
  };
  const nextConfirmed = sorted.find(a => a.status === 'confirmed' && minutesOf(a.start_time) >= nowMin);
  const urgent = nextConfirmed && (minutesOf(nextConfirmed.start_time) - nowMin) < 60;

  const padX = 20;
  const cardPad = density === 'compact' ? 12 : 14;
  const rowGap = density === 'compact' ? 8 : 10;

  return (
    <div style={{ background: TOKENS.bg, color: TOKENS.cream, fontFamily: TOKENS.sans, paddingBottom: 100, minHeight: '100%' }}>
      <BrandBar subtitle="Agenda" />

      {/* Day header — Playfair italic, big */}
      <div style={{ padding: `18px ${padX}px 0`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: TOKENS.sans, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: gold, marginBottom: 4 }}>
            {selectedIdx === todayIdx ? 'Hoy' : DAY_NAMES_SHORT[(week[selectedIdx].date.getDay())]} · 15 May
          </div>
          <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontWeight: 400, fontSize: 32, lineHeight: 1, color: TOKENS.cream }}>
            Jueves <span style={{ color: gold }}>15</span>
          </div>
          <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontWeight: 400, fontSize: 18, color: TOKENS.muted, marginTop: 2 }}>
            de mayo
          </div>
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', border: `1px solid ${TOKENS.border}`, borderRadius: 8, padding: 2, background: TOKENS.bgCard }}>
          <button onClick={() => setView('list')}
            style={{ ...iconBtn, color: view==='list' ? '#0a0a0a' : TOKENS.muted, background: view==='list' ? gold : 'transparent' }}>
            {Icon.list(15)}
          </button>
          <button onClick={() => setView('timeline')}
            style={{ ...iconBtn, color: view==='timeline' ? '#0a0a0a' : TOKENS.muted, background: view==='timeline' ? gold : 'transparent' }}>
            {Icon.grid(15)}
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div style={{ display: 'flex', gap: 6, padding: `16px ${padX}px 4px`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {week.map(w => {
          const is = w.idx === selectedIdx;
          const today = w.idx === todayIdx;
          return (
            <button key={w.idx} onClick={() => setSelectedIdx(w.idx)}
              style={{
                flex: '1 1 0', minWidth: 38, padding: '8px 4px 6px', borderRadius: 6,
                background: is ? gold : 'transparent',
                border: is ? `1px solid ${gold}` : `1px solid ${today ? TOKENS.goldRim : TOKENS.border}`,
                color: is ? '#0a0a0a' : (today ? TOKENS.cream : TOKENS.muted),
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                cursor: 'pointer', fontFamily: TOKENS.sans, transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, opacity: is ? 0.7 : 1 }}>
                {DAY_NAMES_SHORT[w.date.getDay()]}
              </span>
              <span style={{ fontFamily: TOKENS.display, fontWeight: 600, fontSize: 17, lineHeight: 1 }}>
                {w.date.getDate()}
              </span>
              <span style={{ fontSize: 8, fontWeight: 700, color: is ? '#0a0a0a' : (w.count > 0 ? gold : TOKENS.mutedDim), opacity: is ? 0.7 : 1 }}>
                {w.count > 0 ? `${w.count} citas` : '—'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Urgent banner (cita en < 60min) */}
      {urgent && selectedIdx === todayIdx && (
        <div style={{ margin: `14px ${padX}px 0`, padding: '11px 13px', borderRadius: 8,
          background: 'rgba(224,131,68,0.08)', border: `1px solid rgba(224,131,68,0.32)`,
          display: 'flex', alignItems: 'center', gap: 10, color: TOKENS.orange,
        }}>
          <span style={{ color: TOKENS.orange, marginTop: 1 }}>{Icon.alert(16)}</span>
          <div style={{ flex: 1, lineHeight: 1.35 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e8a77a' }}>Próxima cita en {minutesOf(nextConfirmed.start_time) - nowMin} minutos</div>
            <div style={{ fontSize: 11, color: 'rgba(224,131,68,0.75)' }}>
              {nextConfirmed.client_name} · {fmt(nextConfirmed.start_time)}h
            </div>
          </div>
        </div>
      )}

      {/* "Voy a llegar tarde" CTA — only if today has confirmed appts */}
      {selectedIdx === todayIdx && nextConfirmed && (
        <div style={{ padding: `12px ${padX}px 0` }}>
          <button onClick={() => setDelayModal({ aptId: nextConfirmed.id, clientName: nextConfirmed.client_name })}
            style={{
              width: '100%', padding: '14px 16px',
              background: TOKENS.orange, color: '#fff',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontFamily: TOKENS.sans, fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 18px rgba(224,131,68,0.18)',
              letterSpacing: '0.01em',
            }}>
            <span style={{ display: 'inline-flex' }}>{Icon.clock({size: 16, bold: true})}</span>
            Voy a llegar tarde
            <span style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontWeight: 400, opacity: 0.8, fontSize: 12, marginLeft: 4 }}>
              · avisar a {nextConfirmed.client_name.split(' ')[0]}
            </span>
          </button>
        </div>
      )}

      {/* Section: appointments list / timeline */}
      <div style={{ padding: `22px ${padX}px 0` }}>
        <SectionLabel accent={`${sorted.length} citas`}>Hoy</SectionLabel>

        {view === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
            {sorted.map(apt => (
              <AppointmentRow key={apt.id} apt={apt} now={NOW} gold={gold}
                isNext={apt.id === nextConfirmed?.id}
                open={openAptId === apt.id}
                onToggle={() => setOpenAptId(openAptId === apt.id ? null : apt.id)}
                onDelay={() => setDelayModal({ aptId: apt.id, clientName: apt.client_name })}
                pad={cardPad}
              />
            ))}
          </div>
        ) : (
          <TimelineView appts={sorted} gold={gold} />
        )}
      </div>

      {/* End rule */}
      <div style={{ padding: `24px ${padX}px 0`, display: 'flex', alignItems: 'center', gap: 12, color: TOKENS.mutedDim }}>
        <span style={{ flex: 1, height: 1, background: TOKENS.borderSoft }}/>
        <span style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 12 }}>fin del día</span>
        <span style={{ flex: 1, height: 1, background: TOKENS.borderSoft }}/>
      </div>

      {/* Floating FAB */}
      <button onClick={() => setCreateModal(true)}
        style={{
          position: 'absolute', bottom: 88, right: 18, zIndex: 30,
          width: 52, height: 52, borderRadius: '50%',
          background: gold, color: '#0a0a0a', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(212,168,83,0.35), 0 0 0 4px rgba(212,168,83,0.08)',
        }}>
        {Icon.plus()}
      </button>

      <AdminNav active="dashboard" />

      {/* DELAY modal */}
      {delayModal && (
        <DelayModal data={delayModal} onClose={() => setDelayModal(null)} gold={gold} />
      )}

      {/* CREATE modal */}
      {createModal && (
        <CreateModal onClose={() => setCreateModal(false)} gold={gold} />
      )}
    </div>
  );
}

const iconBtn = {
  width: 30, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
};

// ─────────────────────────────────────────────────────────────
// Appointment row
// ─────────────────────────────────────────────────────────────
function AppointmentRow({ apt, now, gold, isNext, open, onToggle, onDelay, pad }) {
  const minutesOf = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
  const nowMin = now.getHours()*60 + now.getMinutes();
  const past = apt.status === 'completed' || minutesOf(apt.end_time) < nowMin;
  const isDelayed = apt.status === 'delayed';
  const isCancelled = apt.status === 'cancelled';
  const ringColor = isNext ? gold : isDelayed ? TOKENS.orange : past ? TOKENS.borderSoft : TOKENS.border;
  const opacity = past ? 0.58 : 1;

  return (
    <div style={{
      background: TOKENS.bgCard, borderRadius: 10,
      border: `1px solid ${isNext ? TOKENS.goldRim : TOKENS.border}`,
      overflow: 'hidden',
      boxShadow: isNext ? `0 0 0 1px ${gold}33` : 'none',
    }}>
      <button onClick={onToggle}
        style={{
          width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
          padding: `${pad}px ${pad}px ${pad}px ${pad - 2}px`,
          display: 'flex', alignItems: 'stretch', gap: pad, textAlign: 'left',
          color: TOKENS.cream, opacity,
        }}>
        {/* Time column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, paddingLeft: 2, paddingRight: 2 }}>
          <div style={{
            fontFamily: TOKENS.display, fontWeight: 600, fontSize: 22, lineHeight: 1,
            color: isNext ? gold : isDelayed ? TOKENS.orange : TOKENS.cream,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmt(apt.start_time)}
          </div>
          <div style={{ fontSize: 9, color: TOKENS.muted, letterSpacing: '0.06em', fontWeight: 500 }}>
            {apt.services.duration_minutes} min
          </div>
        </div>
        {/* vertical hair */}
        <div style={{ width: 1, background: ringColor, alignSelf: 'stretch', marginRight: 2 }}/>
        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: TOKENS.sans, fontWeight: 600, fontSize: 14, color: TOKENS.cream,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textDecoration: isCancelled ? 'line-through' : 'none',
            }}>{apt.client_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, color: TOKENS.muted, fontSize: 11.5 }}>
            <span>{apt.services.name}</span>
            <span style={{ color: TOKENS.mutedDim }}>·</span>
            <span style={{ fontFamily: TOKENS.display, fontStyle: 'italic', color: gold, fontSize: 12 }}>
              {apt.services.price}€
            </span>
          </div>
        </div>
        {/* Status badge */}
        <StatusBadge apt={apt} isNext={isNext} gold={gold} />
      </button>
      {/* Expanded actions */}
      {open && !past && !isCancelled && (
        <div style={{
          borderTop: `1px solid ${TOKENS.borderSoft}`,
          padding: `10px ${pad}px`,
          display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.015)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, color: TOKENS.muted, fontSize: 11 }}>
            <span style={{ color: TOKENS.muted }}>{Icon.phone()}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{apt.client_phone}</span>
          </div>
          {apt.status === 'confirmed' && (
            <>
              <ActionChip kind="ok" label="Completar" />
              <ActionChip kind="warn" label="Retraso" onClick={onDelay} />
              <ActionChip kind="bad" label={Icon.x(11)} />
            </>
          )}
        </div>
      )}
      {open && isDelayed && (
        <div style={{
          borderTop: `1px solid ${TOKENS.borderSoft}`,
          padding: `10px ${pad}px`, fontSize: 11.5,
          color: TOKENS.orange,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(224,131,68,0.05)',
        }}>
          <span>{Icon.clock({size: 13})}</span>
          Retraso de {apt.delay_minutes} min · {apt.delay_notified ? 'cliente avisado por WhatsApp' : 'sin avisar'}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ apt, isNext, gold }) {
  let label, fg, bg, border;
  if (apt.status === 'completed') { label = '✓'; fg = TOKENS.green; bg = 'rgba(90,138,90,0.08)'; border = 'rgba(90,138,90,0.3)'; }
  else if (apt.status === 'delayed') { label = `+${apt.delay_minutes}'`; fg = TOKENS.orange; bg = 'rgba(224,131,68,0.08)'; border = 'rgba(224,131,68,0.3)'; }
  else if (apt.status === 'cancelled') { label = 'X'; fg = TOKENS.red; bg = 'rgba(168,80,80,0.08)'; border = 'rgba(168,80,80,0.3)'; }
  else if (isNext) { label = 'siguiente'; fg = gold; bg = TOKENS.goldDim; border = TOKENS.goldRim; }
  else { label = '—'; fg = TOKENS.muted; bg = 'transparent'; border = TOKENS.border; }
  return (
    <div style={{
      alignSelf: 'flex-start',
      padding: '4px 8px', borderRadius: 4, fontSize: 9.5, letterSpacing: '0.06em',
      textTransform: 'uppercase', fontWeight: 700, color: fg,
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', minWidth: 22, justifyContent: 'center',
    }}>{label}</div>
  );
}

function ActionChip({ kind, label, onClick }) {
  const palette = {
    ok:   { fg: TOKENS.green,  bg: 'rgba(90,138,90,0.10)',  br: 'rgba(90,138,90,0.35)' },
    warn: { fg: TOKENS.orange, bg: 'rgba(224,131,68,0.10)', br: 'rgba(224,131,68,0.35)' },
    bad:  { fg: TOKENS.red,    bg: 'rgba(168,80,80,0.10)',  br: 'rgba(168,80,80,0.35)' },
  }[kind];
  return (
    <button onClick={onClick} style={{
      padding: '6px 9px', borderRadius: 5,
      background: palette.bg, border: `1px solid ${palette.br}`,
      color: palette.fg, cursor: 'pointer',
      fontFamily: TOKENS.sans, fontSize: 11, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>{label}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// Timeline view (hybrid mode) — denser, hour-by-hour
// ─────────────────────────────────────────────────────────────
function TimelineView({ appts, gold }) {
  const hours = [];
  for (let h = 9; h <= 20; h++) hours.push(h);
  const minutesOf = t => { const [h,m]=t.split(':').map(Number); return h*60+m; };
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {hours.map(h => {
        const slot = `${String(h).padStart(2,'0')}:00:00`;
        const apt = appts.find(a => a.status !== 'cancelled' && minutesOf(a.start_time) <= h*60 && minutesOf(a.end_time) > h*60);
        const startsHere = apt && minutesOf(apt.start_time) === h*60;
        return (
          <div key={h} style={{ display: 'flex', gap: 10, minHeight: 56 }}>
            <div style={{ width: 44, paddingTop: 4, color: TOKENS.muted, fontFamily: TOKENS.display, fontSize: 14, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
              {String(h).padStart(2,'0')}
            </div>
            <div style={{ flex: 1, borderLeft: `1px solid ${TOKENS.borderSoft}`, paddingLeft: 10, paddingBottom: 6, position: 'relative' }}>
              {startsHere ? (
                <div style={{
                  background: apt.status === 'completed' ? 'rgba(90,138,90,0.06)' : apt.status === 'delayed' ? 'rgba(224,131,68,0.06)' : TOKENS.goldDim,
                  border: `1px solid ${apt.status === 'completed' ? 'rgba(90,138,90,0.3)' : apt.status === 'delayed' ? 'rgba(224,131,68,0.3)' : TOKENS.goldRim}`,
                  borderRadius: 8, padding: '8px 11px',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: TOKENS.cream }}>{apt.client_name}</div>
                  <div style={{ fontSize: 11, color: TOKENS.muted, marginTop: 2 }}>
                    {apt.services.name} · {fmt(apt.start_time)}–{fmt(apt.end_time)}
                  </div>
                </div>
              ) : apt ? (
                <div style={{ height: 38, borderLeft: `2px solid ${TOKENS.goldRim}`, marginLeft: 4 }}/>
              ) : (
                <div style={{ color: TOKENS.mutedDim, fontSize: 10.5, fontStyle: 'italic', paddingTop: 4 }}>
                  + añadir
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modals (visual only — wired to existing /api/* endpoints in tsx)
// ─────────────────────────────────────────────────────────────
function DelayModal({ data, onClose, gold }) {
  const [mins, setMins] = useStateDash(15);
  return (
    <ModalShell onClose={onClose}>
      <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 22, color: TOKENS.cream, marginBottom: 2 }}>
        Avisar retraso
      </div>
      <div style={{ fontSize: 12, color: TOKENS.muted, marginBottom: 16 }}>
        WhatsApp a <span style={{ color: TOKENS.cream }}>{data.clientName}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[10, 15, 20, 30, 45].map(m => (
          <button key={m} onClick={() => setMins(m)}
            style={{
              flex: '1 1 0', minWidth: 50, padding: '10px 0', borderRadius: 6,
              background: mins === m ? TOKENS.goldDim : 'transparent',
              border: `1px solid ${mins === m ? gold : TOKENS.border}`,
              color: mins === m ? gold : TOKENS.cream,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{m} min</button>
        ))}
      </div>
      <div style={{ background: TOKENS.bgInput, border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 6, padding: 10, fontSize: 11.5, color: TOKENS.creamDim, lineHeight: 1.5, marginBottom: 16 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: TOKENS.muted, marginBottom: 6 }}>Vista previa</div>
        Hola Pablo, te aviso que hoy llegaré unos <span style={{ color: gold }}>{mins}</span> minutos tarde. Tu nueva hora estimada es <span style={{ color: gold }}>11:{String(mins).padStart(2,'0')}</span>. Disculpa las molestias 🙏
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={modalBtnGhost}>Cancelar</button>
        <button style={{ ...modalBtnPrimary, background: TOKENS.orange, color: '#fff' }}>Enviar aviso</button>
      </div>
    </ModalShell>
  );
}

function CreateModal({ onClose, gold }) {
  return (
    <ModalShell onClose={onClose}>
      <div style={{ fontFamily: TOKENS.display, fontStyle: 'italic', fontSize: 22, color: TOKENS.cream, marginBottom: 16 }}>
        Nueva cita
      </div>
      <Field label="Nombre del cliente">
        <input placeholder="Carlos García" style={inputStyle}/>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Teléfono"><input placeholder="+34 600..." style={inputStyle}/></Field>
        <Field label="Email"><input placeholder="opcional" style={inputStyle}/></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Servicio">
          <select style={inputStyle}>
            {SERVICES.map(s => <option key={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Hora"><input type="time" defaultValue="11:30" style={inputStyle}/></Field>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button onClick={onClose} style={modalBtnGhost}>Cancelar</button>
        <button style={{ ...modalBtnPrimary, background: gold, color: '#0a0a0a' }}>Añadir cita</button>
      </div>
    </ModalShell>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9.5, color: TOKENS.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', background: TOKENS.bgInput,
  border: `1px solid ${TOKENS.border}`, borderRadius: 6,
  color: TOKENS.cream, fontFamily: TOKENS.sans, fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};

const modalBtnGhost = {
  flex: 1, padding: '12px', borderRadius: 8, background: 'transparent',
  border: `1px solid ${TOKENS.border}`, color: TOKENS.muted,
  fontFamily: TOKENS.sans, fontSize: 13, fontWeight: 500, cursor: 'pointer',
};

const modalBtnPrimary = {
  flex: 1, padding: '12px', borderRadius: 8, border: 'none',
  fontFamily: TOKENS.sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
};

function ModalShell({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: TOKENS.bgCard, borderTopLeftRadius: 16, borderTopRightRadius: 16,
        border: `1px solid ${TOKENS.border}`, borderBottom: 'none',
        width: '100%', padding: '20px 18px 28px',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ width: 36, height: 4, background: TOKENS.border, borderRadius: 2, margin: '0 auto 14px' }}/>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
