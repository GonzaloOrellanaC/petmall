/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { CatalogItem, Order, Store, SaaSPayment, BlogPost } from './src/types.js'; // typescript files would need matching js/ts extension
import { 
  connectMongoDB, 
  isMongoDbActive, 
  UserDb, 
  StoreDb, 
  CatalogItemDb, 
  OrderDb, 
  SaaSPaymentDb,
  BlogPostDb,
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

// --- DELIVERY PARTNER TYPES & IN-MEMORY DATABASE ---
export interface DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  fee: number;
  coverageCenter: [number, number]; // [lat, lng]
  coverageRadius: number; // in km
  rating: number;
  ratingsCount: number;
  reviews?: { rating: number; comment: string; author: string; date: string }[];
}

let deliveryPartners: DeliveryPartner[] = [
  {
    id: 'dp_1',
    name: 'Carlos Pérez',
    email: 'carlos.envios@gmail.com',
    phone: '+56 9 8765 4321',
    vehicle: 'Auto',
    fee: 2500,
    coverageCenter: [-33.4489, -70.6693], // Santiago Centro
    coverageRadius: 15,
    rating: 4.8,
    ratingsCount: 24,
    reviews: [
      { rating: 5, comment: 'Excelente servicio, muy rápido.', author: 'Sofía G.', date: '2026-06-28' },
      { rating: 4, comment: 'Buen trato, llegó a tiempo.', author: 'Juan R.', date: '2026-06-25' }
    ]
  },
  {
    id: 'dp_2',
    name: 'María José Valenzuela',
    email: 'mariajose.delivery@outlook.cl',
    phone: '+56 9 9123 4567',
    vehicle: 'Moto',
    fee: 1800,
    coverageCenter: [-33.415, -70.600], // Providencia
    coverageRadius: 8,
    rating: 4.9,
    ratingsCount: 42,
    reviews: [
      { rating: 5, comment: 'Llegó volando! Muy recomendada.', author: 'Andrés S.', date: '2026-06-29' }
    ]
  },
  {
    id: 'dp_3',
    name: 'Juan Pablo Muñoz',
    email: 'juanpablo.bici@gmail.com',
    phone: '+56 9 7654 3210',
    vehicle: 'Bicicleta',
    fee: 1200,
    coverageCenter: [-33.4372, -70.6345], // Bellavista / Recoleta
    coverageRadius: 5,
    rating: 4.7,
    ratingsCount: 15,
    reviews: [
      { rating: 4, comment: 'Cuidado con el empaque, pero todo bien.', author: 'Camila L.', date: '2026-06-20' }
    ]
  },
  {
    id: 'dp_4',
    name: 'John Doe (USA)',
    email: 'john.delivery@petmall.com',
    phone: '+1 415-555-0101',
    vehicle: 'Auto',
    fee: 5.0,
    coverageCenter: [37.7749, -122.4194], // San Francisco
    coverageRadius: 20,
    rating: 4.9,
    ratingsCount: 11,
    reviews: [
      { rating: 5, comment: 'Very fast shipping across SF!', author: 'BioShop Cust', date: '2026-06-29' }
    ]
  }
];

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

let platformSettings = {
  commissionRate: 5,
  basicPlanPrice: 19990,
  proPlanPrice: 39990,
  enterprisePlanPrice: 79990,
  activePilotCommunes: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción'],
  marketingCoFundingRate: 20,
  allowNewRegistrations: true,
  searchMultiplier: 1.2
};

let adoptionPets = [
  {
    id: 'pet_1',
    name: 'Simba',
    type: 'Perro',
    breed: 'Mestizo',
    age: '2 años',
    healthStatus: 'Sano / Vacunas al día',
    foundation: 'Fundación Huellas Unidas',
    description: 'Simba es muy sociable, adora jugar en parques y convive excelente con niños y otros perros.',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=350',
    status: 'DISPONIBLE',
    lat: -33.435,
    lng: -70.655 // ~2.1 km from Santiago Center
  },
  {
    id: 'pet_2',
    name: 'Mimi',
    type: 'Gato',
    breed: 'Romano Gris',
    age: '5 meses',
    healthStatus: 'Desparasitada / Esterilizada',
    foundation: 'Agrupación Rescate Felino',
    description: 'Mimi es de carácter sumamente apacible, romronea constante y ama dormir en el sofá.',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=350',
    status: 'DISPONIBLE',
    lat: -33.475,
    lng: -70.710 // ~4.8 km from Santiago Center
  },
  {
    id: 'pet_3',
    name: 'Cholo',
    type: 'Perro',
    breed: 'Mestizo Chileno',
    age: '2 años',
    healthStatus: 'Sano / Vacunado',
    foundation: 'Refugio Garras y Patas',
    description: 'Cholo es muy activo, ideal para familias que amen pasear. Se lleva bien con otros perritos.',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=350&q=80',
    status: 'DISPONIBLE',
    lat: -33.415,
    lng: -70.600 // ~7.4 km from Santiago Center
  },
  {
    id: 'pet_4',
    name: 'Mila',
    type: 'Gato',
    breed: 'Romana',
    age: '6 meses',
    healthStatus: 'Sana / Vacunas al día',
    foundation: 'Corporación S.O.S Gatos',
    description: 'Mila es súper mimosa, educada en arenero. Busca departamento seguro.',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=350&q=80',
    status: 'DISPONIBLE',
    lat: -33.440,
    lng: -70.770 // ~9.4 km from Santiago Center (under 10 km!)
  },
  {
    id: 'pet_5',
    name: 'Kayser',
    type: 'Perro',
    breed: 'Pastor Alemán',
    age: '8 años',
    healthStatus: 'Leal / Vacunas al día',
    foundation: 'Grupo San Francisco',
    description: 'Kayser es leal, calmado, guardián jubilado excelente para compañía de adultos.',
    imageUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=350&q=80',
    status: 'DISPONIBLE',
    lat: -33.510,
    lng: -70.550 // ~13 km from Santiago Center (outside 10 km!)
  },
  {
    id: 'pet_6',
    name: 'Rocky',
    type: 'Perro',
    breed: 'Golden Retriever Mix',
    age: '1 año',
    healthStatus: 'Enérgico / Castrado',
    foundation: 'Fundación Garras',
    description: 'Rocky es un torbellino de amor. Le encanta correr tras la pelota y nadar.',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=350',
    status: 'DISPONIBLE',
    lat: -33.560,
    lng: -70.600 // ~14 km from Santiago Center
  },
  {
    id: 'pet_7',
    name: 'Luna',
    type: 'Gato',
    breed: 'Siamés Mix',
    age: '3 años',
    healthStatus: 'Sana / Esterilizada',
    foundation: 'Rescate Felino Sur',
    description: 'Luna es tímida al inicio, pero una vez que confía es sumamente dulce y habladora.',
    imageUrl: 'https://images.unsplash.com/photo-1513360309081-36f5e878fc9e?auto=format&fit=crop&q=80&w=350',
    status: 'DISPONIBLE',
    lat: -33.720,
    lng: -70.850 // ~42 km from Santiago Center
  },
  {
    id: 'pet_8',
    name: 'Bella',
    type: 'Perro',
    breed: 'Labrador Mestizo',
    age: '4 años',
    healthStatus: 'Sana / Esterilizada',
    foundation: 'Refugio Valparaíso',
    description: 'Bella es una perrita extremadamente cariñosa, obediente y adora tomar sol.',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=350',
    status: 'DISPONIBLE',
    lat: -33.0472,
    lng: -71.6127 // ~100 km from Santiago (Valparaíso)
  },
  {
    id: 'pet_9',
    name: 'Lucas',
    type: 'Perro',
    breed: 'Mestizo Negro',
    age: '5 años',
    healthStatus: 'Sano / Vacunado',
    foundation: 'Esperanza de Talca',
    description: 'Lucas es un gran compañero de siestas, silencioso, educado y muy agradecido.',
    imageUrl: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=350',
    status: 'DISPONIBLE',
    lat: -35.4264,
    lng: -71.6554 // ~225 km from Santiago Center (>200 km)
  }
];

let promotionalMaterials = [
  {
    id: 'mat_1',
    title: 'Kit de Calcomanías Oficiales Petmall',
    description: 'Manual de marca y adhesivos vectoriales listos para imprimir y pegar en vitrinas de tu comercio.',
    format: 'PDF Vectorial',
    iconName: 'FileImage',
    downloadUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' // Mock image link
  },
  {
    id: 'mat_2',
    title: 'Plantilla de Bolsas Ecológicas Reutilizables',
    description: 'Diseño personalizable con logo de tu e-Store para empaque ecológico certificado por la marca.',
    format: 'ZIP / PNG HD',
    iconName: 'ShoppingBag',
    downloadUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=300'
  }
];

let platformAnnouncements = [
  {
    id: 'ann_1',
    title: 'Actualización en Co-financiamiento de Anuncios Google & Meta',
    content: 'A partir de este mes, Petmall subvencionará hasta un 20% del presupuesto de pauta activa en las comunas piloto del país. Configura tu simulador de pauta en Ajustes.',
    date: '2026-06-20',
    type: 'MARKETING_PLAN',
    important: true
  },
  {
    id: 'ann_2',
    title: 'Nueva Guía de Tenencia Responsable - Ley Cholito',
    content: 'Sincronizamos un nuevo set de categorías orgánicas para impulsar tu SEO. Revisa la pestaña de Plan de Marketing para copiar los nuevos borradores de prensa.',
    date: '2026-06-18',
    type: 'BUSINESS_GUIDELINES',
    important: false
  }
];

let blogPosts: BlogPost[] = [
  {
    id: 'blog_1',
    storeId: 'store_1',
    title: 'Nutrición Barf: El Secreto de un Pelaje Brillante y Fuerte',
    slug: 'nutricion-barf-pelaje-brillante',
    excerpt: 'Descubre por qué alimentar a tu mascota con ingredientes 100% biológicamente apropiados transforma su salud y previene el letargo alimenticio.',
    content: `## Alimentación Barf para tus pequeños compañeros

La alimentación biológicamente apropiada (BARF) es mucho más que una tendencia vacía: consiste en volver a las raíces evolutivas de nuestros caninos y felinos.

### Beneficios Principales observados:
1. **Pelaje sedoso y fuerte**: Gracias a la retención intacta de aceites esenciales y aminoácidos naturales.
2. **Digestión optimizada**: Reducción drástica del tamaño e intolerancia fecal.
3. **Energía balanceada**: Eliminación del letargo post-alimenticio de los carbohidratos procesados.

*¡Visita nuestro local "Don Jorge\'s BioShop" para resolver todas tus dudas sobre la transición segura de tu mascota!*`,
    bannerUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80',
    authorEmail: 'comerciante1@petmall.com',
    authorName: 'Juan Rodríguez',
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    tags: ['Salud', 'Nutrición', 'Natural'],
    views: 45,
    likes: 12,
    dislikes: 1,
    likedBy: [],
    dislikedBy: [],
    comments: [
      {
        id: 'c1',
        authorEmail: 'buyer_test@petmall.com',
        authorRole: 'CUSTOMER',
        content: 'Excelente artículo! He notado una gran mejora en mi perrito pastor alemán desde que empezamos con BARF.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'c2',
        authorEmail: 'comerciante1@petmall.com',
        authorRole: 'STORE_OWNER',
        content: 'Muchas gracias por comentar! Así es, el pelaje brilla casi de inmediato.',
        createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
        parentId: 'c1'
      }
    ]
  },
  {
    id: 'blog_2',
    storeId: 'store_1',
    title: 'La importancia del juego cognitivo en cachorros de departamento',
    slug: 'juego-cognitivo-en-cachorros',
    excerpt: 'Evita problemas de ansiedad por separación y frustración estimulando la mente de tu mascota con estos sencillos ejercicios de olfato.',
    content: `## Estimulación y Enriquecimiento Ambiental

Cuando pensamos en el desarrollo de un cachorro, a menudo nos limitamos al ejercicio físico. No obstante, el cansancio mental es tanto o más beneficioso.

### Ideas para resolver hoy:
- **Alfombras de Olfato**: Excelente recurso de calma pasiva.
- **Juguetes de Relleno Congelables**: Estimula la masticación segura desestresante.
- **Búsqueda del Tesoro**: Esconde premios orgánicos de soga por la sala.

*Encuentra nuestra selección exclusiva de juguetes de soga de algodón orgánico y material interactivo libre de microplásticos en nuestro catálogo online.*`,
    bannerUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80',
    authorEmail: 'comerciante1@petmall.com',
    authorName: 'Juan Rodríguez',
    status: 'PUBLISHED',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    tags: ['Acondicionamiento', 'Juguetes', 'Bienestar'],
    views: 32,
    likes: 8,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    comments: []
  }
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
    res.flushHeaders();

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

  // --- PLATFORM SUPER ADMIN SETTINGS & ANNOUNCEMENTS ---
  app.get('/api/platform/settings', (req, res) => {
    return res.json(platformSettings);
  });

  app.post('/api/platform/settings', (req, res) => {
    const { commissionRate, basicPlanPrice, proPlanPrice, enterprisePlanPrice, activePilotCommunes, marketingCoFundingRate, allowNewRegistrations, searchMultiplier } = req.body;
    if (commissionRate !== undefined) platformSettings.commissionRate = Number(commissionRate);
    if (basicPlanPrice !== undefined) platformSettings.basicPlanPrice = Number(basicPlanPrice);
    if (proPlanPrice !== undefined) platformSettings.proPlanPrice = Number(proPlanPrice);
    if (enterprisePlanPrice !== undefined) platformSettings.enterprisePlanPrice = Number(enterprisePlanPrice);
    if (activePilotCommunes !== undefined) platformSettings.activePilotCommunes = activePilotCommunes;
    if (marketingCoFundingRate !== undefined) platformSettings.marketingCoFundingRate = Number(marketingCoFundingRate);
    if (allowNewRegistrations !== undefined) platformSettings.allowNewRegistrations = !!allowNewRegistrations;
    if (searchMultiplier !== undefined) platformSettings.searchMultiplier = Number(searchMultiplier);

    broadcastToClients('SETTINGS_UPDATED', platformSettings);
    return res.json({ success: true, settings: platformSettings });
  });

  // --- ADOPTION PETS ENDPOINTS ---
  app.get('/api/platform/adoption', (req, res) => {
    return res.json(adoptionPets);
  });

  app.post('/api/platform/adoption', (req, res) => {
    const { name, type, breed, age, healthStatus, foundation, description, imageUrl, status, lat, lng } = req.body;
    if (!name || !type || !foundation) {
      return res.status(400).json({ error: 'Nombre, tipo y fundación son obligatorios.' });
    }

    const newPet = {
      id: `pet_${Date.now()}`,
      name,
      type,
      breed: breed || 'Mestizo',
      age: age || 'Edad no especificada',
      healthStatus: healthStatus || 'Sano',
      foundation,
      description: description || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=350',
      status: status || 'DISPONIBLE',
      lat: lat !== undefined ? Number(lat) : -33.4489 + (Math.random() - 0.5) * 0.08,
      lng: lng !== undefined ? Number(lng) : -70.6693 + (Math.random() - 0.5) * 0.08
    };

    adoptionPets.push(newPet);
    broadcastToClients('ADOPTION_RELOAD', adoptionPets);
    return res.status(201).json(newPet);
  });

  app.delete('/api/platform/adoption/:id', (req, res) => {
    const { id } = req.params;
    adoptionPets = adoptionPets.filter(p => p.id !== id);
    broadcastToClients('ADOPTION_RELOAD', adoptionPets);
    return res.json({ success: true });
  });

  // --- PROMOTIONAL MATERIALS ENDPOINTS ---
  app.get('/api/platform/promotional', (req, res) => {
    return res.json(promotionalMaterials);
  });

  app.post('/api/platform/promotional', (req, res) => {
    const { title, description, format, iconName, downloadUrl } = req.body;
    if (!title || !downloadUrl) {
      return res.status(400).json({ error: 'Título y link para descargar son requeridos.' });
    }

    const newMaterial = {
      id: `mat_${Date.now()}`,
      title,
      description: description || 'Material para comercios socios.',
      format: format || 'PDF',
      iconName: iconName || 'FileText',
      downloadUrl
    };

    promotionalMaterials.push(newMaterial);
    broadcastToClients('PROMOTIONAL_RELOAD', promotionalMaterials);
    return res.status(201).json(newMaterial);
  });

  app.delete('/api/platform/promotional/:id', (req, res) => {
    const { id } = req.params;
    promotionalMaterials = promotionalMaterials.filter(m => m.id !== id);
    broadcastToClients('PROMOTIONAL_RELOAD', promotionalMaterials);
    return res.json({ success: true });
  });

  app.get('/api/platform/announcements', (req, res) => {
    return res.json(platformAnnouncements);
  });

  app.post('/api/platform/announcements', (req, res) => {
    const { title, content, type, important } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título y contenido son requeridos.' });
    }

    const newAnnouncement = {
      id: `ann_${Date.now()}`,
      title,
      content,
      type: type || 'GENERAL',
      important: !!important,
      date: new Date().toISOString().split('T')[0]
    };

    platformAnnouncements.unshift(newAnnouncement);
    broadcastToClients('ANNOUNCEMENT_CREATED', newAnnouncement);
    return res.status(201).json(newAnnouncement);
  });

  app.delete('/api/platform/announcements/:id', (req, res) => {
    const { id } = req.params;
    platformAnnouncements = platformAnnouncements.filter(a => a.id !== id);
    broadcastToClients('ANNOUNCEMENT_DELETED', { id });
    return res.json({ success: true });
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
    const finalAvatarUrl = avatarUrl || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Cpath d='M50 56a16 16 0 100-32 16 16 0 000 32zm0 4c-18.5 0-32 10.5-32 20v4h64v-4c0-9.5-13.5-20-32-20z' fill='%23475569'/%3E%3C/svg%3E";

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

  // --- USER BLOG PERMISSION MANAGEMENT ---
  app.put('/api/stores/:storeId/users/:email/blog-permission', async (req, res) => {
    const { storeId, email } = req.params;
    const { allowBlog } = req.body;

    if (isMongoDbActive()) {
      try {
        const updated = await (UserDb as any).findOneAndUpdate(
          { storeId, email: email.toLowerCase() },
          { allowBlog: !!allowBlog },
          { new: true }
        );
        if (updated) {
          return res.json(updated);
        }
        return res.status(404).json({ error: 'Colaborador no encontrado en la base de datos' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Error al actualizar permisos en MongoDB: ' + err.message });
      }
    } else {
      const idx = memoryUsers.findIndex(u => u.storeId === storeId && u.email.toLowerCase() === email.toLowerCase());
      if (idx !== -1) {
        (memoryUsers[idx] as any).allowBlog = !!allowBlog;
        return res.json(memoryUsers[idx]);
      }
      return res.status(404).json({ error: 'Colaborador no encontrado en memoria' });
    }
  });

  // --- BLOG ENDPOINTS ---

  // Get all blog posts or filter by storeId
  app.get('/api/blogs', async (req, res) => {
    const { storeId } = req.query;

    if (isMongoDbActive()) {
      try {
        const query = storeId ? { storeId: String(storeId) } : {};
        const dbPosts = await (BlogPostDb as any).find(query).sort({ createdAt: -1 });
        return res.json(dbPosts);
      } catch (err: any) {
        console.error('[MongoDB Get Blogs Error]', err.message);
      }
    }

    if (storeId) {
      const filtered = blogPosts.filter(p => p.storeId === String(storeId));
      return res.json(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
    return res.json(blogPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  // Create or Update a blog post
  app.post('/api/blogs', async (req, res) => {
    const data = req.body;

    if (!data.storeId || !data.title || !data.content || !data.authorEmail) {
      return res.status(400).json({ error: 'Datos de blog incompletos. Se requieren storeId, título, contenido y correo de autor.' });
    }

    const docId = data.id || `blog_${Math.random().toString(36).substring(2, 9)}`;
    const isEdit = !!data.id;
    const now = new Date().toISOString();

    const finalPost = {
      id: docId,
      storeId: data.storeId,
      title: data.title,
      slug: data.slug || data.title.toLowerCase().trim().replace(/[\s\W]+/g, '-'),
      excerpt: data.excerpt || (data.content.substring(0, 150) + '...'),
      content: data.content,
      bannerUrl: data.bannerUrl || 'https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=800&q=80',
      authorEmail: data.authorEmail.toLowerCase(),
      authorName: data.authorName || 'Autor Petmall',
      status: data.status || 'DRAFT',
      tags: data.tags || [],
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    if (isMongoDbActive()) {
      try {
        if (isEdit) {
          const updated = await (BlogPostDb as any).findOneAndUpdate({ id: docId }, finalPost, { new: true });
          if (updated) {
            broadcastToClients('BLOG_UPDATED', updated);
            return res.json(updated);
          }
        } else {
          const created = await (BlogPostDb as any).create(finalPost);
          broadcastToClients('BLOG_CREATED', created);
          return res.status(201).json(created);
        }
      } catch (err: any) {
        console.error('[MongoDB Save Blog Error]', err.message);
        return res.status(500).json({ error: 'Error al sincronizar con BD: ' + err.message });
      }
    }

    // Fallback to memory
    if (isEdit) {
      const idx = blogPosts.findIndex(p => p.id === docId);
      if (idx !== -1) {
        blogPosts[idx] = { ...blogPosts[idx], ...finalPost };
        broadcastToClients('BLOG_UPDATED', blogPosts[idx]);
        return res.json(blogPosts[idx]);
      }
    } else {
      blogPosts.push(finalPost);
      broadcastToClients('BLOG_CREATED', finalPost);
      return res.status(201).json(finalPost);
    }
    
    return res.status(404).json({ error: 'Artículo de blog no encontrado para editar.' });
  });

  // Delete a blog post
  app.delete('/api/blogs/:id', async (req, res) => {
    const { id } = req.params;

    if (isMongoDbActive()) {
      try {
        await (BlogPostDb as any).deleteOne({ id });
        broadcastToClients('BLOG_DELETED', { id });
        return res.json({ success: true });
      } catch (err: any) {
        return res.status(500).json({ error: 'Error al borrar artículo en MongoDB: ' + err.message });
      }
    } else {
      blogPosts = blogPosts.filter(p => p.id !== id);
      broadcastToClients('BLOG_DELETED', { id });
      return res.json({ success: true });
    }
  });

  // Increment view counter for a blog post
  app.post('/api/blogs/:id/view', async (req, res) => {
    const { id } = req.params;
    if (isMongoDbActive()) {
      try {
        const updated = await (BlogPostDb as any).findOneAndUpdate(
          { id },
          { $inc: { views: 1 } },
          { new: true }
        );
        if (updated) {
          broadcastToClients('BLOG_UPDATED', updated);
          return res.json(updated);
        }
      } catch (err: any) {
        console.error('[MongoDB Inc Views Error]', err.message);
      }
    }

    // fallback memory
    const post = blogPosts.find(p => p.id === id);
    if (post) {
      post.views = (post.views || 0) + 1;
      broadcastToClients('BLOG_UPDATED', post);
      return res.json(post);
    }
    return res.status(404).json({ error: 'Post no encontrado' });
  });

  // Submit reaction / evaluate blog post (Like or Dislike)
  app.post('/api/blogs/:id/react', async (req, res) => {
    const { id } = req.params;
    const { action, email } = req.body; // action: 'like' | 'dislike', email: commenter email

    if (!email) {
      return res.status(400).json({ error: 'Se requiere validar usuario con correo para evaluar.' });
    }

    if (isMongoDbActive()) {
      try {
        let post = await (BlogPostDb as any).findOne({ id });
        if (!post) return res.status(404).json({ error: 'Post no encontrado en MongoDB' });

        let likedBy = post.likedBy || [];
        let dislikedBy = post.dislikedBy || [];

        if (action === 'like') {
          if (likedBy.includes(email)) {
            likedBy = likedBy.filter((e: string) => e !== email);
          } else {
            likedBy.push(email);
            dislikedBy = dislikedBy.filter((e: string) => e !== email);
          }
        } else if (action === 'dislike') {
          if (dislikedBy.includes(email)) {
            dislikedBy = dislikedBy.filter((e: string) => e !== email);
          } else {
            dislikedBy.push(email);
            likedBy = likedBy.filter((e: string) => e !== email);
          }
        }

        const likes = likedBy.length;
        const dislikes = dislikedBy.length;

        const updated = await (BlogPostDb as any).findOneAndUpdate(
          { id },
          { likedBy, dislikedBy, likes, dislikes },
          { new: true }
        );

        if (updated) {
          broadcastToClients('BLOG_UPDATED', updated);
          return res.json(updated);
        }
      } catch (err: any) {
        console.error('[MongoDB React Error]', err.message);
      }
    }

    // fallback memory
    const post = blogPosts.find(p => p.id === id);
    if (post) {
      let likedBy = post.likedBy || [];
      let dislikedBy = post.dislikedBy || [];

      if (action === 'like') {
        if (likedBy.includes(email)) {
          likedBy = likedBy.filter(e => e !== email);
        } else {
          likedBy.push(email);
          dislikedBy = dislikedBy.filter(e => e !== email);
        }
      } else if (action === 'dislike') {
        if (dislikedBy.includes(email)) {
          dislikedBy = dislikedBy.filter(e => e !== email);
        } else {
          dislikedBy.push(email);
          likedBy = likedBy.filter(e => e !== email);
        }
      }

      post.likedBy = likedBy;
      post.dislikedBy = dislikedBy;
      post.likes = likedBy.length;
      post.dislikes = dislikedBy.length;

      broadcastToClients('BLOG_UPDATED', post);
      return res.json(post);
    }

    return res.status(404).json({ error: 'Post no encontrado en memoria' });
  });

  // Threaded comments endpoint
  app.post('/api/blogs/:id/comment', async (req, res) => {
    const { id } = req.params;
    const { authorEmail, authorRole, content, parentId } = req.body;

    if (!authorEmail || !authorRole || !content) {
      return res.status(400).json({ error: 'Comentario incompleto. Se requieren correo de autor, rol y contenido.' });
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newComment = {
      id: commentId,
      authorEmail,
      authorRole,
      content,
      createdAt: new Date().toISOString(),
      parentId: parentId || undefined
    };

    if (isMongoDbActive()) {
      try {
        const updated = await (BlogPostDb as any).findOneAndUpdate(
          { id },
          { $push: { comments: newComment } },
          { new: true }
        );
        if (updated) {
          broadcastToClients('BLOG_UPDATED', updated);
          return res.json(updated);
        }
      } catch (err: any) {
        console.error('[MongoDB Comment Error]', err.message);
      }
    }

    // fallback memory
    const post = blogPosts.find(p => p.id === id);
    if (post) {
      if (!post.comments) post.comments = [];
      post.comments.push(newComment);
      broadcastToClients('BLOG_UPDATED', post);
      return res.json(post);
    }

    return res.status(404).json({ error: 'Post no encontrado' });
  });

  // --- UPGRADE STORE PLAN ENDPOINT ---
  app.post('/api/stores/:storeId/upgrade', async (req, res) => {
    const { storeId } = req.params;
    const { planType, planName } = req.body;

    if (isMongoDbActive()) {
      try {
        const updated = await (StoreDb as any).findOneAndUpdate(
          { id: storeId },
          { planType, planName },
          { new: true }
        );
        broadcastToClients('STORE_UPDATED', updated);
        return res.json(updated);
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    } else {
      return res.json({ id: storeId, planType, planName, success: true });
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
    const { items, storeId, orderType, deliveryPartnerId, deliveryFee, deliveryAddressCoords, deliveryAddressText } = req.body; 

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
        total: total + (deliveryFee ? Number(deliveryFee) : 0),
        createdAt: new Date().toISOString(),
        // Private delivery extension fields:
        deliveryPartnerId,
        deliveryFee: deliveryFee ? Number(deliveryFee) : undefined,
        deliveryAddressCoords,
        deliveryAddressText,
        deliveryStatus: deliveryPartnerId ? 'CONFIRMED' : undefined
      } as any;

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

  // --- PRIVATE DELIVERY PARTNERS NETWORK ENDPOINTS ---
  app.get('/api/delivery/partners', (req, res) => {
    res.json(deliveryPartners);
  });

  app.post('/api/delivery/partners', (req, res) => {
    const { name, email, phone, vehicle, fee, coverageCenter, coverageRadius } = req.body;
    if (!name || !email || !phone || !vehicle || !fee || !coverageCenter || !coverageRadius) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios para inscribirse.' });
    }
    const newPartner: DeliveryPartner = {
      id: 'dp_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      phone,
      vehicle,
      fee: Number(fee),
      coverageCenter: [Number(coverageCenter[0]), Number(coverageCenter[1])],
      coverageRadius: Number(coverageRadius),
      rating: 5.0,
      ratingsCount: 0,
      reviews: []
    };
    deliveryPartners.push(newPartner);
    res.status(201).json({ success: true, partner: newPartner });
  });

  app.post('/api/delivery/partners/:id/rate', (req, res) => {
    const { id } = req.params;
    const { rating, comment, author } = req.body;
    const partner = deliveryPartners.find(dp => dp.id === id);
    if (!partner) {
      return res.status(404).json({ error: 'Repartidor no encontrado' });
    }
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Calificación inválida.' });
    }
    if (!partner.reviews) partner.reviews = [];
    partner.reviews.push({
      rating: numRating,
      comment: comment || '',
      author: author || 'Comprador Petmall',
      date: new Date().toISOString().split('T')[0]
    });
    const sum = partner.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    partner.ratingsCount = partner.reviews.length;
    partner.rating = Number((sum / partner.ratingsCount).toFixed(1));

    res.json({ success: true, partner });
  });



  // --- CHAT ENDPOINTS / OTHER INTEGRATION CHANNELS ---
  // Default to SPA entry handler later

  // Vite Integration for dev
  let viteInstance: any = null;
  if (process.env.NODE_ENV !== 'production') {
    viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // HTML SEO Middleware for Social Sharing Previews (WhatsApp, Facebook, X, etc.)
  const serveHtmlWithMeta = async (req: express.Request, res: express.Response, meta: { title: string; description: string; image: string }) => {
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const indexPath = isProd 
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html');
      
      let html = '';
      try {
        html = fs.readFileSync(indexPath, 'utf-8');
      } catch (err) {
        html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Petmall</title></head><body><div id="root"></div></body></html>`;
      }

      if (!isProd && viteInstance) {
        html = await viteInstance.transformIndexHtml(req.originalUrl, html);
      }

      const absoluteUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const escapedTitle = meta.title.replace(/"/g, '&quot;');
      const escapedDesc = meta.description.replace(/"/g, '&quot;').replace(/\n/g, ' ');

      const metaTags = `
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDesc}" />
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDesc}" />
    <meta property="og:image" content="${meta.image}" />
    <meta property="og:url" content="${absoluteUrl}" />
    <meta property="og:site_name" content="Petmall Chile" />
    <!-- Twitter / X / Threads -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDesc}" />
    <meta name="twitter:image" content="${meta.image}" />
    <meta name="twitter:url" content="${absoluteUrl}" />
      `;

      if (html.includes('<title>Petmall</title>')) {
        html = html.replace('<title>Petmall</title>', metaTags);
      } else if (html.includes('</head>')) {
        html = html.replace('</head>', `${metaTags}\n</head>`);
      }

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (error: any) {
      console.error('[SEO Middleware Error]', error.message);
      return res.status(500).send('Internal Server Error');
    }
  };

  app.get([
    '/',
    '/demo',
    '/item/:id',
    '/demo/item/:id',
    '/store/:id',
    '/demo/store/:id',
    '/store/:id/blogs',
    '/demo/store/:id/blogs',
    '/store/:id/blogs/:blogId',
    '/demo/store/:id/blogs/:blogId',
    '/blogs',
    '/demo/blogs'
  ], async (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    try {
      let title = 'Petmall Chile | Ecosistema Omnicanal para Mascotas';
      let description = 'La red de tiendas de mascotas, clínicas veterinarias y estéticas premium en Chile con ERP SaaS integrado.';
      let image = 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&q=80';

      const pathParts = req.path.split('/');
      const isItem = req.path.includes('/item/');
      const isStore = req.path.includes('/store/') && !req.path.includes('/blogs');
      const isStoreBlogs = req.path.includes('/store/') && req.path.endsWith('/blogs');
      const isBlogPost = req.path.includes('/store/') && req.path.includes('/blogs/') && !req.path.endsWith('/blogs');

      if (isItem) {
        const itemId = req.params.id || pathParts[pathParts.length - 1];
        let item;
        if (isMongoDbActive()) {
          try {
            item = await (CatalogItemDb as any).findOne({ id: itemId });
          } catch (e) {}
        }
        if (!item) {
          item = catalog.find(i => i.id === itemId);
        }

        if (item) {
          title = `${item.title} | Petmall Chile`;
          description = item.description || `Encuentra ${item.title} en nuestra red de tiendas. Calidad y salud para tu mascota al mejor precio.`;
          image = item.images && item.images[0] ? item.images[0] : image;
        }
      } else if (isBlogPost) {
        const blogId = req.params.blogId || pathParts[pathParts.length - 1];
        let post;
        if (isMongoDbActive()) {
          try {
            post = await (BlogPostDb as any).findOne({ id: blogId });
          } catch (e) {}
        }
        if (!post) {
          post = blogPosts.find(p => p.id === blogId);
        }

        if (post) {
          let store;
          if (isMongoDbActive()) {
            try {
              store = await (StoreDb as any).findOne({ id: post.storeId });
            } catch (e) {}
          }
          if (!store) {
            store = stores.find(s => s.id === post.storeId);
          }

          title = `${post.title} | Blog de ${store ? store.name : 'Petmall'}`;
          description = post.excerpt || post.content?.substring(0, 160).replace(/[#*`\n]/g, ' ') || `Lee nuestra última publicación sobre bienestar animal.`;
          image = post.bannerUrl || image;
        }
      } else if (isStoreBlogs) {
        const storeIdx = pathParts.indexOf('store');
        const storeId = storeIdx !== -1 ? pathParts[storeIdx + 1] : null;
        let store;
        if (storeId) {
          if (isMongoDbActive()) {
            try {
              store = await (StoreDb as any).findOne({ id: storeId });
            } catch (e) {}
          }
          if (!store) {
            store = stores.find(s => s.id === storeId);
          }
        }

        if (store) {
          title = `Blog Oficial de ${store.name} | Consejos de Mascotas`;
          description = `Revisa las últimas guías de salud, noticias de tenencia responsable y consejos expertos de ${store.name}.`;
          image = 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&q=80';
        }
      } else if (isStore) {
        const storeId = req.params.id || pathParts[pathParts.length - 1];
        let store;
        if (isMongoDbActive()) {
          try {
            store = await (StoreDb as any).findOne({ id: storeId });
          } catch (e) {}
        }
        if (!store) {
          store = stores.find(s => s.id === storeId);
        }

        if (store) {
          title = `${store.name} | Petmall Chile`;
          description = `Visita la e-Store oficial de ${store.name} en Petmall. Revisa su catálogo de productos y agenda servicios para tu mascota.`;
          if (store.branding?.colors?.primary) {
            image = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80';
          }
        }
      }

      await serveHtmlWithMeta(req, res, { title, description, image });
    } catch (err: any) {
      console.error('[SEO Matcher Error]', err);
      return next();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    if (viteInstance) {
      app.use(viteInstance.middlewares);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Petmall server] Running full-stack system on http://0.0.0.0:${PORT}`);
  });
}

startServer();
