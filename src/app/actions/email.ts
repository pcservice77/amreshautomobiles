
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

/**
 * Generates a PDF buffer for the invoice using pdfkit
 */
async function generateInvoicePDFBuffer(sale: any, showroom: any): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    // Brand Header
    doc.fontSize(20).text('TAX INVOICE', { align: 'center', underline: true });
    doc.moveDown();

    doc.fontSize(14).text(showroom.name || 'AMRESH AUTOMOBILES', { bold: true });
    doc.fontSize(10).text(showroom.address || 'Showroom Address');
    doc.text(`GSTIN: ${sale.gstin || showroom.gstin || 'N/A'}`);
    doc.text(`Email: ${showroom.email || 'contact@amreshautomobiles.in'}`);
    doc.moveDown();

    // Invoice Details
    doc.fontSize(10).text(`Invoice No: ${sale.invoiceNo}`, { align: 'right' });
    doc.text(`Date: ${new Date(sale.soldAt).toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown();

    // Billed To
    doc.fontSize(11).text('BILLED TO:', { bold: true });
    doc.fontSize(10).text(sale.customerName);
    doc.text(sale.address);
    doc.text(`Mobile: ${sale.mobile}`);
    doc.text(`ID: ${sale.idType} - ${sale.idNumber}`);
    doc.moveDown();

    // Vehicle Details
    doc.fontSize(11).text('VEHICLE DETAILS:', { bold: true });
    doc.fontSize(10).text(`Model: ${sale.model}`);
    doc.text(`Chassis No: ${sale.chassisNumber}`);
    doc.text(`Battery: ${sale.batteryType}`);
    doc.text(`Color: ${sale.color}`);
    doc.moveDown();

    // Item Table
    const tableTop = doc.y;
    doc.moveTo(50, tableTop).lineTo(550, tableTop).stroke();
    doc.fontSize(10).text('Description', 60, tableTop + 5);
    doc.text('HSN', 300, tableTop + 5);
    doc.text('Amount', 450, tableTop + 5, { align: 'right' });
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    const rowTop = tableTop + 30;
    doc.text(`${sale.model} Electric Scooter`, 60, rowTop);
    doc.text(sale.hsn || '871160', 300, rowTop);
    doc.text(`₹ ${sale.price.toLocaleString()}`, 450, rowTop, { align: 'right' });

    doc.moveTo(50, rowTop + 20).lineTo(550, rowTop + 20).stroke();

    // Totals
    doc.moveDown(2);
    doc.fontSize(12).text(`Grand Total: ₹ ${sale.price.toLocaleString()}`, { align: 'right', bold: true });
    doc.fontSize(10).text(`Payment Method: ${sale.paymentMethod}`, { align: 'right' });
    if (sale.utrNumber) doc.text(`Transaction ID: ${sale.utrNumber}`, { align: 'right' });

    // Footer
    doc.moveDown(5);
    doc.text('__________________________', 350, doc.y, { align: 'right' });
    doc.text('Authorized Signatory', 350, doc.y + 5, { align: 'right' });
    doc.text(`For ${showroom.name || 'Amresh Automobiles'}`, 350, doc.y + 15, { align: 'right' });

    doc.end();
  });
}

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
    // Generate the PDF Buffer
    const pdfBuffer = await generateInvoicePDFBuffer(sale, showroom);

    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles Billing <billing@contact.amreshautomobiles.in>',
      to: email,
      subject: `Invoice ${sale.invoiceNo} - Amresh Automobiles`,
      attachments: [
        {
          filename: `Invoice_${sale.invoiceNo.replace(/\//g, '_')}.pdf`,
          content: pdfBuffer,
        },
      ],
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

          <p>Hello <strong>${sale.customerName}</strong>,</p>
          <p>Please find attached your formal tax invoice for the purchase of your new electric vehicle. Thank you for choosing Amresh Automobiles!</p>

          <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
            <tr style="background: #f9f9f9;">
              <td style="padding: 15px; border: 1px solid #eee;"><strong>Model</strong></td>
              <td style="padding: 15px; border: 1px solid #eee;">${sale.model}</td>
            </tr>
            <tr>
              <td style="padding: 15px; border: 1px solid #eee;"><strong>Invoice No</strong></td>
              <td style="padding: 15px; border: 1px solid #eee;">${sale.invoiceNo}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 15px; border: 1px solid #eee;"><strong>Amount Paid</strong></td>
              <td style="padding: 15px; border: 1px solid #eee; color: #10b981; font-weight: bold;">₹ ${sale.price.toLocaleString()}</td>
            </tr>
          </table>

          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #eee; pt-20">
            <p style="color: #999; font-size: 12px;">This is a computer-generated tax invoice. A downloadable PDF is attached to this email.</p>
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
