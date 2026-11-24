import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';

export default function PassengerDetailsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTrip, selectedSeats, boardingPoint, droppingPoint, setPassengers, setCurrentBooking } = useBooking();

  const [forms, setForms] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedTrip || selectedSeats.length === 0) {
      navigate('/search');
      return;
    }
    setForms(
      selectedSeats.map((seat, idx) => ({
        seatNumber: seat.seatNumber,
        fullName: idx === 0 ? user?.name || '' : '',
        age: '',
        gender: 'Male',
        phone: idx === 0 ? user?.phone || '' : '',
        email: idx === 0 ? user?.email || '' : '',
      }))
    );
  }, [selectedTrip, selectedSeats]);

  const handleChange = (index, field, value) => {
    setForms((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const p of forms) {
      if (!p.fullName.trim() || !p.age || Number(p.age) < 1 || !p.phone.trim() || !p.email.trim()) {
        toast.error(`Please fill all required fields for Seat ${p.seatNumber}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      setPassengers(forms);
      const { data } = await api.post('/bookings', {
        tripId: selectedTrip._id,
        seatIds: selectedSeats.map((s) => s._id),
        passengers: forms,
        boardingPoint,
        droppingPoint,
      });
      setCurrentBooking(data.booking);
      toast.success('Passenger details saved. Proceed to payment.');
      navigate('/booking/payment');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-red" /> Passenger Details
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {selectedTrip?.busId?.busName} • {selectedTrip?.routeId?.source} → {selectedTrip?.routeId?.destination}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {forms.map((p, idx) => (
          <div key={p.seatNumber} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-bold text-slate-900">Passenger {idx + 1}</h2>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                Seat {p.seatNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={p.fullName}
                  onChange={(e) => handleChange(idx, 'fullName', e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={p.age}
                    onChange={(e) => handleChange(idx, 'age', e.target.value)}
                    placeholder="28"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                  <select
                    value={p.gender}
                    onChange={(e) => handleChange(idx, 'gender', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={p.phone}
                  onChange={(e) => handleChange(idx, 'phone', e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={p.email}
                  onChange={(e) => handleChange(idx, 'email', e.target.value)}
                  placeholder="passenger@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-red outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold flex items-center gap-2 shadow-md transition disabled:opacity-60"
          >
            {submitting ? 'Creating Booking...' : 'Continue to Payment'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
