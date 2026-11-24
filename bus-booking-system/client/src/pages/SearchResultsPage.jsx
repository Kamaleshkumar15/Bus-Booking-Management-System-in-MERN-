import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, Clock, SlidersHorizontal, ArrowRight } from 'lucide-react';
import api from '../services/api';
import SearchForm from '../components/SearchForm';

const BUS_TYPES = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Volvo Multi-Axle', 'AC Seater/Sleeper'];

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const source = searchParams.get('source') || '';
  const destination = searchParams.get('destination') || '';
  const journeyDate = searchParams.get('journeyDate') || '';
  const passengers = searchParams.get('passengers') || '1';

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2500);
  const [departureWindow, setDepartureWindow] = useState('');
  const [arrivalWindow, setArrivalWindow] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (source) params.set('source', source);
        if (destination) params.set('destination', destination);
        if (journeyDate) params.set('journeyDate', journeyDate);
        if (passengers) params.set('passengers', passengers);
        if (selectedTypes.length > 0) params.set('busType', selectedTypes.join(','));
        if (maxPrice) params.set('maxPrice', String(maxPrice));
        if (departureWindow) params.set('departureWindow', departureWindow);

        const { data } = await api.get(`/trips/search?${params.toString()}`);
        setTrips(data.trips || []);
      } catch {
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [source, destination, journeyDate, passengers, selectedTypes, maxPrice, departureWindow]);

  const filteredTrips = useMemo(() => {
    if (!arrivalWindow) return trips;
    return trips.filter((t) => {
      const m = t.arrivalTime?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!m) return true;
      let hour = parseInt(m[1], 10);
      const mer = m[3]?.toUpperCase();
      if (mer === 'PM' && hour !== 12) hour += 12;
      if (mer === 'AM' && hour === 12) hour = 0;
      if (arrivalWindow === 'morning') return hour >= 6 && hour < 12;
      if (arrivalWindow === 'afternoon') return hour >= 12 && hour < 17;
      if (arrivalWindow === 'evening') return hour >= 17 && hour < 21;
      if (arrivalWindow === 'night') return hour >= 21 || hour < 6;
      return true;
    });
  }, [trips, arrivalWindow]);

  const toggleBusType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <SearchForm initialValues={{ source, destination, journeyDate, passengers: Number(passengers) }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-3 premium-card p-5 h-fit lg:sticky lg:top-20 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-red" /> Filters
            </h2>
            <button
              onClick={() => {
                setSelectedTypes([]);
                setMaxPrice(2500);
                setDepartureWindow('');
                setArrivalWindow('');
              }}
              className="text-xs text-brand-red font-bold hover:underline"
            >
              Reset
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Max Price: <span className="text-brand-navy">₹{maxPrice}</span>
            </label>
            <input
              type="range"
              min={300}
              max={3000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-red"
            />
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2.5">Bus Type</h3>
            <div className="space-y-2">
              {BUS_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleBusType(type)}
                    className="rounded accent-brand-red w-4 h-4"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Departure Time</h3>
            <select
              value={departureWindow}
              onChange={(e) => setDepartureWindow(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/60"
            >
              <option value="">Any Time</option>
              <option value="morning">Morning (6 AM – 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
              <option value="evening">Evening (5 PM – 9 PM)</option>
              <option value="night">Night (9 PM – 6 AM)</option>
            </select>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Arrival Time</h3>
            <select
              value={arrivalWindow}
              onChange={(e) => setArrivalWindow(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50/60"
            >
              <option value="">Any Time</option>
              <option value="morning">Morning (6 AM – 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
              <option value="evening">Evening (5 PM – 9 PM)</option>
              <option value="night">Night (9 PM – 6 AM)</option>
            </select>
          </div>
        </aside>

        {/* Results List */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-extrabold text-slate-900">
              {loading ? 'Searching buses...' : `${filteredTrips.length} Buses Found`}
              {source && destination ? ` (${source} → ${destination})` : ''}
            </h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-36 bg-white rounded-2xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="premium-card p-12 text-center">
              <p className="text-slate-700 font-bold">No buses matched your search criteria.</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or selecting another date.</p>
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <div key={trip._id} className="premium-card p-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-lg text-slate-900">{trip.busId?.busName}</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-sm">
                        <Star className="w-3 h-3 fill-current" /> {trip.busId?.rating || 4.4}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {trip.busId?.operatorName} • {trip.busId?.busType}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(trip.busId?.amenities || []).slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-between text-center px-2">
                    <div>
                      <div className="text-lg font-extrabold text-slate-900">{trip.departureTime}</div>
                      <div className="text-xs font-medium text-slate-500">{trip.routeId?.source}</div>
                    </div>
                    <div className="flex-1 px-3">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 justify-center mb-1">
                        <Clock className="w-3 h-3" /> {trip.duration}
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-brand-red" />
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-red/40 to-brand-navy/40" />
                        <span className="w-2 h-2 rounded-full bg-brand-navy" />
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-slate-900">{trip.arrivalTime}</div>
                      <div className="text-xs font-medium text-slate-500">{trip.routeId?.destination}</div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex md:flex-col items-center md:items-end justify-between gap-2">
                    <div className="text-right">
                      <div className="text-[11px] font-semibold uppercase text-slate-400">Starts from</div>
                      <div className="text-2xl font-extrabold text-brand-navy">₹{trip.basePrice}</div>
                      <div className="text-xs font-bold text-emerald-600">
                        {trip.availableSeats} Seats available
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/buses/${trip._id}`)}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => navigate(`/trips/${trip._id}/seats`)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-red to-rose-600 hover:opacity-95 text-white text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 transition"
                      >
                        View Seats <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
