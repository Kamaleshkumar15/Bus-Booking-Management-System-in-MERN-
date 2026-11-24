import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock, KeyRound, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password, portal: 'user' });
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/forgot-password', { email: otpEmail });
      setDemoOtp(data.demoOtp);
      toast.success(`Demo OTP generated: ${data.demoOtp}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { email: otpEmail, otp: otpInput, newPassword });
      toast.success('Password reset! Please sign in.');
      setShowOtpModal(false);
      setDemoOtp('');
      setOtpInput('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP reset failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-brand-red flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Login</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to book tickets and manage your trips</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@bus.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => setShowOtpModal(true)}
                className="text-xs font-semibold text-brand-red hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold text-sm transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          OR
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <GoogleSignInButton onSuccess={() => navigate(from, { replace: true })} />

        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
          <div>
            <strong>Demo User:</strong> user@bus.com / User@123
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('user@bus.com');
              setPassword('User@123');
            }}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
          >
            Fill
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" state={{ from: location.state?.from }} className="text-brand-red font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <KeyRound className="w-4 h-4 text-brand-red" /> Demo OTP Password Reset
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!demoOtp ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email (e.g. user@bus.com)"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <button className="w-full py-2.5 rounded-xl bg-brand-navy text-white font-bold text-sm">
                  Generate Local Demo OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  Local Demo OTP: <strong className="font-mono text-sm">{demoOtp}</strong>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
                <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm">
                  Reset Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
