const PDFDocument = require('pdfkit');

const generateTicketPDF = (booking, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingCode}.pdf`);
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 90).fill('#D84E55');
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('RedBus Clone - E-Ticket', 50, 30);
  doc.fontSize(11).font('Helvetica').text(`Booking ID: ${booking.bookingCode}   |   Status: ${booking.bookingStatus}`, 50, 60);

  doc.moveDown(3);
  doc.fillColor('#1E293B');

  const trip = booking.tripId;
  const route = trip?.routeId;
  const bus = trip?.busId;

  doc.fontSize(14).font('Helvetica-Bold').text('Journey Details');
  doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).stroke('#CBD5E1');
  doc.moveDown(0.6);

  doc.fontSize(11).font('Helvetica');
  doc.text(`Route: ${route?.source || ''} -> ${route?.destination || ''}`);
  doc.text(`Journey Date: ${trip?.journeyDate ? new Date(trip.journeyDate).toDateString() : ''}`);
  doc.text(`Departure: ${trip?.departureTime || ''}   |   Arrival: ${trip?.arrivalTime || ''}   |   Duration: ${trip?.duration || ''}`);
  doc.text(`Bus: ${bus?.busName || ''} (${bus?.busNumber || ''}) - ${bus?.busType || ''}`);
  doc.text(`Boarding Point: ${booking.boardingPoint?.name} (${booking.boardingPoint?.time})`);
  doc.text(`Dropping Point: ${booking.droppingPoint?.name} (${booking.droppingPoint?.time})`);

  doc.moveDown(1.2);
  doc.fontSize(14).font('Helvetica-Bold').text('Passenger & Seat Details');
  doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).stroke('#CBD5E1');
  doc.moveDown(0.6);

  doc.fontSize(11).font('Helvetica');
  (booking.passengers || []).forEach((p, idx) => {
    doc.text(`${idx + 1}. ${p.fullName} (${p.age} yrs, ${p.gender})  |  Seat: ${p.seatNumber}  |  Phone: ${p.phone}`);
  });

  doc.moveDown(1.2);
  doc.fontSize(14).font('Helvetica-Bold').text('Payment Summary');
  doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).stroke('#CBD5E1');
  doc.moveDown(0.6);

  doc.fontSize(11).font('Helvetica');
  doc.text(`Base Fare: INR ${booking.baseAmount}`);
  doc.text(`Taxes (GST 5%): INR ${booking.taxAmount}`);
  doc.text(`Convenience Fee: INR ${booking.convenienceFee}`);
  doc.font('Helvetica-Bold').text(`Total Paid: INR ${booking.totalAmount} (${booking.paymentStatus})`);

  doc.moveDown(2);
  doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(
    'Please carry a valid government photo ID during your journey. Arrive at the boarding point 15 minutes prior to departure.',
    { align: 'center' }
  );

  doc.end();
};

const generateManifestPDF = (trip, passengers, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=manifest-${trip._id}.pdf`);
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 80).fill('#0F172A');
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('Driver Passenger Manifest', 40, 25);
  doc.fontSize(10).font('Helvetica').text(
    `${trip.routeId?.source || ''} to ${trip.routeId?.destination || ''}  |  ${new Date(trip.journeyDate).toDateString()}  |  ${trip.departureTime}`,
    40,
    52
  );

  doc.moveDown(3);
  doc.fillColor('#0F172A').fontSize(11).font('Helvetica');
  doc.text(`Bus: ${trip.busId?.busName || ''} (${trip.busId?.busNumber || ''})`);
  doc.text(`Trip Status: ${trip.status}   |   Total Passengers: ${passengers.length}`);
  doc.moveDown(1);

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Seat   |   Passenger Name              |   Age/Gen   |   Phone          |   Booking ID      |   Payment');
  doc.moveTo(40, doc.y + 3).lineTo(555, doc.y + 3).stroke('#94A3B8');
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(9.5);
  passengers.forEach((p) => {
    const line = `${String(p.seatNumber).padEnd(6)} | ${String(p.fullName).slice(0, 26).padEnd(27)} | ${String(p.age + '/' + p.gender[0]).padEnd(9)} | ${String(p.phone).padEnd(14)} | ${String(p.bookingId?.bookingCode || '').padEnd(15)} | ${p.bookingId?.paymentStatus || 'Paid'}`;
    doc.text(line);
  });

  doc.end();
};

module.exports = { generateTicketPDF, generateManifestPDF };
