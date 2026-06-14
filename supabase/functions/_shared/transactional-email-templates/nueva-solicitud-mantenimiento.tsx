/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  folio?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  state?: string
  municipality?: string
  postalCode?: string
  scheduledDate?: string
  timeSlot?: string
  totalUnits?: number
  additionalNotes?: string | null
  equipmentItems?: Array<{ category?: string; quantity?: number }>
}

const Email = ({
  folio = '—', contactName = '—', contactPhone = '—', contactEmail = '—',
  address = '', state = '', municipality = '', postalCode = '',
  scheduledDate = '', timeSlot = '', totalUnits = 0,
  additionalNotes = null, equipmentItems = [],
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>🔧 Nueva solicitud {folio} · {scheduledDate} {timeSlot}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔧 Nueva solicitud de mantenimiento</Heading>
        <Text style={lead}>Folio <strong>{folio}</strong> — agendada para {scheduledDate} ({timeSlot}).</Text>

        <Section style={card}>
          <Text style={subhead}>Contacto</Text>
          <Text style={row}><strong>{contactName}</strong></Text>
          <Text style={row}>{contactPhone} · {contactEmail}</Text>
        </Section>

        <Section style={card}>
          <Text style={subhead}>Ubicación de recolección</Text>
          <Text style={row}>{address}</Text>
          <Text style={row}>{municipality}, {state} · CP {postalCode}</Text>
        </Section>

        <Section style={card}>
          <Text style={subhead}>Equipos ({totalUnits} unidades)</Text>
          {equipmentItems.map((it, i) => (
            <Text key={i} style={row}>• {it.quantity}× {it.category}</Text>
          ))}
        </Section>

        {additionalNotes && (
          <Section style={card}>
            <Text style={subhead}>Notas del cliente</Text>
            <Text style={row}>{additionalNotes}</Text>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={muted}>Panel admin · grupopsi.com/admin/maintenance</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `🔧 Nueva solicitud ${d?.folio ?? ''} · ${d?.scheduledDate ?? ''}`.trim(),
  displayName: 'Nueva solicitud de mantenimiento',
  to: 'daniel@grupopsi.com',
  previewData: {
    folio: 'PSI-2026-0042', contactName: 'María López', contactPhone: '993 123 4567',
    contactEmail: 'maria@ejemplo.com', address: 'Calle Reforma 123',
    state: 'Tabasco', municipality: 'Nacajuca', postalCode: '86220',
    scheduledDate: '2026-06-20', timeSlot: '9:00 - 11:00', totalUnits: 5,
    equipmentItems: [{ category: 'Extintores', quantity: 5 }],
    additionalNotes: 'Acceso por la puerta lateral',
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
