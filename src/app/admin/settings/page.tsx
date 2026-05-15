'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Config {
  barber_phone: string
  alarm_margin_minutes: number
  delay_message_template: string
  business_name: string
  business_address: string
  owner_email: string
  logo_url: string | null
  admin_password: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [config, setConfig] = useState<Config>({
    barber_phone: '', alarm_margin_minutes: 60,
    delay_message_template: '', business_name: 'BarberApp',
    business_address: '', owner_email: '', logo_url: null, admin_password: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)
  const [notifPermission, setNotifPermission] = useState<string>('default')

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => { if (r.status === 401) { router.push('/admin'); throw new Error() } return r.json() })
      .then(d => { if (d.config) setConfig(p => ({ ...p, ...d.config })); setLoading(false) })
      .catch(() => {})
    if ('Notification' in window) setNotifPermission(Notification.permission)
  }, [router])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload-logo', { method: 'POST', body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setConfig(p => ({ ...p, logo_url: url }))
    }
    setLogoUploading(false)
  }

  async function changePassword() {
    setPassError('')
    if (!newPassword || newPassword.length < 4) { setPassError('Mínimo 4 caracteres'); return }
    if (newPassword !== confirmPassword) { setPassError('Las contraseñas no coinciden'); return }
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, admin_password: newPassword }),
    })
    if (res.ok) {
      setConfig(p => ({ ...p, admin_password: newPassword }))
      setNewPassword('')
      setConfirmPassword('')
      setPassSaved(true)
      setTimeout(() => setPassSaved(false), 2000)
    }
  }

  async function requestNotif() {
    const p = await Notification.requestPermission()
    setNotifPermission(p)
  }

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin')
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-muted">Cargando...</p></main>

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-gold">Ajustes</h1>
        <button onClick={logout} className="text-xs text-muted hover:text-red-400 transition-colors">Cerrar sesión</button>
      </div>

      <div className="flex flex-col gap-8">

        {/* ── Negocio ── */}
        <section>
          <h2 className="text-xs text-muted uppercase tracking-widest mb-4">Negocio</h2>
          <div className="flex flex-col gap-4 bg-bg-card border border-border rounded-2xl p-5">

            {/* Logo */}
            <div>
              <p className="text-sm text-muted mb-2">Logo del negocio</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-border bg-bg-input flex items-center justify-center overflow-hidden shrink-0">
                  {config.logo_url ? (
                    <img src={config.logo_url} alt="logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl">✂️</span>
                  )}
                </div>
                <div>
                  <button onClick={() => fileRef.current?.click()} disabled={logoUploading}
                    className="text-sm text-gold border border-gold/40 rounded-lg px-4 py-2 hover:bg-gold/10 transition-colors disabled:opacity-50">
                    {logoUploading ? 'Subiendo...' : 'Subir logo'}
                  </button>
                  {config.logo_url && (
                    <button onClick={() => setConfig(p => ({ ...p, logo_url: null }))}
                      className="ml-2 text-xs text-muted hover:text-red-400 transition-colors">
                      Eliminar
                    </button>
                  )}
                  <p className="text-xs text-muted mt-1">PNG o JPG · Recomendado 256×256</p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                </div>
              </div>
            </div>

            {/* Business name */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Nombre del negocio</label>
              <input value={config.business_name} onChange={e => setConfig(p => ({ ...p, business_name: e.target.value }))}
                placeholder="Mi Barbería" className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold" />
              <p className="text-xs text-muted mt-1">Aparece en el portal de reservas</p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm text-muted mb-1.5">Dirección</label>
              <input value={config.business_address} onChange={e => setConfig(p => ({ ...p, business_address: e.target.value }))}
                placeholder="Calle Ejemplo 1, Betanzos" className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold" />
            </div>
          </div>
        </section>

        {/* ── Datos personales ── */}
        <section>
          <h2 className="text-xs text-muted uppercase tracking-widest mb-4">Datos personales</h2>
          <div className="flex flex-col gap-4 bg-bg-card border border-border rounded-2xl p-5">
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input type="email" value={config.owner_email} onChange={e => setConfig(p => ({ ...p, owner_email: e.target.value }))}
                placeholder="barbero@email.com" className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Teléfono (para SMS de alarma nocturna)</label>
              <input type="tel" value={config.barber_phone} onChange={e => setConfig(p => ({ ...p, barber_phone: e.target.value }))}
                placeholder="+34600000000" className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold" />
            </div>
          </div>
        </section>

        {/* ── Notificaciones ── */}
        <section>
          <h2 className="text-xs text-muted uppercase tracking-widest mb-4">Notificaciones</h2>
          <div className="bg-bg-card border border-border rounded-2xl p-5">
            {!('Notification' in window) ? (
              <p className="text-muted text-sm">Tu navegador no soporta notificaciones</p>
            ) : notifPermission === 'granted' ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
                <p className="text-cream text-sm">Notificaciones activas — recibirás avisos de nuevas citas en este dispositivo</p>
              </div>
            ) : notifPermission === 'denied' ? (
              <p className="text-muted text-sm">Notificaciones bloqueadas en el navegador. Actívalas desde la configuración del sitio.</p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-cream text-sm">Activa las notificaciones para recibir avisos de nuevas citas</p>
                <button onClick={requestNotif}
                  className="ml-4 shrink-0 bg-gold hover:bg-gold-dark text-bg text-sm font-semibold rounded-lg px-4 py-2 transition-colors">
                  Activar
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Alarma nocturna ── */}
        <section>
          <h2 className="text-xs text-muted uppercase tracking-widest mb-4">Alarma nocturna</h2>
          <div className="flex flex-col gap-4 bg-bg-card border border-border rounded-2xl p-5">
            <div>
              <p className="text-sm text-muted mb-2">Minutos de margen antes de la primera cita del día siguiente</p>
              <div className="flex gap-2 flex-wrap">
                {[30, 45, 60, 90, 120].map(m => (
                  <button key={m} onClick={() => setConfig(p => ({ ...p, alarm_margin_minutes: m }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      config.alarm_margin_minutes === m ? 'border-gold bg-gold/10 text-gold' : 'border-border text-cream hover:border-gold/50'
                    }`}>
                    {m} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Mensaje de retraso al cliente</label>
              <textarea value={config.delay_message_template} onChange={e => setConfig(p => ({ ...p, delay_message_template: e.target.value }))}
                rows={3} className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold resize-none text-sm" />
              <p className="text-xs text-muted mt-1">
                Variables: <code className="text-gold">{'{nombre}'}</code> <code className="text-gold">{'{minutos}'}</code> <code className="text-gold">{'{hora_nueva}'}</code>
              </p>
            </div>
          </div>
        </section>

        {/* Save all */}
        <button onClick={save} disabled={saving}
          className="bg-gold hover:bg-gold-dark text-bg font-semibold rounded-xl py-4 transition-colors disabled:opacity-50 text-base">
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {/* ── Contraseña ── */}
        <section>
          <h2 className="text-xs text-muted uppercase tracking-widest mb-4">Cambiar contraseña de acceso</h2>
          <div className="flex flex-col gap-4 bg-bg-card border border-border rounded-2xl p-5">
            <div>
              <label className="block text-sm text-muted mb-1.5">Nueva contraseña</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres" className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Confirmar contraseña</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña" className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-cream placeholder-muted focus:outline-none focus:border-gold" />
            </div>
            {passError && <p className="text-red-400 text-sm">{passError}</p>}
            <button onClick={changePassword}
              className="border border-border hover:border-gold text-cream rounded-xl py-3 text-sm transition-colors">
              {passSaved ? '✓ Contraseña actualizada' : 'Cambiar contraseña'}
            </button>
          </div>
        </section>

      </div>
    </main>
  )
}
