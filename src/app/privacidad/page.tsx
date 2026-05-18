import { createSupabaseAdmin } from '@/lib/supabase-server'

export default async function PrivacidadPage() {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('barber_config')
    .select('business_name, owner_name, nif, address, contact_email, data_retention_years')
    .eq('id', 1)
    .maybeSingle()

  const c = {
    business_name: data?.business_name ?? '',
    owner_name: data?.owner_name ?? '',
    nif: data?.nif ?? '',
    address: data?.address ?? '',
    contact_email: data?.contact_email ?? '',
    data_retention_years: data?.data_retention_years ?? 3,
  }

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-cream">
      <h1 className="font-display text-3xl font-bold text-cream mb-2">Política de privacidad</h1>
      <p className="text-xs text-muted mb-10">Última actualización: {fechaActual}</p>

      <Section title="1. Responsable del tratamiento">
        <p>
          En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de
          abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento
          de datos personales (en adelante, RGPD), y de la Ley Orgánica 3/2018, de 5 de diciembre, de
          Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos
          que el responsable del tratamiento de sus datos personales es:
        </p>
        <ul className="mt-3 space-y-1 not-italic">
          <li>Razón social: {c.business_name}</li>
          <li>Titular: {c.owner_name}</li>
          <li>NIF/NIE: {c.nif}</li>
          <li>Domicilio: {c.address}</li>
          <li>Correo electrónico de contacto: {c.contact_email}</li>
        </ul>
      </Section>

      <Section title="2. Datos personales que tratamos">
        <p>
          Con ocasión de la utilización de nuestra plataforma de reservas online, {c.business_name} podrá
          tratar las siguientes categorías de datos personales:
        </p>
        <ul className="mt-3 space-y-1 list-none">
          <li>— Datos identificativos: nombre y apellidos.</li>
          <li>— Datos de contacto: dirección de correo electrónico y número de teléfono.</li>
          <li>
            — Datos de la prestación del servicio: fecha y hora de la cita, tipo de servicio solicitado e
            historial de visitas cuando el usuario dispone de cuenta registrada.
          </li>
        </ul>
        <p className="mt-3">
          No se tratan datos especialmente protegidos en el sentido del artículo 9 del RGPD.
        </p>
      </Section>

      <Section title="3. Finalidad del tratamiento">
        <p>Los datos personales facilitados a través del formulario de reserva serán tratados con las siguientes finalidades:</p>
        <div className="mt-3 space-y-3">
          <p>
            <strong className="text-cream">a) Gestión de la reserva:</strong> tramitar, confirmar y gestionar la cita
            solicitada, incluyendo el envío de comunicaciones de confirmación, recordatorios y, en su caso, avisos
            de modificación o cancelación.
          </p>
          <p>
            <strong className="text-cream">b) Historial de servicios:</strong> cuando el usuario dispone de cuenta
            registrada, conservar un registro de los servicios recibidos con el fin de facilitar futuras reservas
            y mejorar la atención personalizada.
          </p>
          <p>
            <strong className="text-cream">c) Comunicaciones operativas:</strong> envío de notificaciones relacionadas
            exclusivamente con el estado de la reserva (confirmación, cambio de horario, cancelación). En ningún caso
            se realizarán comunicaciones comerciales sin consentimiento expreso e independiente.
          </p>
        </div>
      </Section>

      <Section title="4. Base jurídica del tratamiento">
        <p>El tratamiento de sus datos se fundamenta en las siguientes bases jurídicas previstas en el artículo 6 del RGPD:</p>
        <ul className="mt-3 space-y-2 list-none">
          <li>
            — <strong className="text-cream">Ejecución de una relación contractual o precontractual (art. 6.1.b):</strong>{' '}
            el tratamiento es necesario para gestionar la reserva solicitada por el interesado.
          </li>
          <li>
            — <strong className="text-cream">Consentimiento del interesado (art. 6.1.a):</strong> para el tratamiento
            del historial de servicios en cuentas registradas, obtenido mediante aceptación expresa en el momento
            del registro.
          </li>
        </ul>
      </Section>

      <Section title="5. Plazo de conservación">
        <p>
          Los datos personales serán conservados durante el tiempo necesario para la prestación del servicio y, una
          vez finalizada la relación, durante un período de {c.data_retention_years}{' '}
          {c.data_retention_years === 1 ? 'año' : 'años'}, con el fin de atender posibles responsabilidades derivadas
          del tratamiento. Transcurrido dicho plazo, los datos serán suprimidos o, en su caso, anonimizados de forma
          irreversible.
        </p>
        <p className="mt-3">
          Los datos de reservas realizadas como invitado (sin cuenta registrada) serán eliminados en el mismo plazo
          desde la fecha de la última cita.
        </p>
      </Section>

      <Section title="6. Cesión de datos a terceros">
        <p>{c.business_name} no cederá sus datos personales a terceros, salvo en los siguientes supuestos:</p>
        <ul className="mt-3 space-y-2 list-none">
          <li>
            — Proveedores tecnológicos que actúan como encargados del tratamiento y que acceden a los datos
            exclusivamente para la prestación de los servicios contratados, bajo contrato de encargo de tratamiento
            y con las garantías exigidas por la normativa aplicable. Entre estos proveedores se encuentran los
            servicios de alojamiento en la nube y envío de comunicaciones electrónicas.
          </li>
          <li>— Cuando sea exigido por obligación legal o requerimiento de autoridad competente.</li>
        </ul>
        <p className="mt-3">
          En ningún caso sus datos serán vendidos, alquilados ni cedidos con fines comerciales a terceros.
        </p>
      </Section>

      <Section title="7. Derechos de los interesados">
        <p>De conformidad con lo establecido en los artículos 15 a 22 del RGPD, usted tiene derecho a:</p>
        <ul className="mt-3 space-y-1 list-none">
          <li>— <strong className="text-cream">Acceso:</strong> obtener confirmación sobre si se están tratando sus datos y, en su caso, acceder a los mismos.</li>
          <li>— <strong className="text-cream">Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.</li>
          <li>— <strong className="text-cream">Supresión:</strong> solicitar la eliminación de sus datos cuando, entre otros motivos, ya no sean necesarios para los fines para los que fueron recogidos.</li>
          <li>— <strong className="text-cream">Oposición:</strong> oponerse al tratamiento de sus datos en determinadas circunstancias.</li>
          <li>— <strong className="text-cream">Limitación del tratamiento:</strong> solicitar la suspensión del tratamiento en los supuestos previstos en la normativa.</li>
          <li>— <strong className="text-cream">Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso común.</li>
        </ul>
        <p className="mt-3">
          Para ejercer cualquiera de estos derechos, puede dirigirse por escrito a {c.contact_email}, indicando el
          derecho que desea ejercer y adjuntando copia de su documento de identidad. Le responderemos en el plazo
          máximo de un mes desde la recepción de su solicitud.
        </p>
        <p className="mt-3">
          Si considera que el tratamiento de sus datos no se ajusta a la normativa vigente, puede presentar una
          reclamación ante la Agencia Española de Protección de Datos, a través de su sede electrónica
          en www.aepd.es.
        </p>
      </Section>

      <Section title="8. Medidas de seguridad">
        <p>
          {c.business_name} ha adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad
          de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado, habida cuenta
          del estado de la tecnología, la naturaleza de los datos almacenados y los riesgos a que están expuestos.
        </p>
      </Section>

      <Section title="9. Modificaciones de la política de privacidad">
        <p>
          {c.business_name} se reserva el derecho a modificar la presente política de privacidad para adaptarla a
          cambios normativos o jurisprudenciales. En todo caso, se comunicará a los usuarios cualquier modificación
          relevante con antelación razonable a su entrada en vigor.
        </p>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold tracking-widest uppercase text-gold mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed space-y-2">{children}</div>
    </section>
  )
}