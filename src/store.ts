/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { CatalogItem, Order, CartItem, Store, DeliveryPartner } from './types.js';

interface PetmallState {
  catalog: CatalogItem[];
  orders: Order[];
  stores: Store[];
  cart: CartItem[];
  deliveryPartners: DeliveryPartner[];
  currentStore: Store | null;
  currentUser: {
    email: string;
    role: 'CUSTOMER' | 'STORE_OWNER' | 'STORE_STAFF' | 'SUPER_USER';
    storeId?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  } | null;
  sseConnected: boolean;
  isDemoMode: boolean;

  // Actions
  fetchCatalog: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchStores: () => Promise<void>;
  fetchDeliveryPartners: () => Promise<void>;
  setDemoMode: (active: boolean) => void;
  
  addToCart: (item: CatalogItem, quantity?: number, booking?: { date: string; timeSlot: string }) => void;
  removeFromCart: (itemId: string, timeSlot?: string) => void;
  clearCart: () => void;
  
  setCurrentStore: (store: Store) => void;
  loginUser: (email: string, role: 'STORE_OWNER' | 'STORE_STAFF' | 'SUPER_USER') => void;
  logoutUser: () => void;

  // Real-time synchronization state mutation
  startSseConnection: () => void;
  createCatalogItem: (data: Partial<CatalogItem>) => Promise<CatalogItem>;
  submitPosSale: (items: { itemId: string; quantity: number }[]) => Promise<{ success: boolean; order?: Order }>;
  submitCheckout: (orderType: 'DELIVERY' | 'CLICK_AND_COLLECT' | 'SERVICE_BOOKING', deliveryData?: any) => Promise<{ success: boolean; order?: Order }>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  enrollStore: (data: any) => Promise<{ success: boolean; store?: Store }>;
  registerDeliveryPartner: (data: any) => Promise<any>;
  rateDeliveryPartner: (id: string, data: any) => Promise<any>;
}

export const usePetmallStore = create<PetmallState>((set, get) => {
  let eventSource: EventSource | null = null;

  return {
    catalog: [],
    orders: [],
    stores: [],
    cart: [],
    deliveryPartners: [],
    currentStore: null,
    currentUser: null,
    sseConnected: false,
    isDemoMode: false,

    fetchCatalog: async () => {
      try {
        const isDemo = get().isDemoMode;
        const res = await fetch(`/api/catalog${isDemo ? '?demo=true' : ''}`);
        if (res.ok) {
          const data = await res.json();
          set({ catalog: data });
        }
      } catch (err) {
        console.error('Error fetching catalog:', err);
      }
    },

    fetchOrders: async () => {
      try {
        const isDemo = get().isDemoMode;
        const res = await fetch(`/api/orders${isDemo ? '?demo=true' : ''}`);
        if (res.ok) {
          const data = await res.json();
          set({ orders: data });
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      }
    },

    fetchStores: async () => {
      try {
        const isDemo = get().isDemoMode;
        const res = await fetch(`/api/stores${isDemo ? '?demo=true' : ''}`);
        if (res.ok) {
          const data = await res.json();
          set({ stores: data, currentStore: data[0] || null });
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
      }
    },

    setDemoMode: (active: boolean) => {
      set({ isDemoMode: active });
      get().fetchCatalog();
      get().fetchStores();
      get().fetchOrders();
    },

    addToCart: (item, quantity = 1, booking) => {
      const currentCart = get().cart;
      
      // Match key for services (depends on booking slots)
      const existingIdx = currentCart.findIndex((cartItem) => {
        if (cartItem.item.id !== item.id) return false;
        if (item.type === 'SERVICE') {
          return cartItem.bookingSchedule?.date === booking?.date && 
                 cartItem.bookingSchedule?.timeSlot === booking?.timeSlot;
        }
        return true;
      });

      if (existingIdx !== -1) {
        const updatedCart = [...currentCart];
        updatedCart[existingIdx].quantity += quantity;
        set({ cart: updatedCart });
      } else {
        set({ cart: [...currentCart, { item, quantity, bookingSchedule: booking }] });
      }
    },

    removeFromCart: (itemId, timeSlot) => {
      const currentCart = get().cart;
      const filtered = currentCart.filter((cartItem) => {
        if (cartItem.item.id !== itemId) return true;
        if (timeSlot) {
          return cartItem.bookingSchedule?.timeSlot !== timeSlot;
        }
        return false;
      });
      set({ cart: filtered });
    },

    clearCart: () => set({ cart: [] }),

    setCurrentStore: (store) => set({ currentStore: store }),

    loginUser: (email, role) => {
      const matchedStore = get().stores.find((s) => s.ownerId?.toLowerCase() === email.toLowerCase() || s.email?.toLowerCase() === email.toLowerCase());
      const storeId = matchedStore ? matchedStore.id : 'store_1';
      
      let firstName = 'Colaborador';
      let lastName = 'Petmall';
      let avatarUrl = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Cpath d='M50 56a16 16 0 100-32 16 16 0 000 32zm0 4c-18.5 0-32 10.5-32 20v4h64v-4c0-9.5-13.5-20-32-20z' fill='%23475569'/%3E%3C/svg%3E";

      const emailLower = email.toLowerCase();
      let resolvedRole = role;

      if (emailLower === 'super@petmall.com') {
        resolvedRole = 'SUPER_USER';
        firstName = 'Sofía';
        lastName = 'García';
        avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120';
      } else if (emailLower === 'manager@petmall.com') {
        firstName = 'Regina';
        lastName = 'Ortega';
        avatarUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120';
      } else if (emailLower === 'comerciante1@petmall.com') {
        firstName = 'Juan';
        lastName = 'Rodríguez';
        avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
      } else if (emailLower === 'vendedor@petmall.com') {
        firstName = 'Andrés';
        lastName = 'Salas';
        avatarUrl = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120';
      } else if (emailLower === 'comerciante2@petmall.com') {
        firstName = 'Camila';
        lastName = 'López';
        avatarUrl = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120';
      } else if (emailLower === 'comerciante3@petmall.com') {
        firstName = 'Mateo';
        lastName = 'Sánchez';
        avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120';
      }

      set({
        currentUser: {
          email,
          role: resolvedRole,
          storeId,
          firstName,
          lastName,
          avatarUrl
        }
      });
    },

    logoutUser: () => set({ currentUser: null }),

    startSseConnection: () => {
      if (eventSource) return;

      console.log('[SSE] Starting real-time sync stream connection...');
      eventSource = new EventSource('/api/live');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('[SSE] Message received:', payload);
          
          if (payload.type === 'CONNECTED') {
            set({ sseConnected: true });
          }

          if (payload.type === 'CATALOG_CREATED') {
            set((state) => ({ catalog: [...state.catalog, payload.data] }));
          }

          if (payload.type === 'CATALOG_UPDATED') {
            set((state) => ({
              catalog: state.catalog.map(i => i.id === payload.data.id ? payload.data : i)
            }));
          }

          if (payload.type === 'ORDER_CREATED') {
            set((state) => ({ orders: [payload.data, ...state.orders] }));
          }

          if (payload.type === 'ORDER_STATUS_CHANGED') {
            set((state) => ({
              orders: state.orders.map(o => o.id === payload.data.id ? payload.data : o)
            }));
          }

          if (payload.type === 'STOCK_SYNCHRONIZED') {
            const { itemId, stockPhysical, stockDigital } = payload.data;
            set((state) => ({
              catalog: state.catalog.map(item => {
                if (item.id === itemId && item.productDetails) {
                  return {
                    ...item,
                    productDetails: {
                      ...item.productDetails,
                      stockPhysical,
                      stockDigital
                    }
                  };
                }
                return item;
              })
            }));
          }
        } catch (err) {
          console.error('[SSE] Error processing sync message:', err);
        }
      };

      eventSource.onerror = () => {
        console.warn('[SSE] Connection lost. Reconnecting...');
        set({ sseConnected: false });
      };
    },

    createCatalogItem: async (data) => {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newItem = await res.json();
        // SSE will also broadcast this, but updating early is nice
        return newItem;
      }
      throw new Error('No se pudo guardar el ítem en catálogo');
    },

    submitPosSale: async (items) => {
      const res = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          storeId: 'store_1'
        })
      });
      if (res.ok) {
        const response = await res.json();
        return { success: true, order: response.order };
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Venta falló por stock insuficiente o bloqueo');
      }
    },

    submitCheckout: async (orderType, deliveryData) => {
      const cart = get().cart;
      if (cart.length === 0) throw new Error('El carro está vacío');

      const bodyItems = cart.map(item => ({
        itemId: item.item.id,
        quantity: item.quantity,
        bookingSchedule: item.bookingSchedule
      }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: bodyItems,
          storeId: 'store_1',
          orderType: orderType,
          ...deliveryData
        })
      });

      if (res.ok) {
        const response = await res.json();
        set({ cart: [] }); // Empty cart on success
        return { success: true, order: response.order };
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Checkout falló debido a existencias concurrentes ocupadas');
      }
    },

    updateOrderStatus: async (orderId, status) => {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    },
    
    enrollStore: async (data) => {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const response = await res.json();
        await get().fetchStores();
        await get().fetchCatalog();
        return { success: true, store: response.store };
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'No se pudo enrolar el comercio');
      }
    },

    fetchDeliveryPartners: async () => {
      try {
        const res = await fetch('/api/delivery/partners');
        if (res.ok) {
          const data = await res.json();
          set({ deliveryPartners: data });
        }
      } catch (err) {
        console.error('Error fetching delivery partners:', err);
      }
    },

    registerDeliveryPartner: async (data) => {
      const res = await fetch('/api/delivery/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const response = await res.json();
        await get().fetchDeliveryPartners();
        return response;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'No se pudo inscribir como repartidor');
      }
    },

    rateDeliveryPartner: async (id, data) => {
      const res = await fetch(`/api/delivery/partners/${id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const response = await res.json();
        await get().fetchDeliveryPartners();
        await get().fetchOrders(); // Refresh orders
        return response;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'No se pudo enviar la evaluación');
      }
    }
  };
});
