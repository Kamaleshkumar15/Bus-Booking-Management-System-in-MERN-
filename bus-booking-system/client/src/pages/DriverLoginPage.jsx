import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DriverLoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password, portal: 'driver' });
      toast.success('Driver portal login successful');
      navigate('/driver/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Driver login failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Driver & Operator Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage assigned buses, trips, and manifests</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Driver Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@bus.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white font-bold text-sm transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login to Driver Portal'}
          </button>
        </form>

        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
          <div>
            <strong>Demo Driver:</strong> driver@bus.com / Driver@123
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('driver@bus.com');
              setPassword('Driver@123');
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
          >
            Fill
          </button>
        </div>
      </div>
    </div>
  );
}
