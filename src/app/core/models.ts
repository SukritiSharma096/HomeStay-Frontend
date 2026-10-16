export type Role = 'GUEST' | 'HOST' | 'ADMIN';
export type PropertyType = 'HOMESTAY' | 'HOTEL' | 'VILLA' | 'RESORT' | 'GUESTHOUSE' | 'APARTMENT' | 'COTTAGE';
export type PropertyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED' | 'REFUND_FAILED' | 'CANCELLED';
export type HostVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const PROPERTY_TYPES: PropertyType[] = ['HOMESTAY', 'HOTEL', 'VILLA', 'RESORT', 'GUESTHOUSE', 'APARTMENT', 'COTTAGE'];

export interface PropertyImage { id: number; propertyId: number; imageUrl: string; primaryImage: boolean; displayOrder: number; }
export interface Property {
  id: number; name: string; slug: string; description: string | null; propertyType: PropertyType;
  destinationId: number; destinationName: string; destinationSlug: string; address: string | null; city?: string; state?: string; postalCode?: string;
  latitude: number | null; longitude: number | null; pricePerNight: number; rating: number | null;
  totalReviews: number; maxGuests: number; bedrooms: number; bathrooms: number; active: boolean;
  status?: PropertyStatus; reviewNote?: string | null; featured?: boolean; hostId: number | null;
  hostName: string | null; hostPhone: string | null; amenityIds: number[]; amenities: string[]; images: PropertyImage[];
}
export interface PropertySearchResponse { destination: string | null; totalResults: number; properties: Property[]; }
export interface Destination { id: number; name: string; slug: string; description: string | null; country: string | null; state: string | null; city: string | null; imageUrl: string | null; active: boolean; }
export interface Amenity { id: number; name: string; description: string | null; active: boolean; }
export interface PropertyPayload {
  name: string; slug: string; description: string; propertyType: PropertyType; destinationId: number;
  address: string; city: string; state: string; postalCode: string; latitude: number | null; longitude: number | null; pricePerNight: number;
  maxGuests: number; bedrooms: number; bathrooms: number; active: boolean; amenityIds: number[];
}
export interface Availability { id: number; propertyId: number; availableDate: string; available: boolean; availableUnits: number; }
export interface AvailabilityCheck { availableRooms: number; }
export interface BulkAvailabilityPayload { startDate: string; endDate: string; available: boolean; availableUnits: number; }
export interface AuthUser { id: number; fullName: string; email: string; phone: string | null; role: Role; hostVerificationStatus?: HostVerificationStatus | null; profilePhotoUrl?: string | null; dateOfBirth?: string | null; gender?: string | null; }
export interface AuthResponse { accessToken: string; tokenType: string; expiresIn: number; user: AuthUser; }
export interface Booking {
  id: number; propertyId: number; propertyName: string; imageUrl: string | null; checkIn: string; checkOut: string;
  guests: number; rooms: number; totalPrice: number; status: BookingStatus; createdAt: string; paymentOrderId: string | null;
  paymentKeyId: string | null; currency: string; paymentStatus: PaymentStatus; commissionRate: number;
  commissionAmount: number; hostEarnings: number; customerName: string; customerEmail: string;
  hostName: string | null; hostEmail: string | null;
}
export interface SupportTicket {
  id: number; customerId: number; customerName: string; customerEmail: string; bookingId: number | null;
  subject: string; message: string; adminReply: string | null; status: SupportTicketStatus; createdAt: string; updatedAt: string;
}
export interface AdminProperty {
  id: number; name: string; slug: string; description: string | null; propertyType: PropertyType;
  destinationId: number; destinationName: string; address: string | null; city?: string; state?: string; postalCode?: string; pricePerNight: number; maxGuests: number;
  bedrooms: number; bathrooms: number; active: boolean; status: PropertyStatus; reviewNote: string | null;
  featured: boolean; commissionRate: number | null; hostId: number | null; hostName: string | null; hostEmail: string | null; createdAt: string;
  images?: PropertyImage[]; amenities?: string[];
}
export interface AdminUser {
  id: number; fullName: string; email: string; phone: string | null; role: Role; active: boolean;
  hostVerificationStatus: HostVerificationStatus | null; propertyCount: number; bookingCount: number; createdAt: string;
}
export interface AdminDashboard {
  totalProperties: number; pendingProperties: number; approvedProperties: number; totalHosts: number; totalCustomers: number;
  totalBookings: number; pendingPayments: number; bookingsToday: number; cancelledBookings: number; openQueries: number;
  paidBookingVolume: number; platformCommission: number; hostEarnings: number;
  monthlyCommission: Record<string, number>; monthlyRevenue: Record<string, number>; bookingsByMonth: Record<string, number>;
  topProperties: { propertyId: number; propertyName: string; bookings: number; revenue: number }[];
  topDestinations: { destinationName: string; bookings: number; revenue: number }[];
}
export interface PlatformCommission { commissionRate: number; updatedAt: string | null; updatedBy: string | null; }
export interface SearchParams {
  destinationId?: string; checkIn?: string; checkOut?: string; guests?: string; minPrice?: string; maxPrice?: string;
  propertyType?: string; minRating?: string; sortBy?: string;
}
