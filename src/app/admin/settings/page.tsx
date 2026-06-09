'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoCropModal from '@/components/LogoCropModal'
import BrandHeader from '@/components/admin/BrandHeader'
import { createSupabaseClient } from '@/lib/supabase-client'

interface Config {
  podologist_phone: string
  alarm_margin_minutes: number
  delay_message_template: string
  business_name: string
  business_address: string
  owner_email: string
  logo_url: string | null
  admin_password: string | null
  reschedule_cutoff_hours: number
  reminder_first_hours: number
  reminder_second_hours: number
  owner_name: string
  nif: string
  address: string
  contact_email: string
  data_retention_years: number
}

const DEFAULTS: Config = {
  podologist_phone: '', alarm_margin_minutes: 60,
  delay_message_template: '', business_name: 'PodologyApp',
  business_address: '', owner_email: '', logo_url: null, admin_password: null,
  reschedule_cutoff_hours: 2, reminder_first_hours: 12, reminder_second_hours: 2,
  owner_name: '', nif: '', address: '', contact_email: '', data_retention_years: 3,
}

export default function SettingsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [config, setConfig] = useState<Config>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const [tab, setTab] = useState<'esenciales'|'avanzados'>('esenciales')

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => { if (r.status === 401) { router.push('/admin'); throw new Error() } return r.json() })
      .then(d => { if (d.config) setConfig(p => ({ ...DEFAULTS, ...p, ...d.config })); setLoading(false) })
      .catch(() => setLoading(false))
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [router])

  async function save() {
    setSaving(true); setSaveError('')
    const res = await fetch('/api/admin/config', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setSaveError(data.error ?? 'Error al guardar'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result as string)
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function uploadCroppedBlob(blob: Blob) {
    setCropSrc(null)
    setLogoUploading(true); setLogoError('')
    const fd = new FormData(); fd.append('file', blob, 'logo.jpg')
    const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd })
    if (res.ok) { const { url } = await res.json(); setConfig(p => ({ ...p, logo_url: url })) }
    else setLogoError('Error al subir el logo')
    setLogoUploading(false)
  }

  async function changePassword() {
    setPassError('')
    if (!newPassword || newPassword.length < 4) { setPassError('Mínimo 4 caracteres'); return }
    if (newPassword !== confirmPassword) { setPassError('Las contraseñas no coinciden'); return }
    const supabase = createSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPassError('Error al cambiar la contraseña'); return }
    setNewPassword(''); setConfirmPassword(''); setPassSaved(true); setTimeout(() => setPassSaved(false), 2000)
  }

  async function requestNotif() { const p = await Notification.requestPermission(); setNotifPermission(p) }
  async function logout() { await fetch('/api/admin/auth', { method: 'DELETE' }); router.push('/admin') }

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-muted">Cargando...</p></main>

  return (
    <main className="min-h-screen pb-24 max-w-2xl mx-auto">
      <BrandHeader section="Ajustes" />

      {/* Title */}
      <div className="px-5 pt-[18px] flex items-end justify-between">
        <div>
          <h1 className="font-display italic text-[32px] leading-none text-cream">Ajustes</h1>
        </div>
        <button onClick={logout} className="text-[11px] text-muted underline underline-offset-2 decoration-border">
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 flex gap-5 border-b border-border/50">
        {([
          { k: 'esenciales' as const, l: 'Esenciales' },
          { k: 'avanzados'  as const, l: 'Avanzados'  },
        ]).map(t => {
          const is = tab === t.k
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`relative pt-2 pb-2.5 text-xs font-semibold uppercase tracking-[0.12em]
                ${is ? 'text-gold' : 'text-muted'}`}>
              {t.l}
              {is && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-gold"/>}
            </button>
          )
        })}
      </div>

      {/* ESENCIALES */}
      {tab === 'esenciales' && (
        <div className="px-5 pt-6">
          {/* 1 — Teléfono */}
          <CardCard icon={<Phone className="w-4 h-4"/>} title="Tu teléfono">
            <input type="tel" value={config.podologist_phone} onChange={e => setConfig(p => ({ ...p, podologist_phone: e.target.value }))}
              placeholder="+34600000000" className={BIG_INPUT}/>
            <p className="text-[11px] text-muted mt-2 font-display italic">
              Recibirás un SMS la noche anterior si tienes citas el día siguiente.
            </p>
          </CardCard>

          {/* 2 — Margen alarma */}
          <CardCard icon={<Bell className="w-4 h-4"/>} title="Margen de alarma"
            subtitle="Cuánto antes de la primera cita quieres recibir el aviso por la mañana.">
            <div className="flex gap-1.5 flex-wrap">
              {[30,45,60,90,120].map(m => {
                const on = config.alarm_margin_minutes === m
                return (
                  <button key={m} onClick={() => setConfig(p => ({ ...p, alarm_margin_minutes: m }))}
                    className={`flex-1 min-w-[55px] py-2.5 rounded-lg border font-semibold transition-colors
                      ${on ? 'bg-gold/15 border-gold text-gold' : 'border-border text-cream'}`}>
                    <span className="font-display font-semibold text-base">{m}</span>
                    <span className="text-[9px] ml-0.5">min</span>
                  </button>
                )
              })}
            </div>
          </CardCard>

          {/* 3 — Mensaje retraso */}
          <CardCard icon={<Scissors className="w-3.5 h-3.5"/>} title="Mensaje de retraso"
            subtitle="Plantilla WhatsApp cuando avisas que llegarás tarde.">
            <textarea value={config.delay_message_template} onChange={e => setConfig(p => ({ ...p, delay_message_template: e.target.value }))}
              rows={4} className={`${BIG_INPUT} resize-none text-[12.5px] leading-[1.55]`}/>
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {['nombre','minutos','hora_nueva'].map(v => (
                <span key={v} className="px-2 py-1 rounded text-[10.5px] bg-bg-input border border-border text-gold font-mono">
                  {'{'}{v}{'}'}
                </span>
              ))}
            </div>
          </CardCard>

          {saveError && <p className="text-red-400 text-sm text-center mt-3">{saveError}</p>}
          <button onClick={save} disabled={saving}
            className="mt-4 w-full py-3.5 bg-gold text-bg rounded-lg font-semibold text-sm tracking-[0.03em] disabled:opacity-50">
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {/* AVANZADOS */}
      {tab === 'avanzados' && (
        <div className="px-5 pt-6 flex flex-col gap-5">
          {/* Negocio */}
          <AdvSection title="Negocio">
            <div className="flex items-center gap-3.5 mb-3.5 p-3 bg-bg-input rounded-lg border border-border/50">
              <div className="w-13 h-13 rounded-md bg-bg border border-border flex items-center justify-center text-gold" style={{width:52, height:52}}>
                {config.logo_url ? <img src={config.logo_url} alt="logo" className="w-full h-full object-contain rounded-md"/> : <Scissors className="w-5 h-5"/>}
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-cream font-medium">Logo del negocio</div>
                <div className="text-[10.5px] text-muted mt-0.5">PNG · 256×256 recomendado</div>
                {logoError && <div className="text-[10.5px] text-red-400">{logoError}</div>}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={logoUploading}
                className="px-3 py-1.5 border border-gold text-gold rounded text-[11px] font-semibold disabled:opacity-50">
                {logoUploading ? 'Subiendo...' : 'Subir'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden"/>
            </div>
            <SmallField label="Nombre del negocio">
              <input value={config.business_name} onChange={e => setConfig(p => ({ ...p, business_name: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
            <SmallField label="Dirección">
              <input value={config.business_address} onChange={e => setConfig(p => ({ ...p, business_address: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
          </AdvSection>

          {/* Datos personales */}
          <AdvSection title="Datos personales">
            <SmallField label="Email del propietario">
              <input type="email" value={config.owner_email} onChange={e => setConfig(p => ({ ...p, owner_email: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
          </AdvSection>

          {/* Recordatorios */}
          <AdvSection title="Recordatorios al cliente">
            <ChipGroup label="Reagendar hasta" suffix="h antes" value={config.reschedule_cutoff_hours}
              options={[1,2,3,4,6,12,24]} onChange={v => setConfig(p => ({ ...p, reschedule_cutoff_hours: v }))}/>
            <ChipGroup label="Primer recordatorio" suffix="h antes" value={config.reminder_first_hours}
              options={[6,12,24,48]} onChange={v => setConfig(p => ({ ...p, reminder_first_hours: v }))}/>
            <ChipGroup label="Segundo recordatorio" suffix="h antes" value={config.reminder_second_hours}
              options={[1,2,3,4]} onChange={v => setConfig(p => ({ ...p, reminder_second_hours: v }))}/>
          </AdvSection>

          {/* Notificaciones push */}
          <AdvSection title="Notificaciones push">
            <div className="p-3 bg-bg-card border border-border/50 rounded-lg flex items-center gap-3">
              {notifPermission === 'granted' ? (<>
                <span className="w-2 h-2 rounded-full bg-green-400"/>
                <span className="text-[12px] text-cream">Activas en este dispositivo</span>
              </>) : notifPermission === 'denied' ? (
                <span className="text-[12px] text-muted">Bloqueadas en el navegador. Actívalas en ajustes del sitio.</span>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[12px] text-cream">Activa las notificaciones</span>
                  <button onClick={requestNotif} className="px-3 py-1.5 bg-gold text-bg rounded text-[11px] font-semibold">Activar</button>
                </div>
              )}
            </div>
          </AdvSection>

          {/* Cambiar contraseña */}
          <AdvSection title="Cambiar contraseña">
            <SmallField label="Nueva contraseña">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mín. 4 caracteres" className={SMALL_INPUT}/>
            </SmallField>
            <SmallField label="Repetir">
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={SMALL_INPUT}/>
            </SmallField>
            {passError && <p className="text-red-400 text-[12px]">{passError}</p>}
            <button onClick={changePassword} className="w-full py-2.5 bg-transparent border border-border rounded-lg text-cream text-[12px] font-semibold">
              {passSaved ? '✓ Contraseña actualizada' : 'Cambiar contraseña'}
            </button>
          </AdvSection>

          {/* Datos legales */}
          <AdvSection title="Datos legales">
            <SmallField label="Nombre del negocio">
              <input value={config.business_name} onChange={e => setConfig(p => ({ ...p, business_name: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
            <SmallField label="Nombre del titular / autónomo">
              <input value={config.owner_name} onChange={e => setConfig(p => ({ ...p, owner_name: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
            <SmallField label="NIF / NIE">
              <input value={config.nif} onChange={e => setConfig(p => ({ ...p, nif: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
            <SmallField label="Dirección física">
              <input value={config.address} onChange={e => setConfig(p => ({ ...p, address: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
            <SmallField label="Email de contacto para clientes">
              <input type="email" value={config.contact_email} onChange={e => setConfig(p => ({ ...p, contact_email: e.target.value }))} className={SMALL_INPUT}/>
            </SmallField>
            <SmallField label="Retención de datos (años)">
              <select value={config.data_retention_years} onChange={e => setConfig(p => ({ ...p, data_retention_years: Number(e.target.value) }))} className={SMALL_INPUT}>
                {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} {y === 1 ? 'año' : 'años'}</option>)}
              </select>
            </SmallField>
            <p className="text-[10.5px] text-muted font-display italic pt-0.5">
              Estos datos rellenan automáticamente las páginas /privacidad y /aviso-legal.
            </p>
          </AdvSection>

          {saveError && <p className="text-red-400 text-sm text-center">{saveError}</p>}
          <button onClick={save} disabled={saving}
            className="w-full py-3.5 bg-gold text-bg rounded-lg font-semibold text-sm tracking-[0.03em] disabled:opacity-50">
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {cropSrc && (
        <LogoCropModal
          src={cropSrc}
          onConfirm={uploadCroppedBlob}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </main>
  )
}

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
function Section({ title, accent }: { title: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gold">{title}</span>
      {accent && <span className="font-display italic text-[13px] text-muted">{accent}</span>}
      <span className="flex-1 h-px bg-border/50"/>
    </div>
  )
}

function CardCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 mb-2.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-6 h-6 rounded bg-gold/15 text-gold inline-flex items-center justify-center">{icon}</span>
        <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-gold">{title}</span>
      </div>
      {subtitle && <p className="text-[12px] text-muted mb-3 leading-relaxed">{subtitle}</p>}
      {children}
    </div>
  )
}

function AdvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Section title={title}/>
      <div className="bg-bg-card border border-border/50 rounded-xl p-3.5 flex flex-col gap-2.5">
        {children}
      </div>
    </div>
  )
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] font-semibold tracking-[0.16em] uppercase text-muted mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function ChipGroup({ label, value, options, onChange }: { label: string; suffix?: string; value: number; options: number[]; onChange: (v:number)=>void }) {
  return (
    <div className="mb-1">
      <div className="text-[11.5px] text-cream font-medium mb-2">{label}</div>
      <div className="flex gap-1 flex-wrap">
        {options.map(o => {
          const on = value === o
          return (
            <button key={o} onClick={() => onChange(o)}
              className={`px-2.5 py-1.5 rounded border font-semibold tabular-nums text-[11.5px] transition-colors
                ${on ? 'bg-gold/15 border-gold text-gold' : 'border-border text-cream'}`}>
              {o}<span className={`text-[9px] ml-0.5 ${on ? 'text-gold' : 'text-muted'}`}>h</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const BIG_INPUT = "w-full px-4 py-3.5 bg-bg-input border border-border rounded-lg text-cream placeholder-muted text-sm focus:outline-none focus:border-gold font-medium"
const SMALL_INPUT = "w-full bg-bg-input border border-border rounded px-3 py-2.5 text-cream text-[13px] focus:outline-none focus:border-gold"

function Scissors({ className='' }) { return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>) }
function Phone({ className='' }) { return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>) }
function Bell({ className='' }) { return (<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>) }