import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Shield, Clock, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function BusDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/trips/${id}`)
      .then((res) => setTrip(res.data.trip))
      .catch(() => setTrip(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-5xl mx-auto p-8 text-center text-slate-500">Loading bus details...</div>;
  }

  if (!trip) {
    return <div className="max-w-5xl mx-auto p-8 text-center text-red-600">Bus trip not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{trip.busId?.busName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-current" /> {trip.busId?.rating} ({trip.busId?.totalReviews} reviews)
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {trip.busId?.operatorName} • {trip.busId?.busType} • Reg: {trip.busId?.busNumber}
            </p>
          </div>
          <button
            onClick={() => navigate(`/trips/${trip._id}/seats`)}
            className="px-6 py-3 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold flex items-center gap-2 shadow-md transition"
          >
            Select Seats in 3D <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Route</span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {trip.routeId?.source} → {trip.routeId?.destination}
            </p>
            <p className="text-sm text-slate-500">{trip.routeId?.distanceKm} km</p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Schedule</span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {trip.departureTime} – {trip.arrivalTime}
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Duration: {trip.duration}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Fare & Availability</span>
            <p className="text-lg font-bold text-brand-navy mt-1">From ₹{trip.basePrice}</p>
            <p className="text-sm text-emerald-600 font-semibold">{trip.availableSeats} / {trip.totalSeats} seats open</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-red" /> Amenities
          </h3>
          <div className="flex flex-wrap gap-2">
            {(trip.busId?.amenities || []).map((a) => (
              <span key={a} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-red" /> Boarding Points
          </h3>
          <ul className="space-y-3">
            {(trip.boardingPoints || []).map((bp, idx) => (
              <li key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <div>
                  <div className="font-semibold text-slate-800">{bp.name}</div>
                  <div className="text-xs text-slate-500">{bp.address}</div>
                </div>
                <span className="font-bold text-slate-700">{bp.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-navy" /> Dropping Points
          </h3>
          <ul className="space-y-3">
            {(trip.droppingPoints || []).map((dp, idx) => (
              <li key={idx} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <div>
                  <div className="font-semibold text-slate-800">{dp.name}</div>
                  <div className="text-xs text-slate-500">{dp.address}</div>
                </div>
                <span className="font-bold text-slate-700">{dp.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
