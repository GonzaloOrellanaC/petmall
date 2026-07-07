import mongoose from 'mongoose';
import { CatalogItem, Store, Order, SaaSPayment } from '../types.js';

// Setup MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petmall';

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) return true;
  try {
    console.log(`[MongoDB] Connecting to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[MongoDB] Connected successfully');
    return true;
  } catch (err: any) {
    console.error('[MongoDB Connection Warning] Could not connect to MongoDB:', err.message);
    console.warn('[MongoDB] Operating in secure fallback in-memory mode.');
    isConnected = false;
    return false;
  }
}

// Check MongoDB connection status
export function isMongoDbActive(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

// MongoDB Schemas correspond with '/src/types.ts'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true, enum: ['SUPER_USER', 'STORE_OWNER', 'STORE_STAFF', 'CUSTOMER'] },
  storeId: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  avatarUrl: { type: String },
  allowBlog: { type: Boolean, default: false },
});

const StoreSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  geolocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  businessType: { type: String, required: true, enum: ['PRODUCTS_ONLY', 'SERVICES_ONLY', 'HYBRID'] },
  branding: {
    theme: { type: String, required: true, enum: ['A', 'B'] },
    colors: {
      primary: { type: String, required: true },
      accent: { type: String, required: true },
    },
  },
  demo: { type: Boolean, default: false },
  // Company presentation space
  description: { type: String },
  slogan: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  logoUrl: { type: String },
  bannerUrl: { type: String },
  // Trial/Plan fields
  planType: { type: String },
  planName: { type: String },
  isTrial: { type: Boolean, default: false },
  trialDaysLeft: { type: Number, default: 30 },
});

const CatalogItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  storeId: { type: String, required: true },
  type: { type: String, required: true, enum: ['PRODUCT', 'SERVICE'] },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: { type: [String], required: true },
  productDetails: {
    sku: { type: String },
    barcode: { type: String },
    costPrice: { type: Number },
    stockPhysical: { type: Number },
    stockDigital: { type: Number },
    reorderThreshold: { type: Number },
    supplierInfo: {
      name: { type: String },
      email: { type: String },
    },
  },
  serviceDetails: {
    durationMinutes: { type: Number },
    capacityPerSlot: { type: Number },
    specialistName: { type: String },
    slotsAvailable: [{
      dayOfWeek: { type: Number },
      startTime: { type: String },
      endTime: { type: String },
    }],
  },
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String },
  storeId: { type: String, required: true },
  items: [{
    itemId: { type: String, required: true },
    quantity: { type: Number, required: true },
    bookingSchedule: {
      date: { type: String },
      timeSlot: { type: String },
    },
  }],
  paymentStatus: { type: String, required: true, enum: ['PENDING', 'PAID', 'REFUNDED'] },
  orderType: { type: String, required: true, enum: ['DELIVERY', 'CLICK_AND_COLLECT', 'SERVICE_BOOKING'] },
  status: { type: String, required: true, enum: ['PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'BOOKED', 'COMPLETED'] },
  total: { type: Number, required: true },
  createdAt: { type: String, required: true },
});

const SaaSPaymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  storeId: { type: String, required: true },
  storeName: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'CLP' },
  plannedDate: { type: String, required: true }, // 'YYYY-MM-DD'
  executionDate: { type: String }, // 'YYYY-MM-DD'
  status: { type: String, required: true, enum: ['PAID', 'PENDING', 'FAILED'] },
  planType: { type: String, required: true },
  planName: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  billingPeriod: { type: String, required: true },
});

export const UserDb = mongoose.models.User || mongoose.model<any>('User', UserSchema);
export const StoreDb = mongoose.models.Store || mongoose.model<any>('Store', StoreSchema);
export const CatalogItemDb = mongoose.models.CatalogItem || mongoose.model<any>('CatalogItem', CatalogItemSchema);
export const OrderDb = mongoose.models.Order || mongoose.model<any>('Order', OrderSchema);
export const SaaSPaymentDb = mongoose.models.SaaSPayment || mongoose.model<any>('SaaSPayment', SaaSPaymentSchema);

const BlogCommentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorRole: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: String, required: true },
  parentId: { type: String }
});

const BlogPostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  storeId: { type: String, required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  bannerUrl: { type: String },
  authorEmail: { type: String, required: true },
  authorName: { type: String, required: true },
  status: { type: String, required: true, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  tags: { type: [String] },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  dislikedBy: { type: [String], default: [] },
  comments: { type: [BlogCommentSchema], default: [] },
});

export const BlogPostDb = mongoose.models.BlogPost || mongoose.model<any>('BlogPost', BlogPostSchema);


// --- SEED PROGRAMMATIC DATA GENERATOR ---

export const SEED_USERS = [
  { email: 'super@petmall.com', role: 'SUPER_USER' },
  { email: 'comerciante1@petmall.com', role: 'STORE_OWNER', storeId: 'store_1' },
  { email: 'comerciante2@petmall.com', role: 'STORE_OWNER', storeId: 'store_2' },
  { email: 'comerciante3@petmall.com', role: 'STORE_OWNER', storeId: 'store_3' },
];

export const SEED_STORES = [
  {
    id: 'store_1',
    name: 'Patitas Gourmet — Premium Orgánico',
    ownerId: 'owner_1',
    geolocation: { type: 'Point', coordinates: [-122.4194, 37.7749] },
    businessType: 'PRODUCTS_ONLY',
    branding: {
      theme: 'A',
      colors: { primary: '#0b2240', accent: '#DABD83' },
    },
    demo: true,
  },
  {
    id: 'store_2',
    name: 'EcoPet Sostenible & Accesorios',
    ownerId: 'owner_2',
    geolocation: { type: 'Point', coordinates: [-122.4014, 37.7889] },
    businessType: 'PRODUCTS_ONLY',
    branding: {
      theme: 'B',
      colors: { primary: '#15803d', accent: '#a3e635' },
    },
    demo: true,
  },
  {
    id: 'store_3',
    name: 'Vet & Wellness Center Integrativo',
    ownerId: 'owner_3',
    geolocation: { type: 'Point', coordinates: [-122.4312, 37.7610] },
    businessType: 'SERVICES_ONLY',
    branding: {
      theme: 'A',
      colors: { primary: '#1e3a8a', accent: '#f59e0b' },
    },
    demo: true,
  },
];

// Rich lists of keywords, descriptions, and high fidelity images to programmatically design unique, rich items
const ALIMENTO_IMAGES = [
  'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500&q=80',
  'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=500&q=80',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&q=80',
];

const ACCESORIO_IMAGES = [
  'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&q=80',
  'https://images.unsplash.com/photo-1477884213984-b971a17708d3?w=500&q=80',
  'https://images.unsplash.com/photo-1537151608828-ea2b117b6b86?w=500&q=80',
  'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=500&q=80',
  'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=500&q=80',
];

const SERVICIO_IMAGES = [
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&q=80',
  'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&q=80',
  'https://images.unsplash.com/photo-1535268647977-a403b69fc756?w=500&q=80',
  'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&q=80',
  'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=500&q=80',
];

const MEATS = ['Pollo Orgánico', 'Pavo de Entorno Libre', 'Res de Pradera', 'Salmón de Fjord', 'Conejo Sylvestre', 'Cordero Grass-Fed', 'Ternera Tierna', 'Atún Blanco'];
const ADJECTIVES = ['Sano', 'Premium', 'Fresco', 'Hipoalergénico', 'Deshidratado', 'Especial', 'Ultra-Digestible', 'Orgánico Certificado'];
const VEGETABLES = ['con Manzana', 'con Zanahoria Orgánica', 'con Espinaca Baby', 'con Quinua', 'con Linaza', 'con Arándanos silvestres'];

const ACCESSORIES_TYPES = ['Cama de Bambú', 'Juguete de Yute', 'Collar de Cáñamo', 'Rascador Biodegradable', 'Comedero de Cerámica', 'Arnés de Lino Orgánico', 'Plato de Fibra de Coco', 'Pelota de Goma Natural'];
const ACCESSORIES_COLORS = ['Verde Olivo', 'Marrón Terroso', 'Beige Natural', 'Azul Océano', 'Gris Ceniza', 'Mostaza Caper', 'Rosa Algodón', 'Café Canela'];

const SERVICES_TYPES = ['Acupuntura Holística', 'Fisioterapia y Masajes', 'Baño Termal Herbáceo', 'Groomer Aromaterapia', 'Nutrición Barf Coaching', 'Peluquería Estilo Asiático', 'Rehabilitación Integral', 'Socialización en Parque'];
const SERVICES_LEVELS = ['Básico', 'Profesional', 'Adulto mayor', 'Avanzado', 'Control Clínico', 'Preventivo', 'Geriátrico', 'Cachorros'];

export function generateSeedCatalog(): CatalogItem[] {
  const items: CatalogItem[] = [];

  // 1. STORE 1: Patitas Gourmet (50 items) - Alimentos de tipo productos
  for (let i = 1; i <= 50; i++) {
    const meat = MEATS[i % MEATS.length];
    const adj = ADJECTIVES[(i + 2) % ADJECTIVES.length];
    const veg = VEGETABLES[i % VEGETABLES.length];
    
    const title = `Alimento BARF ${meat} ${adj} ${veg}`;
    const price = Math.round((19.99 + (i * 1.15)) * 100) / 100;
    const costPrice = Math.round((price * 0.5) * 100) / 100;
    const description = `Un delicioso preparado de ${meat.toLowerCase()} ultra premium, combinado ${veg.toLowerCase()} y formulado bajo estándares veterinarios ecológicos. Apto para alimentación de mascotas con estómagos sensibles o intolerancias alimentarias de base.`;
    const image = ALIMENTO_IMAGES[i % ALIMENTO_IMAGES.length];
    
    items.push({
      id: `seed_store_1_item_${i}`,
      storeId: 'store_1',
      type: 'PRODUCT',
      title,
      description,
      price,
      category: i % 2 === 0 ? 'Alimento Barf' : 'Salud Natural',
      images: [image],
      productDetails: {
        sku: `BARF-S1-SKU-${1000 + i}`,
        barcode: `742384910${1000 + i}`,
        costPrice,
        stockPhysical: Math.round(15 + (i % 30)),
        stockDigital: Math.round(12 + (i % 25)),
        reorderThreshold: 5,
        supplierInfo: {
          name: 'Naturals & BARF Distribution Co.',
          email: 'b2b@bary-natures.com',
        },
      },
    });
  }

  // 2. STORE 2: EcoPet Sostenible (50 items) - Accesorios de tipo productos
  for (let i = 1; i <= 50; i++) {
    const type = ACCESSORIES_TYPES[i % ACCESSORIES_TYPES.length];
    const col = ACCESSORIES_COLORS[(i + 1) % ACCESSORIES_COLORS.length];
    
    const title = `${type} Color ${col}`;
    const price = Math.round((12.50 + (i * 0.95)) * 100) / 100;
    const costPrice = Math.round((price * 0.4) * 100) / 100;
    const description = `Fabricado de forma totalmente sostenible. Este ${type.toLowerCase()} ha sido confeccionado con materias primas naturales, libres de tintes artificiales tóxicos o microplásticos contaminantes, reduciendo la huella de carbono de tu mascota.`;
    const image = ACCESORIO_IMAGES[i % ACCESORIO_IMAGES.length];

    items.push({
      id: `seed_store_2_item_${i}`,
      storeId: 'store_2',
      type: 'PRODUCT',
      title,
      description,
      price,
      category: 'Vegano',
      images: [image],
      productDetails: {
        sku: `ECO-S2-SKU-${2000 + i}`,
        barcode: `742384920${2000 + i}`,
        costPrice,
        stockPhysical: Math.round(10 + (i % 20)),
        stockDigital: Math.round(8 + (i % 18)),
        reorderThreshold: 3,
        supplierInfo: {
          name: 'Comunidad Green Latam S.A.',
          email: 'ventas@greenlatam.cl',
        },
      },
    });
  }

  // 3. STORE 3: Vet & Wellness Center (50 items) - Servicios
  const specialists = ['Dr. Roberto Soto', 'Dra. María Martínez', 'Dra. Ana López', 'Dr. Esteban Orozco', 'Dra. Clara Fuentes'];
  for (let i = 1; i <= 50; i++) {
    const type = SERVICES_TYPES[i % SERVICES_TYPES.length];
    const level = SERVICES_LEVELS[(i + 3) % SERVICES_LEVELS.length];
    
    const title = `${type} ${level}`;
    const price = Math.round((25.00 + (i * 1.50)) * 100) / 100;
    const specialist = specialists[i % specialists.length];
    const description = `Sesión profesional de ${type.toLowerCase()} ideal para cuidado de nivel ${level.toLowerCase()}. Un servicio preventivo e integrativo libre de estrés, diseñado para mejorar el bienestar físico y mental de tu querido compañero.`;
    const image = SERVICIO_IMAGES[i % SERVICIO_IMAGES.length];

    items.push({
      id: `seed_store_3_item_${i}`,
      storeId: 'store_3',
      type: 'SERVICE',
      title,
      description,
      price,
      category: i % 2 === 0 ? 'Veterinarios' : 'Paseadores',
      images: [image],
      serviceDetails: {
        durationMinutes: i % 3 === 0 ? 30 : i % 3 === 1 ? 45 : 60,
        capacityPerSlot: i % 5 === 0 ? 2 : 1,
        specialistName: specialist,
        slotsAvailable: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 3, startTime: '13:00', endTime: '18:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
          { dayOfWeek: 5, startTime: '10:00', endTime: '17:00' },
        ],
      },
    });
  }

  return items;
}

export function generateSeedSaaSPayments(): SaaSPayment[] {
  const payments: SaaSPayment[] = [];
  const seedStoresData = [
    { id: 'store_1', name: 'Patitas Gourmet — Premium Orgánico', planType: 'market_growth', planName: 'Plan Market & Growth 🛒', amount: 24990 },
    { id: 'store_2', name: 'EcoPet Sostenible & Accesorios', planType: 'control_omnicanal', planName: 'Plan Control & Omnicanal 🚀', amount: 59990 },
    { id: 'store_3', name: 'Vet & Wellness Center Integrativo', planType: 'enterprise_elite', planName: 'Plan Enterprise & Elite 👑', amount: 149900 },
  ];

  const months = [
    { name: 'Enero 2026', planned: '2026-01-05', execution: '2026-01-05', status: 'PAID' },
    { name: 'Febrero 2026', planned: '2026-02-05', execution: '2026-02-05', status: 'PAID' },
    { name: 'Marzo 2026', planned: '2026-03-05', execution: '2026-03-05', status: 'PAID' },
    { name: 'Abril 2026', planned: '2026-04-05', execution: '2026-04-05', status: 'PAID' },
    { name: 'Mayo 2026', planned: '2026-05-05', execution: '2026-05-05', status: 'PAID' },
    { name: 'Junio 2026', planned: '2026-06-05', execution: '2026-06-05', status: 'PAID' },
    { name: 'Julio 2026', planned: '2026-07-05', execution: undefined, status: 'PENDING' },
  ];

  let idCounter = 1;

  for (const s of seedStoresData) {
    for (const m of months) {
      payments.push({
        id: `spay_${s.id}_${idCounter++}`,
        storeId: s.id,
        storeName: s.name,
        amount: s.amount,
        currency: 'CLP',
        plannedDate: m.planned,
        executionDate: m.execution,
        status: m.status as 'PAID' | 'PENDING',
        planType: s.planType as any,
        planName: s.planName,
        paymentMethod: 'Tarjeta de Crédito (PAGO AUTOMÁTICO - PAT)',
        billingPeriod: m.name,
      });
    }
  }

  return payments;
}

// Generate complete in-memory seed records
export const MEMORY_SEED_CATALOG = generateSeedCatalog();
export const MEMORY_SEED_SAAS_PAYMENTS = generateSeedSaaSPayments();

// Functions to run database seed
export async function seedMongoDb() {
  const active = await connectMongoDB();
  if (!active) {
    console.warn('[MongoDB] Seed script skipped because MongoDB connection could not be established.');
    return false;
  }

  try {
    console.log('[MongoDB] Purging existing database records...');
    await UserDb.deleteMany({});
    await StoreDb.deleteMany({});
    await CatalogItemDb.deleteMany({});
    await SaaSPaymentDb.deleteMany({});
    
    console.log('[MongoDB] Inserting superadmin and store owners seed...');
    await UserDb.insertMany(SEED_USERS as any[]);

    console.log('[MongoDB] Inserting store profiles...');
    await StoreDb.insertMany(SEED_STORES as any[]);

    console.log('[MongoDB] Generating and inserting catalog items (150 items)...');
    const seedCatalog = generateSeedCatalog();
    await CatalogItemDb.insertMany(seedCatalog as any[]);

    console.log('[MongoDB] Inserting SaaS payments schedule (21 items)...');
    const seedPayments = generateSeedSaaSPayments();
    await SaaSPaymentDb.insertMany(seedPayments as any[]);

    console.log('[MongoDB] Seeding completed successfully. 150 items, 3 stores, 21 payments, and 4 users are ready!');
    return true;
  } catch (err: any) {
    console.error('[MongoDB] Critical error executing seed process:', err);
    return false;
  }
}
