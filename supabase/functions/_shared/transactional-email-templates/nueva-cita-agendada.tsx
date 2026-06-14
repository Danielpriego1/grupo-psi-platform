/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  appointmentType?: string
  clientName?: string
  contactName?: string
  contactPhone?: string
  scheduledDate?: string
  scheduledTime?: string
  durationMinutes?: number
  address?: string
  municipality?: string
  state?: string
  notes?: string
}

const Email = ({
  appointmentType = 'Cita', clientName = '—', contactName = '—', contactPhone = '—',
  scheduledDate = '', scheduledTime = '', durationMinutes = 60,
  address = '', municipality = '', state = '', notes = '',
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>📅 {appointmentType} · {scheduledDate} {scheduledTime}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>📅 Nueva cita agendada</Heading>
        <Text style={lead}>
          {appointmentType} para <strong>{scheduledDate}</strong> a las <strong>{scheduledTime}</strong> ({durationMinutes} min).
        </Text>

        <Section style={card}>
          <Text style={subhead}>Cliente</Text>
          <Text style={row}><strong>{clientName}</strong></Text>
          <Text style={row}>{contactName} · {contactPhone}</Text>
        </Section>

        {(address || municipality || state) && (
          <Section style={card}>
            <Text style={subhead}>Ubicación</Text>
            <Text style={row}>{address}</Text>
            <Text style={row}>{municipality}{municipality && state ? ', ' : ''}{state}</Text>
          </Section>
        )}

        {notes && (
          <Section style={card}>
            <Text style={subhead}>Notas</Text>
            <Text style={row}>{notes}</Text>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={muted}>Panel admin · grupopsi.com/admin/calendario</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `📅 ${d?.appointmentType ?? 'Cita'} · ${d?.scheduledDate ?? ''} ${d?.scheduledTime ?? ''}`.trim(),
  displayName: 'Nueva cita agendada',
  to: 'daniel@grupopsi.com',
  previewData: {
    appointmentType: 'Visita', clientName: 'PEMEX Tabasco', contactName: 'Ing. Rivas',
    contactPhone: '993 000 0000', scheduledDate: '2026-06-22',
    scheduledTime: '10:30', durationMinutes: 60,
    address: 'Av. Industrial 45', municipality: 'Villahermosa', state: 'Tabasco',
    notes: 'Llevar muestras de equipo',
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
