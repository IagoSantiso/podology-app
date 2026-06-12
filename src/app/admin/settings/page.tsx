'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoCropModal from '@/components/LogoCropModal'
import BrandHeader from '@/components/admin/BrandHeader'

interface Config {
  podologist_phone: string; delay_message_template: string
  business_name: string; business_address: string; owner_email: string; logo_url: string | null
  admin_password: string | null; reschedule_cutoff_hours: number; reminder_first_hours: number
  reminder_second_hours: number; owner_name: string; nif: string; address: string
  contact_email: string; data_retention_years: number
}

const DEFAULTS: Config = {
  podologist_phone: '', delay_message_template: '',
  business_name: 'Patricia Podología', business_address: '', owner_email: '',
  logo_url: null, admin_password: null, reschedule_cutoff_hours: 2,
  reminder_first_hours: 12, reminder_second_hours: 2, owner_name: '', nif: '',
  address: '', contact_email: '', data_retention_years: 3,
}

const BIG_INPUT = "w-full px-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none transition-colors"
const SMALL_INPUT = "w-full px-3 py-2.5 rounded-lg text-[13px] focus:outline-none transition-colors"

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
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)
  const [notifPermission, setNotifPermission] = useState<string>('default')
  const [advancedOpen, setAdvancedOpen] = useState(false)

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
    setCropSrc(null); setLogoUploading(true); setLogoError('')
    const fd = new FormData(); fd.append('file', blob, 'logo.jpg')
    const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd })
    if (res.ok) { const { url } = await res.json(); setConfig(p => ({ ...p, logo_url: url })) }
    else setLogoError('Error al subir el logo')
    setLogoUploading(false)
  }

  async function changePassword() {
    setPassError('')
    if (!currentPassword) { setPassError('Introduce la contraseña actual'); return }
    if (!newPassword || newPassword.length < 6) { setPassError('Mínimo 6 caracteres'); return }
    if (newPassword !== confirmPassword) { setPassError('Las contraseñas no coinciden'); return }
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setPassError(data.error ?? 'Error al cambiar la contraseña')
      return
    }
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    setPassSaved(true); setTimeout(() => setPassSaved(false), 2000)
  }

  async function requestNotif() { const p = await Notification.requestPermission(); setNotifPermission(p) }
  async function logout() { await fetch('/api/admin/auth', { method: 'DELETE' }); router.push('/admin') }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--ink-3)' }}>Cargando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-24 max-w-2xl mx-auto" style={{ background: 'var(--bg)' }}>
      <BrandHeader section="Ajustes" />

      <div className="px-5 pt-5 flex items-end justify-between mb-6">
        <h1 className="font-display italic text-[28px] leading-none" style={{ color: 'var(--ink)' }}>Ajustes</h1>
        <button onClick={logout} className="text-xs transition-opacity hover:opacity-70 underline underline-offset-2" style={{ color: 'var(--ink-3)' }}>
          Cerrar sesión
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3">

        {/* 1 — Teléfono */}
        <EssentialCard
          icon={<PhoneIcon />}
          title="Tu teléfono"
        >
          <input type="tel" value={config.podologist_phone}
            onChange={e => setConfig(p => ({ ...p, podologist_phone: e.target.value }))}
            placeholder="+34600000000"
            className={BIG_INPUT}
            style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
          <p className="text-xs mt-2 font-display italic leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            Recibirás un SMS la noche anterior si tienes citas el día siguiente.
          </p>
        </EssentialCard>

        {/* 2 — Mensaje retraso */}
        <EssentialCard icon={<MessageIcon />} title="Mensaje de retraso"
          subtitle="Plantilla WhatsApp cuando avisas que llegarás tarde.">
          <textarea value={config.delay_message_template}
            onChange={e => setConfig(p => ({ ...p, delay_message_template: e.target.value }))}
            rows={4}
            className={`${BIG_INPUT} resize-none text-[12.5px] leading-[1.55]`}
            style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {['nombre','minutos','hora_nueva'].map(v => (
              <span key={v}
                className="px-2 py-1 rounded text-[10.5px] font-mono font-medium"
                style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                {'{'}{v}{'}'}
              </span>
            ))}
          </div>
        </EssentialCard>

        {saveError && <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{saveError}</p>}

        <button onClick={save} disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {/* Acordeón Avanzado */}
        <button
          onClick={() => setAdvancedOpen(o => !o)}
          className="flex items-center justify-between w-full py-3 transition-opacity hover:opacity-70"
        >
          <span className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--ink-3)' }}>Avanzado</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--ink-3)', transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {advancedOpen && (
          <div className="flex flex-col gap-4 pb-4">

            {/* Negocio */}
            <AdvSection title="Negocio">
              <div className="flex items-center gap-3.5 mb-3.5 p-3 rounded-xl" style={{ background: 'var(--field)', border: '1px solid var(--line)' }}>
                <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: 'var(--primary-soft)', border: '1px solid var(--line)' }}>
                  {config.logo_url
                    ? <img src={config.logo_url} alt="logo" className="w-full h-full object-contain rounded-xl"/>
                    : <FootIcon />
                  }
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Logo del negocio</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>PNG · 256×256 recomendado</div>
                  {logoError && <div className="text-xs" style={{ color: 'var(--danger)' }}>{logoError}</div>}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={logoUploading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
                  style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                  {logoUploading ? 'Subiendo...' : 'Subir'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden"/>
              </div>
              <SmallField label="Nombre del negocio">
                <input value={config.business_name} onChange={e => setConfig(p => ({ ...p, business_name: e.target.value }))}
                  className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
              </SmallField>
              <SmallField label="Dirección">
                <input value={config.business_address} onChange={e => setConfig(p => ({ ...p, business_address: e.target.value }))}
                  className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
              </SmallField>
            </AdvSection>

            {/* Datos personales */}
            <AdvSection title="Datos personales">
              <SmallField label="Email del propietario">
                <input type="email" value={config.owner_email} onChange={e => setConfig(p => ({ ...p, owner_email: e.target.value }))}
                  className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
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
              <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--field)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--ink-3)' }}/>
                  <span className="text-sm" style={{ color: 'var(--ink-3)' }}>Desactivadas</span>
                </div>
                <a href="/admin/settings/notificaciones"
                  className="text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--primary)' }}>¿Cómo activarlas?</a>
              </div>
            </AdvSection>

            {/* Cambiar contraseña */}
            <AdvSection title="Cambiar contraseña">
              <SmallField label="Contraseña actual">
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
              </SmallField>
              <SmallField label="Nueva contraseña">
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
              </SmallField>
              <SmallField label="Repetir nueva contraseña">
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
              </SmallField>
              {passError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{passError}</p>}
              <button onClick={changePassword}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-2)' }}>
                {passSaved ? '✓ Contraseña actualizada' : 'Cambiar contraseña'}
              </button>
            </AdvSection>

            {/* Datos legales */}
            <AdvSection title="Datos legales">
              {[
                { key: 'business_name', label: 'Nombre del negocio', type: 'text' },
                { key: 'owner_name', label: 'Nombre del titular / autónomo', type: 'text' },
                { key: 'nif', label: 'NIF / NIE', type: 'text' },
                { key: 'address', label: 'Dirección física', type: 'text' },
                { key: 'contact_email', label: 'Email de contacto', type: 'email' },
              ].map(f => (
                <SmallField key={f.key} label={f.label}>
                  <input type={f.type} value={(config[f.key as keyof Config] as string) ?? ''}
                    onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))}
                    className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}/>
                </SmallField>
              ))}
              <SmallField label="Retención de datos (años)">
                <select value={config.data_retention_years}
                  onChange={e => setConfig(p => ({ ...p, data_retention_years: Number(e.target.value) }))}
                  className={SMALL_INPUT} style={{ background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} {y === 1 ? 'año' : 'años'}</option>)}
                </select>
              </SmallField>
              <p className="text-xs font-display italic" style={{ color: 'var(--ink-3)' }}>
                Estos datos rellenan automáticamente las páginas <a href="/privacidad" className="underline hover:opacity-70">/privacidad</a> y <a href="/aviso-legal" className="underline hover:opacity-70">/aviso-legal</a>.
              </p>
            </AdvSection>

            {saveError && <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>{saveError}</p>}
            <button onClick={save} disabled={saving}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}

      </div>

      {cropSrc && (
        <LogoCropModal src={cropSrc} onConfirm={uploadCroppedBlob} onCancel={() => setCropSrc(null)} />
      )}
    </main>
  )
}

function EssentialCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-6 h-6 rounded-lg inline-flex items-center justify-center"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
          {icon}
        </span>
        <span className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--primary)' }}>{title}</span>
      </div>
      {subtitle && <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--ink-3)' }}>{subtitle}</p>}
      {children}
    </div>
  )
}

function AdvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--primary)' }}>{title}</span>
        <span className="flex-1 h-px" style={{ background: 'var(--line)' }}/>
      </div>
      <div className="rounded-xl p-3.5 flex flex-col gap-2.5"
        style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
        {children}
      </div>
    </div>
  )
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] font-bold tracking-[0.16em] uppercase mb-1.5" style={{ color: 'var(--ink-3)' }}>{label}</div>
      {children}
    </div>
  )
}

function ChipGroup({ label, value, options, onChange }: { label: string; suffix?: string; value: number; options: number[]; onChange: (v:number)=>void }) {
  return (
    <div className="mb-1">
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--ink)' }}>{label}</div>
      <div className="flex gap-1 flex-wrap">
        {options.map(o => {
          const on = value === o
          return (
            <button key={o} onClick={() => onChange(o)}
              className="px-2.5 py-1.5 rounded-lg font-semibold tabular-nums text-xs transition-colors"
              style={on
                ? { background: 'var(--primary-soft)', border: '1.5px solid var(--primary)', color: 'var(--primary)' }
                : { background: 'var(--field)', border: '1px solid var(--line)', color: 'var(--ink-2)' }
              }>
              {o}<span className="text-[9px] ml-0.5" style={{ color: on ? 'var(--primary)' : 'var(--ink-3)' }}>h</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}
function MessageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function FootIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M6 26 Q6 10 16 8 Q26 10 26 26" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}
