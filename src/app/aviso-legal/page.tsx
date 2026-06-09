import { createSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export default async function AvisoLegalPage() {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('podologist_config')
    .select('business_name, owner_name, nif, address, contact_email')
    .eq('id', 1)
    .maybeSingle()

  const c = {
    business_name: data?.business_name ?? '',
    owner_name: data?.owner_name ?? '',
    nif: data?.nif ?? '',
    address: data?.address ?? '',
    contact_email: data?.contact_email ?? '',
  }

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-cream">
      <h1 className="font-display text-3xl font-bold text-cream mb-2">Aviso legal</h1>
      <p className="text-xs text-muted mb-10">Última actualización: {fechaActual}</p>

      <Section title="1. Identificación del titular">
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de
          la Información y de Comercio Electrónico (LSSI-CE), se informa que el titular de la presente
          aplicación es:
        </p>
        <ul className="mt-3 space-y-1 list-none">
          <li>Denominación comercial: {c.business_name}</li>
          <li>Titular: {c.owner_name}</li>
          <li>NIF/NIE: {c.nif}</li>
          <li>Domicilio: {c.address}</li>
          <li>Correo electrónico: {c.contact_email}</li>
        </ul>
      </Section>

      <Section title="2. Objeto y ámbito de aplicación">
        <p>
          El presente Aviso Legal regula el acceso y uso de la aplicación de reservas online
          de {c.business_name} (en adelante, &ldquo;la Aplicación&rdquo;), cuya finalidad es permitir a los
          usuarios solicitar y gestionar citas para los servicios de podología ofrecidos por
          el titular.
        </p>
        <p>
          El acceso a la Aplicación implica la aceptación plena y sin reservas de las condiciones
          establecidas en el presente Aviso Legal, en la Política de Privacidad y, en su caso, en las
          Condiciones Particulares que pudieran resultar de aplicación. El titular se reserva el derecho a
          modificar unilateralmente dichas condiciones, sin que ello pueda afectar a los servicios ya
          contratados o en curso.
        </p>
      </Section>

      <Section title="3. Condiciones de uso">
        <p>
          El usuario se compromete a hacer un uso adecuado de la Aplicación y a no emplearla para realizar
          actividades ilícitas o contrarias a la buena fe, al orden público o a las presentes condiciones.
          En particular, queda prohibido:
        </p>
        <ul className="mt-3 space-y-1 list-none">
          <li>— Utilizar la Aplicación con fines fraudulentos o para la realización de reservas falsas o sin intención real de hacer uso del servicio.</li>
          <li>— Intentar acceder a áreas restringidas de la Aplicación sin autorización.</li>
          <li>— Introducir datos de carácter personal de terceros sin su consentimiento.</li>
          <li>— Realizar cualquier acción que pueda dañar, inutilizar o sobrecargar la Aplicación o impedir su normal funcionamiento.</li>
        </ul>
        <p className="mt-3">
          El titular se reserva el derecho a cancelar reservas o bloquear el acceso a usuarios que
          incumplan las presentes condiciones, sin perjuicio del ejercicio de las acciones legales que
          pudieran corresponder.
        </p>
      </Section>

      <Section title="4. Propiedad intelectual e industrial">
        <p>
          El diseño, estructura, código fuente, logotipos, textos, gráficos, imágenes y demás elementos
          que integran la Aplicación son propiedad del titular o de sus proveedores tecnológicos, y están
          protegidos por la legislación española e internacional sobre propiedad intelectual e industrial.
        </p>
        <p>
          Queda expresamente prohibida la reproducción, distribución, comunicación pública, transformación
          o cualquier otra forma de explotación, total o parcial, de los contenidos de la Aplicación sin
          autorización expresa y por escrito del titular. El incumplimiento de esta prohibición podrá dar
          lugar al ejercicio de las acciones legales correspondientes.
        </p>
      </Section>

      <Section title="5. Exclusión de responsabilidad">
        <div className="space-y-4">
          <div>
            <p className="font-medium text-cream mb-1">5.1 Disponibilidad del servicio</p>
            <p>
              {c.business_name} no garantiza la disponibilidad y continuidad ininterrumpida del
              funcionamiento de la Aplicación. Cuando ello sea razonablemente posible, el titular advertirá
              previamente de las interrupciones en el funcionamiento. {c.business_name} tampoco garantiza
              la utilidad de la Aplicación para la realización de ninguna actividad en concreto, ni su
              infalibilidad.
            </p>
          </div>
          <div>
            <p className="font-medium text-cream mb-1">5.2 Contenidos de terceros</p>
            <p>
              La Aplicación puede contener enlaces a sitios web de terceros. {c.business_name} no asume
              ninguna responsabilidad derivada de la existencia de dichos enlaces ni del contenido de las
              páginas enlazadas, siendo el usuario el único responsable de acceder a las mismas.
            </p>
          </div>
          <div>
            <p className="font-medium text-cream mb-1">5.3 Fuerza mayor</p>
            <p>
              {c.business_name} no será responsable por retrasos o incumplimientos causados por
              circunstancias fuera de su control razonable, incluyendo fallos de suministro eléctrico,
              fallos de telecomunicaciones, desastres naturales u otras causas de fuerza mayor.
            </p>
          </div>
        </div>
      </Section>

      <Section title="6. Política de cancelaciones">
        <p>
          Las reservas realizadas a través de la Aplicación podrán cancelarse por el usuario a través del
          enlace habilitado en el correo electrónico de confirmación. Se recomienda comunicar cualquier
          cancelación con la mayor antelación posible para permitir la reasignación del hueco a otros
          clientes.
        </p>
        <p>
          {c.business_name} se reserva el derecho a cancelar o modificar citas en circunstancias
          excepcionales debidamente justificadas, notificándolo al usuario mediante los datos de contacto
          proporcionados en el momento de la reserva.
        </p>
      </Section>

      <Section title="7. Legislación aplicable y jurisdicción">
        <p>
          El presente Aviso Legal se rige en su integridad por la legislación española, siendo de
          aplicación, entre otras, la Ley 34/2002 de Servicios de la Sociedad de la Información, el Real
          Decreto Legislativo 1/2007 por el que se aprueba el Texto Refundido de la Ley General para la
          Defensa de los Consumidores y Usuarios, y el Reglamento (UE) 2016/679 en materia de protección
          de datos.
        </p>
        <p>
          Para la resolución de cualquier controversia derivada del acceso o uso de la Aplicación, las
          partes se someten expresamente a los Juzgados y Tribunales del domicilio del titular indicado
          en el apartado 1 del presente Aviso Legal, con renuncia expresa a cualquier otro fuero que
          pudiera corresponderles.
        </p>
      </Section>

      <Section title="8. Contacto">
        <p>
          Para cualquier consulta relacionada con el presente Aviso Legal, puede dirigirse al titular a
          través de la siguiente dirección de correo electrónico: {c.contact_email}
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