/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core Types for Petmall Ecosystem

export type BusinessType = 'PRODUCTS_ONLY' | 'SERVICES_ONLY' | 'HYBRID';
export type BrandingTheme = 'A' | 'B'; // Theme A: Marino/Oro, Theme B: Eco-Tech

export interface Store {
  id: string;
  name: string;
  ownerId: string;
  geolocation: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  businessType: BusinessType;
  branding: {
    theme: BrandingTheme;
    colors: {
      primary: string;
      accent: string;
    };
  };
  demo?: boolean;
  // Company presentation space
  description?: string;
  slogan?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  bannerUrl?: string;
  // Trial/Plan fields
  planType?: 'market_growth' | 'control_omnicanal' | 'enterprise_elite';
  planName?: string;
  isTrial?: boolean;
  trialDaysLeft?: number;
}

export interface ProductDetails {
  sku: string;
  barcode: string;
  costPrice: number; // Cost price from supplier
  stockPhysical: number; // In-store physical stock
  stockDigital: number; // Online app stock
  reorderThreshold: number; // For automatic purchase orders
  supplierInfo: {
    name: string;
    email: string;
  };
}

export interface ServiceSlot {
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface ServiceDetails {
  durationMinutes: number;
  capacityPerSlot: number;
  specialistName: string;
  slotsAvailable: ServiceSlot[];
}

export interface CatalogItem {
  id: string;
  storeId: string;
  type: 'PRODUCT' | 'SERVICE';
  title: string;
  description: string;
  price: number;
  category: string; // 'Alimento' | 'Peluquería' | 'Juguetes' | etc.
  images: string[];
  productDetails?: ProductDetails;
  serviceDetails?: ServiceDetails;
}

export type OrderStatus = 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'BOOKED' | 'COMPLETED';
export type OrderType = 'DELIVERY' | 'CLICK_AND_COLLECT' | 'SERVICE_BOOKING';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface OrderItem {
  itemId: string;
  quantity: number;
  bookingSchedule?: {
    date: string; // 'YYYY-MM-DD'
    timeSlot: string; // "10:30"
  };
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  storeId: string;
  items: OrderItem[];
  paymentStatus: PaymentStatus;
  orderType: OrderType;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

// Global UI State
export interface CartItem {
  item: CatalogItem;
  quantity: number;
  bookingSchedule?: {
    date: string;
    timeSlot: string;
  };
}

export interface SaaSPayment {
  id: string;
  storeId: string;
  storeName: string;
  amount: number;
  currency: string;
  plannedDate: string; // 'YYYY-MM-DD'
  executionDate?: string; // 'YYYY-MM-DD'
  status: 'PAID' | 'PENDING' | 'FAILED';
  planType: 'market_growth' | 'control_omnicanal' | 'enterprise_elite';
  planName: string;
  paymentMethod: string;
  billingPeriod: string; // e.g. "Febrero 2026", "Marzo 2026"
}

