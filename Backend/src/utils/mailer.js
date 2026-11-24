import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export function isMailConfigured() {
  return Boolean((process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) || (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL));
}

export async function sendEmail({ to, subject, text, html }) {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
    return transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text, html });
  }
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.RESEND_FROM_EMAIL, to: [to], subject, text, html });
    if (error) throw new Error('No se pudo enviar el correo');
    return data;
  }
  throw new Error('El envío de correo no está configurado');
}
