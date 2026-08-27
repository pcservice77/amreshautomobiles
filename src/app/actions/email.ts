
'use server';

import { Resend } from 'resend';
import PDFDocument from 'pdfkit';

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
  googleMapUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  try {
    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles <bookings@contact.amreshautomobiles.in>',
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
            ${details.googleMapUrl ? `<p style="margin: 15px 0;"><a href="${details.googleMapUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Showroom Location</a></p>` : ''}
          </div>
          
          <p>Our team will contact you shortly to confirm the appointment and provide the exact location details.</p>
          <p>Best Regards,<br/><strong>Team Amresh Automobiles</strong></p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendServiceConfirmationEmail(email: string, details: {
  customerName: string;
  scooterModel: string;
  date: string;
  time: string;
  branchName: string;
  serviceType: string;
}) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  try {
    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles Service <service@contact.amreshautomobiles.in>',
      to: email,
      subject: `Service Appointment Booked - ${details.scooterModel}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Service Request Received</h2>
          <p>Hi <strong>${details.customerName}</strong>,</p>
          <p>Your <strong>${details.serviceType}</strong> appointment for your <strong>${details.scooterModel}</strong> has been successfully registered.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0;"><strong>Service Center:</strong> ${details.branchName}</p>
            <p style="margin: 5px 0;"><strong>Scheduled Date:</strong> ${details.date}</p>
            <p style="margin: 5px 0;"><strong>Arrival Slot:</strong> ${details.time}</p>
          </div>
          
          <p>Please bring your digital service slip or a copy of your invoice for a faster check-in process.</p>
          <p>Best Regards,<br/><strong>Amresh Automobiles Service Team</strong></p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
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
  googleMapUrl?: string;
}) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  const isConfirmed = details.status === 'confirmed';
  const subject = isConfirmed ? 'Test Ride Confirmed! - Amresh Automobiles' : 'Update on your Test Ride Booking';
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles <bookings@contact.amreshautomobiles.in>',
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
            ${isConfirmed && details.googleMapUrl ? `<p style="margin: 15px 0;"><a href="${details.googleMapUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Navigate to Showroom</a></p>` : ''}
          </div>
          
          <p>Best Regards,<br/><strong>Team Amresh Automobiles</strong></p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function sendInvoiceEmail(email: string, sale: any, showroom: any) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  try {
    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles Billing <billing@contact.amreshautomobiles.in>',
      to: email,
      subject: `Invoice ${sale.invoiceNo} - Amresh Automobiles`,
      html: `
        <div style="font-family: sans-serif; padding: 40px; color: #333; max-width: 700px; margin: auto; border: 1px solid #eee; border-radius: 15px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 20px;">
            <div>
              <h1 style="margin: 0; color: #10b981; text-transform: uppercase; font-size: 24px;">Amresh Automobiles</h1>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">${showroom.address || 'Showroom location'}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 32px; color: #000;">INVOICE</h2>
              <p style="margin: 5px 0; color: #10b981; font-weight: bold;"># ${sale.invoiceNo}</p>
            </div>
          </div>
          <p>Hello <strong>${sale.customerName}</strong>,</p>
          <p>Thank you for choosing Amresh Automobiles! Your invoice for ${sale.model} is attached below.</p>
          <p>Amount Paid: <strong>₹ ${sale.price.toLocaleString()}</strong></p>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
