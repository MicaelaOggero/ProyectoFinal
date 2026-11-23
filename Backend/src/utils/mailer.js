import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASSWORD;

  if (!user || !password) {
    throw new Error("EMAIL_USER y EMAIL_PASSWORD son requeridos");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: password },
  });
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
};
