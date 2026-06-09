'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase-client'
import styles from './display.module.css'

interface AppointmentRow {
  id: string
  client_name: string
  client_phone: string
  appointment_date: string
  start_time: string
  service_id: string | null
}

const ALERT_SECONDS = 60 * 60
const ALERT_AUTO_HIDE_MS = 3 * 60 * 1000
const BLINK_THRESHOLD = 60

export default function DisplayPage() {
  const [appointment, setAppointment] = useState<AppointmentRow | null>(null)
  const [servicesMap, setServicesMap] = useState<Map<string, string>>(new Map())
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [showButtons, setShowButtons] = useState(false)
  const [showDelaySelector, setShowDelaySelector] = useState(false)
  const [delayStep, setDelayStep] = useState(0)
  const [messageSent, setMessageSent] = useState(false)
  const [sending, setSending] = useState(false)

  const supabase = useRef(createSupabaseClient())
  const shownButtonsForRef = useRef<string | null>(null)
  const notifiedIdRef = useRef<string | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getSecondsUntil = useCallback((apt: AppointmentRow): number => {
    const target = new Date(`${apt.appointment_date}T${apt.start_time.split('.')[0]}`)
    return Math.floor((target.getTime() - Date.now()) / 1000)
  }, [])

  const formatMinutes = (secs: number): string => String(Math.ceil(secs / 60))

  const formatHHMM = (timeStr: string): string => {
    const [h, m] = timeStr.split(':')
    return `${h}:${m}`
  }

  const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0]

  // minutes for the current delay step: step 0 → [15,20,25], step 1 → [30,35,40], etc.
  const delayOptions = (): number[] => {
    const base = 15 + delayStep * 15
    return [base, base + 5, base + 10]
  }

  // ── Load services map once ────────────────────────────────────────────────

  useEffect(() => {
    supabase.current
      .from('services')
      .select('id, name')
      .then(({ data }) => {
        if (data) setServicesMap(new Map(data.map(s => [s.id as string, s.name as string])))
      })
  }, [])

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchNext = useCallback(async () => {
    const sb = supabase.current
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const nowTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    const sel = 'id, client_name, client_phone, appointment_date, start_time, service_id'

    const { data: todayData } = await sb
      .from('appointments')
      .select(sel)
      .neq('status', 'cancelled')
      .neq('status', 'completed')
      .eq('appointment_date', todayStr)
      .gt('start_time', nowTimeStr)
      .order('start_time', { ascending: true })
      .limit(1)

    if (todayData && todayData.length > 0) {
      setAppointment(todayData[0] as AppointmentRow)
      return
    }

    const { data: futureData } = await sb
      .from('appointments')
      .select(sel)
      .neq('status', 'cancelled')
      .neq('status', 'completed')
      .gt('appointment_date', todayStr)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(1)

    setAppointment((futureData?.[0] as AppointmentRow) ?? null)
  }, [])

  // ── Supabase Realtime ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchNext()
    const channel = supabase.current
      .channel('display-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchNext()
      })
      .subscribe()
    return () => { supabase.current.removeChannel(channel) }
  }, [fetchNext])

  // ── Countdown ticker ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!appointment) return

    const tick = () => {
      const secs = getSecondsUntil(appointment)
      if (secs <= 0) { fetchNext(); return }
      setSecondsLeft(secs)

      if (
        secs <= ALERT_SECONDS &&
        shownButtonsForRef.current !== appointment.id &&
        notifiedIdRef.current !== appointment.id &&
        appointment.client_phone?.trim()
      ) {
        shownButtonsForRef.current = appointment.id
        setShowButtons(true)
        setShowDelaySelector(false)
        setDelayStep(0)
        setMessageSent(false)
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => setShowButtons(false), ALERT_AUTO_HIDE_MS)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => {
      clearInterval(interval)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [appointment, getSecondsUntil, fetchNext])

  // ── Dismiss helper ────────────────────────────────────────────────────────

  const dismissAfterSent = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
      setShowButtons(false)
      setMessageSent(false)
      setShowDelaySelector(false)
      setDelayStep(0)
    }, 3000)
  }

  // ── Delay notification (uses configured template from podologist_config) ────

  const handleDelaySelect = async (delayMinutes: number) => {
    if (!appointment || sending) return
    setSending(true)
    try {
      await fetch('/api/delay-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id, delayMinutes }),
      })
      notifiedIdRef.current = appointment.id
      setMessageSent(true)
      dismissAfterSent()
    } finally {
      setSending(false)
    }
  }

  // ── On-time notification ──────────────────────────────────────────────────

  const handleOnTime = async () => {
    if (!appointment || sending) return
    setSending(true)
    try {
      await fetch('/api/display/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ontime',
          clientName: appointment.client_name,
          clientPhone: appointment.client_phone,
          appointmentTime: formatHHMM(appointment.start_time),
        }),
      })
      notifiedIdRef.current = appointment.id
      setMessageSent(true)
      dismissAfterSent()
    } finally {
      setSending(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isBlinking = secondsLeft > 0 && secondsLeft < BLINK_THRESHOLD
  const serviceName = appointment?.service_id
    ? (servicesMap.get(appointment.service_id) ?? '')
    : ''

  return (
    <div className={styles.container}>
      <div className={styles.inner}>

        <div className={styles.countdownSection}>
          <div className={`${styles.digits} ${isBlinking ? styles.blink : ''}`}>
            {secondsLeft > 0 ? formatMinutes(secondsLeft) : '0'}
          </div>
        </div>

        {appointment && (
          <div className={styles.infoSection}>
            <div className={styles.infoLine}>
              {firstName(appointment.client_name)}
              {serviceName ? `, ${serviceName.toLowerCase()}` : ''}
              {`, ${formatHHMM(appointment.start_time)}`}
            </div>
          </div>
        )}
      </div>

      {/* Alert zone */}
      {showButtons && appointment && (
        <div className={styles.buttonsSection}>
          {messageSent ? (
            <div className={styles.confirmation}>Mensaje enviado</div>

          ) : showDelaySelector ? (
            /* ── Delay time selector ── */
            <div className={styles.delaySelector}>
              {delayOptions().map(mins => (
                <button
                  key={mins}
                  className={styles.btnDelayMin}
                  onClick={() => handleDelaySelect(mins)}
                  disabled={sending}
                >
                  {mins} min
                </button>
              ))}
              <button
                className={styles.btnDelayMore}
                onClick={() => setDelayStep(s => s + 1)}
                disabled={sending}
              >
                +
              </button>
            </div>

          ) : (
            /* ── Main alert buttons ── */
            <>
              <button
                className={styles.btnDelay}
                onClick={() => setShowDelaySelector(true)}
                disabled={sending}
              >
                Avisar retraso
              </button>
              <button
                className={styles.btnOntime}
                onClick={handleOnTime}
                disabled={sending}
              >
                Va en tiempo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
