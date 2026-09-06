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
 * Generates a PDF buffer for the test ride booking slip.
 */
async function generateBookingSlipPDFBuffer(booking: any, showroom: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#10b981';
    
    // Showroom Info
    doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(showroom.name || 'AMRESH AUTOMOBILES', { align: 'left' });
    doc.fillColor('#666666').fontSize(10).font('Helvetica-Oblique').text(showroom.tagline || 'Drive Electric • Live Smart');
    doc.moveDown(0.5);
    doc.fillColor('#444444').font('Helvetica').fontSize(9).text(showroom.address || '', { width: 300 });
    doc.text(`Contact: ${showroom.contact || ''}`);

    doc.moveTo(50, 45).lineTo(545, 45).strokeColor('#eeeeee').stroke();
    
    doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold').text('TEST RIDE SLIP', 300, 60, { align: 'right' });
    doc.fillColor(primaryColor).fontSize(12).text(`# ${booking.id?.substring(0, 8).toUpperCase() || 'AA-TR'}`, 350, 90, { align: 'right', width: 195 });
    doc.fillColor('#888888').fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });

    doc.moveDown(3);
    const sectionY = doc.y;

    // Rider Details Column
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('RIDER DETAILS', 50, sectionY);
    doc.fillColor('#000000').fontSize(12).text(booking.customerName.toUpperCase(), 50, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(`Mobile: ${booking.mobile}`, 50, sectionY + 30);
    doc.text(`Email: ${booking.email}`, 50, sectionY + 43);

    // Appointment Column
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('APPOINTMENT', 300, sectionY);
    doc.fillColor('#000000').fontSize(12).text(booking.scooterModel.toUpperCase(), 300, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(`Date: ${booking.date}`, 300, sectionY + 30);
    doc.text(`Slot: ${booking.time}`, 300, sectionY + 43);

    doc.moveDown(5);
    
    // Showroom Guidance Box
    const boxY = doc.y;
    doc.rect(50, boxY, 495, 80).fill('#f9f9f9').stroke('#eeeeee');
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('SHOWROOM LOCATION', 60, boxY + 15);
    doc.fillColor('#000000').fontSize(11).text(showroom.name, 60, boxY + 30);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(showroom.address, 60, boxY + 45, { width: 450 });

    if (showroom.googleMapUrl) {
      doc.moveDown(6);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Navigate to Showroom:', 50, doc.y);
      doc.fillColor('blue').fontSize(9).text(showroom.googleMapUrl, { link: showroom.googleMapUrl, underline: true });
    }

    // Terms
    doc.moveDown(3);
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('IMPORTANT GUIDELINES:');
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text('1. Please carry your original Driving License.');
    doc.text('2. Wearing a helmet is mandatory (Rider & Pillion).');
    doc.text('3. Please report 15 minutes before your scheduled slot.');
    doc.text('4. Booking is subject to vehicle availability and weather conditions.');

    // Footer
    doc.fillColor('#888888').fontSize(8).text('This is a computer-generated booking slip and does not require a signature.', 50, 720, { align: 'center', width: 495 });
    doc.moveDown(1);
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(`Team ${showroom.name || 'Amresh Automobiles'}`, { align: 'center', width: 495 });

    doc.end();
  });
}

/**
 * Generates a PDF buffer for the sales invoice.
 */
async function generateInvoicePDFBuffer(sale: any, showroom: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header - Branded Colors
    const primaryColor = '#10b981';
    
    // Showroom Info
    doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(showroom.name || 'AMRESH AUTOMOBILES', { align: 'left' });
    doc.fillColor('#666666').fontSize(10).font('Helvetica-Oblique').text(showroom.tagline || 'Drive Electric • Live Smart');
    doc.moveDown(0.5);
    doc.fillColor('#444444').font('Helvetica').fontSize(9).text(showroom.address || '', { width: 300 });
    doc.text(`GSTIN: ${showroom.gstin || 'N/A'}`);
    doc.text(`Contact: ${showroom.contact || ''}`);

    // Invoice Title
    doc.moveTo(50, 45).lineTo(545, 45).strokeColor('#eeeeee').stroke();
    
    doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold').text('INVOICE', 350, 60, { align: 'right' });
    doc.fillColor(primaryColor).fontSize(12).text(`# ${sale.invoiceNo}`, { align: 'right' });
    doc.fillColor('#888888').fontSize(9).font('Helvetica').text(`Date: ${sale.soldAt ? new Date(sale.soldAt).toLocaleDateString('en-IN') : 'N/A'}`, { align: 'right' });

    doc.moveDown(3);
    const sectionY = doc.y;

    // Buyer Details Column
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('BUYER DETAILS', 50, sectionY);
    doc.fillColor('#000000').fontSize(12).text(sale.customerName.toUpperCase(), 50, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(sale.address || '', 50, sectionY + 30, { width: 200 });
    doc.text(`Mobile: ${sale.mobile}`, 50, sectionY + 55);
    doc.text(`ID: ${sale.idType} - ${sale.idNumber}`, 50, sectionY + 68);

    // Vehicle Details Column
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('VEHICLE SPECIFICATIONS', 300, sectionY);
    doc.fillColor('#000000').fontSize(12).text(sale.model.toUpperCase(), 300, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(`Variant: ${sale.variant || 'Standard'}`, 300, sectionY + 30);
    doc.text(`Chassis: ${sale.chassisNumber}`, 300, sectionY + 43);
    
    let currentY = sectionY + 56;
    if (sale.batterySerialNumber) {
      doc.text(`Battery S/N: ${sale.batterySerialNumber}`, 300, currentY);
      currentY += 13;
    }
    
    doc.text(`Color: ${sale.color}`, 300, currentY);
    currentY += 13;
    doc.text(`Battery: ${sale.batteryType} (${sale.batteryCapacity || 'N/A'})`, 300, currentY);

    doc.moveDown(8);

    // Table Header
    const tableTop = doc.y + 20;
    doc.rect(50, tableTop, 495, 25).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('DESCRIPTION', 60, tableTop + 7);
    doc.text('HSN', 400, tableTop + 7);
    doc.text('AMOUNT (INR)', 470, tableTop + 7, { align: 'right', width: 70 });

    // Table Row
    const rowY = tableTop + 35;
    doc.fillColor('#000000').font('Helvetica').text(`${sale.model} Electric Vehicle`, 60, rowY);
    doc.fontSize(8).fillColor('#666666').text(`HSN Code: ${sale.hsn || '871160'}`, 60, rowY + 12);
    
    doc.fillColor('#000000').fontSize(10).text(sale.hsn || '871160', 400, rowY);
    doc.font('Helvetica-Bold').text(sale.price.toLocaleString('en-IN'), 470, rowY, { align: 'right', width: 70 });

    doc.moveTo(50, rowY + 30).lineTo(545, rowY + 30).strokeColor('#eeeeee').stroke();

    // Summary
    const summaryY = rowY + 50;
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Payment Method:', 350, summaryY);
    doc.fillColor('#000000').font('Helvetica-Bold').text(sale.paymentMethod, 450, summaryY, { align: 'right', width: 90 });
    
    doc.fillColor('#666666').fontSize(9).font('Helvetica').text('Subtotal:', 350, summaryY + 15);
    doc.fillColor('#000000').text(sale.price.toLocaleString('en-IN'), 450, summaryY + 15, { align: 'right', width: 90 });

    doc.rect(340, summaryY + 35, 205, 30).fill('#f9f9f9');
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('TOTAL PAID', 350, summaryY + 43);
    doc.text(`INR ${sale.price.toLocaleString('en-IN')}`, 450, summaryY + 43, { align: 'right', width: 90 });

    // Footer
    const footerY = 720;
    doc.fillColor('#888888').fontSize(8).font('Helvetica').text('This is a computer-generated invoice and does not require a physical signature.', 50, footerY, { align: 'center', width: 495 });
    doc.moveDown(1);
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text(`Thank you for choosing ${showroom.name}!`, { align: 'center', width: 495 });

    doc.end();
  });
}

/**
 * Generates a PDF buffer for the service booking slip.
 */
async function generateServiceSlipPDFBuffer(booking: any, showroom: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#10b981';
    
    // Showroom Info
    doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(showroom.name || 'AMRESH AUTOMOBILES', { align: 'left' });
    doc.fillColor('#666666').fontSize(10).font('Helvetica-Oblique').text(showroom.tagline || 'Drive Electric • Live Smart');
    doc.moveDown(0.5);
    doc.fillColor('#444444').font('Helvetica').fontSize(9).text(showroom.address || '', { width: 300 });
    doc.text(`Contact: ${showroom.contact || ''}`);

    doc.moveTo(50, 45).lineTo(545, 45).strokeColor('#eeeeee').stroke();
    
    doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold').text('SERVICE SLIP', 300, 60, { align: 'right' });
    doc.fillColor(primaryColor).fontSize(12).text(`# ${booking.serviceNo}`, { align: 'right' });
    doc.fillColor('#888888').fontSize(9).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });

    doc.moveDown(3);
    const sectionY = doc.y;

    // Customer Details
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('CUSTOMER DETAILS', 50, sectionY);
    doc.fillColor('#000000').fontSize(12).text(booking.customerName.toUpperCase(), 50, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(`Mobile: ${booking.mobile}`, 50, sectionY + 30);
    doc.text(`Email: ${booking.email}`, 50, sectionY + 43);

    // Vehicle Details
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('VEHICLE DETAILS', 300, sectionY);
    doc.fillColor('#000000').fontSize(12).text(booking.scooterModel?.toUpperCase() || booking.model?.toUpperCase() || 'EV SCOOTER', 300, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(`Chassis: ${booking.chassisNumber}`, 300, sectionY + 30);
    doc.text(`Current KM: ${booking.currentKm}`, 300, sectionY + 43);

    doc.moveDown(4);
    
    // Appointment Details Box
    const apptY = doc.y + 20;
    doc.rect(50, apptY, 495, 100).fill('#f9f9f9').stroke('#eeeeee');
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('APPOINTMENT SUMMARY', 60, apptY + 15);

    doc.fillColor('#000000').font('Helvetica').fontSize(11).text(`Service Type: ${booking.serviceType}`, 60, apptY + 35);
    doc.text(`Scheduled Date: ${booking.date || booking.preferredDate}`, 60, apptY + 50);
    doc.text(`Arrival Slot: ${booking.time || booking.preferredTime}`, 60, apptY + 65);
    doc.text(`Service Center: ${showroom.name || 'Amresh Automobiles'}`, 60, apptY + 80);

    // Showroom Address Guidance
    doc.moveDown(6);
    const guideY = doc.y;
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('REPORT TO:', 50, guideY);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(showroom.address, 50, guideY + 15, { width: 450 });

    if (showroom.googleMapUrl) {
      doc.moveDown(3);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Navigate to Service Center:', 50, doc.y);
      doc.fillColor('blue').fontSize(9).text(showroom.googleMapUrl, { link: showroom.googleMapUrl, underline: true });
    }

    if (booking.notes) {
      doc.moveDown(4);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('ADDITIONAL NOTES');
      doc.fillColor('#444444').fontSize(9).font('Helvetica').text(booking.notes, { width: 450 });
    }

    // Guidelines
    doc.moveDown(4);
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('IMPORTANT GUIDELINES:');
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text('1. Please arrive 15 minutes prior to your slot.');
    doc.text('2. Ensure your vehicle has at least 20% battery charge.');
    doc.text('3. Bring this slip and a valid ID for faster processing.');

    // Footer
    doc.fillColor('#888888').fontSize(8).text('This is a computer-generated service slip.', 50, 720, { align: 'center', width: 495 });
    doc.end();
  });
}

/**
 * Generates a PDF buffer for the finalized service bill.
 */
async function generateServiceBillPDFBuffer(booking: any, showroom: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#10b981';
    
    // Showroom Header
    doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text(showroom.name || 'AMRESH AUTOMOBILES', { align: 'left' });
    doc.fillColor('#666666').fontSize(10).font('Helvetica-Oblique').text(showroom.tagline || 'Drive Electric • Live Smart');
    doc.moveDown(0.5);
    doc.fillColor('#444444').font('Helvetica').fontSize(9).text(showroom.address || '', { width: 300 });
    doc.text(`GSTIN: ${showroom.gstin || 'N/A'}`);
    doc.text(`Contact: ${showroom.contact || ''}`);

    doc.moveTo(50, 45).lineTo(545, 45).strokeColor('#eeeeee').stroke();
    
    doc.fillColor('#000000').fontSize(24).font('Helvetica-Bold').text('SERVICE BILL', 300, 60, { align: 'right' });
    doc.fillColor(primaryColor).fontSize(12).text(`# ${booking.serviceNo}`, { align: 'right' });
    doc.fillColor('#888888').fontSize(9).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });

    doc.moveDown(3);
    const sectionY = doc.y;

    // Customer
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('CUSTOMER', 50, sectionY);
    doc.fillColor('#000000').fontSize(12).text(booking.customerName.toUpperCase(), 50, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(`Mobile: ${booking.mobile}`, 50, sectionY + 30);

    // Vehicle
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('VEHICLE', 300, sectionY);
    doc.fillColor('#000000').fontSize(12).text(booking.model.toUpperCase(), 300, sectionY + 15);
    doc.fillColor('#444444').fontSize(9).font('Helvetica').text(`Chassis: ${booking.chassisNumber}`, 300, sectionY + 30);
    doc.text(`Odometer: ${booking.currentKm} KM`, 300, sectionY + 43);

    doc.moveDown(6);
    const tableTop = doc.y;

    // Table Headers
    doc.rect(50, tableTop, 495, 25).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('JOB / PART DESCRIPTION', 60, tableTop + 7);
    doc.text('AMOUNT (INR)', 470, tableTop + 7, { align: 'right', width: 70 });

    let currentY = tableTop + 35;
    
    // Labor Charge Row
    doc.fillColor('#000000').font('Helvetica').text(`${booking.serviceType} Service Charge (Labor)`, 60, currentY);
    doc.text(booking.laborCharge.toLocaleString('en-IN'), 470, currentY, { align: 'right', width: 70 });
    currentY += 20;

    // Parts Rows
    if (booking.parts && booking.parts.length > 0) {
      booking.parts.forEach((part: any) => {
        doc.text(part.name.toUpperCase(), 60, currentY);
        doc.text(part.price.toLocaleString('en-IN'), 470, currentY, { align: 'right', width: 70 });
        currentY += 20;
      });
    }

    doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor('#eeeeee').stroke();
    currentY += 15;

    // Total
    doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('TOTAL BILL', 300, currentY);
    doc.text(`INR ${booking.totalAmount?.toLocaleString('en-IN')}`, 450, currentY, { align: 'right', width: 90 });

    // Footer
    doc.fillColor('#888888').fontSize(8).text('This is a computer-generated service bill.', 50, 720, { align: 'center', width: 495 });
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

export async function sendServiceConfirmationEmail(email: string, details: {
  serviceNo: string;
  customerName: string;
  scooterModel: string;
  date: string;
  time: string;
  branchName: string;
  serviceType: string;
  currentKm: number;
  chassisNumber: string;
  notes?: string;
  googleMapUrl?: string;
}, showroom: any) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  try {
    // Generate PDF Buffer
    const pdfBuffer = await generateServiceSlipPDFBuffer({
      ...details,
      googleMapUrl: showroom.googleMapUrl,
    }, showroom);

    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles Service <service@contact.amreshautomobiles.in>',
      to: email,
      subject: `Service Appointment Booked - ${details.serviceNo}`,
      attachments: [
        {
          filename: `ServiceSlip_${details.serviceNo.replace(/\//g, '_')}.pdf`,
          content: pdfBuffer,
        },
      ],
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981; border-bottom: 20px solid #10b981; padding-bottom: 10px;">Service Request Received</h2>
          <p>Hi <strong>${details.customerName}</strong>,</p>
          <p>Your <strong>${details.serviceType}</strong> appointment for your <strong>${details.scooterModel}</strong> has been successfully registered.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0;"><strong>Service Number:</strong> ${details.serviceNo}</p>
            <p style="margin: 5px 0;"><strong>Service Center:</strong> ${details.branchName}</p>
            <p style="margin: 5px 0;"><strong>Scheduled Date:</strong> ${details.date}</p>
            <p style="margin: 5px 0;"><strong>Arrival Slot:</strong> ${details.time}</p>
            ${showroom.googleMapUrl ? `<p style="margin: 15px 0;"><a href="${showroom.googleMapUrl}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Navigate to Showroom</a></p>` : ''}
          </div>
          
          <p>We have attached your official <strong>Service Slip (PDF)</strong> to this email. Please bring it with you for a faster check-in process.</p>
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

export async function sendServiceCompletionEmail(email: string, details: {
  serviceNo: string;
  customerName: string;
  model: string;
  preferredDate: string;
  branchName: string;
  serviceType: string;
  totalAmount: number;
  parts: any[];
  laborCharge: number;
  currentKm: number;
  chassisNumber: string;
}, showroom: any) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  try {
    // Generate PDF Buffer for final bill
    const pdfBuffer = await generateServiceBillPDFBuffer(details, showroom);

    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles Service <service@contact.amreshautomobiles.in>',
      to: email,
      subject: `Service Completed - ${details.serviceNo}`,
      attachments: [
        {
          filename: `ServiceBill_${details.serviceNo.replace(/\//g, '_')}.pdf`,
          content: pdfBuffer,
        },
      ],
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Service Completed!</h2>
          <p>Hi <strong>${details.customerName}</strong>,</p>
          <p>Your <strong>${details.model}</strong> has been serviced and is ready for pickup.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0;"><strong>Service Number:</strong> ${details.serviceNo}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${details.serviceType}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹ ${details.totalAmount.toLocaleString('en-IN')}</p>
            <p style="margin: 5px 0;"><strong>Center:</strong> ${details.branchName}</p>
          </div>
          
          <p>Please find your detailed **Digital Service Bill** attached as a PDF.</p>
          <p>Thank you for choosing Amresh Automobiles for your maintenance needs.</p>
          <p>Best Regards,<br/><strong>Team Amresh Automobiles Service</strong></p>
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
  id?: string;
}, showroom: any) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'API Key missing' };

  const isConfirmed = details.status === 'confirmed';
  const subject = isConfirmed ? 'Test Ride Confirmed! - Amresh Automobiles' : 'Update on your Test Ride Booking';
  
  try {
    let attachments = [];
    if (isConfirmed) {
      // Generate PDF for the confirmed booking
      const pdfBuffer = await generateBookingSlipPDFBuffer({
        ...details,
      }, showroom);
      
      attachments.push({
        filename: `BookingSlip_${details.customerName.replace(/\s/g, '_')}.pdf`,
        content: pdfBuffer,
      });
    }

    const { data, error } = await resend.emails.send({
      from: 'Amresh Automobiles <bookings@contact.amreshautomobiles.in>',
      to: email,
      subject: subject,
      attachments: attachments,
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

          ${isConfirmed ? `<p>We have attached your official **Test Ride Slip** as a PDF. Please bring it along with a valid Driving License.</p>` : ''}
          
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
    // Generate PDF Buffer
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
              <h1 style="margin: 0; color: #10b981; text-transform: uppercase; font-size: 24px;">${showroom.name || 'Amresh Automobiles'}</h1>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">${showroom.address || 'Showroom location'}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 32px; color: #000;">INVOICE</h2>
              <p style="margin: 5px 0; color: #10b981; font-weight: bold;"># ${sale.invoiceNo}</p>
            </div>
          </div>
          <div style="padding: 20px 0;">
            <p>Hello <strong>${sale.customerName}</strong>,</p>
            <p>Thank you for choosing <strong>${showroom.name || 'Amresh Automobiles'}</strong> for your electric mobility journey!</p>
            <p>We are pleased to attach your official invoice for the <strong>${sale.model}</strong>.</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Vehicle:</strong> ${sale.model}</p>
              <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹ ${sale.price.toLocaleString('en-IN')}</p>
              <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date(sale.soldAt).toLocaleDateString('en-IN')}</p>
            </div>

            <p style="font-size: 13px; color: #666;">Please find the detailed GST invoice attached as a PDF to this email.</p>
          </div>
          <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999; text-align: center;">
            <p>© ${new Date().getFullYear()} ${showroom.name || 'Amresh Automobiles'}. Drive Electric • Live Smart.</p>
          </div>
        </div>
      `,
    });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    console.error('PDF Email Error:', error);
    return { success: false, error };
  }
}
