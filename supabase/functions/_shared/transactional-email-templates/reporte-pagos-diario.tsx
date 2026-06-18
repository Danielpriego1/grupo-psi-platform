/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  reportDate?: string
  rangeLabel?: string
  total?: number
  paid?: number
  failed?: number
  expired?: number
  refunded?: number
  downloadUrl?: string
  expiresAt?: string
}

const Email = ({
  reportDate = '',
  rangeLabel = '',
  total = 0,
  paid = 0,
  failed = 0,
  expired = 0,
  refunded = 0,
  downloadUrl = '#',
  expiresAt = '',
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>📊 Reporte diario de pagos · {total} eventos</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📊 Reporte diario de pagos</Heading>
        <Text style={lead}>
          Resumen automático de eventos de pago registrados en el CRM.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Fecha del reporte:</strong> {reportDate}</Text>
          <Text style={row}><strong>Rango:</strong> {rangeLabel}</Text>
          <Hr style={hr} />
          <Text style={row}><strong>Total eventos:</strong> {total}</Text>
          <Text style={row}>✅ Pagados: {paid}</Text>
          <Text style={row}>❌ Rechazados: {failed}</Text>
          <Text style={row}>⌛ Expirados: {expired}</Text>
          <Text style={row}>↩️ Reembolsos: {refunded}</Text>
        </Section>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={downloadUrl} style={btn}>Descargar CSV</Button>
          {expiresAt && (
            <Text style={small}>El enlace expira el {expiresAt}.</Text>
          )}
        </Section>
        <Text style={footer}>
          Este reporte fue generado automáticamente. Si no esperabas recibirlo,
          contacta al administrador del sistema.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) =>
    `📊 Reporte de pagos ${data.reportDate ?? ''} — ${data.total ?? 0} eventos`,
  displayName: 'Reporte diario de pagos',
  previewData: {
    reportDate: '2026-06-18',
    rangeLabel: 'Últimas 24 horas',
    total: 12, paid: 9, failed: 1, expired: 1, refunded: 1,
    downloadUrl: 'https://example.com/report.csv',
    expiresAt: '2026-06-25 12:00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', color: '#0f172a' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', margin: '0 0 12px 0' }
const lead = { fontSize: '14px', color: '#475569', margin: '0 0 16px 0' }
const card = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }
const row = { margin: '4px 0', fontSize: '14px' }
const hr = { borderColor: '#e2e8f0', margin: '12px 0' }
const btn = { backgroundColor: '#f97316', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }
const small = { fontSize: '12px', color: '#64748b', marginTop: '8px' }
const footer = { fontSize: '12px', color: '#94a3b8', marginTop: '24px', textAlign: 'center' as const }
