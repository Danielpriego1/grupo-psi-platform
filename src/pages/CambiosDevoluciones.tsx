import { SEO } from "@/components/SEO";

export default function CambiosDevoluciones() {
  return (
    <>
      <SEO
        title="Política de Cambios y Devoluciones | Grupo Psi"
        description="Consulta las condiciones para cambios, devoluciones y cancelaciones de productos y servicios de Grupo Psi."
        path="/cambios-devoluciones"
      />
      <main className="container mx-auto px-6 py-12 max-w-3xl prose prose-invert">
        <h1>Política de Cambios y Devoluciones</h1>
        <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString("es-MX")}</p>

        <h2>1. Alcance</h2>
        <p>Esta política aplica a todos los productos adquiridos a través de la plataforma de Grupo Psi, así como a los servicios de mantenimiento, calibración y certificación contratados en línea.</p>

        <h2>2. Productos físicos</h2>
        <h3>2.1 Devoluciones</h3>
        <p>Puedes solicitar la devolución de productos físicos dentro de los <strong>15 días naturales</strong> posteriores a la recepción, siempre que:</p>
        <ul>
          <li>El producto se encuentre en su empaque original, sin uso y con todos sus accesorios.</li>
          <li>Presentes el comprobante de compra o factura correspondiente.</li>
          <li>El producto no pertenezca a las categorías exceptuadas (ver sección 4).</li>
        </ul>

        <h3>2.2 Cambios</h3>
        <p>Los cambios por talla, modelo o presentación están sujetos a disponibilidad de inventario y deben solicitarse dentro de los <strong>15 días naturales</strong> posteriores a la recepción, en las mismas condiciones de devolución.</p>

        <h3>2.3 Proceso</h3>
        <p>Para iniciar una devolución o cambio, contáctanos vía WhatsApp al <a href="https://wa.me/5219931684717">+52 1 993 168 4717</a> o escribe a <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a>. Te indicaremos los pasos para el envío. Los costos de envío de devolución corren por cuenta del cliente, salvo que el producto tenga un defecto de fábrica.</p>

        <h2>3. Reembolsos</h2>
        <p>Una vez recibido y verificado el producto, procesaremos el reembolso en un plazo de <strong>5 a 10 días hábiles</strong> mediante el mismo método de pago utilizado en la compra (Stripe). Para transferencias bancarias directas, el plazo puede extenderse según las políticas de la institución bancaria.</p>

        <h2>4. Excepciones</h2>
        <p>No aplican cambios ni devoluciones en los siguientes casos:</p>
        <ul>
          <li>Productos personalizados, bordados o fabricados bajo pedido específico (ej. uniformes con logotipo).</li>
          <li>Productos que hayan sido usados, dañados por mal manejo o que presenten alteraciones.</li>
          <li>Consumibles, equipos de protección personal (EPP) sellados que hayan sido abiertos por razones de higiene y seguridad.</li>
          <li>Certificados digitales ya emitidos, copias certificadas o servicios de calibración/mantenimiento ya ejecutados.</li>
        </ul>

        <h2>5. Servicios de mantenimiento y calibración</h2>
        <p>Para servicios programados pero no ejecutados:</p>
        <ul>
          <li>Cancelaciones con <strong>más de 48 horas</strong> de anticipación: reembolso completo o reprogramación sin costo.</li>
          <li>Cancelaciones con <strong>menos de 48 horas</strong>: se retiene el <strong>30 %</strong> del monto como cargo administrativo.</li>
          <li>Servicios ya iniciados o ejecutados: no aplican reembolsos.</li>
        </ul>

        <h2>6. Garantía de servicios</h2>
        <p>Los servicios de mantenimiento, calibración y pruebas hidrostáticas cuentan con una garantía de <strong>30 días naturales</strong> contra defectos en la ejecución. Si detectas una falla atribuible a nuestro trabajo, reprogramaremos el servicio sin costo adicional.</p>

        <h2>7. Productos defectuosos o dañados en envío</h2>
        <p>Si recibes un producto dañado durante el envío o con defecto de fábrica, notifícanos dentro de las <strong>48 horas</strong> posteriores a la recepción con fotografías del daño. Asumimos el costo de reposición y envío.</p>

        <h2>8. Contacto</h2>
        <p>Para cualquier solicitud relacionada con cambios, devoluciones o garantías:</p>
        <ul>
          <li>WhatsApp: <a href="https://wa.me/5219931684717">+52 1 993 168 4717</a></li>
          <li>Email: <a href="mailto:ventas@grupopsi.com">ventas@grupopsi.com</a></li>
          <li>Dirección: Nacajuca, Tabasco, México.</li>
        </ul>
      </main>
    </>
  );
}
