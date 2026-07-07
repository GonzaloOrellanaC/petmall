/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { MapPin, Sliders, X, Heart, Sparkles, AlertCircle, CheckCircle, Info, Navigation, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AnyMap = Map as any;
const AnyOverlay = Overlay as any;

// Distance calculation helper (Haversine formula)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function NearbyAdoptions() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number }>({
    lat: -33.4489,
    lng: -70.6693, // Santiago Center, Chile default
  });
  const [isCustomLocation, setIsCustomLocation] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(10); // 10 km default
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // Map control states in modal
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.4489, -70.6693]);
  const [mapZoom, setMapZoom] = useState<number>(11);

  // Adoption interest form states
  const [contactPet, setContactPet] = useState<any | null>(null);
  const [contactName, setContactName] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactMessage, setContactMessage] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Fetch adoption pets on mount
  useEffect(() => {
    fetch('/api/platform/adoption')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Error al obtener mascotas');
      })
      .then((data) => {
        setPets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching adoption pets:', err);
        setLoading(false);
      });
  }, []);

  // Try to find actual device location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setDeviceLocation(coords);
          setMapCenter([coords.lat, coords.lng]);
        },
        (error) => {
          console.warn('Permiso denegado de geolocalización o fallo. Usando Santiago, Chile:', error);
        }
      );
    }
  }, []);

  // Update map center when device location changes
  useEffect(() => {
    setMapCenter([deviceLocation.lat, deviceLocation.lng]);
  }, [deviceLocation]);

  // Handle map interaction to change device location or mock center
  const handleMapClick = ({ latLng }: { latLng: [number, number] }) => {
    setDeviceLocation({ lat: latLng[0], lng: latLng[1] });
    setIsCustomLocation(true);
  };

  // Reset location to original device location
  const handleResetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsCustomLocation(false);
        },
        () => {
          setDeviceLocation({ lat: -33.4489, lng: -70.6693 });
          setIsCustomLocation(false);
        }
      );
    } else {
      setDeviceLocation({ lat: -33.4489, lng: -70.6693 });
      setIsCustomLocation(false);
    }
  };

  // Process pets with distance and inside-status
  const petsWithDistance = pets.map((pet) => {
    // If pet does not have lat/lng, assign standard Santiago coordinates
    const petLat = pet.lat !== undefined ? pet.lat : -33.4489;
    const petLng = pet.lng !== undefined ? pet.lng : -70.6693;
    const distance = calculateDistance(deviceLocation.lat, deviceLocation.lng, petLat, petLng);
    return {
      ...pet,
      lat: petLat,
      lng: petLng,
      distance,
      isNearby: distance <= radiusKm,
    };
  });

  // Sort pets: nearest first
  const sortedPets = [...petsWithDistance].sort((a, b) => a.distance - b.distance);

  // Filtered list based on the active radius
  const nearbyPets = sortedPets.filter((pet) => pet.isNearby);

  // Web Mercator formula for circle overlay size in pixels
  const getCircleDiameter = (zoom: number, latitude: number, radiusInKm: number): number => {
    const metersPerPixel = (156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
    const radiusInMeters = radiusInKm * 1000;
    return (2 * radiusInMeters) / metersPerPixel;
  };

  const circleDiameter = getCircleDiameter(mapZoom, deviceLocation.lat, radiusKm);

  const handleInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactPhone) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setContactPet(null);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
      alert(`✓ Solicitud de adopción enviada con éxito para ${contactPet?.name}. ¡La fundación se contactará contigo pronto!`);
    }, 1500);
  };

  // Format distance cleanly
  const formatDistanceLabel = (dist: number) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)} m`;
    }
    return `${dist.toFixed(1)} km`;
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner/Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 uppercase tracking-widest border border-rose-100">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" /> Adopción Georeferenciada
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#102948] tracking-tight">
              Mascotas en Adopción Cercanas
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl">
              Busca y filtra animales que necesitan un hogar en base a tu ubicación actual en tiempo real. 
              Por defecto mostramos mascotas en un <b>radio de 10 km</b>. ¡Ajusta el rango para expandir tu búsqueda!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Quick Distance Status */}
            <div className="bg-slate-50 border border-gray-200 px-4 py-2.5 rounded-2xl flex flex-col text-left shrink-0">
              <span className="text-[10px] text-gray-400 font-mono font-bold uppercase leading-none">Rango Actual:</span>
              <span className="text-base font-black text-indigo-900 mt-1 leading-none font-mono">
                {formatDistanceLabel(radiusKm)}
              </span>
            </div>

            {/* Config Button */}
            <button
              onClick={() => {
                setIsModalOpen(true);
                // Pre-center map around device position
                setMapCenter([deviceLocation.lat, deviceLocation.lng]);
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              <Sliders className="w-4 h-4" />
              Ajustar Distancia & Mapa
            </button>
          </div>
        </div>

        {/* Location alert if custom location chosen */}
        {isCustomLocation && (
          <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-2xl text-xs text-amber-800 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Estás visualizando mascotas cerca de un <b>punto personalizado</b> en el mapa.
              </span>
            </div>
            <button
              onClick={handleResetLocation}
              className="text-amber-900 font-extrabold underline hover:text-amber-950 uppercase text-[10px] tracking-wider cursor-pointer font-mono"
            >
              Reestablecer a mi ubicación real
            </button>
          </div>
        )}

        {/* Main Grid: Info + Cards */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-150">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4">Buscando rescatados en tu zona...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-sm font-sans font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                🐾 Mascotas Disponibles ({nearbyPets.length})
              </h2>
              <span className="text-3xs font-mono font-bold text-gray-400 uppercase">
                Ubicación base: [{deviceLocation.lat.toFixed(4)}, {deviceLocation.lng.toFixed(4)}]
              </span>
            </div>

            {nearbyPets.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto">
                  <Heart className="w-8 h-8 fill-rose-100" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-brand-blue">No encontramos mascotas a {formatDistanceLabel(radiusKm)}</h3>
                  <p className="text-xs text-gray-400">
                    Aumenta el radio de cobertura a 20 km, 50 km o más usando el selector de distancia para encontrar fundaciones en comunas vecinas.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black uppercase rounded-xl border border-indigo-100 cursor-pointer"
                >
                  Cambiar Distancia de Búsqueda
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {nearbyPets.map((pet) => (
                  <div
                    key={pet.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-150 hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Image header */}
                      <div className="h-44 bg-gray-100 relative">
                        <img
                          src={pet.imageUrl}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                          {pet.type}
                        </div>
                        {/* Distance tag */}
                        <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-3xs text-white text-[10px] font-mono font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-brand-gold rotate-45" />
                          a {formatDistanceLabel(pet.distance)}
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-black text-brand-blue">{pet.name}</h3>
                            <span className="text-[10px] text-gray-450 font-mono font-bold uppercase">{pet.breed} • {pet.age}</span>
                          </div>
                          <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm">
                            {pet.healthStatus}
                          </span>
                        </div>

                        <p className="text-4xs text-gray-500 leading-normal line-clamp-2">
                          {pet.description || 'Sin descripción adicional. Contáctanos para conocer más de este bello rescatado.'}
                        </p>

                        <div className="pt-2 border-t border-gray-50 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-[10px]">
                            🏢
                          </div>
                          <span className="text-3xs text-[#cdaf7a] font-extrabold uppercase tracking-wide">
                            {pet.foundation}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => setContactPet(pet)}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl font-sans text-3xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer text-center"
                      >
                        Adoptar a {pet.name}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Informational banner about how adoptions help */}
        <div className="bg-gradient-to-r from-[#102948] to-[#1a3d69] rounded-3xl p-6 sm:p-8 text-white text-left relative overflow-hidden shadow-sm border border-blue-950">
          <div className="relative z-10 max-w-3xl space-y-3">
            <h3 className="text-lg sm:text-xl font-serif font-black text-brand-gold">
              Alianza Petmall por la Tenencia Responsable de Mascotas
            </h3>
            <p className="text-4xs text-slate-250 leading-relaxed">
              Todos los perritos y gatitos listados aquí pertenecen a fundaciones sin fines de lucro asociadas a Petmall Chile. 
              Garantizamos alojamiento publicitario 100% gratuito en nuestro ERP SaaS para promover el bienestar de animales abandonados. 
              Al adoptar, recibes un <b>cupón de 20% de descuento</b> en alimentos naturales en cualquiera de nuestras tiendas socias durante los primeros 3 meses.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <Heart className="w-80 h-80 fill-white" />
          </div>
        </div>

      </div>

      {/* --- 1. MODAL: RADIUS SELECTOR & GEOLOCATION MAP --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 text-left shadow-xl border border-gray-150 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="space-y-0.5">
                  <h3 className="text-base font-sans font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-5 h-5 text-indigo-600 animate-bounce" /> Cobertura y Distancia de Adopción
                  </h3>
                  <p className="text-4xs text-gray-450">
                    Arrastra el control de distancia o haz clic en el mapa para simular tu ubicación.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-650 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slider Controller block */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider">
                    Distancia máxima de búsqueda:
                  </label>
                  <span className="text-sm font-mono font-black text-indigo-700 bg-white border border-indigo-150 px-2.5 py-1 rounded-lg">
                    {formatDistanceLabel(radiusKm)}
                  </span>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="0.5"
                    max="200"
                    step={radiusKm < 10 ? '0.5' : '1'}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                  />
                  <div className="flex justify-between text-[9px] font-mono font-bold text-gray-400">
                    <span>500 m (Mínimo)</span>
                    <span>10 km</span>
                    <span>50 km</span>
                    <span>100 km</span>
                    <span>200 km (Máximo)</span>
                  </div>
                </div>
              </div>

              {/* Map Canvas Frame */}
              <div className="relative w-full h-[360px] bg-slate-900 rounded-2xl overflow-hidden border border-gray-150 shadow-inner">
                <AnyMap
                  center={mapCenter}
                  zoom={mapZoom}
                  onBoundsChanged={({ center, zoom }: { center: [number, number]; zoom: number }) => {
                    setMapCenter(center);
                    setMapZoom(zoom);
                  }}
                  onClick={handleMapClick}
                  height={360}
                >
                  {/* Area radius circle centered exactly on user coordinates */}
                  <AnyOverlay anchor={[deviceLocation.lat, deviceLocation.lng]}>
                    <div
                      className="absolute border border-rose-500 bg-rose-500/15 rounded-full pointer-events-none transition-all duration-100 flex items-center justify-center"
                      style={{
                        width: `${circleDiameter}px`,
                        height: `${circleDiameter}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Inside/center dot indicator */}
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white animate-pulse" />
                    </div>
                  </AnyOverlay>

                  {/* Device location description overlay */}
                  <AnyOverlay anchor={[deviceLocation.lat, deviceLocation.lng]}>
                    <div className="absolute -translate-x-1/2 -translate-y-9 bg-slate-900/90 backdrop-blur-3xs border border-brand-gold text-white text-[9px] font-sans px-2 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none font-extrabold select-none z-40">
                      📍 Mi Ubicación ({formatDistanceLabel(radiusKm)} Radio)
                    </div>
                  </AnyOverlay>

                  {/* Render Pets as Map markers */}
                  {petsWithDistance.map((pet) => {
                    const isInside = pet.distance <= radiusKm;
                    return (
                      <AnyOverlay key={pet.id} anchor={[pet.lat, pet.lng]}>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`${pet.name} (${pet.breed})\nFundación: ${pet.foundation}\nDistancia: ${formatDistanceLabel(pet.distance)}`);
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-full px-2 py-1.5 rounded-lg shadow-md border cursor-pointer select-none transition-all duration-300 flex flex-col items-center gap-0.5 whitespace-nowrap font-mono text-[9px] font-extrabold ${
                            isInside
                              ? 'bg-emerald-650 border-emerald-500 text-white z-30 scale-105'
                              : 'bg-slate-300 border-slate-400 text-slate-700 z-10 opacity-75'
                          }`}
                        >
                          <span>{pet.type === 'Perro' ? '🐶' : '🐱'} {pet.name}</span>
                          <span className="text-[8px] opacity-90">({formatDistanceLabel(pet.distance)})</span>
                        </div>
                      </AnyOverlay>
                    );
                  })}
                </AnyMap>

                {/* Map Helpers floating UI */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-3xs border border-gray-200 p-2.5 rounded-xl text-[9px] font-sans font-bold space-y-1 text-[#102948] shadow-md max-w-[200px] text-left">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold">
                    <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Guía del Mapa</span>
                  </div>
                  <p className="text-4xs leading-normal font-medium text-gray-500">
                    El círculo rojo representa la zona de cobertura. Las mascotas en verde están <b>dentro</b> de tu rango y se listarán abajo.
                  </p>
                  <div className="pt-1.5 border-t border-gray-100 flex flex-col gap-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Dentro de rango</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> Fuera de rango</span>
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-4xs text-gray-400 font-medium">
                  Se muestran <b>{nearbyPets.length}</b> de un total de <b>{pets.length}</b> mascotas en el sistema.
                </span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-brand-blue hover:bg-opacity-95 text-brand-gold text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Aplicar Cobertura
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 2. MODAL: ADOPTION REQUEST FORM --- */}
      <AnimatePresence>
        {contactPet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-left shadow-xl border border-gray-150 relative"
            >
              <button
                onClick={() => setContactPet(null)}
                className="absolute top-4 right-4 text-gray-450 hover:text-gray-700 p-1"
              >
                ✕
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-rose-100">
                    <img src={contactPet.imageUrl} alt={contactPet.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-3xs font-black text-rose-600 uppercase tracking-widest block font-mono">Formulario de Adopción</span>
                    <h3 className="text-base font-serif font-black text-[#102948] leading-tight">Postular para adoptar a {contactPet.name}</h3>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-left space-y-1">
                  <span className="block text-[10px] font-mono font-black text-rose-800 uppercase leading-none">Fundación Administradora:</span>
                  <span className="block text-xs font-bold text-rose-950">{contactPet.foundation}</span>
                  <span className="block text-[9px] text-rose-700 font-medium">Ubicada a {formatDistanceLabel(contactPet.distance)} de tu ubicación.</span>
                </div>

                <form onSubmit={handleInterestSubmit} className="space-y-3">
                  <div>
                    <label className="block text-3xs font-extrabold text-[#102948] uppercase tracking-wider mb-1 font-mono">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3.5 py-2 border border-gray-250 rounded-xl text-xs placeholder-gray-450 focus:outline-hidden focus:border-rose-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-3xs font-extrabold text-[#102948] uppercase tracking-wider mb-1 font-mono">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full px-3.5 py-2 border border-gray-250 rounded-xl text-xs placeholder-gray-450 focus:outline-hidden focus:border-rose-300"
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-extrabold text-[#102948] uppercase tracking-wider mb-1 font-mono">Teléfono de Contacto *</label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+56 9 1234 5678"
                        className="w-full px-3.5 py-2 border border-gray-250 rounded-xl text-xs placeholder-gray-450 focus:outline-hidden focus:border-rose-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-3xs font-extrabold text-[#102948] uppercase tracking-wider mb-1 font-mono">Mensaje o Motivo de Adopción (Opcional)</label>
                    <textarea
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Cuéntanos brevemente sobre tu hogar, experiencia con mascotas y por qué quieres adoptar a este peludito..."
                      className="w-full px-3.5 py-2 border border-gray-250 rounded-xl text-xs placeholder-gray-450 focus:outline-hidden focus:border-rose-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitted}
                    className="w-full py-3 bg-rose-650 hover:bg-rose-700 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer mt-2 text-center transition-all disabled:opacity-50"
                  >
                    {isSubmitted ? 'Enviando solicitud...' : 'Enviar Solicitud de Adopción ❤️'}
                  </button>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
