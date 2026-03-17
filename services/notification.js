import nodemailer from "nodemailer";

export async function sendEmail(to, message) {

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to,
    subject: "Appointment Confirmed",
    text: message
  });
}
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

export async function sendSMS(phone, message) {

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: phone
  });
}