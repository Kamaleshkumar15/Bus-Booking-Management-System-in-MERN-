import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Bus, User, LogOut, ShieldCheck, Truck, Ticket, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-slate-200/80 shadow-[0_2px_16px_rgb(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-brand-navy">
                Red<span className="text-brand-red">Bus</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 ml-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-50 to-rose-50 text-brand-red border border-red-100">
                <Sparkles className="w-3 h-3" /> 3D Edition
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2.5 sm:gap-4 text-sm font-semibold">
            <Link to="/search" className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-red hover:bg-red-50/60 transition">
              Bus Tickets
            </Link>
            <Link to="/about" className="hidden lg:inline-block px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-red transition">
              About
            </Link>
            <Link to="/contact" className="hidden lg:inline-block px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-red transition">
              Support
            </Link>

            {!isAuthenticated ? (
              <>
                <Link to="/driver/login" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-navy hover:bg-slate-100 transition">
                  <Truck className="w-4 h-4" /> Driver
                </Link>
                <Link to="/admin/login" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-navy hover:bg-slate-100 transition">
                  <ShieldCheck className="w-4 h-4" /> Admin
                </Link>
                <Link to="/login" className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-red to-rose-600 text-white hover:opacity-95 transition shadow-md shadow-red-500/20">
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                {user?.role === 'driver' && (
                  <Link to="/driver/dashboard" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy text-white hover:bg-slate-800 shadow-sm transition">
                    <Truck className="w-4 h-4" /> Driver Dashboard
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-navy text-white hover:bg-slate-800 shadow-sm transition">
                    <ShieldCheck className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
                {user?.role === 'user' && (
                  <>
                    <Link to="/my-bookings" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-brand-red hover:bg-red-50/60 transition">
                      <Ticket className="w-4 h-4" /> My Bookings
                    </Link>
                    <Link to="/dashboard" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-brand-red border border-red-100 hover:bg-red-100 transition">
                      <User className="w-4 h-4" /> {user.name.split(' ')[0]}
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-gradient-to-b from-brand-navy to-slate-950 text-slate-300 py-12 mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-extrabold text-lg mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
                <Bus className="w-4 h-4 text-white" />
              </div>
              RedBus Clone
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              100% local bus ticket booking & fleet management platform featuring interactive 3D cabin seat selection, demo UPI QR checkout, and PDF tickets.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-widest">Portals</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/search" className="hover:text-white transition">Search Buses</Link></li>
              <li><Link to="/driver/login" className="hover:text-white transition">Driver & Operator Login</Link></li>
              <li><Link to="/admin/login" className="hover:text-white transition">Admin Management Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-widest">Information & Policies</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact & Support</Link></li>
              <li><Link to="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link to="/cancellation-policy" className="hover:text-white transition">Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
