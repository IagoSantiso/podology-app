import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const from = process.env.TWILIO_FROM_NUMBER!

export async function sendSMS(to: string, body: string) {
  return client.messages.create({ from, to, body })
}

export async function sendWhatsApp(to: string, body: string) {
  const whatsappFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
  const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  return client.messages.create({ from: whatsappFrom, to: whatsappTo, body })
}
