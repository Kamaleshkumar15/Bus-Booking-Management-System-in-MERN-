import { useNavigate } from 'react-router-dom';
import { Shield, Clock, Box, ArrowRight, Star, QrCode, CheckCircle2 } from 'lucide-react';
import SearchForm from '../components/SearchForm';

const POPULAR_ROUTES = [
  { source: 'Bengaluru', destination: 'Chennai', price: 799, duration: '6h 30m', tag: 'Most Popular' },
  { source: 'Chennai', destination: 'Coimbatore', price: 899, duration: '8h 30m', tag: 'Overnight Sleeper' },
  { source: 'Mumbai', destination: 'Pune', price: 450, duration: '3h 30m', tag: 'Expressway' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-slate-900 to-rose-950 text-white py-16 sm:py-24">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-rose-200 text-xs font-bold mb-5 border border-white/15 backdrop-blur-md">
              <Box className="w-3.5 h-3.5 text-brand-red" /> Interactive 3D Bus Cabin Selection
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Travel Smarter with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
                Live 3D Seat Views
              </span>
            </h1>
            <p className="mt-5 text-slate-300 text-base sm:text-lg leading-relaxed">
              Inspect lower & upper decks in 3D, lock your favorite seats in real time, pay via UPI QR, and download instant PDF e-tickets.
            </p>
          </div>

          <SearchForm />

          {/* Trust Strip */}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant UPI & QR Checkout
            </span>
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-current" /> 4.8/5 Verified Operator Ratings
            </span>
            <span className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-rose-300" /> Digital PDF Tickets & Manifests
            </span>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-red">Top Corridors</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Popular Bus Routes</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POPULAR_ROUTES.map((r) => (
            <div
              key={`${r.source}-${r.destination}`}
              onClick={() =>
                navigate(
                  `/search?source=${encodeURIComponent(r.source)}&destination=${encodeURIComponent(
                    r.destination
                  )}&journeyDate=${todayStr}&passengers=1`
                )
              }
              className="premium-card p-6 cursor-pointer group hover:-translate-y-1"
            >
              <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-brand-red mb-4">
                {r.tag}
              </span>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-brand-red transition">
                  {r.source} → {r.destination}
                </h3>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-brand-red group-hover:text-white flex items-center justify-center transition">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> {r.duration}
                </span>
                <span className="font-extrabold text-lg text-brand-navy">From ₹{r.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t border-slate-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-7 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mb-4">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">3D Cabin Inspection</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Rotate, zoom, and inspect lower and upper decks in 3D before picking your exact window seat or sleeper berth.
            </p>
          </div>
          <div className="p-7 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Real-Time Seat Locking</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Atomic 10-minute seat locks powered by Socket.IO prevent double bookings while you complete checkout.
            </p>
          </div>
          <div className="p-7 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">UPI QR & Instant PDFs</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Scan-to-pay UPI QR, backend signature verification, instant PDF e-tickets, and one-click cancellations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
