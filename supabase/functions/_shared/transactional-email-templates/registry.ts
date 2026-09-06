import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: (props: any) => React.ReactElement
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

import { template as nuevoPedidoPagado } from './nuevo-pedido-pagado.tsx'
import { template as nuevaSolicitudMantenimiento } from './nueva-solicitud-mantenimiento.tsx'
import { template as nuevaCitaAgendada } from './nueva-cita-agendada.tsx'
import { template as reportePagosDiario } from './reporte-pagos-diario.tsx'
import { template as nuevaCotizacion } from './nueva-cotizacion.tsx'
import { template as passwordCambiada } from './password-cambiada.tsx'
import { template as alertaServicio } from './alerta-servicio.tsx'
import { template as nuevoMensajeContacto } from './nuevo-mensaje-contacto.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'nuevo-pedido-pagado': nuevoPedidoPagado,
  'nueva-solicitud-mantenimiento': nuevaSolicitudMantenimiento,
  'nueva-cita-agendada': nuevaCitaAgendada,
  'reporte-pagos-diario': reportePagosDiario,
  'nueva-cotizacion': nuevaCotizacion,
  'password-cambiada': passwordCambiada,
  'alerta-servicio': alertaServicio,
  'nuevo-mensaje-contacto': nuevoMensajeContacto,
}
