import { ShieldCheck, Box, QrCode, Bus } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-red">About RedBus Clone</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
          Next-Gen 3D Bus Booking & Fleet Management
        </h1>
        <p className="text-slate-600 mt-4 leading-relaxed">
          Built as a 100% local, zero-external-API full-stack platform combining interactive Three.js 3D seat selection, atomic JSON persistence, real-time Socket.IO updates, and dedicated portals for Customers, Drivers, and Admins.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6">
          <Box className="w-8 h-8 text-brand-red mb-3" />
          <h3 className="font-bold text-lg text-slate-900">3D Cabin Inspection</h3>
          <p className="text-sm text-slate-600 mt-2">Inspect seater, sleeper, and mixed decks in 3D before booking.</p>
        </div>
        <div className="premium-card p-6">
          <QrCode className="w-8 h-8 text-brand-navy mb-3" />
          <h3 className="font-bold text-lg text-slate-900">QR Tickets & Boarding</h3>
          <p className="text-sm text-slate-600 mt-2">Instant PNR QR codes and PDF tickets verified by drivers on boarding.</p>
        </div>
        <div className="premium-card p-6">
          <ShieldCheck className="w-8 h-8 text-emerald-600 mb-3" />
          <h3 className="font-bold text-lg text-slate-900">Role-Based Portals</h3>
          <p className="text-sm text-slate-600 mt-2">Secure JWT & RBAC dashboards for Passengers, Drivers, and Admins.</p>
        </div>
      </div>
    </div>
  );
}
