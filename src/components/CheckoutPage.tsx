/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { ShoppingCart, CreditCard, ShieldCheck, MapPin, Truck, CalendarCheck, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, currentStore, submitCheckout, clearCart } = usePetmallStore();
  const navigate = useNavigate();

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

  const handleProcessPyment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setErrorMsg('Por favor completa los campos obligatorios de identificación.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Dispatch securely to Express checkout with transaction safety block!
      const res = await submitCheckout(orderType);
      
      if (res.success) {
        setConfirmedOrder(res.order);
      }
    } catch (err: any) {
      console.error('[Checkout error]', err);
      setErrorMsg(err.message || 'La venta física o digital concurrente ha colisionado o stock es insuficiente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-150 p-8 shadow-md flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-5">
            <CheckCircle className="w-9 h-9" />
          </div>
          
          <h1 className="font-serif text-3xl font-bold text-brand-blue tracking-tight">
            ¡Pago Procesado Exitosamente!
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Tu transacción hiperlocal ha sido validada en tiempo real.
          </p>

          <div className="w-full bg-gray-50 rounded-xl p-5 border border-gray-100 my-6 text-left space-y-3.5">
            <div className="flex justify-between items-center text-xs font-medium border-b border-gray-200 pb-3">
              <span className="text-gray-400">ID de Pedido</span>
              <span className="font-mono text-brand-blue font-bold">{confirmedOrder.id}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Monto Cobrado</span>
              <span className="font-mono text-gray-900 font-extrabold">${confirmedOrder.total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Métodos de Despacho</span>
              <span className="font-bold text-green-700 capitalize">
                {confirmedOrder.orderType === 'SERVICE_BOOKING' ? 'Reserva de Cita' : 'Envío Express 1-3 hrs'}
              </span>
            </div>

            <div className="bg-green-50 rounded-lg p-3 text-2xs text-green-800 border border-green-100 leading-relaxed font-semibold">
              ⚠️ El stock físico del POS de la tienda '{currentStore?.name}' ha sido reducido y sincronizado instantáneamente para evitar cualquier venta duplicada en local.
            </div>
          </div>

          <div className="flex space-x-4 w-full">
            <button
              onClick={() => {
                clearCart();
                navigate('/');
              }}
              className="flex-1 bg-brand-blue text-white py-3 rounded-lg font-semibold hover:bg-brand-blue/90 cursor-pointer transition-all focus:outline-hidden text-xs"
            >
              Volver al Inicio
            </button>
            <button
              onClick={() => {
                clearCart();
                navigate('/admin/dashboard');
              }}
              className="flex-1 border border-brand-blue text-brand-blue py-3 rounded-lg font-semibold hover:bg-gray-50 cursor-pointer transition-all focus:outline-hidden text-xs"
            >
              Ir a Panel Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-serif text-3xl font-extrabold text-brand-blue tracking-tight mb-8">
        Pasarela de Pagos Segura
      </h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed text-center py-16">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No tienes productos en la cola de checkout.</p>
          <button onClick={() => navigate('/')} className="mt-4 bg-brand-gold text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-brand-gold/90 transition-all cursor-pointer">
            Volver a vitrina
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Checkout forms */}
          <form onSubmit={handleProcessPyment} className="lg:col-span-7 bg-white rounded-xl border border-gray-150 p-6 sm:p-8 space-y-6">
            
            {/* Delivery address */}
            <div>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                1. Información de Despacho / Contacto
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
                      required
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
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                2. Pago Seguro (Simulado Stripe / MercadoPago)
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
                  <span className="font-bold block">Colisión Concurrente de Stock Detectada</span>
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
              className={`w-full bg-brand-gold text-white font-semibold py-3 px-6 rounded-lg shadow-xs hover:bg-brand-gold/90 transition-all font-sans cursor-pointer text-xs ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Procesando Transacción Segura...' : `Confirmar y Pagar $${cartTotal.toFixed(2)}`}
            </button>
          </form>

          {/* Cart Sidebar Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-gray-150 p-6 shadow-2xs">
              <h2 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 pb-3 border-b border-gray-100">
                Resumen de Compra
              </h2>

              <ul className="divide-y divide-gray-150">
                {cart.map((cartItem, i) => (
                  <li key={i} className="py-4 flex">
                    <img
                      src={cartItem.item.images[0]}
                      alt={cartItem.item.title}
                      className="w-14 h-14 object-cover rounded-md border"
                    />
                    <div className="ml-3.5 flex-1 select-none">
                      <span className="block text-xs font-bold text-brand-blue line-clamp-1">{cartItem.item.title}</span>
                      <span className="block text-3xs text-gray-400 capitalize">{cartItem.item.type.toLowerCase()}</span>
                      
                      {cartItem.bookingSchedule && (
                        <span className="inline-flex items-center text-3xs font-semibold text-amber-700 bg-amber-50 rounded-sm border border-amber-100 px-1 py-0.5 mt-1">
                          📅 {cartItem.bookingSchedule.date} a las {cartItem.bookingSchedule.timeSlot}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold block text-gray-900">${(cartItem.item.price * cartItem.quantity).toFixed(2)}</span>
                      <span className="text-3xs text-gray-400 block mt-0.5">Cant: {cartItem.quantity}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Total calculations */}
              <div className="mt-4 pt-4 border-t border-gray-150 space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono text-gray-800">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Costo Despacho</span>
                  <span className="font-mono text-green-700 font-bold">GRATIS</span>
                </div>
                <div className="flex justify-between text-sm text-gray-900 font-extrabold border-t border-dashed border-gray-200 pt-3">
                  <span>Total Estimado</span>
                  <span className="font-mono text-base text-brand-blue font-black">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
