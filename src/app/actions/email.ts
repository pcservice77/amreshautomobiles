
'use server';

import { Resend } from 'resend';

// Initialize inside the function to ensure process.env is ready
const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is missing from environment variables.');
    return null;
  }
  return new Resend(apiKey);
};

export async function sendBookingConfirmationEmail(email: string, details: {
  customerName: string;
  scooterModel: string;
  date: string;
  time: string;
  branchName: string;
}) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  try {
    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles <bookings@amreshautomobiles.in>',
      to: email,
      subject: 'Test Ride Booking Received - Amresh Automobiles',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Ride Request Received!</h2>
          <p>Hi <strong>${details.customerName}</strong>,</p>
          <p>Thank you for booking a test ride with <strong>Amresh Automobiles</strong>. We have received your request for the <strong>${details.scooterModel}</strong>.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0;"><strong>Showroom:</strong> ${details.branchName}</p>
            <p style="margin: 5px 0;"><strong>Preferred Date:</strong> ${details.date}</p>
            <p style="margin: 5px 0;"><strong>Preferred Slot:</strong> ${details.time}</p>
          </div>
          
          <p>Our team will contact you shortly to confirm the appointment and provide the exact location details.</p>
          <p>Best Regards,<br/><strong>Team Amresh Automobiles</strong></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #999;">This is an automated confirmation of your request.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return { success: false, error };
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
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  const isConfirmed = details.status === 'confirmed';
  const subject = isConfirmed ? 'Test Ride Confirmed! - Amresh Automobiles' : 'Update on your Test Ride Booking';
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles <bookings@amreshautomobiles.in>',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${isConfirmed ? '#10b981' : '#f59e0b'}; border-bottom: 2px solid ${isConfirmed ? '#10b981' : '#f59e0b'}; padding-bottom: 10px;">
            ${isConfirmed ? 'Your Ride is Confirmed!' : 'Booking Update'}
          </h2>
          <p>Hi <strong>${details.customerName}</strong>,</p>
          <p>Your test ride booking for the <strong>${details.scooterModel}</strong> at <strong>${details.branchName}</strong> has been <strong>${details.status}</strong>.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isConfirmed ? '#10b981' : '#f59e0b'};">
            <p style="margin: 5px 0;"><strong>Confirmed Date:</strong> ${details.date}</p>
            <p style="margin: 5px 0;"><strong>Confirmed Time:</strong> ${details.time}</p>
          </div>
          
          ${isConfirmed ? '<p style="color: #10b981; font-weight: bold;">Please bring a valid driving license for the test ride. See you at the showroom!</p>' : ''}
          
          <p>Best Regards,<br/><strong>Team Amresh Automobiles</strong></p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send status update email:', error);
    return { success: false, error };
  }
}
