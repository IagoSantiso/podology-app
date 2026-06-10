import { createSupabaseAdmin } from './supabase-server'
import { format, parse, addMinutes, isBefore, isToday } from 'date-fns'

export async function getAvailableSlots(date: Date, durationMinutes: number, excludeAppointmentId?: string): Promise<string[]> {
  const supabase = createSupabaseAdmin()
  const dayOfWeek = date.getDay()
  const dateStr = format(date, 'yyyy-MM-dd')

  // 1. Disponibilidad del día de la semana
  const { data: avail } = await supabase
    .from('availability')
    .select('start_time, end_time, break_start, break_end')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single()

  if (!avail) return []

  // 2. Comprobar si el día cae dentro de un rango de vacaciones
  const { data: vacations } = await supabase
    .from('vacations')
    .select('start_date, end_date')
    .lte('start_date', dateStr)
    .gte('end_date', dateStr)

  if (vacations && vacations.length > 0) return []

  // 3. Citas existentes ese día
  let appointmentsQuery = supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('appointment_date', dateStr)
    .neq('status', 'cancelled')

  if (excludeAppointmentId) {
    appointmentsQuery = appointmentsQuery.neq('id', excludeAppointmentId)
  }

  const { data: appointments } = await appointmentsQuery

  // 4. Bloqueos puntuales ese día
  const { data: blocks } = await supabase
    .from('blocked_slots')
    .select('start_time, end_time')
    .eq('blocked_date', dateStr)

  const fullDayBlock = blocks?.some(b => !b.start_time && !b.end_time)
  if (fullDayBlock) return []

  // 5. Generar slots de 15 min dentro del rango laboral
  const slots: string[] = []
  const workStart = parse(avail.start_time, 'HH:mm:ss', date)
  const workEnd = parse(avail.end_time, 'HH:mm:ss', date)
  let current = workStart

  while (isBefore(addMinutes(current, durationMinutes), workEnd) || +addMinutes(current, durationMinutes) === +workEnd) {
    const slotEnd = addMinutes(current, durationMinutes)

    const occupiedByAppointment = appointments?.some(apt => {
      const aptStart = parse(apt.start_time, 'HH:mm:ss', date)
      const aptEnd = parse(apt.end_time, 'HH:mm:ss', date)
      return isBefore(current, aptEnd) && isBefore(aptStart, slotEnd)
    })

    const occupiedByBlock = blocks?.some(b => {
      if (!b.start_time || !b.end_time) return false
      const blockStart = parse(b.start_time, 'HH:mm:ss', date)
      const blockEnd = parse(b.end_time, 'HH:mm:ss', date)
      return isBefore(current, blockEnd) && isBefore(blockStart, slotEnd)
    })

    const occupiedByBreak = avail.break_start && avail.break_end
      ? (() => {
          const breakStart = parse(avail.break_start, 'HH:mm:ss', date)
          const breakEnd   = parse(avail.break_end,   'HH:mm:ss', date)
          return isBefore(current, breakEnd) && isBefore(breakStart, slotEnd)
        })()
      : false

    const isPast = isToday(date) && isBefore(current, new Date())

    if (!occupiedByAppointment && !occupiedByBlock && !occupiedByBreak && !isPast) {
      slots.push(format(current, 'HH:mm'))
    }

    current = addMinutes(current, 15)
  }

  return slots
}
