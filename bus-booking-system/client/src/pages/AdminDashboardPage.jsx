import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState('analytics');
  const [analytics, setAnalytics] = useState({});
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [newBus, setNewBus] = useState({
    busName: '',
    busNumber: '',
    operatorName: '',
    busType: 'AC Sleeper',
    seatLayoutType: 'sleeper',
    totalSeats: 30,
  });

  const [newRoute, setNewRoute] = useState({
    source: '',
    destination: '',
    distanceKm: 300,
    estimatedDurationMinutes: 360,
  });

  const [newTrip, setNewTrip] = useState({
    busId: '',
    routeId: '',
    journeyDate: new Date().toISOString().split('T')[0],
    departureTime: '08:00 AM',
    arrivalTime: '02:30 PM',
    duration: '6h 30m',
    basePrice: 799,
  });

  const [newDriver, setNewDriver] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Driver@123',
    licenseNumber: '',
    licenseExpiry: '2030-12-31',
    experienceYears: 5,
  });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: 10,
    maxDiscount: 200,
    minOrder: 400,
  });

  const loadAll = async () => {
    try {
      const [aRes, bRes, rRes, tRes, dRes, uRes, bkRes, pRes, rfRes, cpRes, alRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/buses'),
        api.get('/routes'),
        api.get('/trips/search?all=true'),
        api.get('/admin/drivers'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
        api.get('/admin/payments'),
        api.get('/admin/refunds'),
        api.get('/admin/coupons'),
        api.get('/admin/audit-logs'),
      ]);
      setAnalytics(aRes.data.analytics || {});
      const loadedBuses = bRes.data.buses || [];
      const loadedRoutes = rRes.data.routes || [];
      setBuses(loadedBuses);
      setRoutes(loadedRoutes);
      setTrips(tRes.data.trips || []);
      setDrivers(dRes.data.drivers || []);
      setUsers(uRes.data.users || []);
      setBookings(bkRes.data.bookings || []);
      setPayments(pRes.data.payments || []);
      setRefunds(rfRes.data.refunds || []);
      setCoupons(cpRes.data.coupons || []);
      setAuditLogs(alRes.data.logs || []);
      setNewTrip((prev) => ({
        ...prev,
        busId: prev.busId || loadedBuses[0]?._id || '',
        routeId: prev.routeId || loadedRoutes[0]?._id || '',
      }));
    } catch {
      toast.error('Failed to load admin data');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateBus = async (e) => {
    e.preventDefault();
    try {
      await api.post('/buses', { ...newBus, totalSeats: Number(newBus.totalSeats), amenities: ['AC', 'WiFi', 'Charging Point'] });
      toast.success('Bus created');
      setNewBus({ busName: '', busNumber: '', operatorName: '', busType: 'AC Sleeper', seatLayoutType: 'sleeper', totalSeats: 30 });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating bus');
    }
  };

  const handleDeleteBus = async (id) => {
    try {
      await api.delete(`/buses/${id}`);
      toast.success('Bus deleted');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting bus');
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/routes', {
        ...newRoute,
        distanceKm: Number(newRoute.distanceKm),
        estimatedDurationMinutes: Number(newRoute.estimatedDurationMinutes),
      });
      toast.success('Route created');
      setNewRoute({ source: '', destination: '', distanceKm: 300, estimatedDurationMinutes: 360 });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating route');
    }
  };

  const handleDeleteRoute = async (id) => {
    try {
      await api.delete(`/routes/${id}`);
      toast.success('Route deleted');
      loadAll();
    } catch {
      toast.error('Error deleting route');
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trips', {
        ...newTrip,
        basePrice: Number(newTrip.basePrice),
        journeyDate: new Date(newTrip.journeyDate).toISOString(),
      });
      toast.success('Trip & seats created');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating trip');
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await api.delete(`/trips/${id}`);
      toast.success('Trip deleted');
      loadAll();
    } catch {
      toast.error('Error deleting trip');
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/drivers', { ...newDriver, experienceYears: Number(newDriver.experienceYears) });
      toast.success('Driver created');
      setNewDriver({ name: '', email: '', phone: '', password: 'Driver@123', licenseNumber: '', licenseExpiry: '2030-12-31', experienceYears: 5 });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating driver');
    }
  };

  const handleDeleteDriver = async (id) => {
    try {
      await api.delete(`/admin/drivers/${id}`);
      toast.success('Driver deleted');
      loadAll();
    } catch {
      toast.error('Error deleting driver');
    }
  };

  const handleRefundAction = async (id, status) => {
    try {
      await api.put(`/admin/refunds/${id}`, { status });
      toast.success(`Refund ${status}`);
      loadAll();
    } catch {
      toast.error('Error updating refund');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', newCoupon);
      toast.success('Coupon created');
      setNewCoupon({ code: '', discountPercent: 10, maxDiscount: 200, minOrder: 400 });
      loadAll();
    } catch {
      toast.error('Error creating coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success('Coupon deleted');
      loadAll();
    } catch {
      toast.error('Error deleting coupon');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand-red" /> Admin Management Portal
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'analytics', label: 'Analytics' },
          { id: 'buses', label: `Buses (${buses.length})` },
          { id: 'routes', label: `Routes (${routes.length})` },
          { id: 'trips', label: `Trips (${trips.length})` },
          { id: 'drivers', label: `Drivers (${drivers.length})` },
          { id: 'users', label: `Users (${users.length})` },
          { id: 'bookings', label: `Bookings (${bookings.length})` },
          { id: 'payments', label: `Payments (${payments.length})` },
          { id: 'refunds', label: `Refunds (${refunds.length})` },
          { id: 'coupons', label: `Coupons (${coupons.length})` },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === t.id ? 'bg-brand-red text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', val: `₹${analytics.totalRevenue || 0}` },
            { label: 'Total Bookings', val: analytics.totalBookings || 0 },
            { label: 'Active Buses', val: analytics.totalBuses || 0 },
            { label: 'Active Routes', val: analytics.totalRoutes || 0 },
            { label: 'Scheduled Trips', val: analytics.totalTrips || 0 },
            { label: 'Registered Users', val: analytics.totalUsers || 0 },
            { label: 'Drivers', val: analytics.totalDrivers || 0 },
            { label: 'Refund Requests', val: analytics.totalRefunds || 0 },
          ].map((card) => (
            <div key={card.label} className="premium-card p-5">
              <div className="text-xs font-bold uppercase text-slate-400">{card.label}</div>
              <div className="text-2xl font-extrabold text-brand-navy mt-1">{card.val}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'buses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateBus} className="lg:col-span-4 premium-card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-red" /> Add New Bus
            </h2>
            <input type="text" required placeholder="Bus Name" value={newBus.busName} onChange={(e) => setNewBus({ ...newBus, busName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="text" required placeholder="Reg Number" value={newBus.busNumber} onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="text" required placeholder="Operator Name" value={newBus.operatorName} onChange={(e) => setNewBus({ ...newBus, operatorName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <select value={newBus.busType} onChange={(e) => setNewBus({ ...newBus, busType: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
              <option>AC Sleeper</option>
              <option>Non-AC Sleeper</option>
              <option>AC Seater</option>
              <option>Non-AC Seater</option>
              <option>Volvo Multi-Axle</option>
              <option>AC Seater/Sleeper</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={newBus.seatLayoutType} onChange={(e) => setNewBus({ ...newBus, seatLayoutType: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
                <option value="seater">Seater</option>
                <option value="sleeper">Sleeper</option>
                <option value="mixed">Mixed</option>
              </select>
              <input type="number" min={10} max={60} value={newBus.totalSeats} onChange={(e) => setNewBus({ ...newBus, totalSeats: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <button className="w-full py-2.5 rounded-xl bg-brand-red text-white font-bold text-sm">Create Bus</button>
          </form>

          <div className="lg:col-span-8 premium-card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3">Reg #</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {buses.map((b) => (
                  <tr key={b._id}>
                    <td className="px-4 py-3 font-bold">{b.busName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{b.busNumber}</td>
                    <td className="px-4 py-3">{b.busType}</td>
                    <td className="px-4 py-3">{b.totalSeats}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteBus(b._id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateRoute} className="lg:col-span-4 premium-card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-red" /> Add New Route
            </h2>
            <input type="text" required placeholder="Source City" value={newRoute.source} onChange={(e) => setNewRoute({ ...newRoute, source: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="text" required placeholder="Destination City" value={newRoute.destination} onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="number" required placeholder="Distance (km)" value={newRoute.distanceKm} onChange={(e) => setNewRoute({ ...newRoute, distanceKm: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <button className="w-full py-2.5 rounded-xl bg-brand-red text-white font-bold text-sm">Create Route</button>
          </form>

          <div className="lg:col-span-8 premium-card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 font-bold">{r.source} → {r.destination}</td>
                    <td className="px-4 py-3">{r.distanceKm} km</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteRoute(r._id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'trips' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateTrip} className="lg:col-span-4 premium-card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-red" /> Schedule Trip
            </h2>
            <select value={newTrip.busId} onChange={(e) => setNewTrip({ ...newTrip, busId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
              {buses.map((b) => <option key={b._id} value={b._id}>{b.busName} ({b.busNumber})</option>)}
            </select>
            <select value={newTrip.routeId} onChange={(e) => setNewTrip({ ...newTrip, routeId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
              {routes.map((r) => <option key={r._id} value={r._id}>{r.source} → {r.destination}</option>)}
            </select>
            <input type="date" required value={newTrip.journeyDate} onChange={(e) => setNewTrip({ ...newTrip, journeyDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" required placeholder="Departure" value={newTrip.departureTime} onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
              <input type="text" required placeholder="Arrival" value={newTrip.arrivalTime} onChange={(e) => setNewTrip({ ...newTrip, arrivalTime: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            </div>
            <input type="number" required placeholder="Base Price (INR)" value={newTrip.basePrice} onChange={(e) => setNewTrip({ ...newTrip, basePrice: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <button className="w-full py-2.5 rounded-xl bg-brand-red text-white font-bold text-sm">Create Trip</button>
          </form>

          <div className="lg:col-span-8 premium-card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Bus</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 font-bold">{t.routeId?.source} → {t.routeId?.destination}</td>
                    <td className="px-4 py-3">{t.busId?.busName}</td>
                    <td className="px-4 py-3">{new Date(t.journeyDate).toDateString()} ({t.departureTime})</td>
                    <td className="px-4 py-3 font-bold">₹{t.basePrice}</td>
                    <td className="px-4 py-3">{t.availableSeats}/{t.totalSeats}</td>
                    <td className="px-4 py-3">{t.status}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteTrip(t._id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateDriver} className="lg:col-span-4 premium-card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-red" /> Add Driver
            </h2>
            <input type="text" required placeholder="Driver Name" value={newDriver.name} onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="email" required placeholder="Email" value={newDriver.email} onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="tel" required placeholder="Phone" value={newDriver.phone} onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="text" required placeholder="License Number" value={newDriver.licenseNumber} onChange={(e) => setNewDriver({ ...newDriver, licenseNumber: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <button className="w-full py-2.5 rounded-xl bg-brand-red text-white font-bold text-sm">Create Driver</button>
          </form>

          <div className="lg:col-span-8 premium-card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">License</th>
                  <th className="px-4 py-3">Assigned Buses</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d._id}>
                    <td className="px-4 py-3 font-bold">{d.name}</td>
                    <td className="px-4 py-3">{d.email}</td>
                    <td className="px-4 py-3">{d.phone}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.licenseNumber}</td>
                    <td className="px-4 py-3">{d.assignedBuses?.map((b) => b.busNumber).join(', ') || 'None'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteDriver(d._id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="premium-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-bold">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.phone}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="premium-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">PNR</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className="px-4 py-3 font-mono font-bold">{b.bookingCode}</td>
                  <td className="px-4 py-3">{b.userId?.name}</td>
                  <td className="px-4 py-3">{b.seatNumbers?.join(', ')}</td>
                  <td className="px-4 py-3 font-bold">₹{b.totalAmount}</td>
                  <td className="px-4 py-3">{b.bookingStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payments' && (
        <div className="premium-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Txn ID</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.transactionId || p.gatewayOrderId}</td>
                  <td className="px-4 py-3">{p.userId?.name}</td>
                  <td className="px-4 py-3">{p.paymentMethod}</td>
                  <td className="px-4 py-3 font-bold">₹{p.amount}</td>
                  <td className="px-4 py-3">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'refunds' && (
        <div className="premium-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">PNR</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3 font-mono font-bold">{r.bookingCode}</td>
                  <td className="px-4 py-3 font-bold">₹{r.amount}</td>
                  <td className="px-4 py-3">{r.reason}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleRefundAction(r._id, 'APPROVED')} className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateCoupon} className="lg:col-span-4 premium-card p-5 space-y-3 h-fit">
            <h2 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-red" /> Add Coupon
            </h2>
            <input type="text" required placeholder="Code (e.g. SAVE15)" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase" />
            <input type="number" required placeholder="Discount %" value={newCoupon.discountPercent} onChange={(e) => setNewCoupon({ ...newCoupon, discountPercent: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <input type="number" required placeholder="Max Discount (INR)" value={newCoupon.maxDiscount} onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <button className="w-full py-2.5 rounded-xl bg-brand-red text-white font-bold text-sm">Create Coupon</button>
          </form>
          <div className="lg:col-span-8 premium-card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min Order</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                    <td className="px-4 py-3">{c.discountPercent ? `${c.discountPercent}% (up to ₹${c.maxDiscount})` : `₹${c.discountFlat} off`}</td>
                    <td className="px-4 py-3">₹{c.minOrder}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteCoupon(c._id)} className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="premium-card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log._id}>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize font-semibold">{log.actorRole}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3">{log.entity}</td>
                  <td className="px-4 py-3 text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
