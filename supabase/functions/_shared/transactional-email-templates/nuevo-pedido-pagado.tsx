/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  orderNumber?: string
  amount?: string
  currency?: string
  customerName?: string
  customerEmail?: string
  paidAt?: string
  items?: Array<{ name: string; qty: number; price?: string }>
}

const Email = ({
  orderNumber = '—',
  amount = '—',
  currency = 'MXN',
  customerName = 'Cliente',
  customerEmail = '—',
  paidAt = '',
  items = [],
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>🛒 Nuevo pedido pagado {orderNumber} · {amount} {currency}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🛒 Nuevo pedido pagado</Heading>
        <Text style={lead}>
          Acaba de entrar un pago confirmado en Grupo Psi.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Pedido:</strong> {orderNumber}</Text>
          <Text style={row}><strong>Monto:</strong> {amount} {currency}</Text>
          <Text style={row}><strong>Cliente:</strong> {customerName}</Text>
          <Text style={row}><strong>Email:</strong> {customerEmail}</Text>
          {paidAt && <Text style={row}><strong>Pagado:</strong> {paidAt}</Text>}
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
  subject: (d: Props) => `🛒 Nuevo pedido pagado · ${d?.orderNumber ?? ''}`.trim(),
  displayName: 'Nuevo pedido pagado',
  to: 'daniel@grupopsi.com',
  previewData: {
    orderNumber: 'ORD-12345',
    amount: '$1,250.00',
    currency: 'MXN',
    customerName: 'Juan Pérez',
    customerEmail: 'juan@example.com',
    paidAt: '2026-06-14 14:30',
    items: [{ name: 'Extintor PQS 6kg', qty: 2, price: '$900.00' }],
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
