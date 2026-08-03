
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmationEmail(email: string, details: {
  customerName: string;
  scooterModel: string;
  date: string;
  time: string;
  branchName: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email not sent.');
    return;
  }

  try {
    await resend.emails.send({
      from: 'Amresh Automobiles <onboarding@resend.dev>',
      to: email,
      subject: 'Test Ride Booking Received - Amresh Automobiles',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Ride Request Received!</h2>
          <p>Hi ${details.customerName},</p>
          <p>Thank you for booking a test ride with <strong>Amresh Automobiles</strong>. We have received your request for the <strong>${details.scooterModel}</strong>.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Showroom:</strong> ${details.branchName}</p>
            <p><strong>Preferred Date:</strong> ${details.date}</p>
            <p><strong>Preferred Slot:</strong> ${details.time}</p>
          </div>
          <p>Our team will contact you shortly to confirm the appointment.</p>
          <p>Best Regards,<br/>Team Amresh Automobiles</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
  }
}

export async function sendStatusUpdateEmail(email: string, details: {
  customerName: string;
  scooterModel: string;
  date: string;
  time: string;
  status: string;
  branchName: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Email not sent.');
    return;
  }

  const isConfirmed = details.status === 'confirmed';
  const subject = isConfirmed ? 'Test Ride Confirmed! - Amresh Automobiles' : 'Update on your Test Ride Booking';
  
  try {
    await resend.emails.send({
      from: 'Amresh Automobiles <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: ${isConfirmed ? '#10b981' : '#f59e0b'};">${isConfirmed ? 'Your Ride is Confirmed!' : 'Booking Update'}</h2>
          <p>Hi ${details.customerName},</p>
          <p>Your test ride booking for the <strong>${details.scooterModel}</strong> at <strong>${details.branchName}</strong> has been ${details.status}.</p>
          
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Confirmed Date:</strong> ${details.date}</p>
            <p><strong>Confirmed Time:</strong> ${details.time}</p>
          </div>
          
          ${isConfirmed ? '<p>Please bring a valid driving license for the test ride. See you at the showroom!</p>' : ''}
          
          <p>Best Regards,<br/>Team Amresh Automobiles</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send status update email:', error);
  }
}
