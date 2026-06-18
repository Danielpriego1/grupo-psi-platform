import { SEO } from "@/components/SEO";

export default function PrivacidadGlobal() {
  return (
    <>
      <SEO
        title="Política de Privacidad Global | Grupo Psi"
        description="Política de privacidad global de Grupo Psi para usuarios internacionales. Conoce tus derechos y cómo tratamos tus datos."
        path="/privacidad-global"
      />
      <main className="container mx-auto px-6 py-12 max-w-3xl prose prose-invert">
        <h1>Política de Privacidad Global</h1>
        <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-MX")}</p>

        <h2>1. Introducción</h2>
        <p>Grupo Psi (&ldquo;nosotros&rdquo;, &ldquo;nuestro&rdquo;) opera desde México y ofrece servicios a clientes nacionales e internacionales. Esta Política de Privacidad Global complementa nuestro <a href="/privacidad">Aviso de Privacidad</a> para usuarios Mexicanos y establece las bases aplicables a visitantes y clientes de cualquier país.</p>

        <h2>2. Responsable del tratamiento</h2>
        <p><strong>Grupo Psi</strong><br />
        Domicilio: Nacajuca, Tabasco, México<br />
        Email: <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a><br />
        Teléfono: +52 1 993 168 4717</p>

        <h2>3. Datos que recopilamos</h2>
        <p>Recopilamos únicamente los datos necesarios para prestar nuestros servicios:</p>
        <ul>
          <li><strong>Datos de contacto:</strong> nombre completo, correo electrónico, número telefónico, empresa y dirección de envío o facturación.</li>
          <li><strong>Datos de autenticación:</strong> credenciales cifradas y, en caso de inicio de sesión con Google o Apple, el identificador público verificado por dichos proveedores.</li>
          <li><strong>Datos operativos:</strong> historial de órdenes, equipos registrados, certificados solicitados, citas agendadas y mantenimientos contratados.</li>
          <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, idioma preferido, cookies de sesión e identificadores de dispositivo.</li>
        </ul>

        <h2>4. Base legal del tratamiento</h2>
        <p>Tratamos tus datos personales con base en:</p>
        <ul>
          <li><strong>Ejecución de contrato:</strong> para procesar tus pedidos, servicios de mantenimiento y emisión de certificados.</li>
          <li><strong>Consentimiento:</strong> para comunicaciones de marketing, cookies no esenciales y uso de datos de localización.</li>
          <li><strong>Obligación legal:</strong> para cumplir con requisitos fiscales, regulatorios y de seguridad industrial.</li>
          <li><strong>Interés legítimo:</strong> para prevención de fraude, seguridad de la plataforma y mejora continua del servicio.</li>
        </ul>

        <h2>5. Transferencias internacionales</h2>
        <p>Utilizamos proveedores de servicios ubicados en distintas jurisdicciones, entre ellos:</p>
        <ul>
          <li><strong>Estados Unidos:</strong> procesamiento de pagos (Stripe), autenticación (Lovable Cloud / Supabase Auth) y envío de correos electrónicos.</li>
          <li><strong>Irlanda y otros países de la UE:</strong> servicios de infraestructura cloud cuando apliquen.</li>
        </ul>
        <p>Todas las transferencias se realizan con salvaguardas contractuales apropiadas (Cláusulas Contractuales Tipo de la Comisión Europea o equivalentes) y únicamente con proveedores que mantengan estándares de seguridad compatibles con esta política.</p>

        <h2>6. Tus derechos</h2>
        <p>Dependiendo de tu jurisdicción, puedes ejercer los siguientes derechos:</p>
        <ul>
          <li><strong>Acceso:</strong> solicitar una copia de los datos personales que tenemos sobre ti.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados.</li>
          <li><strong>Supresión (&ldquo;derecho al olvido&rdquo;):</strong> solicitar la eliminación de tus datos, salvo obligaciones legales de retención.</li>
          <li><strong>Oposición y limitación:</strong> oponerte al tratamiento o solicitar que limitemos su uso en determinadas circunstancias.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común.</li>
          <li><strong>Retiro del consentimiento:</strong> retirar en cualquier momento el consentimiento otorgado para fines específicos.</li>
        </ul>
        <p>Para ejercer estos derechos, escribe a <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a> desde la misma cuenta de correo asociada a tu perfil. Responderemos en un plazo máximo de <strong>30 días</strong> naturales.</p>

        <h2>7. Cookies y tecnologías de seguimiento</h2>
        <p>Usamos cookies estrictamente necesarias para la autenticación y operación de la plataforma. No empleamos cookies de terceros para publicidad comportamental ni perfiles de usuario automatizados. Puedes configurar tu navegador para rechazar cookies, aunque algunas funciones podrían verse afectadas.</p>

        <h2>8. Seguridad de la información</h2>
        <p>Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (TLS), cifrado en reposo para credenciales y datos sensibles, control de acceso basado en roles (RBAC) a nivel de base de datos, y auditoría continua de eventos de seguridad.</p>

        <h2>9. Retención de datos</h2>
        <p>Conservamos tus datos personales durante el tiempo necesario para cumplir con las finalidades descritas y con las obligaciones legales aplicables. Tras la eliminación de tu cuenta, los datos operativos vinculados a certificados emitidos se conservan durante el plazo de vigencia legal de dichos certificados; el resto se elimina o anonimiza en un plazo máximo de <strong>90 días</strong>.</p>

        <h2>10. Privacidad de menores</h2>
        <p>Nuestros servicios no están dirigidos a personas menores de 18 años. No recopilamos intencionalmente datos de menores. Si detectamos que hemos recopilado datos de un menor, los eliminaremos de inmediato.</p>

        <h2>11. Cambios a esta política</h2>
        <p>Podemos actualizar esta Política de Privacidad Global para reflejar cambios en nuestras prácticas o en la legislación aplicable. Te notificaremos los cambios materiales mediante un aviso visible en la plataforma o por correo electrónico antes de que entren en vigor.</p>

        <h2>12. Contacto y quejas</h2>
        <p>Para preguntas sobre esta política o para ejercer tus derechos:</p>
        <ul>
          <li>Email: <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a></li>
          <li>Teléfono: +52 1 993 168 4717</li>
          <li>Dirección postal: Nacajuca, Tabasco, México</li>
        </ul>
        <p>Si resides en la Unión Europea o en un país con autoridad de protección de datos, también tienes derecho a presentar una queja ante la autoridad correspondiente de tu país de residencia.</p>
      </main>
    </>
  );
}
