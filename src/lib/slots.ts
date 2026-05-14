import { createSupabaseAdmin } from './supabase-server'
import { format, parse, addMinutes, isBefore, isToday } from 'date-fns'

export async function getAvailableSlots(date: Date, durationMinutes: number): Promise<string[]> {
  const supabase = createSupabaseAdmin()
  const dayOfWeek = date.getDay()
  const dateStr = format(date, 'yyyy-MM-dd')

  // 1. Disponibilidad del día de la semana
  const { data: avail } = await supabase
    .from('availability')
    .select('start_time, end_time')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single()

  if (!avail) return []

  // 2. Citas existentes ese día
  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('appointment_date', dateStr)
    .neq('status', 'cancelled')

  // 3. Bloqueos puntuales ese día
  const { data: blocks } = await supabase
    .from('blocked_slots')
    .select('start_time, end_time')
    .eq('blocked_date', dateStr)

  // Comprobar si el día entero está bloqueado
  const fullDayBlock = blocks?.some(b => !b.start_time && !b.end_time)
  if (fullDayBlock) return []

  // 4. Generar slots de 30 min dentro del rango laboral
  const slots: string[] = []
  const workStart = parse(avail.start_time, 'HH:mm:ss', date)
  const workEnd = parse(avail.end_time, 'HH:mm:ss', date)
  let current = workStart

  while (isBefore(addMinutes(current, durationMinutes), workEnd) || +addMinutes(current, durationMinutes) === +workEnd) {
    const slotStr = format(current, 'HH:mm')
    const slotEnd = addMinutes(current, durationMinutes)

    // 5. Filtrar slots ocupados por citas
    const occupiedByAppointment = appointments?.some(apt => {
      const aptStart = parse(apt.start_time, 'HH:mm:ss', date)
      const aptEnd = parse(apt.end_time, 'HH:mm:ss', date)
      return isBefore(current, aptEnd) && isBefore(aptStart, slotEnd)
    })

    // 6. Filtrar slots bloqueados
    const occupiedByBlock = blocks?.some(b => {
      if (!b.start_time || !b.end_time) return false
      const blockStart = parse(b.start_time, 'HH:mm:ss', date)
      const blockEnd = parse(b.end_time, 'HH:mm:ss', date)
      return isBefore(current, blockEnd) && isBefore(blockStart, slotEnd)
    })

    // 7. Filtrar slots pasados si es hoy
    const isPast = isToday(date) && isBefore(current, new Date())

    if (!occupiedByAppointment && !occupiedByBlock && !isPast) {
      slots.push(slotStr)
    }

    current = addMinutes(current, 30)
  }

  return slots
}
