import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Download, Ticket, Printer } from 'lucide-react';
import api, { downloadBlobFile } from '../services/api';

function buildTicketQr(text) {
  const size = 21;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));
  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        grid[r0 + r][c0 + c] = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (hash >>> 0) % 2 === 0;
    }
  }
  return grid;
}

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data.booking))
      .catch(() => toast.error('Could not load booking details'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const qrMatrix = useMemo(() => {
    if (!booking) return [];
    return buildTicketQr(`${booking.bookingCode}|${booking.seatNumbers?.join(',')}`);
  }, [booking]);

  const handleDownloadTicket = async () => {
    try {
      await downloadBlobFile(`/bookings/${bookingId}/ticket`, `ticket-${booking.bookingCode}.pdf`);
      toast.success('Ticket PDF downloaded');
    } catch {
      toast.error('Failed to download ticket PDF');
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto p-12 text-center text-slate-500">Loading confirmation...</div>;
  }

  if (!booking) {
    return <div className="max-w-3xl mx-auto p-12 text-center text-red-600">Booking not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="premium-card overflow-hidden">
        <div className="bg-emerald-600 text-white p-8 text-center">
          <CheckCircle2 className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-2xl sm:text-3xl font-extrabold">Booking Confirmed!</h1>
          <p className="text-emerald-100 text-sm mt-1">
            PNR / Booking ID: <span className="font-bold text-white font-mono">{booking.bookingCode}</span>
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0 text-center">
              <svg viewBox="0 0 21 21" className="w-28 h-28 mx-auto" aria-label="Boarding QR Code">
                <rect width="21" height="21" fill="#FFFFFF" />
                {qrMatrix.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#0F172A" /> : null
                  )
                )}
              </svg>
              <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 block">Scan at Boarding</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm flex-1 w-full">
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">Route</span>
                <div className="font-bold text-slate-900">
                  {booking.tripId?.routeId?.source} → {booking.tripId?.routeId?.destination}
                </div>
                <div className="text-slate-500 text-xs">
                  {new Date(booking.tripId?.journeyDate).toDateString()} • {booking.tripId?.departureTime}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">Bus & Seats</span>
                <div className="font-bold text-slate-900">{booking.tripId?.busId?.busName}</div>
                <div className="text-slate-500 text-xs">Seats: {booking.seatNumbers?.join(', ')}</div>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">Transaction ID</span>
                <div className="font-mono font-bold text-slate-800 text-xs">
                  {booking.paymentId?.transactionId || 'Verified'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">Total Paid</span>
                <div className="font-extrabold text-brand-navy text-lg">₹{booking.totalAmount}</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Passengers</h2>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {(booking.passengers || []).map((p) => (
                <div key={p._id} className="p-3.5 flex justify-between text-sm">
                  <div>
                    <span className="font-bold text-slate-800">{p.fullName}</span>{' '}
                    <span className="text-slate-500">({p.age} yrs, {p.gender})</span>
                  </div>
                  <span className="font-bold text-blue-600">Seat {p.seatNumber}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadTicket}
              className="flex-1 py-3 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Download className="w-4 h-4" /> Download Ticket PDF
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <Link
              to="/my-bookings"
              className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 transition"
            >
              <Ticket className="w-4 h-4" /> My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
