/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { Star, Shield, HelpCircle, ArrowLeft, Check, Clock, User, Calendar, MapPin, Truck, HelpCircle as HelpIcon, ChevronRight } from 'lucide-react';
import { CatalogItem } from '../types.js';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { catalog, stores, addToCart } = usePetmallStore();

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'CLICK_AND_COLLECT'>('DELIVERY');
  
  // Service scheduling states
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-12');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slotsTable, setSlotsTable] = useState<string[]>([]);

  useEffect(() => {
    const found = catalog.find(i => i.id === id);
    if (found) {
      setItem(found);
      setSelectedImage(found.images[0]);
      
      // Calculate dynamic mock slots for today/tomorrow based on service config
      if (found.type === 'SERVICE') {
        setSlotsTable(['09:00', '10:30', '12:00', '14:30', '16:00', '17:30']);
      }
    }
  }, [id, catalog]);

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Cargando detalles de tu ítem...</p>
        <button onClick={() => navigate('/')} className="mt-4 text-brand-gold font-bold flex items-center justify-center mx-auto hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Marketplace
        </button>
      </div>
    );
  }

  const store = stores.find(s => s.id === item.storeId) || stores[0];
  const isProduct = item.type === 'PRODUCT';

  // Available dates list
  const nextDates = [
    { day: 'Viernes', dateStr: '2026-06-12' },
    { day: 'Sábado', dateStr: '2026-06-13' },
    { day: 'Lunes', dateStr: '2026-06-15' },
    { day: 'Martes', dateStr: '2026-06-16' },
  ];

  const handleAction = () => {
    if (isProduct) {
      // Add product to cart with chosen checkout preference
      addToCart(item, 1);
      alert('¡Producto añadido! Puedes revisarlo en tu carrito de compras.');
    } else {
      // Validate scheduler selection
      if (!selectedSlot) {
        alert('Por favor selecciona un bloque de horario para agendar la cita.');
        return;
      }
      addToCart(item, 1, {
        date: selectedDate,
        timeSlot: selectedSlot
      });
      alert(`¡Cita agendada para el ${selectedDate} a las ${selectedSlot}! Revisa tu carrito.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="inline-flex items-center text-xs font-semibold text-brand-blue hover:text-brand-gold transition-colors focus:outline-hidden"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-gray-500" />
          <span>Volver a la galería</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-150 p-6 sm:p-8 shadow-xs mb-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          
          {/* Images Section (Image 2 style) */}
          <div className="lg:col-span-6">
            <div className="aspect-square w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center p-4">
              <img
                src={selectedImage}
                alt={item.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            
            {/* Gallery Thumbnails (Mocked high-fidelity) */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              {item.images.concat([
                'https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=300&q=80',
                'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&q=80',
                'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=300&q=80'
              ]).slice(0, 4).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square w-full rounded-md overflow-hidden bg-gray-50 border transition-all ${
                    img === selectedImage ? 'border-brand-gold ring-1 ring-brand-gold' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details Content Box */}
          <div className="mt-8 lg:mt-0 lg:col-span-6 flex flex-col">
            <div>
              <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">
                {item.category}
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-brand-blue tracking-tight">
                {item.title}
              </h1>
              
              <div className="mt-2.5 flex items-center space-x-2.5 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">Marca: Nature's Pet</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                  <span className="font-bold text-gray-800">4.8</span> (125 reseñas)
                </span>
                <span className="text-gray-300">|</span>
                <span 
                  onClick={() => navigate(location.pathname.startsWith('/demo') ? `/demo/store/${store.id}` : `/store/${store.id}`)}
                  className="font-semibold text-brand-blue hover:text-brand-gold flex items-center cursor-pointer hover:underline"
                  title="Ver perfil profesional de la tienda"
                >
                  <MapPin className="w-3.5 h-3.5 mr-0.5 text-red-500 animate-bounce" />
                  {store.name} (Ver Empresa ↗)
                </span>
              </div>
            </div>

            {/* Price block */}
            <div className="mt-5 p-4.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="block text-2xs font-semibold text-gray-400 uppercase tracking-wide">PVP Sugerido</span>
                  <span className="font-serif text-3xl font-black text-brand-blue">${item.price.toFixed(2)}</span>
                </div>
                
                {isProduct && (
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      Stock: {item.productDetails?.stockDigital} uds disponibles
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description (Image 2 style) */}
            <div className="mt-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</h3>
              <p className="mt-2 text-xs text-gray-650 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* INTERACTIVE CONDITIONAL: Product Delivery options OR Service schedule options */}
            {isProduct ? (
              <div className="mt-6 text-left">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Dinámicas de Delivery
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Delivery */}
                  <label className={`relative p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryType === 'DELIVERY'
                      ? 'border-brand-blue bg-blue-50/15'
                      : 'border-gray-200 hover:bg-gray-50/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="deliveryOption" 
                      className="sr-only" 
                      checked={deliveryType === 'DELIVERY'}
                      onChange={() => setDeliveryType('DELIVERY')}
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-brand-blue flex items-center">
                          <Truck className="w-3.5 h-3.5 text-brand-gold mr-1.5" />
                          Envío Express (1-3 hrs)
                        </span>
                        {deliveryType === 'DELIVERY' && <span className="w-4 h-4 rounded-full bg-brand-blue flex items-center justify-center text-white text-3xs">✓</span>}
                      </div>
                      <p className="text-3xs text-gray-500 mt-2">
                        Envío Express prioritario a tu dirección desde la tienda {store.name}.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Click & Collect */}
                  <label className={`relative p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryType === 'CLICK_AND_COLLECT'
                      ? 'border-brand-blue bg-blue-50/15'
                      : 'border-gray-200 hover:bg-gray-50/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="deliveryOption" 
                      className="sr-only" 
                      checked={deliveryType === 'CLICK_AND_COLLECT'}
                      onChange={() => setDeliveryType('CLICK_AND_COLLECT')}
                    />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-brand-blue flex items-center">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold mr-1.5" />
                          Click & Collect (Hoy mismo)
                        </span>
                        {deliveryType === 'CLICK_AND_COLLECT' && <span className="w-4 h-4 rounded-full bg-brand-blue flex items-center justify-center text-white text-3xs">✓</span>}
                      </div>
                      <p className="text-3xs text-gray-500 mt-2">
                        Retira hoy mismo gratis en la tienda física {store.name} y ahorra costes.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-left border-t border-gray-100 pt-6">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Agendar Bloque de Atención
                </span>
                
                {/* Meta details Specialist */}
                <div className="flex items-center space-x-3 mb-4 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100 text-xs">
                  <User className="w-4 h-4 text-brand-gold shrink-0" />
                  <div>
                    <span className="font-bold text-brand-blue block">Especialista asignado:</span>
                    <span className="text-gray-500">{item.serviceDetails?.specialistName}</span>
                  </div>
                  <div className="ml-auto flex items-center text-gray-500 pl-4 border-l border-gray-200">
                    <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    <span>{item.serviceDetails?.durationMinutes} min</span>
                  </div>
                </div>

                {/* Day selector */}
                <span className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-2">Paso 1: Elige la Fecha</span>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {nextDates.map(d => (
                    <button
                      key={d.dateStr}
                      onClick={() => {
                        setSelectedDate(d.dateStr);
                        setSelectedSlot(''); // Reset slot on date change
                      }}
                      className={`p-2 rounded-lg border text-center transition-all focus:outline-hidden ${
                        selectedDate === d.dateStr
                          ? 'border-brand-blue bg-brand-blue text-white shadow-xs'
                          : 'border-gray-250 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block text-3--xs font-medium uppercase tracking-wider leading-none mb-1">{d.day}</span>
                      <span className="block text-xs font-bold font-mono">{d.dateStr.split('-')[2]}</span>
                    </button>
                  ))}
                </div>

                {/* Time slot selector */}
                <span className="block text-3xs font-bold text-gray-400 uppercase tracking-wide mb-2">Paso 2: Elige el Bloque Disponible</span>
                <div className="grid grid-cols-3 gap-2">
                  {slotsTable.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSlot(s)}
                      className={`py-1.8 text-xs font-mono font-bold rounded-md border text-center transition-all focus:outline-hidden ${
                        selectedSlot === s
                          ? 'border-brand-gold bg-brand-gold text-white shadow-xs'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action CTA */}
            <div className="mt-8 pt-6 border-t border-gray-150">
              <button
                onClick={handleAction}
                className="w-full bg-brand-blue text-white py-3 px-6 rounded-lg font-semibold hover:bg-brand-blue/90 cursor-pointer shadow-sm transition-all focus:outline-hidden"
              >
                {isProduct ? 'Añadir al Carrito' : 'Confirmar Reserva de Cita'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Reviews (Image 2 style: Multiple round animal circles representing reviews) */}
      <section className="bg-white rounded-2xl border border-gray-150 p-6 sm:p-8">
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-serif font-bold text-brand-blue">Reseñas de la Comunidad Petmall</h2>
            <p className="text-3xs text-gray-450 uppercase font-semibold">Stocks y experiencias reales de otros compradores</p>
          </div>
          <button className="text-xs text-brand-gold hover:underline font-bold flex items-center">
            Ver todas <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* Customer Pet Avatars Rows */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&q=80', name: 'Milo (Golden)', review: '¡Excelente alimento! Su digestión mejoró muchísimo.' },
            { img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80', name: 'Luna (Gata Criolla)', review: 'Amo el Click & Collect en Don Jorge. Todo listo.' },
            { img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&q=80', name: 'Simba (Siames)', review: 'Súper bien empacado. Un 7.' },
            { img: 'https://images.unsplash.com/photo-1477884213970-29c2794b24fd?w=200&q=80', name: 'Coco (Poodle)', review: 'El servicio de baño en Don Jorges fue maravilloso.' },
            { img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&q=80', name: 'Toby (Labrador)', review: 'Todo orgánico, empaques ecológicos.' },
          ].map((r, i) => (
            <div key={i} className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-gold mb-2.5">
                <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-brand-blue">{r.name}</p>
              <div className="flex my-1">
                {[1, 2, 3, 4, 5].map(st => <Star key={st} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-3xs text-gray-500 leading-snug mt-1 line-clamp-2">"{r.review}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
