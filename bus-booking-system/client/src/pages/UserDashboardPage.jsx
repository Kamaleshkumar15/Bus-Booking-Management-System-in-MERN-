import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Ticket, CreditCard, Download, LogOut, Save, Trash2 } from 'lucide-react';
import api, { downloadBlobFile } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UserDashboardPage() {
  const { user, updateUserState, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    address: user?.address || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/bookings/my-bookings'), api.get('/payments/history')])
      .then(([bRes, pRes]) => {
        setBookings(bRes.data.bookings || []);
        setPayments(pRes.data.payments || []);
      })
      .catch(() => {});
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', profileForm);
      updateUserState(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account?')) return;
    try {
      await api.delete('/users/account');
      toast.success('Account deactivated');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not deactivate account');
    }
  };

  const handleDownloadTicket = async (booking) => {
    try {
      await downloadBlobFile(`/bookings/${booking._id}/ticket`, `ticket-${booking.bookingCode}.pdf`);
      toast.success('Ticket PDF downloaded');
    } catch {
      toast.error('Failed to download ticket PDF');
    }
  };

  const upcomingCount = bookings.filter((b) => b.bookingStatus === 'Confirmed').length;
  const completedCount = bookings.filter((b) => b.bookingStatus === 'Completed').length;
  const cancelledCount = bookings.filter((b) => b.bookingStatus === 'Cancelled').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome, {user?.name}</h1>
          <p className="text-sm text-slate-500">{user?.email} • Customer Dashboard</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/my-bookings"
            className="px-4 py-2 rounded-xl bg-brand-red text-white text-sm font-bold hover:bg-brand-redDark transition"
          >
            All Bookings
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="premium-card p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Upcoming Trips</div>
          <div className="text-3xl font-extrabold text-brand-navy mt-1">{upcomingCount}</div>
        </div>
        <div className="premium-card p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Completed Trips</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
        </div>
        <div className="premium-card p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Cancelled Tickets</div>
          <div className="text-3xl font-extrabold text-red-600 mt-1">{cancelledCount}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
        {[
          { id: 'bookings', label: 'Recent Bookings', icon: Ticket },
          { id: 'payments', label: 'Payment History', icon: CreditCard },
          { id: 'profile', label: 'My Profile', icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
              activeTab === id ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && (
        <div className="premium-card overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No bookings yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3">Booking ID</th>
                    <th className="px-5 py-3">Route</th>
                    <th className="px-5 py-3">Seats</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.slice(0, 6).map((b) => (
                    <tr key={b._id}>
                      <td className="px-5 py-3.5 font-mono font-bold">{b.bookingCode}</td>
                      <td className="px-5 py-3.5">
                        {b.tripId?.routeId?.source} → {b.tripId?.routeId?.destination}
                      </td>
                      <td className="px-5 py-3.5 font-semibold">{b.seatNumbers?.join(', ')}</td>
                      <td className="px-5 py-3.5 font-bold">₹{b.totalAmount}</td>
                      <td className="px-5 py-3.5">
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
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleDownloadTicket(b)}
                          className="text-brand-red hover:underline font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="premium-card overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No payment transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3">Transaction ID</th>
                    <th className="px-5 py-3">Booking</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td className="px-5 py-3.5 font-mono text-xs">{p.transactionId || p.gatewayOrderId}</td>
                      <td className="px-5 py-3.5 font-semibold">{p.bookingId?.bookingCode}</td>
                      <td className="px-5 py-3.5">{p.paymentMethod}</td>
                      <td className="px-5 py-3.5 font-bold">₹{p.amount}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} className="premium-card p-6 max-w-xl space-y-4">
          <h2 className="font-bold text-lg text-slate-900">Update Profile</h2>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
            <select
              value={profileForm.gender}
              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
            <input
              type="text"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-brand-red text-white font-bold text-sm flex items-center gap-2 hover:bg-brand-redDark"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDeactivate}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Deactivate Account
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
