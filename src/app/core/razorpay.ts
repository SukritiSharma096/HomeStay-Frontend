import { Booking } from './models';
import { ApiService } from './api.service';

interface CheckoutResult { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }
interface CheckoutOptions {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name?: string; email?: string; contact?: string };
  theme: { color: string };
  handler: (result: CheckoutResult) => void;
  modal: { ondismiss: () => void };
}
interface CheckoutInstance { open(): void; on(event: string, callback: (error: unknown) => void): void; }
declare global { interface Window { Razorpay?: new (options: CheckoutOptions) => CheckoutInstance; } }

export function openCheckout(
  booking: Booking,
  user: { fullName: string; email: string; phone: string | null },
  api: ApiService,
  setBusy: (busy: boolean) => void,
  onPaid: () => void,
  onError: (message: string) => void,
): void {
  const keyId = booking.paymentKeyId;
  const orderId = booking.paymentOrderId;
  if (!keyId || !orderId) {
    onError('Payment checkout details are missing. Please create a new booking.');
    return;
  }
  setBusy(true);
  const open = () => {
    if (!window.Razorpay) {
      setBusy(false);
      onError('Payment checkout could not be loaded. Check your connection and try again.');
      return;
    }
    const checkout = new window.Razorpay({
      key: keyId,
      amount: Math.round(booking.totalPrice * 100),
      currency: booking.currency || 'INR',
      name: 'Havenstay',
      description: `Booking #${booking.id} · ${booking.propertyName}`,
      order_id: orderId,
      prefill: { name: user.fullName, email: user.email, contact: user.phone || undefined },
      theme: { color: '#315b4d' },
      handler: result => {
        api.verifyPayment({
          razorpayOrderId: result.razorpay_order_id,
          razorpayPaymentId: result.razorpay_payment_id,
          razorpaySignature: result.razorpay_signature,
        }).subscribe({ next: () => { setBusy(false); onPaid(); }, error: err => { setBusy(false); onError(err?.error?.message || 'Payment verification failed. Please contact support before retrying.'); } });
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    checkout.on('payment.failed', () => { setBusy(false); onError('Payment could not be completed. You can try again from My trips.'); });
    checkout.open();
  };
  if (window.Razorpay) { open(); return; }
  const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
  if (existing) {
    existing.addEventListener('load', open, { once: true });
    existing.addEventListener('error', () => { setBusy(false); onError('Unable to load the secure payment window.'); }, { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.dataset['razorpayCheckout'] = 'true';
  script.onload = open;
  script.onerror = () => { setBusy(false); onError('Unable to load the secure payment window.'); };
  document.body.appendChild(script);
}
