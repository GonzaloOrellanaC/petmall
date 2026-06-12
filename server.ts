/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { CatalogItem, Order, Store, SaaSPayment } from './src/types.js'; // typescript files would need matching js/ts extension
import { 
  connectMongoDB, 
  isMongoDbActive, 
  UserDb, 
  StoreDb, 
  CatalogItemDb, 
  OrderDb, 
  SaaSPaymentDb,
  MEMORY_SEED_CATALOG, 
  MEMORY_SEED_SAAS_PAYMENTS,
  SEED_STORES, 
  seedMongoDb 
} from './src/db/mongodb.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Concurrency Lock Manager: Prevents race conditions over physical stock or service capacity
class LockManager {
  private activeLocks = new Set<string>();
  private queue: { [key: string]: (() => void)[] } = {};

  async acquire(key: string): Promise<void> {
    if (!this.activeLocks.has(key)) {
      this.activeLocks.add(key);
      console.log(`[LockManager] Lock ACQUIRED for key: ${key}`);
      return;
    }

    return new Promise<void>((resolve) => {
      if (!this.queue[key]) {
        this.queue[key] = [];
      }
      this.queue[key].push(resolve);
      console.log(`[LockManager] Request for key ${key} queued. Queue length: ${this.queue[key].length}`);
    });
  }

  release(key: string): void {
    const next = this.queue[key]?.shift();
    if (next) {
      console.log(`[LockManager] Lock PASSED to queued request for key: ${key}`);
      // Run next in queue without releasing the lock
      setTimeout(next, 0);
    } else {
      this.activeLocks.delete(key);
      console.log(`[LockManager] Lock RELEASED for key: ${key}`);
    }
  }
}

const dbLock = new LockManager();

// --- IN-MEMORY DATABASE (Seeded with high-fidelity items matching screenshots) ---
let stores: Store[] = [
  {
    id: 'store_1',
    name: "Don Jorge's BioShop",
    ownerId: 'owner_123',
    geolocation: { type: 'Point', coordinates: [-122.4194, 37.7749] }, // San Francisco
    businessType: 'HYBRID',
    branding: {
      theme: 'A',
      colors: { primary: '#0b2240', accent: '#cfa86b' }
    }
  },
  {
    id: 'store_2',
    name: 'EcoPet Green Store',
    ownerId: 'owner_456',
    geolocation: { type: 'Point', coordinates: [-122.4014, 37.7889] },
    businessType: 'PRODUCTS_ONLY',
    branding: {
      theme: 'B',
      colors: { primary: '#15803d', accent: '#a3e635' }
    }
  },
  {
    id: 'store_3',
    name: 'Vet & Care Clinic',
    ownerId: 'owner_789',
    geolocation: { type: 'Point', coordinates: [-122.4312, 37.7610] },
    businessType: 'SERVICES_ONLY',
    branding: {
      theme: 'A',
      colors: { primary: '#1e3a8a', accent: '#f59e0b' }
    }
  }
];

let catalog: CatalogItem[] = [
  {
    id: 'item_1',
    storeId: 'store_1',
    type: 'PRODUCT',
    title: 'Alimento Natural Gato Adulto',
    description: 'Alimento Natural Premiom para Gatos producido con ingredientes 100% orgánicos, sanos y libres de granos nocivos. Perfecto para la digestión del felino.',
    price: 24.99,
    category: 'Alimento Barf',
    images: ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80'],
    productDetails: {
      sku: 'CAT-FOOD-ORG-01',
      barcode: '7423849201932',
      costPrice: 12.50,
      stockPhysical: 15,
      stockDigital: 15,
      reorderThreshold: 5,
      supplierInfo: { name: "Nature's Pet Distribution", email: "orders@naturespet.com" }
    }
  },
  {
    id: 'item_2',
    storeId: 'store_1',
    type: 'PRODUCT',
    title: 'Arena Sanitaria Biodegradable',
    description: 'Arena ecológica aglutinante a base de fibras de cereales. Alta absorción y control natural de olores para la higiene de tu gato.',
    price: 24.99,
    category: 'Salud Natural',
    images: ['https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&q=80'],
    productDetails: {
      sku: 'CAT-LITTER-ECO-02',
      barcode: '7423849201988',
      costPrice: 11.00,
      stockPhysical: 25,
      stockDigital: 22,
      reorderThreshold: 8,
      supplierInfo: { name: "EcoSanitary Corp", email: "info@ecosanitary.com" }
    }
  },
  {
    id: 'item_3',
    storeId: 'store_1',
    type: 'PRODUCT',
    title: 'Juguetes Orgánicos Set de Soga',
    description: 'Set de juguetes fabricados con hilos de algodón orgánico teñidos con pigmentos naturales vegetales. Libres de microplásticos.',
    price: 18.50,
    category: 'Vegano',
    images: ['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&q=80'],
    productDetails: {
      sku: 'PET-TOY-COTTON-03',
      barcode: '7423849202044',
      costPrice: 6.20,
      stockPhysical: 12,
      stockDigital: 12,
      reorderThreshold: 3,
      supplierInfo: { name: "GreenToys Latam", email: "ventas@greentoys.cl" }
    }
  },
  {
    id: 'item_4',
    storeId: 'store_1',
    type: 'SERVICE',
    title: 'Peluquería Canina Relajante',
    description: 'Baño y peluquería premium con masoterapia y aromaterapia natural. Estilistas profesionales cuidarán de la higiene de tu amigo.',
    price: 35.00,
    category: 'Paseadores',
    images: ['https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=500&q=80'],
    serviceDetails: {
      durationMinutes: 60,
      capacityPerSlot: 2,
      specialistName: 'Dra. María Martínez',
      slotsAvailable: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
        { dayOfWeek: 6, startTime: '10:00', endTime: '14:00' }
      ]
    }
  },
  {
    id: 'item_5',
    storeId: 'store_3',
    type: 'SERVICE',
    title: 'Consulta Veterinaria Integrativa',
    description: 'Diagnóstico holístico, control de peso, nutrición barf personalizada y chequeo general adaptado a la edad pediátrica o geriátrica.',
    price: 45.00,
    category: 'Veterinarios',
    images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&q=80'],
    serviceDetails: {
      durationMinutes: 45,
      capacityPerSlot: 1,
      specialistName: 'Dr. Roberto Soto',
      slotsAvailable: [
        { dayOfWeek: 1, startTime: '08:30', endTime: '17:30' },
        { dayOfWeek: 2, startTime: '08:30', endTime: '17:30' },
        { dayOfWeek: 3, startTime: '08:30', endTime: '17:30' },
        { dayOfWeek: 4, startTime: '08:30', endTime: '17:30' },
        { dayOfWeek: 5, startTime: '08:30', endTime: '17:30' }
      ]
    }
  }
];

let orders: Order[] = [
  {
    id: 'ord_1',
    customerId: 'cust_999',
    customerName: 'Juan Pérez',
    storeId: 'store_1',
    items: [
      { itemId: 'item_1', quantity: 2 }
    ],
    paymentStatus: 'PAID',
    orderType: 'DELIVERY',
    status: 'PREPARING',
    total: 49.98,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'ord_2',
    customerId: 'cust_888',
    customerName: 'Sofía Larraín',
    storeId: 'store_1',
    items: [
      {
        itemId: 'item_4',
        quantity: 1,
        bookingSchedule: { date: '2026-06-12', timeSlot: '11:00' }
      }
    ],
    paymentStatus: 'PAID',
    orderType: 'SERVICE_BOOKING',
    status: 'BOOKED',
    total: 35.00,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

let memoryUsers = [
  { email: 'super@petmall.com', role: 'SUPER_USER', firstName: 'Sofía', lastName: 'García', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120' },
  { email: 'comerciante1@petmall.com', role: 'STORE_OWNER', storeId: 'store_1', firstName: 'Juan', lastName: 'Rodríguez', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120' },
  { email: 'manager@petmall.com', role: 'STORE_OWNER', storeId: 'store_1', firstName: 'Regina', lastName: 'Ortega', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120' },
  { email: 'vendedor@petmall.com', role: 'STORE_STAFF', storeId: 'store_1', firstName: 'Andrés', lastName: 'Salas', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' },
  { email: 'comerciante2@petmall.com', role: 'STORE_OWNER', storeId: 'store_2', firstName: 'Camila', lastName: 'López', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120' },
  { email: 'comerciante3@petmall.com', role: 'STORE_OWNER', storeId: 'store_3', firstName: 'Mateo', lastName: 'Sánchez', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120' },
];

let saasPayments: SaaSPayment[] = [...MEMORY_SEED_SAAS_PAYMENTS];

// --- SERVER-SENT EVENTS (SSE) BROADCAST BUS ---
let sseClients: any[] = [];

function broadcastToClients(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  sseClients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
}

// Start Server Setup
async function startServer() {
  // Connect to MongoDB
  await connectMongoDB();

  if (isMongoDbActive()) {
    try {
      const storesCount = await StoreDb.countDocuments();
      if (storesCount === 0) {
        console.log('[MongoDB] Connected, but database is empty. Auto-seeding now...');
        await seedMongoDb();
      } else {
        console.log('[MongoDB] Connected database has existing records. Skipping seed.');
      }
    } catch (err: any) {
      console.error('[MongoDB Error checking stores count]', err.message);
    }
  }

  const app = express();
  app.use(express.json());

  // --- API ENDPOINTS ---

  // Real-Time Event Stream (SSE Setup)
  app.get('/api/live', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write('data: {"type":"CONNECTED"}\n\n');
    sseClients.push(res);

    // Send a periodic heartbeat (every 15 seconds) to prevent proxy/Cloud Run timeouts
    const heartbeatInterval = setInterval(() => {
      res.write(':keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeatInterval);
      sseClients = sseClients.filter((client) => client !== res);
    });
  });

  // Get Stores
  app.get('/api/stores', async (req, res) => {
    const isDemo = req.query.demo === 'true';
    if (isDemo) {
      if (isMongoDbActive()) {
        try {
          const dbStores = await (StoreDb as any).find({ demo: true });
          if (dbStores.length > 0) {
            return res.json(dbStores);
          }
        } catch (err: any) {
          console.error('[MongoDB Get Demo Stores Error]', err.message);
        }
      }
      return res.json(SEED_STORES);
    }

    if (isMongoDbActive()) {
      try {
        const dbStores = await (StoreDb as any).find({ $or: [{ demo: false }, { demo: { $exists: false } }] });
        if (dbStores.length > 0) {
          return res.json(dbStores);
        }
      } catch (err: any) {
        console.error('[MongoDB Get Non-Demo Stores Error]', err.message);
      }
    }

    res.json(stores.filter(s => !s.demo));
  });

  // Delete Store and cascade delete all associated users and catalog items (products & services)
  app.delete('/api/stores/:storeId', async (req, res) => {
    const { storeId } = req.params;

    if (isMongoDbActive()) {
      try {
        // Cascade DELETE:
        // 1. Delete associated users
        const deletedUsers = await (UserDb as any).deleteMany({ storeId });
        // 2. Delete associated products and services (Catalog items)
        const deletedCatalogItems = await (CatalogItemDb as any).deleteMany({ storeId });
        // 3. Delete associated SaaS payments
        const deletedPayments = await (SaaSPaymentDb as any).deleteMany({ storeId });
        // 4. Delete store itself
        const deletedStore = await (StoreDb as any).deleteOne({ id: storeId });

        console.log(`[MongoDB Cascade Delete] Store ${storeId} deleted:`, {
          storeDeleted: deletedStore.deletedCount,
          usersDeleted: deletedUsers.deletedCount,
          catalogItemsDeleted: deletedCatalogItems.deletedCount,
          paymentsDeleted: deletedPayments.deletedCount
        });

      } catch (err: any) {
        console.error('[MongoDB Delete Store Error]', err.message);
        return res.status(500).json({ error: 'Fallo al borrar tienda en MongoDB: ' + err.message });
      }
    }

    // Always clean in-memory state as well (whether MongoDB is active or fallback)
    const initialStoresCount = stores.length;
    stores = stores.filter(s => s.id !== storeId);
    
    const initialUsersCount = memoryUsers.length;
    memoryUsers = memoryUsers.filter(u => u.storeId !== storeId);
    
    const initialCatalogCount = catalog.length;
    catalog = catalog.filter(item => item.storeId !== storeId);

    const initialPaymentsCount = saasPayments.length;
    saasPayments = saasPayments.filter(p => p.storeId !== storeId);

    console.log(`[In-Memory Cascade Delete] Store ${storeId} deleted:`, {
      storesDeleted: initialStoresCount - stores.length,
      usersDeleted: initialUsersCount - memoryUsers.length,
      catalogItemsDeleted: initialCatalogCount - catalog.length,
      paymentsDeleted: initialPaymentsCount - saasPayments.length
    });

    // Notify clients that database lists changed
    sseClients.forEach((client) => {
      try {
        client.write(`data: {"type":"SYNC_STORES"}\n\n`);
        client.write(`data: {"type":"SYNC_CATALOG"}\n\n`);
      } catch (e) {
        // Safe stream retry
      }
    });

    return res.json({ 
      success: true, 
      message: `La tienda ${storeId} ha sido eliminada junto con todos sus colaboradores, productos, servicios y registros de pago asociados.` 
    });
  });

  // Get SaaS Payments (auditoría de pagos SaaS de tiendas)
  app.get('/api/saas-payments', async (req, res) => {
    const { storeId } = req.query;
    
    if (isMongoDbActive()) {
      try {
        const query = storeId ? { storeId: String(storeId) } : {};
        const dbPayments = await (SaaSPaymentDb as any).find(query);
        return res.json(dbPayments);
      } catch (err: any) {
        console.error('[MongoDB Get SaaS Payments Error]', err.message);
      }
    }
    
    if (storeId) {
      return res.json(saasPayments.filter(p => p.storeId === String(storeId)));
    }
    return res.json(saasPayments);
  });

  // Simular pago manual de una fecha acordada o cuota pendiente
  app.post('/api/saas-payments/:paymentId/execute', async (req, res) => {
    const { paymentId } = req.params;
    const executionDate = new Date().toISOString().split('T')[0];
    
    if (isMongoDbActive()) {
      try {
        const updated = await (SaaSPaymentDb as any).findOneAndUpdate(
          { id: paymentId },
          { status: 'PAID', executionDate: executionDate },
          { new: true }
        );
        if (updated) {
          // Sync with memory fallback too
          const idx = saasPayments.findIndex(p => p.id === paymentId);
          if (idx !== -1) {
            saasPayments[idx].status = 'PAID';
            saasPayments[idx].executionDate = executionDate;
          }
          return res.json({ success: true, payment: updated });
        }
      } catch (err: any) {
        console.error('[MongoDB Execute SaaS Payment Error]', err.message);
      }
    }
    
    const idx = saasPayments.findIndex(p => p.id === paymentId);
    if (idx !== -1) {
      saasPayments[idx].status = 'PAID';
      saasPayments[idx].executionDate = executionDate;
      return res.json({ success: true, payment: saasPayments[idx] });
    }
    
    res.status(404).json({ error: 'Pago de suscripción no encontrado o inválido' });
  });

  // Crear un nuevo registro de acuerdo de pago o pago ejecutado para auditoría
  app.post('/api/saas-payments', async (req, res) => {
    const { storeId, storeName, amount, plannedDate, executionDate, status, planType, planName, paymentMethod, billingPeriod } = req.body;
    
    if (!storeId || !storeName || !amount || !plannedDate || !status) {
      return res.status(400).json({ error: 'Datos de pago incompletos. Se requieren storeId, storeName, amount, plannedDate y status.' });
    }

    const newPayment: SaaSPayment = {
      id: `spay_${storeId}_manual_${Date.now()}`,
      storeId,
      storeName,
      amount: Number(amount),
      currency: 'CLP',
      plannedDate,
      executionDate,
      status,
      planType: planType || 'control_omnicanal',
      planName: planName || 'Plan Personalizado',
      paymentMethod: paymentMethod || 'Tarjeta Bancaria (PAT)',
      billingPeriod: billingPeriod || 'Mes Corriente'
    };

    if (isMongoDbActive()) {
      try {
        await (SaaSPaymentDb as any).create(newPayment);
        console.log('[MongoDB] Manual SaaS payment created:', newPayment.id);
      } catch (err: any) {
        console.error('[MongoDB Create SaaS Payment Error]', err.message);
        return res.status(500).json({ error: 'Error al registrar pago en BD: ' + err.message });
      }
    }

    saasPayments.push(newPayment);
    return res.status(201).json({ success: true, payment: newPayment });
  });

  // --- USER MANAGEMENT ENDPOINTS ---

  // Get users for a store
  app.get('/api/stores/:storeId/users', async (req, res) => {
    const { storeId } = req.params;
    if (isMongoDbActive()) {
      try {
        const dbUsers = await (UserDb as any).find({ storeId });
        return res.json(dbUsers);
      } catch (err: any) {
        return res.status(500).json({ error: 'Error al buscar usuarios en MongoDB: ' + err.message });
      }
    } else {
      const filtered = memoryUsers.filter(u => u.storeId === storeId);
      return res.json(filtered);
    }
  });

  // Create or register new admin user
  app.post('/api/stores/:storeId/users', async (req, res) => {
    const { storeId } = req.params;
    const { email, role, firstName, lastName, avatarUrl } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email y Rol son requeridos.' });
    }

    // Determine current plan user limit check
    let activePlanType = 'control_omnicanal';
    if (isMongoDbActive()) {
      try {
        const store = await (StoreDb as any).findOne({ id: storeId });
        activePlanType = store?.planType || 'control_omnicanal';
      } catch (e) {}
    } else {
      const store = stores.find(s => s.id === storeId);
      activePlanType = store?.planType || 'control_omnicanal';
    }

    const maxUsers = activePlanType === 'market_growth' ? 2 : activePlanType === 'control_omnicanal' ? 6 : Infinity;

    let currentCount = 0;
    if (isMongoDbActive()) {
      try {
        currentCount = await (UserDb as any).countDocuments({ storeId });
      } catch (e) {}
    } else {
      currentCount = memoryUsers.filter(u => u.storeId === storeId).length;
    }

    if (currentCount >= maxUsers) {
      const planLabel = activePlanType === 'market_growth' ? 'Market & Growth (máx 2)' : 'Control & Omnicanal (máx 6)';
      return res.status(400).json({ 
        error: `Límite de usuarios alcanzado: Tu plan "${planLabel}" no permite agregar más personal. Por favor mejora al plan "Enterprise & Elite" para contar con usuarios administradores ILIMITADOS.` 
      });
    }

    const finalFirstName = firstName || 'Colaborador';
    const finalLastName = lastName || 'Petmall';
    const finalAvatarUrl = avatarUrl || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&q=80&w=120`;

    if (isMongoDbActive()) {
      try {
        // Delete conflicting to avoid replication
        await (UserDb as any).deleteOne({ email: email.toLowerCase() });
        const newUser = await (UserDb as any).create({
          email: email.toLowerCase(),
          role,
          storeId,
          firstName: finalFirstName,
          lastName: finalLastName,
          avatarUrl: finalAvatarUrl
        });
        return res.json(newUser);
      } catch (err: any) {
        return res.status(500).json({ error: 'Error al guardar usuario en MongoDB: ' + err.message });
      }
    } else {
      // Remove duplicates from memory
      memoryUsers = memoryUsers.filter(u => u.email.toLowerCase() !== email.toLowerCase());
      const newUser = { 
        email: email.toLowerCase(), 
        role, 
        storeId,
        firstName: finalFirstName,
        lastName: finalLastName,
        avatarUrl: finalAvatarUrl
      };
      memoryUsers.push(newUser);
      return res.json(newUser);
    }
  });

  // Delete a user
  app.delete('/api/stores/:storeId/users/:email', async (req, res) => {
    const { storeId, email } = req.params;
    if (isMongoDbActive()) {
      try {
        await (UserDb as any).deleteOne({ storeId, email: email.toLowerCase() });
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: 'Error al eliminar usuario en MongoDB: ' + err.message });
      }
    } else {
      memoryUsers = memoryUsers.filter(u => !(u.storeId === storeId && u.email.toLowerCase() === email.toLowerCase()));
      return res.json({ success: true });
    }
  });

  // Get Catalog
  app.get('/api/catalog', async (req, res) => {
    const isDemo = req.query.demo === 'true';
    const { storeId, type } = req.query;

    if (isDemo) {
      if (isMongoDbActive()) {
        try {
          const demoStores = await (StoreDb as any).find({ demo: true });
          const demoStoreIds = demoStores.map((s: any) => s.id);

          const query: any = { storeId: { $in: demoStoreIds } };
          if (storeId) query.storeId = storeId;
          if (type) query.type = type;

          const dbCatalog = await (CatalogItemDb as any).find(query);
          if (dbCatalog.length > 0) {
            return res.json(dbCatalog);
          }
        } catch (err: any) {
          console.error('[MongoDB Get Demo Catalog Error]', err.message);
        }
      }

      let filtered = MEMORY_SEED_CATALOG;
      if (storeId) filtered = filtered.filter(i => i.storeId === storeId);
      if (type) filtered = filtered.filter(i => i.type === type);
      return res.json(filtered);
    }

    // Non-demo (path '/')
    if (isMongoDbActive()) {
      try {
        const demoStores = await (StoreDb as any).find({ demo: true });
        const demoStoreIds = demoStores.map((s: any) => s.id);

        const query: any = { storeId: { $nin: demoStoreIds } };
        if (storeId) query.storeId = storeId;
        if (type) query.type = type;

        const dbCatalog = await (CatalogItemDb as any).find(query);
        return res.json(dbCatalog);
      } catch (err: any) {
        console.error('[MongoDB Get Non-Demo Catalog Error]', err.message);
      }
    }

    let filtered = catalog.filter(i => {
      const parentStore = stores.find(s => s.id === i.storeId);
      return !parentStore || !parentStore.demo;
    });
    if (storeId) filtered = filtered.filter(i => i.storeId === storeId);
    if (type) filtered = filtered.filter(i => i.type === type);
    res.json(filtered);
  });

  // Get Catalog Item
  app.get('/api/catalog/:id', async (req, res) => {
    const isDemo = req.query.demo === 'true';
    const { id } = req.params;

    if (isDemo) {
      if (isMongoDbActive()) {
        try {
          const dbItem = await (CatalogItemDb as any).findOne({ id });
          if (dbItem) {
            const store = await (StoreDb as any).findOne({ id: dbItem.storeId });
            if (store && store.demo) {
              return res.json(dbItem);
            }
          }
        } catch (err: any) {
          console.error('[MongoDB Get Demo Item Detail Error]', err.message);
        }
      }

      const item = MEMORY_SEED_CATALOG.find((i) => i.id === id);
      if (item) {
        return res.json(item);
      } else {
        return res.status(404).json({ error: 'Item no encontrado' });
      }
    }

    if (isMongoDbActive()) {
      try {
        const dbItem = await (CatalogItemDb as any).findOne({ id });
        if (dbItem) {
          const store = await (StoreDb as any).findOne({ id: dbItem.storeId });
          if (store && store.demo) {
            return res.status(403).json({ error: 'Este ítem pertenece al catálogo demo y no está disponible en producción.' });
          }
          return res.json(dbItem);
        }
      } catch (err: any) {
        console.error('[MongoDB Get Item Detail Error]', err.message);
      }
    }

    const item = catalog.find((i) => i.id === id);
    if (item) {
      const parentStore = stores.find(s => s.id === item.storeId);
      if (parentStore && parentStore.demo) {
        return res.status(403).json({ error: 'Este ítem pertenece al catálogo demo y no está disponible en producción.' });
      }
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item no encontrado' });
    }
  });

  // Create/Update Catalog Item
  app.post('/api/catalog', async (req, res) => {
    const data = req.body;

    if (isMongoDbActive()) {
      try {
        if (data.id) {
          // update
          const updated = await (CatalogItemDb as any).findOneAndUpdate({ id: data.id } as any, data as any, { new: true });
          if (updated) {
            broadcastToClients('CATALOG_UPDATED', updated);
            return res.json(updated);
          }
        } else {
          // create
          const newId = 'item_' + Math.random().toString(36).substring(2, 9);
          const newItem = {
            id: newId,
            storeId: data.storeId || 'store_1',
            type: data.type,
            title: data.title,
            description: data.description || '',
            price: Number(data.price),
            category: data.category || 'Varios',
            images: data.images && data.images.length ? data.images : ['https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=500&q=80'],
            productDetails: data.type === 'PRODUCT' ? {
              sku: data.productDetails?.sku || 'SKU-' + Date.now(),
              barcode: data.productDetails?.barcode || '',
              costPrice: Number(data.productDetails?.costPrice || 0),
              stockPhysical: Number(data.productDetails?.stockPhysical || 0),
              stockDigital: Number(data.productDetails?.stockDigital || 0),
              reorderThreshold: Number(data.productDetails?.reorderThreshold || 2),
              supplierInfo: {
                name: data.productDetails?.supplierInfo?.name || 'Distribuidor',
                email: data.productDetails?.supplierInfo?.email || ''
              }
            } : undefined,
            serviceDetails: data.type === 'SERVICE' ? {
              durationMinutes: Number(data.serviceDetails?.durationMinutes || 30),
              capacityPerSlot: Number(data.serviceDetails?.capacityPerSlot || 1),
              specialistName: data.serviceDetails?.specialistName || 'Especialista',
              slotsAvailable: data.serviceDetails?.slotsAvailable || []
            } : undefined
          };
          const created = await (CatalogItemDb as any).create(newItem as any);
          broadcastToClients('CATALOG_CREATED', created);
          return res.status(201).json(created);
        }
      } catch (err: any) {
        console.error('[MongoDB Save Catalog Error]', err.message);
      }
    }

    // Fallback to memory
    if (data.id) {
      // update
      const idx = catalog.findIndex(i => i.id === data.id);
      if (idx !== -1) {
        catalog[idx] = { ...catalog[idx], ...data };
        broadcastToClients('CATALOG_UPDATED', catalog[idx]);
        return res.json(catalog[idx]);
      }
    }
    
    // create
    const newItem: CatalogItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      storeId: data.storeId || 'store_1',
      type: data.type,
      title: data.title,
      description: data.description || '',
      price: Number(data.price),
      category: data.category || 'Varios',
      images: data.images && data.images.length ? data.images : ['https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=500&q=80'],
      productDetails: data.type === 'PRODUCT' ? {
        sku: data.productDetails?.sku || 'SKU-' + Date.now(),
        barcode: data.productDetails?.barcode || '',
        costPrice: Number(data.productDetails?.costPrice || 0),
        stockPhysical: Number(data.productDetails?.stockPhysical || 0),
        stockDigital: Number(data.productDetails?.stockDigital || 0),
        reorderThreshold: Number(data.productDetails?.reorderThreshold || 2),
        supplierInfo: {
          name: data.productDetails?.supplierInfo?.name || 'Distribuidor',
          email: data.productDetails?.supplierInfo?.email || ''
        }
      } : undefined,
      serviceDetails: data.type === 'SERVICE' ? {
        durationMinutes: Number(data.serviceDetails?.durationMinutes || 30),
        capacityPerSlot: Number(data.serviceDetails?.capacityPerSlot || 1),
        specialistName: data.serviceDetails?.specialistName || 'Especialista',
        slotsAvailable: data.serviceDetails?.slotsAvailable || []
      } : undefined
    };

    catalog.push(newItem);
    broadcastToClients('CATALOG_CREATED', newItem);
    res.status(201).json(newItem);
  });

  // Get orders
  app.get('/api/orders', async (req, res) => {
    if (isMongoDbActive()) {
      try {
        const dbOrders = await (OrderDb as any).find({}).sort({ createdAt: -1 });
        return res.json(dbOrders);
      } catch (err: any) {
        console.error('[MongoDB Get Orders Error]', err.message);
      }
    }
    res.json(orders);
  });

  // Update order status
  app.post('/api/orders/:id/status', async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (isMongoDbActive()) {
      try {
        const updated = await (OrderDb as any).findOneAndUpdate({ id: orderId } as any, { status } as any, { new: true });
        if (updated) {
          broadcastToClients('ORDER_STATUS_CHANGED', updated);
          return res.json(updated);
        }
      } catch (err: any) {
        console.error('[MongoDB Update Order Status Error]', err.message);
      }
    }

    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      broadcastToClients('ORDER_STATUS_CHANGED', order);
      return res.json(order);
    }
    res.status(404).json({ error: 'Pedido no encontrado' });
  });

  // POS Store Direct Checkout (Race Condition Protection)
  app.post('/api/pos/sale', async (req, res) => {
    const { items, storeId } = req.body; // { items: [{ itemId: string, quantity: number }] }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems para procesar' });
    }

    try {
      // Phase 1: Locking requested product records globally
      console.log(`[POS Sale] Starting safety transaction hook...`);
      for (const reqItem of items) {
        await dbLock.acquire(reqItem.itemId);
      }

      // Phase 2: Transaction Check and Write
      const transactionItems: any[] = [];
      let total = 0;

      for (const reqItem of items) {
        let item = catalog.find(i => i.id === reqItem.itemId);
        
        if (isMongoDbActive()) {
          try {
            const dbItem = await (CatalogItemDb as any).findOne({ id: reqItem.itemId } as any);
            if (dbItem) {
              item = JSON.parse(JSON.stringify(dbItem));
            }
          } catch (e: any) {
            console.error('[MongoDB POS find item error]', e.message);
          }
        }
        
        if (!item) {
          throw new Error(`Item ${reqItem.itemId} no existe en el catálogo`);
        }

        if (item.type !== 'PRODUCT') {
          throw new Error(`Intento incorrecto de vender servicio ${item.title} mediante POS físico de autoservicio instantáneo`);
        }

        const physicalStock = item.productDetails?.stockPhysical || 0;
        if (physicalStock < reqItem.quantity) {
          throw new Error(`Stock insuficiente para ${item.title}: Solicitado ${reqItem.quantity}, disponible ${physicalStock}`);
        }

        // Add to checklist
        transactionItems.push({ item, quantity: reqItem.quantity });
        total += item.price * reqItem.quantity;
      }

      // Mutate catalog securely within transaction lock
      for (const tx of transactionItems) {
        const item = catalog.find(i => i.id === tx.item.id)!;
        if (item.productDetails) {
          const oldStock = item.productDetails.stockPhysical;
          item.productDetails.stockPhysical -= tx.quantity;
          // Synchronize Digital / Marketplace stock as well for omnichannel real-time!
          item.productDetails.stockDigital = Math.max(0, item.productDetails.stockDigital - tx.quantity);
          
          if (isMongoDbActive()) {
            try {
              await (CatalogItemDb as any).findOneAndUpdate(
                { id: item.id } as any,
                {
                  'productDetails.stockPhysical': item.productDetails.stockPhysical,
                  'productDetails.stockDigital': item.productDetails.stockDigital
                } as any,
                { new: true } as any
              );
            } catch (err: any) {
              console.error('[MongoDB POS Stock Mutation Error]', err.message);
            }
          }

          console.log(`[POS Tx] Stock physical updated for ${item.title}: ${oldStock} -> ${item.productDetails.stockPhysical}`);
          broadcastToClients('STOCK_SYNCHRONIZED', {
            itemId: item.id,
            stockPhysical: item.productDetails.stockPhysical,
            stockDigital: item.productDetails.stockDigital,
          });
        }
      }

      // Record transaction
      const newOrder: Order = {
        id: 'ord_' + Math.random().toString(36).substring(2, 9),
        customerId: 'pos_customer',
        customerName: 'Cliente POS Físico',
        storeId: storeId || 'store_1',
        items: items.map((i: any) => ({ itemId: i.itemId, quantity: i.quantity })),
        paymentStatus: 'PAID',
        orderType: 'CLICK_AND_COLLECT', // or in store POS
        status: 'COMPLETED',
        total: total,
        createdAt: new Date().toISOString()
      };

      orders.push(newOrder);
      
      if (isMongoDbActive()) {
        try {
          await (OrderDb as any).create(newOrder as any);
        } catch (err: any) {
          console.error('[MongoDB POS Save Order Error]', err.message);
        }
      }

      broadcastToClients('ORDER_CREATED', newOrder);

      res.json({ success: true, order: newOrder });

    } catch (err: any) {
      console.error(`[POS Sale CRITICAL ERROR] Transaction rolled back:`, err.message);
      res.status(500).json({ error: err.message });
    } finally {
      // Phase 3: Unlocking
      for (const reqItem of items) {
        dbLock.release(reqItem.itemId);
      }
      console.log(`[POS Sale] Safety transaction completed and records unlocked.`);
    }
  });

  // Register / Enroll new Store
  app.post('/api/enroll', async (req, res) => {
    const {
      name,
      email,
      description,
      slogan,
      phone,
      address,
      logoUrl,
      bannerUrl,
      businessType,
      branding,
      planType,
      planName,
      demo,
      geolocation
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre de la tienda y Correo son obligatorios' });
    }

    const storeId = `store_${Date.now()}`;
    const newStore: Store = {
      id: storeId,
      name,
      ownerId: email,
      geolocation: geolocation || { type: 'Point', coordinates: [-70.64827, -33.45694] }, // Santiago, Chile by default if not provided
      businessType: businessType || 'HYBRID',
      branding: branding || {
        theme: 'A',
        colors: { primary: '#0b2240', accent: '#DABD83' }
      },
      demo: demo === true,
      description: description || 'Tienda profesional registrada en ecosistema Petmall.',
      slogan: slogan || 'Bienestar para tu mascota',
      email,
      phone: phone || '+56 9 1234 5678',
      address: address || 'Santiago, Chile',
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=150&q=80',
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200&q=80',
      planType: planType || 'libre_30',
      planName: planName || 'Libre por 30 días',
      isTrial: true,
      trialDaysLeft: 30
    };

    if (isMongoDbActive()) {
      try {
        const savedStore = await (StoreDb as any).create(newStore);
        console.log('[MongoDB] Store enrolled successfully:', savedStore.id);
        
        // Seed 3 mock products/services for this store
        const defaultItems = [
          {
            id: `item_${storeId}_1`,
            storeId: storeId,
            type: 'PRODUCT',
            title: `Alimento Premium de Prueba (${name})`,
            description: `Nutrición especializada de prueba para tus mascotas. Exclusivo de ${name}.`,
            price: 15.99,
            category: 'Alimento Barf',
            images: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80'],
            productDetails: {
              sku: `TEST-SKU-1`,
              barcode: `TESTBAR1`,
              costPrice: 8.00,
              stockPhysical: 50,
              stockDigital: 45,
              reorderThreshold: 5,
              supplierInfo: { name: 'Ecosistema Petmall', email: 'soporte@petmall.com' }
            }
          },
          {
            id: `item_${storeId}_2`,
            storeId: storeId,
            type: 'PRODUCT',
            title: `Accesorio de Testecilla (${name})`,
            description: `Juguete o accesorio de alta durabilidad para fomentar el juego activo.`,
            price: 9.99,
            category: 'Vegano',
            images: ['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&q=80'],
            productDetails: {
              sku: `TEST-SKU-2`,
              barcode: `TESTBAR2`,
              costPrice: 4.00,
              stockPhysical: 30,
              stockDigital: 25,
              reorderThreshold: 3,
              supplierInfo: { name: 'Ecosistema Petmall', email: 'soporte@petmall.com' }
            }
          },
          {
            id: `item_${storeId}_3`,
            storeId: storeId,
            type: 'SERVICE',
            title: `Consulta de Orientación 30 Días (${name})`,
            description: `Te guiamos paso a paso con las mejores dietas y cuidados de tu pequeño compañero.`,
            price: 25.00,
            category: 'Veterinarios',
            images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&q=80'],
            serviceDetails: {
              durationMinutes: 45,
              capacityPerSlot: 1,
              specialistName: 'Médico Veterinario Residente',
              slotsAvailable: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }]
            }
          }
        ];

        await (CatalogItemDb as any).insertMany(defaultItems);
        
        // Also register default user account
        await (UserDb as any).create({
          email: email.toLowerCase(),
          role: 'STORE_OWNER',
          storeId: storeId
        });

        // Seed initial SaaS payments schedule for the newly enrolled store
        const months = [
          { name: 'Enero 2026', planned: '2026-01-05', execution: '2026-01-05', status: 'PAID' },
          { name: 'Febrero 2026', planned: '2026-02-05', execution: '2026-02-05', status: 'PAID' },
          { name: 'Marzo 2026', planned: '2026-03-05', execution: '2026-03-05', status: 'PAID' },
          { name: 'Abril 2026', planned: '2026-04-05', execution: '2026-04-05', status: 'PAID' },
          { name: 'Mayo 2026', planned: '2026-05-05', execution: '2026-05-05', status: 'PAID' },
          { name: 'Junio 2026', planned: '2026-06-05', execution: '2026-06-05', status: 'PAID' },
          { name: 'Julio 2026', planned: '2026-07-05', execution: undefined, status: 'PENDING' },
        ];

        const enrollPayments: SaaSPayment[] = months.map((m, idx) => ({
          id: `spay_${storeId}_${idx + 1}`,
          storeId: storeId,
          storeName: name,
          amount: planType === 'market_growth' ? 24990 : planType === 'enterprise_elite' ? 149900 : 59990,
          currency: 'CLP',
          plannedDate: m.planned,
          executionDate: m.execution,
          status: m.status as 'PAID' | 'PENDING',
          planType: planType || 'control_omnicanal',
          planName: planName || 'Plan Control & Omnicanal 🚀',
          paymentMethod: 'Tarjeta de Crédito (PAGO AUTOMÁTICO - PAT)',
          billingPeriod: m.name,
        }));

        await (SaaSPaymentDb as any).insertMany(enrollPayments);
        saasPayments.push(...enrollPayments);

      } catch (err: any) {
        console.error('[MongoDB Enroll Error]', err.message);
        return res.status(500).json({ error: 'Fallo al guardar comercio en MongoDB: ' + err.message });
      }
    } else {
      // In-memory fallback
      stores.push(newStore);
      console.log('[In-Memory fallback] Store enrolled successfully:', storeId);

      const defaultItems: CatalogItem[] = [
        {
          id: `item_${storeId}_1`,
          storeId: storeId,
          type: 'PRODUCT',
          title: `Alimento Premium de Prueba (${name})`,
          description: `Nutrición especializada de prueba para tus mascotas. Exclusivo de ${name}.`,
          price: 15.99,
          category: 'Alimento Barf',
          images: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80'],
          productDetails: {
            sku: `TEST-SKU-1`,
            barcode: `TESTBAR1`,
            costPrice: 8.00,
            stockPhysical: 50,
            stockDigital: 45,
            reorderThreshold: 5,
            supplierInfo: { name: 'Ecosistema Petmall', email: 'soporte@petmall.com' }
          }
        },
        {
          id: `item_${storeId}_2`,
          storeId: storeId,
          type: 'PRODUCT',
          title: `Accesorio de Testecilla (${name})`,
          description: `Juguete o accesorio de alta durabilidad para fomentar el juego activo.`,
          price: 9.99,
          category: 'Vegano',
          images: ['https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&q=80'],
          productDetails: {
            sku: `TEST-SKU-2`,
            barcode: `TESTBAR2`,
            costPrice: 4.00,
            stockPhysical: 30,
            stockDigital: 25,
            reorderThreshold: 3,
            supplierInfo: { name: 'Ecosistema Petmall', email: 'soporte@petmall.com' }
          }
        },
        {
          id: `item_${storeId}_3`,
          storeId: storeId,
          type: 'SERVICE',
          title: `Consulta de Orientación 30 Días (${name})`,
          description: `Te guiamos paso a paso con las mejores dietas y cuidados de tu pequeño compañero.`,
          price: 25.00,
          category: 'Veterinarios',
          images: ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&q=80'],
          serviceDetails: {
            durationMinutes: 45,
            capacityPerSlot: 1,
            specialistName: 'Médico Veterinario Residente',
            slotsAvailable: [{ dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }]
          }
        }
      ];
      catalog.push(...defaultItems);

      // Seed initial SaaS payments schedule for in-memory fallback
      const months = [
        { name: 'Enero 2026', planned: '2026-01-05', execution: '2026-01-05', status: 'PAID' },
        { name: 'Febrero 2026', planned: '2026-02-05', execution: '2026-02-05', status: 'PAID' },
        { name: 'Marzo 2026', planned: '2026-03-05', execution: '2026-03-05', status: 'PAID' },
        { name: 'Abril 2026', planned: '2026-04-05', execution: '2026-04-05', status: 'PAID' },
        { name: 'Mayo 2026', planned: '2026-05-05', execution: '2026-05-05', status: 'PAID' },
        { name: 'Junio 2026', planned: '2026-06-05', execution: '2026-06-05', status: 'PAID' },
        { name: 'Julio 2026', planned: '2026-07-05', execution: undefined, status: 'PENDING' },
      ];

      const enrollPayments: SaaSPayment[] = months.map((m, idx) => ({
        id: `spay_${storeId}_${idx + 1}`,
        storeId: storeId,
        storeName: name,
        amount: planType === 'market_growth' ? 24990 : planType === 'enterprise_elite' ? 149900 : 59990,
        currency: 'CLP',
        plannedDate: m.planned,
        executionDate: m.execution,
        status: m.status as 'PAID' | 'PENDING',
        planType: planType || 'control_omnicanal',
        planName: planName || 'Plan Control & Omnicanal 🚀',
        paymentMethod: 'Tarjeta de Crédito (PAGO AUTOMÁTICO - PAT)',
        billingPeriod: m.name,
      }));

      saasPayments.push(...enrollPayments);
    }

    // Broadcast sync
    sseClients.forEach((client) => {
      try {
        client.write(`data: {"type":"SYNC_STORES"}\n\n`);
        client.write(`data: {"type":"SYNC_CATALOG"}\n\n`);
      } catch (e) {
        // Safe stream retry
      }
    });

    res.status(201).json({ success: true, store: newStore });
  });

  // Online Checkout (Race Condition Protection for Digital Stock & Service Booking Slots)
  app.post('/api/checkout', async (req, res) => {
    const { items, storeId, orderType } = req.body; 

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ítems para pagar' });
    }

    try {
      // Step 1: Concurrency Lock Acquisition
      console.log(`[Checkout] Acquiring locking hooks for checkout transaction...`);
      for (const reqItem of items) {
        await dbLock.acquire(reqItem.itemId);
      }

      // Step 2: Concurrency Validation
      const txItems: any[] = [];
      let total = 0;

      for (const reqItem of items) {
        let item = catalog.find(i => i.id === reqItem.itemId);
        
        if (isMongoDbActive()) {
          try {
            const dbItem = await (CatalogItemDb as any).findOne({ id: reqItem.itemId } as any);
            if (dbItem) {
              item = JSON.parse(JSON.stringify(dbItem));
            }
          } catch (e: any) {
            console.error('[MongoDB Checkout find item error]', e.message);
          }
        }

        if (!item) {
          throw new Error(`Ítem inválido no existente`);
        }

        if (item.type === 'PRODUCT') {
          const digitalStock = item.productDetails?.stockDigital || 0;
          if (digitalStock < reqItem.quantity) {
            throw new Error(`Temporalmente agotado: ${item.title}. Solo quedan ${digitalStock} unidades.`);
          }
        } else if (item.type === 'SERVICE') {
          // Verify service duration / slot bookings
          const booking = reqItem.bookingSchedule;
          if (!booking || !booking.date || !booking.timeSlot) {
            throw new Error(`Se requiere programar fecha y hora para el servicio ${item.title}`);
          }

          // Count active bookings for this service on this specific slot date/time
          let alreadyBookedCount = orders
            .filter(o => o.orderType === 'SERVICE_BOOKING')
            .flatMap(o => o.items)
            .filter(i => 
              i.itemId === item.id && 
              i.bookingSchedule?.date === booking.date && 
              i.bookingSchedule?.timeSlot === booking.timeSlot
            ).reduce((acc, curr) => acc + curr.quantity, 0);

          if (isMongoDbActive()) {
            try {
              const matchedDbOrders = await (OrderDb as any).find({ orderType: 'SERVICE_BOOKING' } as any);
              const dbBookedCount = matchedDbOrders
                .flatMap((o: any) => o.items)
                .filter((i: any) => 
                  i.itemId === item.id && 
                  i.bookingSchedule?.date === booking.date && 
                  i.bookingSchedule?.timeSlot === booking.timeSlot
                ).reduce((acc: number, curr: any) => acc + curr.quantity, 0);
              if (dbBookedCount > 0) {
                alreadyBookedCount = dbBookedCount;
              }
            } catch (e: any) {
              console.error('[MongoDB Bookings Check Error]', e.message);
            }
          }

          const maxCapacity = item.serviceDetails?.capacityPerSlot || 1;
          if (alreadyBookedCount + reqItem.quantity > maxCapacity) {
            throw new Error(`El horario del ${booking.date} a las ${booking.timeSlot} para ${item.title} está lleno.`);
          }
        }

        txItems.push({ item, reqItem });
        total += item.price * reqItem.quantity;
      }

      // Step 3: Transaction Commit writes (Safe)
      for (const tx of txItems) {
        const item = catalog.find(i => i.id === tx.item.id)!;
        if (item.type === 'PRODUCT' && item.productDetails) {
          item.productDetails.stockDigital -= tx.reqItem.quantity;
          item.productDetails.stockPhysical = Math.max(0, item.productDetails.stockPhysical - tx.reqItem.quantity);

          if (isMongoDbActive()) {
            try {
              await (CatalogItemDb as any).findOneAndUpdate(
                { id: item.id } as any,
                {
                  'productDetails.stockDigital': item.productDetails.stockDigital,
                  'productDetails.stockPhysical': item.productDetails.stockPhysical
                } as any,
                { new: true } as any
              );
            } catch (err: any) {
              console.error('[MongoDB Checkout Stock Mutation Error]', err.message);
            }
          }

          broadcastToClients('STOCK_SYNCHRONIZED', {
            itemId: item.id,
            stockPhysical: item.productDetails.stockPhysical,
            stockDigital: item.productDetails.stockDigital,
          });
        }
      }

      const newOrder: Order = {
        id: 'ord_' + Math.random().toString(36).substring(2, 9),
        customerId: 'cust_online',
        customerName: 'Cliente B2C Digital',
        storeId: storeId || 'store_1',
        items: items.map((i: any) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          bookingSchedule: i.bookingSchedule
        })),
        paymentStatus: 'PAID',
        orderType: orderType || 'DELIVERY',
        status: orderType === 'SERVICE_BOOKING' ? 'BOOKED' : 'PREPARING',
        total: total,
        createdAt: new Date().toISOString()
      };

      orders.push(newOrder);

      if (isMongoDbActive()) {
        try {
          await (OrderDb as any).create(newOrder as any);
        } catch (err: any) {
          console.error('[MongoDB Online Checkout Save Order Error]', err.message);
        }
      }

      broadcastToClients('ORDER_CREATED', newOrder);

      res.json({ success: true, order: newOrder });

    } catch (err: any) {
      console.error(`[Checkout CRITICAL ERROR] Concurrency rollback executed:`, err.message);
      res.status(500).json({ error: err.message });
    } finally {
      // Step 4: Release locks
      for (const reqItem of items) {
        dbLock.release(reqItem.itemId);
      }
      console.log(`[Checkout] Concurrency locks released successfully.`);
    }
  });


  // --- CHAT ENDPOINTS / OTHER INTEGRATION CHANNELS ---
  // Default to SPA entry handler later

  // Vite Integration for dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Petmall server] Running full-stack system on http://0.0.0.0:${PORT}`);
  });
}

startServer();
