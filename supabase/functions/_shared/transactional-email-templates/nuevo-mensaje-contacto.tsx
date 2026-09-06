/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  phone?: string
  company?: string
  subject?: string
  message?: string
  receivedAt?: string
  panelUrl?: string
}

const Email = ({
  name = 'Sin nombre',
  email = '—',
  phone = '—',
  company = '—',
  subject = 'Mensaje desde el sitio web',
  message = '',
  receivedAt = '',
  panelUrl = 'https://grupopsi.com/admin/crm',
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{`Nuevo mensaje de ${name}: ${subject}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>✉️ Nuevo mensaje de contacto</Heading>
        <Text style={lead}>{subject}</Text>

        <Section style={card}>
          <Text style={subhead}>Datos de contacto</Text>
          <Text style={row}><strong>Nombre:</strong> {name}</Text>
          <Text style={row}><strong>Empresa:</strong> {company || '—'}</Text>
          <Text style={row}><strong>Correo:</strong> <Link href={`mailto:${email}`}>{email}</Link></Text>
          <Text style={row}><strong>Teléfono:</strong> {phone || '—'}</Text>
          {receivedAt ? <Text style={row}><strong>Recibido:</strong> {receivedAt}</Text> : null}
        </Section>

        <Section style={card}>
          <Text style={subhead}>Mensaje</Text>
          <Text style={row}>{message}</Text>
        </Section>

        <Text style={row}>
          <Link href={panelUrl} style={btn}>Abrir el panel</Link>
        </Text>

        <Hr style={hr} />
        <Text style={muted}>
          Mensaje enviado desde el formulario de contacto de grupopsi.com.
          Puede responder directamente a este correo del cliente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) =>
    `✉️ Nuevo mensaje de contacto · ${data?.name ?? 'sitio web'}`,
  displayName: 'Nuevo mensaje de contacto',
  previewData: {
    name: 'Laura Méndez',
    email: 'laura@industriastabasco.com',
    phone: '+52 993 123 4567',
    company: 'Industrias Tabasco',
    subject: 'Cotización de mantenimiento de SCBA',
    message: 'Buen día, necesitamos mantenimiento para 18 equipos SCBA en Villahermosa.',
    receivedAt: '5 de septiembre de 2026, 22:40 h',
    panelUrl: 'https://grupopsi.com/admin/crm',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#0f172a' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', margin: '0 0 8px 0', color: '#0f172a' }
const lead = { fontSize: '15px', color: '#475569', margin: '0 0 16px 0' }
const card = { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', margin: '12px 0', border: '1px solid #e2e8f0' }
const row = { fontSize: '14px', margin: '4px 0', color: '#0f172a', whiteSpace: 'pre-wrap' as const }
const subhead = { fontSize: '13px', fontWeight: 600, color: '#475569', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
const btn = { display: 'inline-block', backgroundColor: '#3b82f6', color: '#ffffff', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', marginTop: '8px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const muted = { fontSize: '12px', color: '#64748b' }
