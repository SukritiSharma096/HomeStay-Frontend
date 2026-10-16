import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './config';
import {
  AdminDashboard, AdminProperty, AdminUser, Amenity, Availability, AvailabilityCheck, Booking,
  BulkAvailabilityPayload, Destination, PlatformCommission, Property, PropertyImage,
  PropertyPayload, PropertySearchResponse, SearchParams, SupportTicket,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private get base() { return API_URL; }

  sendVerification(channel: 'email', identifier: string) { return this.http.post<{ message: string }>(`${this.base}/auth/verification/${channel}/send`, { identifier }); }
  verifyCode(channel: 'email', identifier: string, code: string) { return this.http.post<{ message: string }>(`${this.base}/auth/verification/${channel}/verify`, { identifier, code }); }
  updateProfile(body: { fullName: string; dateOfBirth: string | null; gender: string | null }) { return this.http.put<import('./models').AuthUser>(`${this.base}/profile/me`, body); }
  uploadProfilePhoto(file: File) { const body = new FormData(); body.append('file', file); return this.http.post<import('./models').AuthUser>(`${this.base}/profile/me/photo`, body); }

  // Public discovery
  getDestinations() { return this.http.get<Destination[]>(`${this.base}/destinations`); }
  getAmenities() { return this.http.get<Amenity[]>(`${this.base}/amenities`); }
  getProperties() { return this.http.get<Property[]>(`${this.base}/properties`); }
  getPropertiesByDestination(id: number) { return this.http.get<Property[]>(`${this.base}/properties/destination/${id}`); }
  getProperty(id: number) { return this.http.get<Property>(`${this.base}/properties/${id}`); }
  searchProperties(search: SearchParams) {
    let params = new HttpParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<PropertySearchResponse>(`${this.base}/properties/search`, { params });
  }

  // Host dashboard
  getMyProperties() { return this.http.get<Property[]>(`${this.base}/host/properties`); }
  getMyProperty(id: number) { return this.http.get<Property>(`${this.base}/host/properties/${id}`); }
  createProperty(payload: PropertyPayload) { return this.http.post<Property>(`${this.base}/host/properties`, payload); }
  updateProperty(id: number, payload: PropertyPayload) { return this.http.put<Property>(`${this.base}/host/properties/${id}`, payload); }
  deleteProperty(id: number) { return this.http.delete<void>(`${this.base}/host/properties/${id}`); }
  getHostBookings() { return this.http.get<Booking[]>(`${this.base}/bookings/host`); }
  uploadImage(propertyId: number, file: File, primaryImage: boolean) {
    const body = new FormData(); body.append('file', file);
    if (primaryImage) body.append('primaryImage', 'true');
    return this.http.post<PropertyImage>(`${this.base}/properties/${propertyId}/images`, body);
  }
  deleteImage(imageId: number) { return this.http.delete<void>(`${this.base}/properties/images/${imageId}`); }
  getAvailability(propertyId: number) { return this.http.get<Availability[]>(`${this.base}/properties/${propertyId}/availability`); }
  checkAvailability(propertyId: number, checkIn: string, checkOut: string) { return this.http.get<AvailabilityCheck>(`${this.base}/properties/${propertyId}/availability/check`, { params: { checkIn, checkOut } }); }
  setAvailabilityRange(propertyId: number, body: BulkAvailabilityPayload) {
    return this.http.put<Availability[]>(`${this.base}/properties/${propertyId}/availability/bulk`, body);
  }

  // Guest booking and support
  createBooking(body: { propertyId: number; checkIn: string; checkOut: string; guests: number; rooms: number }) {
    return this.http.post<Booking>(`${this.base}/bookings`, body);
  }
  verifyPayment(body: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    return this.http.post<Booking>(`${this.base}/bookings/verify-payment`, body);
  }
  getMyBookings() { return this.http.get<Booking[]>(`${this.base}/bookings/my`); }
  cancelMyBooking(id: number) { return this.http.post<Booking>(`${this.base}/bookings/${id}/cancel`, {}); }
  getMyTickets() { return this.http.get<SupportTicket[]>(`${this.base}/support/tickets/my`); }
  createTicket(body: { bookingId?: number | null; subject: string; message: string }) {
    return this.http.post<SupportTicket>(`${this.base}/support/tickets`, body);
  }

  // Admin console
  getAdminDashboard() { return this.http.get<AdminDashboard>(`${this.base}/admin/dashboard`); }
  getAdminProperties(status?: string) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<AdminProperty[]>(`${this.base}/admin/properties`, { params });
  }
  approveProperty(id: number) { return this.http.post<AdminProperty>(`${this.base}/admin/properties/${id}/approve`, {}); }
  rejectProperty(id: number, reason: string) { return this.http.post<AdminProperty>(`${this.base}/admin/properties/${id}/reject`, { reason }); }
  suspendProperty(id: number, reason: string) { return this.http.post<AdminProperty>(`${this.base}/admin/properties/${id}/suspend`, { reason }); }
  setPropertyListing(id: number, active: boolean) { return this.http.patch<AdminProperty>(`${this.base}/admin/properties/${id}/listing?active=${active}`, {}); }
  setPropertyFeatured(id: number, featured: boolean) { return this.http.patch<AdminProperty>(`${this.base}/admin/properties/${id}/featured?featured=${featured}`, {}); }
  setPropertyCommission(id: number, commissionRate: number | null) { return this.http.put<AdminProperty>(`${this.base}/admin/properties/${id}/commission`, { commissionRate }); }
  deleteAdminProperty(id: number) { return this.http.delete<void>(`${this.base}/admin/properties/${id}`); }
  getAdminUsers(role?: string) {
    const params = role ? new HttpParams().set('role', role) : undefined;
    return this.http.get<AdminUser[]>(`${this.base}/admin/users`, { params });
  }
  getAdminUserBookings(id: number) { return this.http.get<Booking[]>(`${this.base}/admin/users/${id}/bookings`); }
  getAdminHostBookings(id: number) { return this.http.get<Booking[]>(`${this.base}/admin/hosts/${id}/bookings`); }
  getAdminHostProperties(id: number) { return this.http.get<AdminProperty[]>(`${this.base}/admin/hosts/${id}/properties`); }
  setUserActive(id: number, active: boolean) { return this.http.patch<AdminUser>(`${this.base}/admin/users/${id}/active?active=${active}`, {}); }
  setHostVerification(id: number, status: string) { return this.http.patch<AdminUser>(`${this.base}/admin/users/${id}/host-verification`, { status }); }
  createAdmin(body: { fullName: string; email: string; password: string }) { return this.http.post<AdminUser>(`${this.base}/admin/users/admin`, body); }
  getAdminBookings() { return this.http.get<Booking[]>(`${this.base}/admin/bookings`); }
  cancelAdminBooking(id: number) { return this.http.post<Booking>(`${this.base}/admin/bookings/${id}/cancel`, {}); }
  getAdminTickets() { return this.http.get<SupportTicket[]>(`${this.base}/admin/tickets`); }
  replyTicket(id: number, adminReply: string, status: string) { return this.http.patch<SupportTicket>(`${this.base}/admin/tickets/${id}`, { adminReply, status }); }
  getCommission() { return this.http.get<PlatformCommission>(`${this.base}/admin/commission`); }
  updateCommission(commissionRate: number) { return this.http.put<PlatformCommission>(`${this.base}/admin/commission`, { commissionRate }); }

  // Admin content management uses the protected destination/amenity CRUD endpoints.
  createDestination(body: Partial<Destination>) { return this.http.post<Destination>(`${this.base}/destinations`, body); }
  updateDestination(id: number, body: Partial<Destination>) { return this.http.put<Destination>(`${this.base}/destinations/${id}`, body); }
  deleteDestination(id: number) { return this.http.delete<void>(`${this.base}/destinations/${id}`); }
  createAmenity(body: Partial<Amenity>) { return this.http.post<Amenity>(`${this.base}/amenities`, body); }
  updateAmenity(id: number, body: Partial<Amenity>) { return this.http.put<Amenity>(`${this.base}/amenities/${id}`, body); }
  deleteAmenity(id: number) { return this.http.delete<void>(`${this.base}/amenities/${id}`); }
}
