import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, ArrowRightLeft, Search } from 'lucide-react';

export default function SearchForm({ initialValues = {} }) {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [source, setSource] = useState(initialValues.source || 'Bengaluru');
  const [destination, setDestination] = useState(initialValues.destination || 'Chennai');
  const [journeyDate, setJourneyDate] = useState(initialValues.journeyDate || todayStr);
  const [passengers, setPassengers] = useState(initialValues.passengers || 1);

  const handleSwap = () => {
    setSource(destination);
    setDestination(source);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      source: source.trim(),
      destination: destination.trim(),
      journeyDate,
      passengers: String(passengers),
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel rounded-3xl p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-slate-900"
    >
      <div className="md:col-span-3 relative">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">From</label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-brand-red absolute left-3.5 top-3.5" />
          <input
            type="text"
            required
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source city"
            className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm font-semibold transition"
          />
        </div>
      </div>

      <div className="md:col-span-1 flex justify-center">
        <button
          type="button"
          onClick={handleSwap}
          className="p-3 rounded-full border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-brand-red text-slate-600 shadow-sm transition-all active:scale-95"
          title="Swap cities"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="md:col-span-3">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-brand-navy absolute left-3.5 top-3.5" />
          <input
            type="text"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination city"
            className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm font-semibold transition"
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Journey Date</label>
        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="date"
            required
            min={todayStr}
            value={journeyDate}
            onChange={(e) => setJourneyDate(e.target.value)}
            className="w-full pl-10 pr-2 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm font-semibold transition"
          />
        </div>
      </div>

      <div className="md:col-span-1">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Seats</label>
        <div className="relative">
          <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="number"
            min={1}
            max={6}
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full pl-9 pr-2 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none text-sm font-semibold transition"
          />
        </div>
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-red to-rose-600 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-all active:scale-[0.99]"
        >
          <Search className="w-4 h-4" /> Search Buses
        </button>
      </div>
    </form>
  );
}
