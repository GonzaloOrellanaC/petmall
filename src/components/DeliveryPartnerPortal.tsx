/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { usePetmallStore } from '../store.js';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { 
  Truck, MapPin, Star, User, Phone, Mail, CheckCircle, 
  Info, Navigation, ShieldCheck, ArrowRight, StarHalf, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AnyMap = Map as any;
const AnyOverlay = Overlay as any;

// Haversine helper to show how close they are to Santiago Centro (or selected store)
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

export default function DeliveryPartnerPortal() {
  const { deliveryPartners, registerDeliveryPartner, rateDeliveryPartner, isDemoMode } = usePetmallStore();

  const [activeTab, setActiveTab] = useState<'register' | 'list'>('list');

  // Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('Moto');
  const [fee, setFee] = useState('2000');
  const [coverageCenter, setCoverageCenter] = useState<[number, number]>([-33.4489, -70.6693]); // Santiago Centro default
  const [coverageRadius, setCoverageRadius] = useState<number>(10); // 10 km default

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.4489, -70.6693]);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Success states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Try to locate driver center
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCoverageCenter(coords);
          setMapCenter(coords);
        },
        (err) => console.log('Location access denied, defaulting to Santiago Center.')
      );
    }
  }, []);

  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    setCoverageCenter(latLng);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !fee) {
      setErrorMsg('Por favor completa todos los datos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await registerDeliveryPartner({
        name,
        email,
        phone,
        vehicle,
        fee: Number(fee),
        coverageCenter,
        coverageRadius
      });
      setSuccessMsg('¡Te has registrado exitosamente en la Red de Envíos Privados Petmall!');
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setFee('2000');
      // Go to list
      setTimeout(() => {
        setActiveTab('list');
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al inscribirse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId) return;

    try {
      await rateDeliveryPartner(selectedPartnerId, {
        rating: reviewRating,
        author: reviewAuthor || 'Cliente Anónimo',
        comment: reviewComment
      });
      setReviewSuccess('¡Tu evaluación ha sido registrada y el promedio se ha actualizado!');
      setReviewAuthor('');
      setReviewComment('');
      setReviewRating(5);
      setTimeout(() => setReviewSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al enviar evaluación.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-800 uppercase tracking-wider">
            🚚 Red Petmall Independiente
          </span>
          <h1 className="font-serif text-3xl font-black text-brand-blue tracking-tight leading-none">
            Portal de Envíos Privados
          </h1>
          <p className="text-gray-500 text-xs max-w-2xl font-medium">
            Inscríbete para entregar pedidos directamente desde las tiendas y veterinarias asociadas a Petmall usando tu propio vehículo (auto, moto o bicicleta). Define tu tarifa por servicio y tu área de cobertura.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-gray-100 rounded-xl p-1 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4.5 py-2 text-2xs font-extrabold uppercase tracking-wide rounded-lg transition-all ${
              activeTab === 'list'
                ? 'bg-white text-brand-blue shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Repartidores Activos
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-4.5 py-2 text-2xs font-extrabold uppercase tracking-wide rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-brand-blue shadow-xs'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inscribirse para Envíos
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'register' ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Form Column */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-150 p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-base font-serif font-black text-brand-blue flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-gold animate-bounce" /> Registro de Transportista
                </h2>
                <p className="text-3xs text-gray-400 uppercase font-black mt-1 tracking-wider">
                  Ingresa tus datos y tarifa preferente
                </p>
              </div>

              {successMsg && (
                <div className="bg-green-50 border border-green-150 text-green-800 text-xs p-4 rounded-xl flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Inscripción Exitosa</span>
                    <p className="text-3xs text-green-700/90 mt-1">{successMsg}</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-150 text-red-800 text-xs p-4 rounded-xl">
                  <span className="font-bold">Error</span>
                  <p className="text-3xs text-red-750/90 mt-1">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-3xs font-bold text-gray-400 uppercase mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Claudio Sepúlveda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-3xs font-bold text-gray-400 uppercase mb-1.5">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="claudio@envios.cl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-3xs font-bold text-gray-400 uppercase mb-1.5">Teléfono Movil *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+56 9 1234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-3xs font-bold text-gray-400 uppercase mb-1.5">Tipo de Vehículo</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden bg-white"
                    >
                      <option value="Bicicleta">🚲 Bicicleta</option>
                      <option value="Moto">🏍️ Moto</option>
                      <option value="Auto">🚗 Auto</option>
                      <option value="Furgón">🚐 Furgón</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-3xs font-bold text-gray-400 uppercase mb-1.5">Tarifa Ofrecida (CLP / Envío) *</label>
                    <input
                      type="number"
                      required
                      min="500"
                      step="100"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      placeholder="e.g. 2500"
                      className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-3xs font-bold text-gray-400 uppercase">Radio de Cobertura</label>
                    <span className="font-mono text-2xs font-black text-brand-blue">{coverageRadius} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={coverageRadius}
                    onChange={(e) => setCoverageRadius(Number(e.target.value))}
                    className="h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-gold"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 leading-normal">
                    La cobertura se proyecta desde el centro de mapa que selecciones a la derecha.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-brand-gold text-white font-semibold py-3 px-6 rounded-xl hover:bg-brand-gold/90 transition-all font-sans cursor-pointer text-xs uppercase tracking-wider font-black shadow-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Guardando Registro...' : 'Registrar Mi Cuenta de Repartidor'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Map Column */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-150 p-6 md:p-8 flex flex-col space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Asignación de Área en Mapa
                </h3>
                <p className="text-3xs text-gray-400 mt-1">
                  Haz clic en el mapa para marcar tu hogar/centro de operaciones. Esto definirá de forma exacta tu zona de envíos.
                </p>
              </div>

              <div className="flex-1 min-h-[350px] bg-slate-50 border border-gray-150 rounded-2xl overflow-hidden relative shadow-inner">
                <AnyMap
                  height={380}
                  center={mapCenter}
                  zoom={mapZoom}
                  onBoundsChanged={({ center, zoom }: any) => {
                    setMapCenter(center);
                    setMapZoom(zoom);
                  }}
                  onClick={handleMapClick}
                >
                  {/* Driver center marker */}
                  <AnyOverlay anchor={coverageCenter}>
                    <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
                      <div className="bg-brand-gold text-brand-blue font-black rounded-full px-3 py-1 text-[10px] border border-white shadow-md flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                        <span>Mi Centro ({coverageRadius} km)</span>
                      </div>
                      <div className="w-2.5 h-2.5 rotate-45 transform -translate-y-[5px] bg-brand-gold border-b border-r border-white" />
                    </div>
                  </AnyOverlay>
                </AnyMap>

                {/* Geolocation visual info overlay */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-xl border border-gray-150 text-[10px] font-semibold text-gray-650 max-w-xs space-y-1 shadow-sm">
                  <div className="text-brand-blue font-black text-2xs uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Coordenadas de Zona
                  </div>
                  <div>Latitud: <span className="font-mono text-gray-900 font-bold">{coverageCenter[0].toFixed(5)}</span></div>
                  <div>Longitud: <span className="font-mono text-gray-900 font-bold">{coverageCenter[1].toFixed(5)}</span></div>
                  <div className="text-green-700 text-3xs font-extrabold leading-tight mt-1 bg-green-50 rounded px-1.5 py-0.5">
                    Cualquier tienda y dirección de comprador a menos de {coverageRadius} km de este punto califica para tus ofertas de despacho.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Partners list Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-2xs">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                  <div>
                    <h2 className="text-base font-serif font-black text-brand-blue">
                      Conductores Inscritos
                    </h2>
                    <p className="text-3xs text-gray-400 uppercase tracking-widest mt-1 font-black">
                      Disponibilidad e historial de valoraciones
                    </p>
                  </div>
                  <span className="bg-brand-blue/5 text-brand-blue px-3 py-1 rounded-full text-3xs font-black uppercase tracking-wider">
                    {deliveryPartners.length} Activos
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {deliveryPartners.map((dp) => (
                    <div 
                      key={dp.id} 
                      onClick={() => {
                        setSelectedPartnerId(dp.id);
                        setMapCenter(dp.coverageCenter);
                        setMapZoom(12);
                      }}
                      className={`py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 px-3 rounded-2xl transition-all border ${
                        selectedPartnerId === dp.id 
                          ? 'border-brand-gold/45 bg-amber-50/20 shadow-xs' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-gray-150 flex items-center justify-center text-slate-600 shrink-0">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm text-brand-blue">{dp.name}</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded">
                              {dp.vehicle}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="flex items-center text-amber-500 font-extrabold gap-0.5">
                              ⭐ {dp.rating}
                            </span>
                            <span className="text-gray-400 text-3xs font-medium">
                              ({dp.ratingsCount || 0} calificaciones)
                            </span>
                            <span className="text-gray-350 select-none">•</span>
                            <span className="text-gray-500 text-[10px] font-semibold">
                              Radio: {dp.coverageRadius} km
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-3xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {dp.phone}</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {dp.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-2xs font-extrabold text-gray-400 uppercase tracking-wider">Tarifa</span>
                        <span className="text-sm font-mono font-black text-green-700">
                          ${dp.fee.toLocaleString('es-CL')} CLP
                        </span>
                        <span className="block text-[8px] text-gray-400 leading-none mt-1 font-semibold">
                          Por entrega hiperlocal
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Partner Details and Map Coverage View Column */}
            <div className="lg:col-span-5 space-y-6">
              {selectedPartnerId ? (() => {
                const partner = deliveryPartners.find(dp => dp.id === selectedPartnerId);
                if (!partner) return <div className="bg-white p-6 rounded-3xl text-center">Selecciona un repartidor de la lista</div>;

                return (
                  <>
                    {/* Visual Coverage Area Map */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-3xs font-black uppercase text-brand-gold tracking-widest">Cobertura en Mapa</span>
                          <h3 className="text-xs font-serif font-black text-brand-blue">
                            Área de Despachos de {partner.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono bg-green-50 text-green-700 font-extrabold px-2 py-0.5 rounded">
                          {partner.coverageRadius} km de cobertura
                        </span>
                      </div>

                      <div className="h-[200px] bg-slate-50 border border-gray-150 rounded-xl overflow-hidden relative">
                        <AnyMap
                          height={200}
                          center={[partner.coverageCenter[0], partner.coverageCenter[1]]}
                          zoom={11}
                        >
                          <AnyOverlay anchor={[partner.coverageCenter[0], partner.coverageCenter[1]]}>
                            <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
                              <div className="bg-indigo-650 text-white font-bold rounded px-2.5 py-0.5 text-3xs flex items-center gap-1 shadow">
                                <Truck className="w-3 h-3 text-amber-300" />
                                <span>{partner.name}</span>
                              </div>
                              <div className="w-1.5 h-1.5 rotate-45 transform -translate-y-[4px] bg-indigo-650" />
                            </div>
                          </AnyOverlay>
                        </AnyMap>
                      </div>
                    </div>

                    {/* Evaluations / Leave a review block */}
                    <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-2xs space-y-4">
                      <div className="border-b border-gray-100 pb-3">
                        <span className="block text-3xs font-black uppercase text-brand-gold tracking-widest">Reputación & Valoraciones</span>
                        <h3 className="text-xs font-serif font-black text-brand-blue">
                          Comentarios del Servicio
                        </h3>
                      </div>

                      {/* Display comments */}
                      <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                        {!partner.reviews || partner.reviews.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-3xs">
                            Este transportista no tiene valoraciones todavía. ¡Sé el primero en calificarlo en tu próxima compra!
                          </div>
                        ) : (
                          partner.reviews.map((rev, idx) => (
                            <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-gray-100 space-y-1.5">
                              <div className="flex justify-between text-3xs font-bold">
                                <span className="text-brand-blue">{rev.author}</span>
                                <span className="text-gray-400 font-mono">{rev.date}</span>
                              </div>
                              <div className="flex text-[10px] text-amber-500 font-extrabold gap-0.5">
                                {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                              </div>
                              <p className="text-[10px] text-gray-600 leading-normal font-medium italic">
                                "{rev.comment}"
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Interactive sandbox review form */}
                      <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-3.5 pt-4">
                        <span className="block text-[10px] font-extrabold text-brand-blue uppercase tracking-wide">
                          📝 Test Sandbox: Añadir Evaluación Directa
                        </span>

                        {reviewSuccess && (
                          <div className="p-2 bg-green-50 text-green-800 text-[10px] rounded font-semibold border border-green-100">
                            {reviewSuccess}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1">Nombre</label>
                            <input
                              type="text"
                              required
                              placeholder="Tu Nombre"
                              value={reviewAuthor}
                              onChange={(e) => setReviewAuthor(e.target.value)}
                              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] bg-white outline-hidden focus:ring-1 focus:ring-brand-gold"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[9px] font-black text-gray-400 uppercase mb-1">Calificación</label>
                            <select
                              value={reviewRating}
                              onChange={(e) => setReviewRating(Number(e.target.value))}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] bg-white outline-hidden"
                            >
                              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                              <option value="4">⭐⭐⭐⭐ (4)</option>
                              <option value="3">⭐⭐⭐ (3)</option>
                              <option value="2">⭐⭐ (2)</option>
                              <option value="1">⭐ (1)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[9px] font-black text-gray-400 uppercase mb-1">Comentario</label>
                          <textarea
                            required
                            placeholder="Comentario sobre el servicio, trato y velocidad de entrega..."
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px] bg-white outline-hidden focus:ring-1 focus:ring-brand-gold resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-1.5 rounded-lg text-3xs uppercase tracking-wider"
                        >
                          Enviar Calificación de Prueba
                        </button>
                      </form>
                    </div>
                  </>
                );
              })() : (
                <div className="bg-white rounded-3xl border border-gray-150 p-8 text-center text-gray-400 text-xs shadow-2xs">
                  <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-serif font-black text-brand-blue text-sm mb-1">
                    Información Detallada de Envíos
                  </p>
                  <p className="text-3xs text-gray-400 max-w-xs mx-auto leading-normal">
                    Selecciona un repartidor de la lista de la izquierda para ver su mapa de cobertura y el historial completo de valoraciones.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
