export default function Privacidad() {
  return (
    <main className="container mx-auto px-6 py-12 max-w-3xl prose prose-invert">
      <h1>Política de Privacidad</h1>
      <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-MX")}</p>

      <h2>1. Responsable</h2>
      <p>Grupo Psi, con domicilio en Nacajuca, Tabasco, México, es responsable del tratamiento de tus datos personales.</p>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li>Datos de identificación: nombre, correo electrónico, teléfono, empresa, sucursal.</li>
        <li>Datos de autenticación: credenciales de acceso (almacenadas cifradas) y, cuando inicias sesión con Google o Apple, el correo verificado y nombre público que dichos proveedores comparten con nosotros.</li>
        <li>Datos operativos: equipos, certificados, órdenes, citas, mantenimientos y entregas asociados a tu cuenta.</li>
        <li>Datos técnicos: cookies de sesión, tipo de dispositivo y dirección IP.</li>
      </ul>

      <h2>3. Autenticación OAuth (Google y Apple)</h2>
      <p>Si eliges iniciar sesión con Google o Apple, esos proveedores nos comparten únicamente tu identificador, correo verificado y nombre. No accedemos a tu agenda, contactos ni archivos. Puedes revocar el acceso desde la configuración de tu cuenta Google o Apple en cualquier momento.</p>

      <h2>4. Sesiones y almacenamiento</h2>
      <p>Las sesiones se mantienen mediante tokens cifrados emitidos por nuestro proveedor de autenticación (Lovable Cloud / Supabase Auth). El token se guarda en el almacenamiento local de tu navegador y caduca automáticamente. Puedes cerrar sesión en cualquier momento.</p>

      <h2>5. Roles y permisos</h2>
      <p>La plataforma distingue tres roles: <strong>administrador</strong> (acceso completo), <strong>técnico</strong> (acceso únicamente a los servicios que se le asignan) y <strong>cliente</strong> (acceso solo a su información). Estos roles se aplican mediante políticas de seguridad a nivel de base de datos.</p>

      <h2>6. Finalidades del tratamiento</h2>
      <ul>
        <li>Prestación de servicios de mantenimiento, calibración y emisión de certificados.</li>
        <li>Comunicación operativa (confirmaciones, recordatorios, alertas).</li>
        <li>Cumplimiento de obligaciones fiscales y contractuales.</li>
        <li>Mejora del servicio y seguridad de la plataforma.</li>
      </ul>

      <h2>7. Retención de datos</h2>
      <p>Conservamos tus datos durante el tiempo necesario para cumplir con las finalidades indicadas y con las obligaciones legales aplicables. Al eliminar tu cuenta, conservamos los datos operativos vinculados a certificados emitidos durante el plazo de vigencia legal de los mismos; el resto se anonimiza o elimina en un plazo máximo de 90 días.</p>

      <h2>8. Derechos ARCO</h2>
      <p>Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, cancelación y oposición escribiendo a <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a>.</p>

      <h2>9. Contacto</h2>
      <p>Para cualquier duda sobre privacidad: <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a> · +52 1 993 168 4717.</p>
    </main>
  );
}
