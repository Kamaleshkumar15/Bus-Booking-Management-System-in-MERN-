import { useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function GoogleLogoSvg() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({ onSuccess }) {
  const { googleLogin } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('user@bus.com');
  const [googleName, setGoogleName] = useState('Demo User');
  const [submitting, setSubmitting] = useState(false);

  const handleDemoGoogleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await googleLogin({
        email: googleEmail.trim(),
        name: googleName.trim(),
        googleId: `local_google_${googleEmail.trim().toLowerCase()}`,
      });
      toast.success('Signed in with customer demo account!');
      setShowDemoModal(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign-In failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDemoModal(true)}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 shadow-sm transition"
      >
        <GoogleLogoSvg />
        Continue with Google (Local Demo)
      </button>

      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <GoogleLogoSvg /> Local Customer Sign-In
              </div>
              <button onClick={() => setShowDemoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              100% local demo sign-in for customer accounts (no external API calls).
            </p>
            <form onSubmit={handleDemoGoogleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Continue as Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
