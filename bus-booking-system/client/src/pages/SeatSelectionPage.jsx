import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { Box, Grid, ArrowRight, Layers } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import BusSeat3DCanvas from '../components/BusSeat3DCanvas';
import SeatMap2DFallback from '../components/SeatMap2DFallback';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function SeatSelectionPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    setSelectedTrip,
    selectedSeats,
    setSelectedSeats,
    boardingPoint,
    setBoardingPoint,
    droppingPoint,
    setDroppingPoint,
  } = useBooking();

  const [trip, setTrip] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [viewMode, setViewMode] = useState(() => (window.innerWidth < 768 ? '2d' : '3d'));
  const [activeDeck, setActiveDeck] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripRes, seatRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/seats/${tripId}`),
        ]);
        const loadedTrip = tripRes.data.trip;
        const loadedSeats = seatRes.data.seats || [];
        setTrip(loadedTrip);
        setSelectedTrip(loadedTrip);
        setSeats(loadedSeats);
        if (loadedTrip.boardingPoints?.length) setBoardingPoint(loadedTrip.boardingPoints[0]);
        if (loadedTrip.droppingPoints?.length) setDroppingPoint(loadedTrip.droppingPoints[0]);

        if (user?._id) {
          const myLocked = loadedSeats.filter((s) => s.status === 'locked' && s.lockedBy === user._id);
          if (myLocked.length > 0 && selectedSeats.length === 0) {
            setSelectedSeats(myLocked);
          }
        }
      } catch {
        toast.error('Failed to load trip seats');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('joinTrip', tripId);
    socket.on('seatUpdate', (payload) => {
      if (payload.tripId === tripId && Array.isArray(payload.seats)) {
        setSeats(payload.seats);
      }
    });

    return () => {
      socket.emit('leaveTrip', tripId);
      socket.disconnect();
    };
  }, [tripId]);

  const selectedSeatIds = useMemo(() => selectedSeats.map((s) => s._id), [selectedSeats]);
  const totalAmount = useMemo(() => selectedSeats.reduce((sum, s) => sum + s.price, 0), [selectedSeats]);
  const hasUpperDeck = useMemo(() => seats.some((s) => s.deck === 'upper'), [seats]);

  const handleToggleSeat = async (seat) => {
    const exists = selectedSeatIds.includes(seat._id);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s._id !== seat._id));
      if (isAuthenticated && seat.status === 'locked' && seat.lockedBy === user?._id) {
        api.post('/seats/release', { tripId, seatIds: [seat._id] }).catch(() => {});
      }
    } else {
      if (selectedSeats.length >= 6) {
        toast.error('Maximum 6 seats can be booked at once');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    if (!isAuthenticated) {
      toast('Please login to lock seats and continue', { icon: '🔐' });
      navigate('/login', { state: { from: { pathname: `/trips/${tripId}/seats` } } });
      return;
    }

    setLocking(true);
    try {
      await api.post('/seats/lock', {
        tripId,
        seatIds: selectedSeatIds,
      });
      toast.success('Seats locked for 10 minutes!');
      navigate('/booking/passengers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to lock selected seats');
    } finally {
      setLocking(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading 3D Bus Cabin...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {trip?.busId?.busName} • Select Your Seats
          </h1>
          <p className="text-sm text-slate-500">
            {trip?.routeId?.source} → {trip?.routeId?.destination} • {trip?.departureTime}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUpperDeck && viewMode === '3d' && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-slate-500 ml-1" />
              {['all', 'lower', 'upper'].map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDeck(d)}
                  className={`px-2.5 py-1 rounded-lg capitalize ${
                    activeDeck === d ? 'bg-brand-navy text-white' : 'text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                viewMode === '3d' ? 'bg-brand-red text-white' : 'text-slate-600'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> 3D View
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${
                viewMode === '2d' ? 'bg-brand-red text-white' : 'text-slate-600'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> 2D Layout
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-5 bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-green-600 inline-block" /> Available
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-blue-600 inline-block" /> Selected
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-red-600 inline-block" /> Booked / Locked
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-slate-500 inline-block" /> Unavailable
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          {viewMode === '3d' ? (
            <BusSeat3DCanvas
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              currentUserId={user?._id}
              onToggleSeat={handleToggleSeat}
              activeDeck={activeDeck}
            />
          ) : (
            <SeatMap2DFallback
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              currentUserId={user?._id}
              onToggleSeat={handleToggleSeat}
            />
          )}
        </div>

        <div className="lg:col-span-4 premium-card p-6 h-fit space-y-5">
          <h2 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
            Booking Summary
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Boarding Point</label>
            <select
              value={boardingPoint?.name || ''}
              onChange={(e) => {
                const found = trip.boardingPoints.find((bp) => bp.name === e.target.value);
                if (found) setBoardingPoint(found);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              {(trip?.boardingPoints || []).map((bp) => (
                <option key={bp.name} value={bp.name}>
                  {bp.name} ({bp.time})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dropping Point</label>
            <select
              value={droppingPoint?.name || ''}
              onChange={(e) => {
                const found = trip.droppingPoints.find((dp) => dp.name === e.target.value);
                if (found) setDroppingPoint(found);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              {(trip?.droppingPoints || []).map((dp) => (
                <option key={dp.name} value={dp.name}>
                  {dp.name} ({dp.time})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Selected Seats ({selectedSeats.length})</span>
              <span className="font-bold text-slate-900">
                {selectedSeats.length > 0 ? selectedSeats.map((s) => s.seatNumber).join(', ') : 'None'}
              </span>
            </div>
            {selectedSeats.map((s) => (
              <div key={s._id} className="flex justify-between text-xs text-slate-500">
                <span>
                  Seat {s.seatNumber} ({s.seatType})
                </span>
                <span>₹{s.price}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-base text-brand-navy">
              <span>Base Fare</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>

          <button
            onClick={handleProceed}
            disabled={locking || selectedSeats.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-red to-rose-600 hover:opacity-95 text-white font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
          >
            {locking ? 'Locking Seats...' : 'Proceed to Passenger Details'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
