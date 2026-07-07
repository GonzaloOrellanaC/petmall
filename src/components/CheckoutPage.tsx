/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { 
  ShoppingCart, CreditCard, ShieldCheck, MapPin, Truck, 
  CalendarCheck, AlertTriangle, CheckCircle, MessageSquare, 
  User, Phone, Star, ArrowRight
} from 'lucide-react';
import { Map, Marker } from 'pigeon-maps';
import { motion, AnimatePresence } from 'motion/react';

const AnyMap = Map as any;
const AnyMarker = Marker as any;

// Helper to calculate distance in km between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CheckoutPage() {
  const { 
    cart, 
    currentStore, 
    submitCheckout, 
    clearCart, 
    deliveryPartners, 
    fetchDeliveryPartners, 
    rateDeliveryPartner 
  } = usePetmallStore();
  const navigate = useNavigate();

  // Load partners on mount
  useEffect(() => {
    fetchDeliveryPartners();
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Delivery-specific state
  const [deliveryOption, setDeliveryOption] = useState<'collect' | 'private_delivery'>('collect');
  
  // Resolve store coordinates
  const storeCoords: [number, number] = currentStore?.geolocation?.coordinates 
    ? [currentStore.geolocation.coordinates[1], currentStore.geolocation.coordinates[0]] // [lat, lng]
    : [-33.4489, -70.6693]; // Santiago default

  // Customer shipping coords default to slightly offset from store
  const [customerCoords, setCustomerCoords] = useState<[number, number]>([
    storeCoords[0] + 0.008, 
    storeCoords[1] + 0.008
  ]);

  // Selected delivery partner
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  
  // Internal contact workflow
  const [isContactConfirmed, setIsContactConfirmed] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationStep, setNegotiationStep] = useState(0);

  // Success-screen Rating States
  const [driverRating, setDriverRating] = useState<number>(5);
  const [driverComment, setDriverComment] = useState<string>('');
  const [driverRatingSuccess, setDriverRatingSuccess] = useState<boolean>(false);

  // Cart properties
  const cartTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  const containsService = cart.some(i => i.item.type === 'SERVICE');
  const containsProduct = cart.some(i => i.item.type === 'PRODUCT');

  // Determine OrderType preference
  let orderType: 'DELIVERY' | 'CLICK_AND_COLLECT' | 'SERVICE_BOOKING' = 'DELIVERY';
  if (containsService && !containsProduct) {
    orderType = 'SERVICE_BOOKING';
  } else if (containsProduct && containsService) {
    orderType = 'DELIVERY'; // Mixed
  }

  // Filter delivery partners within range of BOTH store and customer location
  const availablePartners = deliveryPartners.filter(partner => {
    // 1. Distance from partner center to store
    const distToStore = calculateDistance(
      partner.coverageCenter[0], partner.coverageCenter[1],
      storeCoords[0], storeCoords[1]
    );
    // 2. Distance from partner center to customer address
    const distToCustomer = calculateDistance(
      partner.coverageCenter[0], partner.coverageCenter[1],
      customerCoords[0], customerCoords[1]
    );

    // Eligible if both locations fall inside their coverage radius
    return distToStore <= partner.coverageRadius && distToCustomer <= partner.coverageRadius;
  });

  const selectedPartner = deliveryPartners.find(dp => dp.id === selectedPartnerId);
  const deliveryFee = deliveryOption === 'private_delivery' && selectedPartner ? selectedPartner.fee : 0;
  const finalTotal = cartTotal + deliveryFee;

  // Handle map clicks to update shipping location
  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    setCustomerCoords(latLng);
    // Force re-negotiation if destination coordinates change
    setIsContactConfirmed(false);
    setSelectedPartnerId('');
  };

  // Start simulated internal contact flow
  const handleStartNegotiation = () => {
    if (!selectedPartnerId) return;
    setIsNegotiating(true);
    setNegotiationStep(1);

    // Sequence of chat messages to make it extremely interactive
    setTimeout(() => setNegotiationStep(2), 1500);
    setTimeout(() => setNegotiationStep(3), 3500);
  };

  const handleAcceptNegotiation = () => {
    setIsContactConfirmed(true);
    setIsNegotiating(false);
    setNegotiationStep(0);
  };

  const handleProcessPyment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setErrorMsg('Por favor completa los campos obligatorios de identificación.');
      return;
    }

    if (deliveryOption === 'private_delivery' && !isContactConfirmed) {
      setErrorMsg('Debes realizar la gestión de contacto interna para confirmar la disponibilidad del repartidor antes de pagar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const deliveryData = deliveryOption === 'private_delivery' ? {
        deliveryPartnerId: selectedPartnerId,
        deliveryFee: deliveryFee,
        deliveryAddressCoords: customerCoords,
        deliveryAddressText: address || 'Dirección en mapa'
      } : undefined;

      const resolvedOrderType = deliveryOption === 'private_delivery' ? 'DELIVERY' : orderType;

      const res = await submitCheckout(resolvedOrderType, deliveryData);
      
      if (res.success) {
        setConfirmedOrder(res.order);
      }
    } catch (err: any) {
      console.error('[Checkout error]', err);
      setErrorMsg(err.message || 'Error al procesar la venta. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success-screen Rating Submit
  const handleRateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedOrder?.deliveryPartnerId) return;

    try {
      await rateDeliveryPartner(confirmedOrder.deliveryPartnerId, {
        rating: driverRating,
        comment: driverComment,
        author: fullName || 'Cliente Petmall'
      });
      setDriverRatingSuccess(true);
    } catch (err) {
      console.error('Error submitting driver rating:', err);
    }
  };

  // Group cart items by store for high-fidelity grouped checkout
  const storeName = currentStore?.name || "Don Jorge's BioShop";

  if (confirmedOrder) {
    const assignedDriver = deliveryPartners.find(dp => dp.id === confirmedOrder.deliveryPartnerId);

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-gray-150 p-8 shadow-md flex flex-col items-center">
          <div className="w-16 h-16 bg-green-150 rounded-full flex items-center justify-center text-green-600 mb-5">
            <CheckCircle className="w-9 h-9" />
          </div>
          
          <h1 className="font-serif text-3xl font-black text-brand-blue tracking-tight">
            ¡Compra Exitosa!
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            Tu transacción y envío hiperlocal han sido validados en tiempo real.
          </p>

          <div className="w-full bg-gray-50 rounded-2xl p-5 border border-gray-150 my-6 text-left space-y-3.5">
            <div className="flex justify-between items-center text-xs font-semibold border-b border-gray-200 pb-3">
              <span className="text-gray-400 uppercase tracking-wider text-4xs">ID de Compra</span>
              <span className="font-mono text-brand-blue font-bold">{confirmedOrder.id}</span>
            </div>
            
            <div className="flex justify-between text-xs font-medium">
              <span className="text-gray-500">Monto Artículos</span>
              <span className="font-mono text-gray-900">${cartTotal.toLocaleString('es-CL')}</span>
            </div>

            {confirmedOrder.deliveryFee && (
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Tarifa Envío Privado</span>
                <span className="font-mono text-amber-700 font-bold">+ ${confirmedOrder.deliveryFee.toLocaleString('es-CL')}</span>
              </div>
            )}

            <div className="flex justify-between text-xs font-black border-t border-gray-250 pt-2.5">
              <span className="text-gray-800 uppercase tracking-wide">Monto Total</span>
              <span className="font-mono text-brand-blue text-sm">${confirmedOrder.total.toLocaleString('es-CL')} CLP</span>
            </div>

            <div className="flex justify-between text-xs font-semibold border-t border-gray-200 pt-3">
              <span className="text-gray-500">Modalidad</span>
              <span className="font-bold text-green-700 capitalize">
                {confirmedOrder.deliveryPartnerId ? 'Envío Privado Confirmado' : 'Retiro Presencial'}
              </span>
            </div>

            {assignedDriver && (
              <div className="bg-amber-50 rounded-xl p-3 text-3xs border border-amber-200 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-800 block">Repartidor Asignado</span>
                  <p className="text-gray-600 font-medium mt-0.5">
                    <b>{assignedDriver.name}</b> se encuentra llevando tu orden en su <b>{assignedDriver.vehicle}</b>. Puedes llamarle al <b>{assignedDriver.phone}</b>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* DRIVER EVALUATION FORM - Crucial user requirement */}
          {assignedDriver && (
            <div className="w-full border-t border-gray-150 pt-6 mt-2 mb-6">
              {!driverRatingSuccess ? (
                <form onSubmit={handleRateDriver} className="bg-slate-50 p-5 rounded-2xl border border-gray-150 text-left space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <div>
                      <h3 className="font-serif font-black text-brand-blue text-xs leading-none">
                        Evalúa el servicio de {assignedDriver.name}
                      </h3>
                      <p className="text-3xs text-gray-400 uppercase tracking-wider font-bold mt-1">
                        Tu opinión es esencial para mantener la calidad de la red de envíos
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-4xs font-bold text-gray-450 uppercase mb-1">Calificación de Entrega</label>
                      <select
                        value={driverRating}
                        onChange={(e) => setDriverRating(Number(e.target.value))}
                        className="border border-gray-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-brand-gold outline-hidden"
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (Excelente)</option>
                        <option value="4">⭐⭐⭐⭐ (Bueno)</option>
                        <option value="3">⭐⭐⭐ (Regular)</option>
                        <option value="2">⭐⭐ (Malo)</option>
                        <option value="1">⭐ (Muy Malo)</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-4xs font-bold text-gray-450 uppercase mb-1">Tu Comentario</label>
                      <input
                        type="text"
                        required
                        placeholder="Excelente puntualidad y cuidado de los productos."
                        value={driverComment}
                        onChange={(e) => setDriverComment(e.target.value)}
                        className="border border-gray-200 rounded-lg p-2 text-xs bg-white focus:ring-1 focus:ring-brand-gold outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-gold hover:bg-brand-gold/90 text-white font-extrabold uppercase text-3xs py-2 px-4 rounded-xl tracking-wider cursor-pointer"
                  >
                    Enviar Evaluación del Despacho
                  </button>
                </form>
              ) : (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-green-850 text-xs font-semibold">
                  👍 ¡Muchas gracias! Tu evaluación ha sido enviada e integrada al promedio histórico de {assignedDriver.name}.
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-4 w-full">
            <button
              onClick={() => {
                clearCart();
                navigate('/');
              }}
              className="flex-1 bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-brand-blue/90 cursor-pointer transition-all focus:outline-hidden text-xs uppercase tracking-wider"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      <h1 className="font-serif text-3xl font-black text-brand-blue tracking-tight mb-8">
        Pasarela de Pagos Segura
      </h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed text-center py-16">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-xs">No tienes productos en la cola de checkout.</p>
          <button onClick={() => navigate('/')} className="mt-4 bg-brand-gold text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-brand-gold/90 transition-all cursor-pointer">
            Volver a vitrina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Checkout forms */}
          <form onSubmit={handleProcessPyment} className="lg:col-span-7 bg-white rounded-3xl border border-gray-150 p-6 sm:p-8 space-y-6">
            
            {/* Delivery option selectors */}
            <div>
              <h2 className="text-xs font-black text-brand-blue uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-gold text-white flex items-center justify-center text-3xs font-black">1</span>
                Método de Entrega
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => {
                    setDeliveryOption('collect');
                    setIsContactConfirmed(false);
                    setSelectedPartnerId('');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer text-left transition-all ${
                    deliveryOption === 'collect'
                      ? 'border-brand-blue bg-blue-50/25'
                      : 'border-gray-150 hover:border-gray-250'
                  }`}
                >
                  <span className="block font-black text-brand-blue text-xs uppercase tracking-wider mb-1">🛒 Retiro Presencial</span>
                  <p className="text-3xs text-gray-400">Retira gratis en la sucursal de {storeName}.</p>
                </div>

                {containsProduct && (
                  <div 
                    onClick={() => setDeliveryOption('private_delivery')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer text-left transition-all ${
                      deliveryOption === 'private_delivery'
                        ? 'border-brand-blue bg-blue-50/25'
                        : 'border-gray-150 hover:border-gray-250'
                    }`}
                  >
                    <span className="block font-black text-brand-blue text-xs uppercase tracking-wider mb-1">🚚 Envío a Domicilio</span>
                    <p className="text-3xs text-gray-400">Usa la Red Privada para recibir hoy mismo en tu hogar.</p>
                  </div>
                )}
              </div>
            </div>

            {/* If Private Delivery option selected */}
            {deliveryOption === 'private_delivery' && (
              <div className="space-y-6 bg-slate-50 p-5 rounded-2xl border border-gray-150 animate-fade-in">
                <div>
                  <h3 className="text-2xs font-extrabold text-brand-blue uppercase tracking-wider mb-1">
                    📍 Tu Ubicación de Despacho (Haz clic en el mapa)
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Marca tu dirección exacta. Mostraremos los transportistas cuya zona cubra este punto y la tienda.
                  </p>
                </div>

                {/* Shipping map coordinates selector */}
                <div className="h-[200px] bg-white border border-gray-150 rounded-xl overflow-hidden relative">
                  <AnyMap
                    height={200}
                    center={storeCoords}
                    zoom={12}
                    onClick={handleMapClick}
                  >
                    {/* Store location */}
                    <AnyMarker anchor={storeCoords} color="indigo" />
                    
                    {/* Customer selected shipping point */}
                    <AnyMarker anchor={customerCoords} color="red" />
                  </AnyMap>
                  <div className="absolute top-2.5 right-2.5 bg-brand-blue text-white px-2 py-0.5 rounded text-[8px] font-bold">
                    Azul: Tienda | Rojo: Tu Dirección
                  </div>
                </div>

                {/* Private delivery partners checklist */}
                <div className="space-y-3">
                  <h4 className="text-2xs font-black text-gray-450 uppercase tracking-wider">
                    Repartidores Disponibles en tu Zona
                  </h4>

                  {availablePartners.length === 0 ? (
                    <div className="p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-3xs font-semibold leading-relaxed">
                      ⚠️ No hay ningún transportista privado disponible en esta área de despacho para {storeName}. 
                      Intenta reubicar el marcador rojo en el mapa o selecciona Retiro Presencial.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availablePartners.map((dp) => (
                        <div 
                          key={dp.id}
                          onClick={() => {
                            setSelectedPartnerId(dp.id);
                            setIsContactConfirmed(false);
                          }}
                          className={`p-3 bg-white rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${
                            selectedPartnerId === dp.id 
                              ? 'border-brand-gold bg-amber-50/10' 
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs">🚚</span>
                            <div>
                              <span className="block font-serif font-black text-brand-blue text-xs leading-none">
                                {dp.name} <span className="text-3xs font-mono font-medium text-gray-400">({dp.vehicle})</span>
                              </span>
                              <span className="text-3xs text-amber-500 font-extrabold mt-1 block">
                                ⭐ {dp.rating} ({dp.ratingsCount} reviews)
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="block text-xs font-mono font-black text-green-700">
                              + ${dp.fee.toLocaleString('es-CL')} CLP
                            </span>
                            <span className="block text-[8px] text-gray-400 font-bold leading-none mt-1 uppercase">
                              Costo de Envío
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* INTERNAL CONTACT MANAGEMENT SEQUENCE */}
                {selectedPartnerId && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h4 className="text-2xs font-black text-gray-450 uppercase tracking-wider">
                      Gestión de Contacto Interna (Obligatoria)
                    </h4>

                    {!isContactConfirmed ? (
                      <div>
                        {!isNegotiating ? (
                          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-3xs text-amber-800 leading-normal space-y-2.5">
                            <p className="font-semibold">
                              Antes de pagar, debes contactar internamente al repartidor para verificar su disponibilidad inmediata en ruta.
                            </p>
                            <button
                              type="button"
                              onClick={handleStartNegotiation}
                              className="w-full bg-brand-blue hover:bg-brand-blue/95 text-white py-2 rounded-lg font-extrabold text-4xs uppercase tracking-widest cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Confirmar Disponibilidad con Repartidor
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-3 shadow-xs animate-pulse text-left">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              <span className="text-3xs font-black text-brand-blue uppercase">Canal de Despacho Interno</span>
                            </div>

                            <div className="space-y-2.5">
                              {negotiationStep >= 1 && (
                                <div className="text-3xs bg-gray-50 p-2 rounded-lg text-gray-600">
                                  <b>Sistema:</b> Solicitando confirmación de ruta a {selectedPartner?.name}...
                                </div>
                              )}
                              {negotiationStep >= 2 && (
                                <div className="text-3xs bg-gray-50 p-2 rounded-lg text-gray-600">
                                  <b>Sistema:</b> Compartiendo coordenadas hiperlocales de origen ({storeName}) y destino...
                                </div>
                              )}
                              {negotiationStep >= 3 && (
                                <div className="text-3xs bg-green-50 p-2 rounded-lg text-green-800 font-medium">
                                  <b>{selectedPartner?.name}:</b> "¡Hola! Sí, me encuentro libre y cerca de {storeName}. Acepto el despacho por la tarifa de ${selectedPartner?.fee} CLP. ¡Proceda con la compra!"
                                </div>
                              )}
                            </div>

                            {negotiationStep === 3 && (
                              <button
                                type="button"
                                onClick={handleAcceptNegotiation}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold uppercase text-4xs py-2 rounded-lg tracking-widest transition-all mt-2 cursor-pointer"
                              >
                                ✔️ Aceptar Confirmación e Integrar al Carro
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-250 p-3.5 rounded-xl text-3xs text-green-800 font-semibold flex items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">✔️</span>
                          <span>Envío confirmado internamente con {selectedPartner?.name}.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsContactConfirmed(false)}
                          className="text-[9px] text-red-650 hover:underline font-extrabold uppercase tracking-wide cursor-pointer"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Buyer Contact details */}
            <div>
              <h2 className="text-xs font-black text-brand-blue uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-gold text-white flex items-center justify-center text-3xs font-black">2</span>
                Información de Despacho / Contacto
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-2xs font-bold text-gray-400 uppercase mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-2xs font-bold text-gray-400 uppercase mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@gmail.com"
                    className="border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
                  />
                </div>
                
                {containsProduct && (
                  <div className="sm:col-span-2 flex flex-col">
                    <label className="text-2xs font-bold text-gray-400 uppercase mb-1.5">Dirección de Despacho (Solo para Envíos) *</label>
                    <input
                      type="text"
                      required={deliveryOption === 'private_delivery'}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Av. Providencia 1256, Depto 402, Santiago"
                      className="border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Credit Cards and billing fields */}
            <div>
              <h2 className="text-xs font-black text-brand-blue uppercase tracking-wider border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-gold text-white flex items-center justify-center text-3xs font-black">3</span>
                Pago Seguro (Simulado Stripe / MercadoPago)
              </h2>
              
              <div className="bg-gray-50 rounded-xl p-4.5 mb-4 border border-gray-200 flex items-start">
                <CreditCard className="w-5 h-5 text-brand-gold shrink-0 mr-3 mt-0.5" />
                <div>
                  <span className="block font-bold text-xs text-brand-blue">Diferenciador Omnicanal</span>
                  <p className="text-3xs text-gray-500 mt-1">
                    Nuestro sistema realiza una reserva atómica temporal del stock. Si confirmas este pago, se debitará un cobro directo en tarjeta de crédito.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-2xs font-bold text-gray-400 uppercase mb-1.5">Número de Tarjeta *</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    maxLength={19}
                    placeholder="4500 1234 5678 9012"
                    className="border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-2xs font-bold text-gray-400 uppercase mb-1.5">Expiración *</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/AA"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      maxLength={5}
                      className="border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden text-center"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-2xs font-bold text-gray-400 uppercase mb-1.5">Código CVV *</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="bg-red-50 text-red-800 text-xs p-4 rounded-xl border border-red-250 flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Colisión Concurrente o Falta de Confirmación</span>
                  <p className="text-3xs text-red-700/90 mt-1">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Stripe Verification Seals */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-3xs text-gray-400 font-semibold">
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-green-600 mr-1" /> Encriptación SSL de 256 bits
              </span>
              <span>Conforme estándares PCI-DSS</span>
            </div>

            {/* Trigger Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-brand-gold text-white font-extrabold uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-xs hover:bg-brand-gold/90 transition-all font-sans cursor-pointer text-xs ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting 
                ? 'Procesando Transacción Segura...' 
                : `Confirmar y Pagar $${finalTotal.toLocaleString('es-CL')} CLP`
              }
            </button>
          </form>

          {/* Cart Sidebar Preview grouped by store */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-2xs">
              <h2 className="text-xs font-black text-brand-blue uppercase tracking-wider mb-4 pb-3 border-b border-gray-100">
                Resumen de Compra
              </h2>

              {/* Grouping by Store label */}
              <div className="space-y-4">
                <div className="bg-gray-100/60 p-3 rounded-xl border border-gray-150">
                  <span className="text-[10px] uppercase font-black tracking-wider text-brand-blue block">
                    🏬 Comercio Emisor
                  </span>
                  <span className="text-xs font-bold text-gray-700 mt-0.5 block">{storeName}</span>
                </div>

                <ul className="divide-y divide-gray-150">
                  {cart.map((cartItem, i) => (
                    <li key={i} className="py-4 flex">
                      <img
                        src={cartItem.item.images[0]}
                        alt={cartItem.item.title}
                        className="w-14 h-14 object-cover rounded-xl border"
                      />
                      <div className="ml-3.5 flex-1 select-none text-left">
                        <span className="block text-xs font-bold text-brand-blue line-clamp-1">{cartItem.item.title}</span>
                        <span className="block text-3xs text-gray-400 uppercase tracking-widest font-bold mt-0.5">{cartItem.item.type}</span>
                        
                        {cartItem.bookingSchedule && (
                          <span className="inline-flex items-center text-3xs font-semibold text-amber-700 bg-amber-50 rounded-sm border border-amber-100 px-1 py-0.5 mt-1">
                            📅 {cartItem.bookingSchedule.date} a las {cartItem.bookingSchedule.timeSlot}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-black block text-gray-900">${cartItem.item.price.toLocaleString('es-CL')}</span>
                        <span className="text-3xs text-gray-400 block mt-0.5">Cant: {cartItem.quantity}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total calculations */}
              <div className="mt-4 pt-4 border-t border-gray-150 space-y-2 text-left">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Subtotal Productos</span>
                  <span className="font-mono text-gray-800">${cartTotal.toLocaleString('es-CL')} CLP</span>
                </div>
                
                {deliveryOption === 'private_delivery' && (
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Costo Despacho Privado</span>
                    <span className="font-mono text-amber-700 font-bold">+ ${deliveryFee.toLocaleString('es-CL')} CLP</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-900 font-black border-t border-dashed border-gray-200 pt-3">
                  <span>Total Neto</span>
                  <span className="font-mono text-base text-brand-blue font-black">${finalTotal.toLocaleString('es-CL')} CLP</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
