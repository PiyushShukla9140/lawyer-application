import { Resend } from 'resend';
import { ApiError } from './ApiError';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailOptions) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.SENDER_EMAIL || 'onboarding@resend.dev',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend Email Error:', error);
      throw new ApiError(500, `Email delivery failed: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw new ApiError(500, error?.message || 'Failed to send email');
  }
};