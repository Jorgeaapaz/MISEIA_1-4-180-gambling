import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAILHOG_HOST || 'localhost',
  port: Number(process.env.MAIL_PORT) || 1027,
  secure: false,
  ignoreTLS: true,
})

export async function sendMagicLink(email: string, token: string) {
  const link = `${process.env.NEXT_PUBLIC_API_URL}/auth/verify?token=${token}`
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'noreply@gambling.local',
    to: email,
    subject: 'Tu enlace de acceso a GamblingApp',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #00e676;">Acceso a GamblingApp</h2>
        <p>Haz clic en el siguiente enlace para acceder. Expira en 15 minutos.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#00e676;color:#000;text-decoration:none;border-radius:4px;font-weight:bold;">
          Acceder ahora
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px;">Si no solicitaste este enlace, ignora este correo.</p>
      </div>
    `,
  })
}
