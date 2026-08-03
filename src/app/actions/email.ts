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
              <p style="margin: 5px 0; font-size: 12px; font-weight: bold;">GSTIN: ${sale.gstin || showroom.gstin || 'N/A'}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 32px; color: #000;">INVOICE</h2>
              <p style="margin: 5px 0; color: #10b981; font-weight: bold;"># ${sale.invoiceNo}</p>
            </div>
          </div>

          <div style="margin: 30px 0; display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
              <p style="margin: 0 0 5px 0; font-size: 10px; color: #999; text-transform: uppercase; font-weight: bold;">Billed To</p>
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${sale.customerName}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">${sale.address}, ${sale.city}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">Mob: ${sale.mobile}</p>
            </div>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
              <p style="margin: 0 0 5px 0; font-size: 10px; color: #999; text-transform: uppercase; font-weight: bold;">Vehicle Specs</p>
              <p style="margin: 0; font-weight: bold; font-size: 16px;">${sale.model}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">Chassis: ${sale.chassisNumber}</p>
              <p style="margin: 5px 0; font-size: 13px; color: #666;">Color: ${sale.color}</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #10b981; color: white;">
                <th style="padding: 12px; text-align: left; border: 1px solid #10b981;">Description</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #10b981;">HSN</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #10b981;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 20px; border: 1px solid #eee;">
                  <p style="margin: 0; font-weight: bold;">${sale.model} Electric Scooter</p>
                  <p style="margin: 5px 0 0 0; font-size: 11px; color: #888;">Variant: ${sale.variant || 'Standard'} • Battery: ${sale.batteryType}</p>
                </td>
                <td style="padding: 20px; border: 1px solid #eee; text-align: center;">${sale.hsn || '871160'}</td>
                <td style="padding: 20px; border: 1px solid #eee; text-align: right; font-weight: bold;">₹ ${sale.price.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="background: #f9f9f9; font-weight: bold;">
                <td colspan="2" style="padding: 15px; text-align: right; border: 1px solid #eee; font-size: 18px;">Grand Total</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #eee; color: #10b981; font-size: 20px;">₹ ${sale.price.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; border: 1px dashed #10b981;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #10b981;">PAYMENT INFORMATION</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Method: <strong>${sale.paymentMethod}</strong></p>
            ${sale.utrNumber ? `<p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Transaction Ref: ${sale.utrNumber}</p>` : ''}
          </div>

          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #eee; pt-20">
            <p style="color: #999; font-size: 12px;">This is a computer-generated tax invoice. No signature required.</p>
            <p style="font-weight: bold; margin-top: 10px; color: #10b981;">Thank you for driving the future with Amresh Automobiles!</p>
          </div>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}
