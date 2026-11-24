import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Truck, Calendar, Download, Eye } from 'lucide-react';
import api, { downloadBlobFile } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TRIP_STATUSES = ['Scheduled', 'Boarding', 'In Progress', 'Completed', 'Cancelled'];

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDriverData = async () => {
    try {
      const [dashRes, tripsRes] = await Promise.all([
        api.get('/driver/dashboard'),
        api.get('/driver/trips'),
      ]);
      setDashboard(dashRes.data);
      setTrips(tripsRes.data.trips || []);
    } catch {
      toast.error('Failed to load driver dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();
  }, []);

  const handleStatusChange = async (tripId, status) => {
    try {
      await api.put(`/driver/trips/${tripId}/status`, { status });
      toast.success(`Trip status updated to ${status}`);
      fetchDriverData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDownloadManifest = async (tripId) => {
    try {
      await downloadBlobFile(`/driver/trips/${tripId}/manifest`, `manifest-${tripId}.pdf`);
      toast.success('Passenger manifest downloaded');
    } catch {
      toast.error('Failed to download manifest PDF');
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">Loading Driver Dashboard...</div>;
  }

  const stats = dashboard?.stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Driver Dashboard</h1>
        <p className="text-sm text-slate-500">
          {user?.name} • License: {user?.licenseNumber}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Assigned Buses</div>
          <div className="text-3xl font-extrabold text-brand-navy mt-1">{stats.totalAssignedBuses || 0}</div>
        </div>
        <div className="premium-card p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Today's Trips</div>
          <div className="text-3xl font-extrabold text-brand-red mt-1">{stats.todaysTripsCount || 0}</div>
        </div>
        <div className="premium-card p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Total Passengers</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.totalPassengers || 0}</div>
        </div>
        <div className="premium-card p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Upcoming Trips</div>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">{stats.upcomingTripsCount || 0}</div>
        </div>
      </div>

      <div className="premium-card p-6">
        <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-brand-red" /> My Assigned Buses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(dashboard?.assignedBuses || []).map((bus) => (
            <div key={bus._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <div className="font-bold text-slate-900">{bus.busName}</div>
                <div className="text-xs text-slate-500">
                  Reg: {bus.busNumber} • {bus.busType}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-brand-navy text-white text-xs font-bold">
                {bus.totalSeats} Seats
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-red" /> Assigned Trips Schedule
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Route</th>
                <th className="px-5 py-3">Bus</th>
                <th className="px-5 py-3">Booked</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips.map((trip) => (
                <tr key={trip._id}>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold">{new Date(trip.journeyDate).toDateString()}</div>
                    <div className="text-xs text-slate-500">{trip.departureTime} – {trip.arrivalTime}</div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold">
                    {trip.routeId?.source} → {trip.routeId?.destination}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {trip.busId?.busName}
                    <div className="text-slate-400">{trip.busId?.busNumber}</div>
                  </td>
                  <td className="px-5 py-3.5 font-bold">
                    {trip.totalSeats - trip.availableSeats} / {trip.totalSeats}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={trip.status}
                      onChange={(e) => handleStatusChange(trip._id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                    >
                      {TRIP_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <Link
                      to={`/driver/trips/${trip._id}/passengers`}
                      className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Passengers
                    </Link>
                    <button
                      onClick={() => handleDownloadManifest(trip._id)}
                      className="text-brand-red hover:underline text-xs font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Manifest
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
