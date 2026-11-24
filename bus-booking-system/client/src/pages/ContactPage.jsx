import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Send } from 'lucide-react';
import api from '../services/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/support', form);
      toast.success('Support ticket submitted! Our team will review it in the Admin Portal.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="premium-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-brand-red flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Contact & Support</h1>
            <p className="text-sm text-slate-500">Submit a support ticket directly to our local Admin Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>
          <input
            type="text"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
          <textarea
            rows={4}
            required
            placeholder="How can we help?"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-brand-red hover:bg-brand-redDark text-white font-bold text-sm flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
}
