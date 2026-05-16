export default function Terminos() {
  return (
    <main className="container mx-auto px-6 py-12 max-w-3xl prose prose-invert">
      <h1>Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-MX")}</p>

      <h2>1. Aceptación</h2>
      <p>Al crear una cuenta o utilizar la plataforma de Grupo Psi aceptas estos Términos y nuestra <a href="/privacidad">Política de Privacidad</a>.</p>

      <h2>2. Cuentas y autenticación</h2>
      <p>Puedes acceder usando email y contraseña o mediante proveedores OAuth (Google, Apple). Si usas el mismo correo electrónico en varios métodos, el sistema lo asocia a una única identidad para evitar cuentas duplicadas. Eres responsable de mantener la confidencialidad de tus credenciales.</p>

      <h2>3. Roles de usuario</h2>
      <ul>
        <li><strong>Cliente:</strong> consulta sus equipos, certificados, órdenes, citas y entregas.</li>
        <li><strong>Técnico:</strong> opera únicamente los servicios que le son asignados.</li>
        <li><strong>Administrador:</strong> gestiona la plataforma según las funciones asignadas por Grupo Psi.</li>
      </ul>

      <h2>4. Servicios</h2>
      <p>Grupo Psi ofrece venta de equipos, servicios de mantenimiento, calibración, prueba hidrostática, pureza de aire, PosiChek y emisión de certificados. Todos los precios incluyen IVA salvo indicación expresa. Pedidos de más de 10 unidades requieren cotización personalizada.</p>

      <h2>5. Certificados y copias</h2>
      <p>Los certificados emitidos se entregan en formato digital sin costo. Las copias certificadas adicionales tienen un costo de $250 MXN, gestionado mediante Stripe Checkout.</p>

      <h2>6. Uso aceptable</h2>
      <p>No está permitido usar la plataforma para fines ilícitos, intentar acceder a datos de otros usuarios, vulnerar la seguridad o redistribuir el servicio sin autorización.</p>

      <h2>7. Datos y permisos</h2>
      <p>Las políticas de seguridad a nivel de base de datos garantizan que cada usuario solo accede a la información que le corresponde según su rol. El incumplimiento puede dar lugar a la suspensión inmediata de la cuenta.</p>

      <h2>8. Cancelación y retención</h2>
      <p>Puedes cerrar tu cuenta en cualquier momento. Los datos operativos asociados a certificados se conservan durante su vigencia legal; el resto se elimina o anonimiza en un plazo máximo de 90 días.</p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>La plataforma se ofrece "tal cual". Grupo Psi no será responsable por interrupciones, pérdidas de datos o daños indirectos derivados del uso del servicio, salvo en los casos previstos por la legislación aplicable.</p>

      <h2>10. Legislación aplicable</h2>
      <p>Estos Términos se rigen por las leyes mexicanas. Cualquier controversia se someterá a los tribunales competentes de Villahermosa, Tabasco.</p>

      <h2>11. Contacto</h2>
      <p>Grupo Psi · Nacajuca, Tabasco · <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a> · +52 1 993 168 4717.</p>
    </main>
  );
}
