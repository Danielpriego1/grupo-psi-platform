/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  title?: string
  summary?: string
  status?: string
  dependency?: string
  detail?: string
  latency?: number
  errorRate?: number
  p95?: number
  correlationId?: string
  panelUrl?: string
}

const Email = ({
  title = 'Alerta de servicio',
  summary = '',
  status = 'down',
  dependency = 'backend',
  detail = '',
  latency = 0,
  errorRate = 0,
  p95 = 0,
  correlationId = '—',
  panelUrl = 'https://grupopsi.com/admin/salud',
}: Props) => {
  const recovered = status === 'ok'
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{recovered ? '✅ ' : '🚨 '}{title}</Heading>
          <Text style={lead}>{summary}</Text>

          <Section style={recovered ? okCard : alertCard}>
            <Text style={subhead}>Estado</Text>
            <Text style={row}><strong>Servicio:</strong> {recovered ? 'operativo' : status}</Text>
            <Text style={row}><strong>Dependencia:</strong> {dependency}</Text>
            <Text style={row}><strong>Detalle:</strong> {detail || '—'}</Text>
          </Section>

          <Section style={card}>
            <Text style={subhead}>Métricas</Text>
            <Text style={row}><strong>Latencia de la verificación:</strong> {latency} ms</Text>
            <Text style={row}><strong>Latencia p95 (24 h):</strong> {p95} ms</Text>
            <Text style={row}><strong>Tasa de fallo (24 h):</strong> {(Number(errorRate) * 100).toFixed(2)}%</Text>
            <Text style={row}><strong>ID de correlación:</strong> {correlationId}</Text>
          </Section>

          <Text style={row}>
            <Link href={panelUrl} style={btn}>Ver panel de salud</Link>
          </Text>

          <Hr style={hr} />
          <Text style={muted}>
            Mensaje automático de monitoreo de Grupo Psi. Se envía al abrir un incidente
            y al confirmar la recuperación.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) =>
    data?.status === 'ok'
      ? '✅ Servicio recuperado · Grupo Psi'
      : '🚨 Alerta de servicio · Grupo Psi',
  displayName: 'Alerta de servicio',
  previewData: {
    title: 'Servicio con fallas · base de datos',
    summary: 'base de datos: timeout · latencia 4200 ms',
    status: 'degraded',
    dependency: 'base de datos',
    detail: 'base de datos: connection timeout',
    latency: 4200,
    errorRate: 0.12,
    p95: 1850,
    correlationId: 'PSI-4F2A-8C10',
    panelUrl: 'https://grupopsi.com/admin/salud',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#0f172a' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', margin: '0 0 8px 0', color: '#0f172a' }
const lead = { fontSize: '15px', color: '#475569', margin: '0 0 16px 0' }
const card = { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', margin: '12px 0', border: '1px solid #e2e8f0' }
const alertCard = { backgroundColor: '#fef2f2', borderRadius: '10px', padding: '16px', margin: '12px 0', border: '1px solid #fecaca' }
const okCard = { backgroundColor: '#f0fdf4', borderRadius: '10px', padding: '16px', margin: '12px 0', border: '1px solid #bbf7d0' }
const row = { fontSize: '14px', margin: '4px 0', color: '#0f172a' }
const subhead = { fontSize: '13px', fontWeight: 600, color: '#475569', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
const btn = { display: 'inline-block', backgroundColor: '#3b82f6', color: '#ffffff', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', marginTop: '8px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const muted = { fontSize: '12px', color: '#64748b' }
