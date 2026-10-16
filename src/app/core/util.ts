import { Property } from './models';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 6);
}

/** Today as YYYY-MM-DD in the user's local time. */
export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Digits only. A 10 digit number is treated as an Indian number (+91). */
export function phoneDigits(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? '91' + digits : digits;
}

export function telLink(phone: string | null | undefined): string {
  const d = phoneDigits(phone);
  return d ? 'tel:+' + d : '';
}

export function whatsappLink(phone: string | null | undefined, message: string): string {
  const d = phoneDigits(phone);
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(message)}` : '';
}

export function mainImage(p: Property): string | null {
  const imgs = p.images ?? [];
  const primary = imgs.find((i) => i.primaryImage) ?? imgs[0];
  return primary ? primary.imageUrl : null;
}

/** Turns a backend error into a short readable message. */
export function errorMessage(err: any): string {
  if (err?.status === 0) {
    return 'Cannot reach the server. Is the backend running?';
  }
  const e = err?.error;
  if (e?.errors) {
    const vals: unknown[] = Array.isArray(e.errors) ? e.errors : Object.values(e.errors);
    if (vals.length) return vals.map(String).join(', ');
  }
  return e?.message || 'Something went wrong. Please try again.';
}
