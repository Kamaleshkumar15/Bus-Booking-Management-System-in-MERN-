import { useMemo, useState, useEffect } from 'react';
import { QrCode, Copy, Check, Clock, Smartphone, Loader2, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';

function buildQrMatrix(text) {
  const size = 21;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (hash >>> 0) % 2 === 0;
    }
  }
  return grid;
}

export default function UpiQrCard({
  upiIntentUri,
  merchantVpa = 'redbusclone@okaxis',
  amount,
  bookingCode,
  onConfirmPaid,
  onSimulateFailure,
  processing,
}) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [scanStage, setScanStage] = useState('waiting'); // 'waiting' | 'scanning' | 'authorizing'

  const matrix = useMemo(() => buildQrMatrix(upiIntentUri || bookingCode), [upiIntentUri, bookingCode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantVpa);
    setCopied(true);
    toast.success('UPI ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLiveScanConfirm = () => {
    if (processing || secondsLeft === 0) return;
    setScanStage('scanning');
    setTimeout(() => {
      setScanStage('authorizing');
      setTimeout(() => {
        onConfirmPaid();
      }, 700);
    }, 800);
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <QrCode className="w-4 h-4 text-brand-red" /> Live UPI QR Scanner
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> {mins}:{secs}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <svg
            viewBox="0 0 21 21"
            className="w-40 h-40"
            role="img"
            aria-label={`UPI QR Code for ₹${amount}`}
          >
            <rect width="21" height="21" fill="#FFFFFF" />
            {matrix.map((row, rIdx) =>
              row.map((cell, cIdx) =>
                cell ? <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#0F172A" /> : null
              )
            )}
          </svg>
          {scanStage !== 'waiting' && (
            <div className="absolute inset-0 bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>{scanStage === 'scanning' ? 'Scanning QR...' : 'Authorizing UPI...'}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm flex-1">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Payable Amount</div>
            <div className="text-2xl font-extrabold text-brand-navy">₹{amount}</div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500">UPI ID:</span>
            <span className="font-mono text-xs font-bold text-slate-800 flex-1 truncate">{merchantVpa}</span>
            <button
              type="button"
              onClick={handleCopyVpa}
              className="text-brand-red hover:text-brand-redDark text-xs font-bold flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
            {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
              <span key={app} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-brand-red" /> {app}
              </span>
            ))}
          </div>

          {upiIntentUri && (
            <a href={upiIntentUri} className="inline-block text-xs font-bold text-blue-600 hover:underline">
              Open in Installed UPI App →
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleLiveScanConfirm}
          disabled={processing || scanStage !== 'waiting' || secondsLeft === 0}
          className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60"
        >
          <ScanLine className="w-4 h-4" />
          {processing || scanStage !== 'waiting'
            ? 'Verifying Payment...'
            : `Pay Now via QR Scan (₹${amount})`}
        </button>
        <button
          type="button"
          onClick={onSimulateFailure}
          disabled={processing || scanStage !== 'waiting'}
          className="px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
        >
          Simulate Failure
        </button>
      </div>
    </div>
  );
}
