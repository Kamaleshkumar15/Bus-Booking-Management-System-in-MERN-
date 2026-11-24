import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Users, QrCode, CheckCircle2 } from 'lucide-react';
import api, { downloadBlobFile } from '../services/api';
import SeatMap2DFallback from '../components/SeatMap2DFallback';

export default function DriverPassengerDetailsPage() {
  const { tripId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pnrInput, setPnrInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  const loadPassengers = () => {
    api
      .get(`/driver/trips/${tripId}/passengers`)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Access denied or trip not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPassengers();
  }, [tripId]);

  const handleVerifyBoarding = async (e) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;
    setVerifying(true);
    try {
      const res = await api.put(`/driver/trips/${tripId}/verify-boarding`, { pnr: pnrInput.trim() });
      toast.success(res.data.message);
      setPnrInput('');
      loadPassengers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid PNR / QR code');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading passenger manifest...</div>;
  }

  if (!data) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-red-600">Unable to load trip passengers.</div>;
  }

  const { trip, passengers = [], seats = [] } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/driver/dashboard" className="text-xs font-bold text-brand-red flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Driver Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-red" /> Trip Passenger Manifest
          </h1>
          <p className="text-sm text-slate-500">
            {trip.routeId?.source} → {trip.routeId?.destination} • {new Date(trip.journeyDate).toDateString()} •{' '}
            {trip.departureTime} • {trip.busId?.busName} ({trip.busId?.busNumber})
          </p>
        </div>

        <button
          onClick={() => downloadBlobFile(`/driver/trips/${tripId}/manifest`, `manifest-${tripId}.pdf`)}
          className="px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-sm font-bold flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Manifest PDF
        </button>
      </div>

      {/* QR / PNR Boarding Verification */}
      <form onSubmit={handleVerifyBoarding} className="premium-card p-5 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 shrink-0">
          <QrCode className="w-5 h-5 text-brand-red" /> Scan QR / Enter PNR:
        </div>
        <input
          type="text"
          value={pnrInput}
          onChange={(e) => setPnrInput(e.target.value)}
          placeholder="e.g. BUS20260001"
          className="flex-1 w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono uppercase"
        />
        <button
          type="submit"
          disabled={verifying}
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-1.5 shrink-0"
        >
          <CheckCircle2 className="w-4 h-4" /> {verifying ? 'Verifying...' : 'Verify Boarding'}
        </button>
      </form>

      <div className="premium-card overflow-hidden">
        {passengers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No confirmed passengers on this trip yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3">Seat</th>
                  <th className="px-5 py-3">Passenger Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">PNR / Booking ID</th>
                  <th className="px-5 py-3">Boarding / Dropping</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {passengers.map((p) => (
                  <tr key={p._id}>
                    <td className="px-5 py-3.5 font-extrabold text-blue-600">{p.seatNumber}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{p.fullName}</div>
                      <div className="text-xs text-slate-500">{p.age} yrs • {p.gender}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <div>{p.phone}</div>
                      <div className="text-slate-400">{p.email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-xs">{p.bookingId?.bookingCode}</td>
                    <td className="px-5 py-3.5 text-xs">
                      <div>In: {p.bookingId?.boardingPoint?.name}</div>
                      <div className="text-slate-400">Out: {p.bookingId?.droppingPoint?.name}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.boarded || p.bookingId?.boarded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.boarded || p.bookingId?.boarded ? 'Boarded' : 'Pending Boarding'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-lg text-slate-900 mb-3">Seat Layout Occupancy</h2>
        <SeatMap2DFallback seats={seats} selectedSeatIds={[]} currentUserId="" onToggleSeat={() => {}} />
      </div>
    </div>
  );
}
