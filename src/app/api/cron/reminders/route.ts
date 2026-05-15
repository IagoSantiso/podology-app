import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import { sendReminderEmailFirst, sendReminderEmailSecond } from '@/lib/resend'

// This endpoint is called by Vercel Cron every 10 minutes.
// It checks for appointments that need reminder emails and sends them.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseAdmin()

  const { data: cfg } = await supabase
    .from('barber_config')
    .select('reminder_first_hours, reminder_second_hours, reschedule_cutoff_hours, business_name, business_address')
    .eq('id', 1)
    .maybeSingle()

  const firstHours = cfg?.reminder_first_hours ?? 12
  const secondHours = cfg?.reminder_second_hours ?? 2
  const cutoffHours = cfg?.reschedule_cutoff_hours ?? 2

  // Fetch all confirmed appointments in the next 50 hours that still need reminders
  const now = new Date()
  const windowEnd = new Date(now.getTime() + 50 * 60 * 60 * 1000)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, services(name, price)')
    .eq('status', 'confirmed')
    .or('reminder_first_sent.eq.false,reminder_second_sent.eq.false')
    .lte('appointment_date', windowEnd.toISOString().slice(0, 10))

  if (!appointments?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  const BUFFER_MINUTES = 12 // cron fires every 10 min, 12 min buffer handles drift

  for (const apt of appointments) {
    const aptDatetime = new Date(`${apt.appointment_date}T${apt.start_time}`)
    const msUntil = aptDatetime.getTime() - now.getTime()
    const minutesUntil = msUntil / (1000 * 60)
    const hoursUntil = minutesUntil / 60

    const emailData = {
      clientName: apt.client_name,
      clientEmail: apt.client_email,
      serviceName: apt.services?.name ?? '',
      appointmentDate: apt.appointment_date,
      startTime: apt.start_time,
      price: apt.services?.price ?? null,
      appointmentId: apt.id,
      rescheduleToken: apt.reschedule_token ?? '',
      isGuest: apt.is_guest,
      businessName: cfg?.business_name ?? 'BarberApp',
      businessAddress: cfg?.business_address ?? '',
    }

    // First reminder: appointment is ~firstHours away
    if (
      !apt.reminder_first_sent &&
      minutesUntil <= firstHours * 60 + BUFFER_MINUTES &&
      minutesUntil > secondHours * 60
    ) {
      try {
        // Only show reschedule button if still within cutoff window
        const canReschedule = hoursUntil >= cutoffHours
        if (canReschedule) {
          await sendReminderEmailFirst(emailData)
        } else {
          await sendReminderEmailSecond(emailData)
        }
        await supabase.from('appointments').update({ reminder_first_sent: true }).eq('id', apt.id)
        sent++
      } catch (err) {
        console.error(`Error sending first reminder for ${apt.id}:`, err)
      }
    }

    // Second reminder: appointment is ~secondHours away
    if (
      !apt.reminder_second_sent &&
      minutesUntil <= secondHours * 60 + BUFFER_MINUTES &&
      minutesUntil > 0
    ) {
      try {
        await sendReminderEmailSecond(emailData)
        await supabase.from('appointments').update({ reminder_second_sent: true }).eq('id', apt.id)
        sent++
      } catch (err) {
        console.error(`Error sending second reminder for ${apt.id}:`, err)
      }
    }
  }

  return NextResponse.json({ ok: true, sent, checked: appointments.length })
}
