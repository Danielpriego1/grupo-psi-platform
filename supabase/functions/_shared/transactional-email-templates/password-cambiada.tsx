/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  userName?: string
  changedAt?: string       // Fecha ya formateada, ej. "15 de julio de 2026, 14:32 (CDMX)"
  location?: string        // "Villahermosa, Tabasco, MX" o "Ubicación no disponible"
  ipAddress?: string
  device?: string          // navegador/SO
  supportEmail?: string
  resetUrl?: string        // Enlace para restablecer si no fue el usuario
}

const Email = ({
  userName = '',
  changedAt = '',
  location = 'Ubicación no disponible',
  ipAddress = '—',
  device = '—',
  supportEmail = 'ventas@grupopsi.com',
  resetUrl = 'https://grupopsi.com/forgot-password',
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Tu contraseña de Grupo Psi fue cambiada</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🔐 Contraseña actualizada</Heading>
        <Text style={lead}>
          Hola{userName ? ` ${userName}` : ''}, te confirmamos que la contraseña de tu cuenta
          en Grupo Psi fue cambiada correctamente.
        </Text>

        <Section style={card}>
          <Text style={subhead}>Detalles del cambio</Text>
          <Text style={row}><strong>Fecha y hora:</strong> {changedAt}</Text>
          <Text style={row}><strong>Ubicación aproximada:</strong> {location}</Text>
          <Text style={row}><strong>Dirección IP:</strong> {ipAddress}</Text>
          <Text style={row}><strong>Dispositivo:</strong> {device}</Text>
        </Section>

        <Section style={warnCard}>
          <Text style={warnTitle}>¿No fuiste tú?</Text>
          <Text style={row}>
            Si no reconoces este cambio, tu cuenta podría estar comprometida.
            Restablece tu contraseña de inmediato y contáctanos.
          </Text>
          <Text style={row}>
            <Link href={resetUrl} style={btn}>Restablecer contraseña</Link>
          </Text>
          <Text style={muted}>
            O escríbenos a <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>.
          </Text>
        </Section>

        <Hr style={hr} />
        <Text style={muted}>
          Este es un mensaje automático de seguridad de Grupo Psi. La ubicación es aproximada
          y proviene de la dirección IP registrada al momento del cambio.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: '🔐 Tu contraseña de Grupo Psi fue cambiada',
  displayName: 'Contraseña cambiada',
  previewData: {
    userName: 'Daniel',
    changedAt: '15 de julio de 2026, 14:32 (CDMX)',
    location: 'Villahermosa, Tabasco, MX',
    ipAddress: '187.190.12.4',
    device: 'Chrome en macOS',
    supportEmail: 'ventas@grupopsi.com',
    resetUrl: 'https://grupopsi.com/forgot-password',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', color: '#0f172a' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', margin: '0 0 8px 0', color: '#0f172a' }
const lead = { fontSize: '15px', color: '#475569', margin: '0 0 16px 0' }
const card = { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', margin: '12px 0', border: '1px solid #e2e8f0' }
const warnCard = { backgroundColor: '#fff7ed', borderRadius: '10px', padding: '16px', margin: '16px 0', border: '1px solid #fed7aa' }
const warnTitle = { fontSize: '14px', fontWeight: 700, color: '#9a3412', margin: '0 0 8px 0' }
const row = { fontSize: '14px', margin: '4px 0', color: '#0f172a' }
const subhead = { fontSize: '13px', fontWeight: 600, color: '#475569', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
const btn = { display: 'inline-block', backgroundColor: '#3b82f6', color: '#ffffff', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', marginTop: '8px' }
const link = { color: '#3b82f6', textDecoration: 'underline' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const muted = { fontSize: '12px', color: '#64748b' }
