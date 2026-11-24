import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl font-extrabold text-brand-red">404</div>
      <h1 className="text-2xl font-bold text-slate-900 mt-3">Page Not Found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        The route you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 rounded-xl bg-brand-navy text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition"
      >
        <Home className="w-4 h-4" /> Back to Home
      </Link>
    </div>
  );
}
