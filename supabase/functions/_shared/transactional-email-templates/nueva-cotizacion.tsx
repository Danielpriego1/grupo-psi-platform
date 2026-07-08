/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  orderNumber?: string
  total?: string
  currency?: string
  clientName?: string
  clientPhone?: string
  items?: Array<{ name: string; qty: number; price?: string }>
  createdAt?: string
}

const Email = ({
  orderNumber = '—',
  total = '—',
  currency = 'MXN',
  clientName = 'Cliente',
  clientPhone = '—',
  items = [],
  createdAt = '',
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>📝 Nueva cotización {orderNumber} · {total} {currency}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📝 Nueva cotización solicitada</Heading>
        <Text style={lead}>
          Un cliente acaba de generar una cotización desde el carrito. Requiere seguimiento comercial.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Folio:</strong> {orderNumber}</Text>
          <Text style={row}><strong>Total estimado:</strong> {total} {currency}</Text>
          <Text style={row}><strong>Cliente:</strong> {clientName}</Text>
          <Text style={row}><strong>Teléfono:</strong> {clientPhone}</Text>
          {createdAt && <Text style={row}><strong>Solicitado:</strong> {createdAt}</Text>}
        </Section>
        {items.length > 0 && (
          <Section style={card}>
            <Text style={subhead}>Productos</Text>
            {items.map((it, i) => (
              <Text key={i} style={row}>• {it.qty}× {it.name}{it.price ? ` — ${it.price}` : ''}</Text>
            ))}
          </Section>
        )}
        <Hr style={hr} />
        <Text style={muted}>Panel admin · grupopsi.com/admin/orders</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `📝 Nueva cotización · ${d?.orderNumber ?? ''}`.trim(),
  displayName: 'Nueva cotización',
  to: 'daniel@grupopsi.com',
  previewData: {
    orderNumber: 'COT-1234567890',
    total: '$3,450.00',
    currency: 'MXN',
    clientName: 'Juan Pérez',
    clientPhone: '+52 993 000 0000',
    createdAt: '2026-07-08 10:30',
    items: [{ name: 'Extintor PQS 6kg', qty: 3, price: '$1,116.30' }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#0f172a' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', margin: '0 0 8px 0', color: '#0f172a' }
const lead = { fontSize: '15px', color: '#475569', margin: '0 0 16px 0' }
const card = { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', margin: '12px 0', border: '1px solid #e2e8f0' }
const row = { fontSize: '14px', margin: '4px 0', color: '#0f172a' }
const subhead = { fontSize: '13px', fontWeight: 600, color: '#475569', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const muted = { fontSize: '12px', color: '#64748b' }
