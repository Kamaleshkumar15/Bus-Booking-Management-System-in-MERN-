import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, ShieldCheck, Lock, QrCode, Smartphone, MapPin, Bus, Users, Tag } from 'lucide-react';
import api from '../services/api';
import { useBooking } from '../context/BookingContext';
import UpiQrCard from '../components/UpiQrCard';

const PAYMENT_METHODS = [
  { id: 'UPI QR', label: 'Demo UPI QR Code', desc: 'Scan with GPay, PhonePe, Paytm' },
  { id: 'UPI', label: 'Demo UPI ID / VPA', desc: 'Pay using your UPI ID' },
  { id: 'Card (Tokenized)', label: 'Demo Credit / Debit Card', desc: 'Simulated card checkout' },
  { id: 'Net Banking', label: 'Demo Net Banking', desc: 'Simulated bank transfer' },
  { id: 'Cash', label: 'Cash at Boarding', desc: 'Pay cash simulator' },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { currentBooking, setCurrentBooking } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState('UPI QR');
  const [upiId, setUpiId] = useState('');
  const [upiChannel, setUpiChannel] = useState('QR Code');
  const [qrOrder, setQrOrder] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!currentBooking) {
      navigate('/search');
    }
  }, [currentBooking]);

  if (!currentBooking) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data: valRes } = await api.get(
        `/coupons/validate?code=${encodeURIComponent(couponInput.trim())}&amount=${currentBooking.baseAmount}`
      );
      const { data: updRes } = await api.put(`/bookings/${currentBooking._id}`, {
        couponCode: valRes.coupon.code,
      });
      setCurrentBooking(updRes.booking);
      setQrOrder(null);
      toast.success(`Coupon ${valRes.coupon.code} applied! Saved ₹${valRes.discount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleGenerateQrOrder = async () => {
    setProcessing(true);
    try {
      const { data } = await api.post('/payments/create-order', {
        bookingId: currentBooking._id,
        paymentMethod: 'UPI QR',
        upiChannel: 'QR Code',
      });
      setQrOrder(data.order);
      toast.success('Demo UPI QR Code ready!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate QR order');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async (simulateOutcome = 'success', existingOrder = null) => {
    if (paymentMethod === 'UPI' && !existingOrder) {
      const upiRegex = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upiId.trim())) {
        toast.error('Enter a valid UPI ID (e.g. user@okicici)');
        return;
      }
    }

    setProcessing(true);
    try {
      let order = existingOrder;
      if (!order) {
        const { data: orderRes } = await api.post('/payments/create-order', {
          bookingId: currentBooking._id,
          paymentMethod,
          upiId: paymentMethod === 'UPI' ? upiId.trim() : '',
          upiChannel: paymentMethod === 'UPI' ? upiChannel : '',
        });
        order = orderRes.order;
      }

      const { data: verifyRes } = await api.post('/payments/verify', {
        bookingId: currentBooking._id,
        gatewayOrderId: order.id,
        gatewayPaymentId: `pay_sim_${Date.now()}`,
        gatewaySignature: order.simulatedAuthToken || 'local_demo_sig',
        simulateOutcome,
        upiId: paymentMethod === 'UPI' ? upiId.trim() : '',
        upiChannel: paymentMethod === 'UPI QR' ? 'QR Code' : upiChannel,
      });

      setCurrentBooking({
        ...currentBooking,
        bookingStatus: verifyRes.booking.bookingStatus,
        paymentStatus: verifyRes.booking.paymentStatus,
        paymentId: verifyRes.payment,
      });

      toast.success('Demo payment verified & booking confirmed!');
      navigate(`/booking/confirmation/${currentBooking._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulated payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 premium-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-red" /> Billing & Payment
          </h1>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-extrabold border border-amber-200 uppercase">
            Demo Payment / No Real Money Transfer
          </span>
        </div>

        <p className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          100% local payment simulation. No card numbers, CVVs, or real bank credentials are stored or transmitted.
        </p>

        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3">Select Payment Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setPaymentMethod(method.id);
                  setQrOrder(null);
                  setUpiChannel(method.id === 'UPI QR' ? 'QR Code' : method.id === 'UPI' ? 'UPI ID' : '');
                }}
                className={`p-3.5 rounded-xl border text-left transition ${
                  paymentMethod === method.id
                    ? 'border-brand-red bg-red-50 text-brand-red ring-1 ring-brand-red'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold">{method.label}</div>
                <div className="text-[11px] opacity-80">{method.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === 'UPI QR' && (
          <div>
            {!qrOrder ? (
              <button
                type="button"
                onClick={handleGenerateQrOrder}
                disabled={processing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-red to-rose-600 hover:opacity-95 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition disabled:opacity-60"
              >
                <QrCode className="w-5 h-5" />
                {processing ? 'Generating QR Code...' : `Pay Now — Show QR Code (₹${currentBooking.totalAmount})`}
              </button>
            ) : (
              <UpiQrCard
                upiIntentUri={qrOrder.upiIntentUri}
                merchantVpa={qrOrder.merchantVpa}
                amount={currentBooking.totalAmount}
                bookingCode={currentBooking.bookingCode}
                processing={processing}
                onConfirmPaid={() => handlePay('success', qrOrder)}
                onSimulateFailure={() => handlePay('failure', qrOrder)}
              />
            )}
          </div>
        )}

        {paymentMethod === 'UPI' && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Smartphone className="w-4 h-4 text-brand-red" /> Pay via Demo UPI ID
            </div>
            <div className="flex flex-wrap gap-2">
              {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                <button
                  key={app}
                  type="button"
                  onClick={() => setUpiChannel(app)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    upiChannel === app
                      ? 'bg-brand-navy text-white border-brand-navy'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {app}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Enter Your UPI ID *</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. user@okicici"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-brand-red outline-none"
              />
            </div>
          </div>
        )}

        {paymentMethod !== 'UPI QR' && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handlePay('success')}
              disabled={processing}
              className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60"
            >
              <ShieldCheck className="w-5 h-5" />
              {processing ? 'Processing Demo Payment...' : `Pay Now ₹${currentBooking.totalAmount} (Demo)`}
            </button>
            <button
              onClick={() => handlePay('failure')}
              disabled={processing}
              className="px-4 py-3.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition"
            >
              Simulate Failure
            </button>
          </div>
        )}
      </div>

      {/* Complete Booking & Billing Card */}
      <div className="lg:col-span-5 premium-card p-6 h-fit space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-lg text-slate-900">Booking & Billing Summary</h2>
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {currentBooking.bookingCode}
          </span>
        </div>

        <div className="space-y-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-start gap-2.5">
            <Bus className="w-4 h-4 text-brand-red mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">{currentBooking.tripId?.busId?.busName}</div>
              <div className="text-xs text-slate-500">
                {currentBooking.tripId?.busId?.busType} • {currentBooking.tripId?.busId?.busNumber}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-brand-navy mt-0.5 shrink-0" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-slate-800">
                {currentBooking.tripId?.routeId?.source} → {currentBooking.tripId?.routeId?.destination}
              </div>
              <div className="text-slate-500">
                Boarding: {currentBooking.boardingPoint?.name} ({currentBooking.boardingPoint?.time})
              </div>
              <div className="text-slate-500">
                Dropping: {currentBooking.droppingPoint?.name} ({currentBooking.droppingPoint?.time})
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-slate-800">Seats: {currentBooking.seatNumbers?.join(', ')}</div>
              <div className="text-slate-500">
                {(currentBooking.passengers || []).map((p) => `${p.fullName} (${p.seatNumber})`).join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* Coupon Code */}
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon (e.g. WELCOME10)"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs uppercase font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={applyingCoupon}
            className="px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-slate-800"
          >
            {applyingCoupon ? '...' : 'Apply'}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Base Ticket Fare</span>
            <span>₹{currentBooking.baseAmount}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>GST (5%)</span>
            <span>₹{currentBooking.taxAmount}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Convenience Fee</span>
            <span>₹{currentBooking.convenienceFee}</span>
          </div>
          {currentBooking.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Coupon ({currentBooking.couponCode})</span>
              <span>-₹{currentBooking.discountAmount}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-extrabold text-brand-navy">
            <span>Final Amount</span>
            <span>₹{currentBooking.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
