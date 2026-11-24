import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, XCircle, Ticket } from 'lucide-react';
import api, { downloadBlobFile } from '../services/api';

export default function UserBookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadBookings = () => {
    setLoading(true);
    api
      .get('/bookings/my-bookings')
      .then((res) => setBookings(res.data.bookings || []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking and release your seats?')) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      toast.success('Booking cancelled & refund initiated');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to cancel booking');
    }
  };

  const filtered = bookings.filter((b) => (filter === 'All' ? true : b.bookingStatus === filter));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-brand-red" /> My Booking History
        </h1>
        <div className="flex gap-2">
          {['All', 'Confirmed', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === tab ? 'bg-brand-navy text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slate-500">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          No bookings found under "{filter}".
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-brand-navy">{b.bookingCode}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        b.bookingStatus === 'Confirmed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.bookingStatus === 'Cancelled'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {b.tripId?.routeId?.source} → {b.tripId?.routeId?.destination}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {b.tripId?.busId?.busName} • {new Date(b.tripId?.journeyDate).toDateString()} •{' '}
                    {b.tripId?.departureTime}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Seats: {b.seatNumbers?.join(', ')}</div>
                  <div className="text-xl font-extrabold text-brand-navy">₹{b.totalAmount}</div>
                  <div className="text-xs text-slate-500">Payment: {b.paymentStatus}</div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Boarding: <strong className="text-slate-700">{b.boardingPoint?.name}</strong> • Dropping:{' '}
                  <strong className="text-slate-700">{b.droppingPoint?.name}</strong>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadBlobFile(`/bookings/${b._id}/ticket`, `ticket-${b.bookingCode}.pdf`)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Ticket
                  </button>
                  {b.bookingStatus === 'Confirmed' && (
                    <button
                      onClick={() => handleCancel(b._id)}
                      className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
