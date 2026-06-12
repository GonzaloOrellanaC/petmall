/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { Heart, Search, MapPin, Sparkles, Filter, ChevronDown, Check, X, ArrowRight, Building2, Compass } from 'lucide-react';
import { Map, Marker, Overlay } from 'pigeon-maps';
const AnyMap = Map as any;
const AnyOverlay = Overlay as any;
import { CatalogItem } from '../types.js';
import { motion, AnimatePresence } from 'motion/react';

// SwiperJS Core and Modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// SwiperJS styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function MarketplaceHome() {
  const { catalog, fetchCatalog, stores, fetchStores, addToCart, isDemoMode } = usePetmallStore();
  const navigate = useNavigate();

  // Filter stores based on demo mode:
  // on "/" (isDemoMode === false), show only stores without demo or demo === false
  // on "/demo" (isDemoMode === true), show only stores with demo === true
  const filteredStores = (stores || []).filter(st => {
    const isDemoStore = !!st.demo;
    return isDemoMode ? isDemoStore : !isDemoStore;
  });

  // Filter catalog items to only show those belonging to the currently allowed stores
  const allowedStoreIds = new Set(filteredStores.map(st => st.id));
  const filteredByStoreCatalog = (catalog || []).filter(item => allowedStoreIds.has(item.storeId));

  // Filters state with sessionStorage restore capabilities
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    return sessionStorage.getItem('mph_selectedCategory') || null;
  });
  const [distance, setDistance] = useState<number>(() => {
    const raw = sessionStorage.getItem('mph_distance');
    return raw ? parseInt(raw, 10) : 15;
  });
  const [selectedType, setSelectedType] = useState<'ALL' | 'PRODUCT' | 'SERVICE'>(() => {
    return (sessionStorage.getItem('mph_selectedType') as any) || 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('mph_searchQuery') || '';
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(() => {
    return (sessionStorage.getItem('mph_viewMode') as any) || 'grid';
  });
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(() => {
    return sessionStorage.getItem('mph_selectedStoreId') || null;
  });
  const [mapStyle, setMapStyle] = useState<'political' | 'satellite'>(() => {
    return (sessionStorage.getItem('mph_mapStyle') as any) || 'political';
  });

  // Persist states to sessionStorage
  useEffect(() => {
    if (selectedCategory) {
      sessionStorage.setItem('mph_selectedCategory', selectedCategory);
    } else {
      sessionStorage.removeItem('mph_selectedCategory');
    }
  }, [selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem('mph_distance', distance.toString());
  }, [distance]);

  useEffect(() => {
    sessionStorage.setItem('mph_selectedType', selectedType);
  }, [selectedType]);

  useEffect(() => {
    sessionStorage.setItem('mph_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('mph_viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (selectedStoreId) {
      sessionStorage.setItem('mph_selectedStoreId', selectedStoreId);
    } else {
      sessionStorage.removeItem('mph_selectedStoreId');
    }
  }, [selectedStoreId]);

  useEffect(() => {
    sessionStorage.setItem('mph_mapStyle', mapStyle);
  }, [mapStyle]);

  // Reset selectedStoreId if it doesn't belong to the current list of filteredStores
  useEffect(() => {
    if (selectedStoreId) {
      const exists = filteredStores.some(s => s.id === selectedStoreId);
      if (!exists) {
        setSelectedStoreId(null);
      }
    }
  }, [filteredStores, selectedStoreId]);

  const mapTileProvider = (x: number, y: number, z: number, dpr?: number) => {
    if (mapStyle === 'satellite') {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  };

  // Coordinate bounds for SF Map scaling
  const latMin = 37.75;
  const latMax = 37.80;
  const lngMin = -122.44;
  const lngMax = -122.39;

  const getCoordinatesPct = (store: any) => {
    const coords = store.geolocation?.coordinates;
    if (!coords || coords.length < 2) return { x: 50, y: 50 };
    const [lng, lat] = coords;
    
    // Scale longitude to percentage X (0 to 100)
    let x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    // Scale latitude to percentage Y (0 to 100, reversed because top is 0 in CSS)
    let y = (1 - (lat - latMin) / (latMax - latMin)) * 100;
    
    // Safety bounds
    x = Math.max(8, Math.min(92, x));
    y = Math.max(8, Math.min(92, y));
    return { x, y };
  };

  // Pagination & infinite scroll state
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset limit when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, selectedType, searchQuery, distance]);

  // Handle dynamic infinite scroll fetching on scroll down + saving current scroll position for restoration
  useEffect(() => {
    const handleScroll = () => {
      const threshold = 150; // px near bottom to trigger
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.innerHeight + window.scrollY;

      if (totalHeight - scrollPosition < threshold) {
        setVisibleCount(prev => prev + 9);
      }

      // Save non-zero positions to recover state upon navigating back
      if (window.scrollY > 15) {
        sessionStorage.setItem('mph_scrollPosition', window.scrollY.toString());
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Category list based on items
  const categories = ['Alimento Barf', 'Salud Natural', 'Vegano', 'Paseadores', 'Veterinarios'];

  useEffect(() => {
    fetchCatalog();
    fetchStores();
  }, []);

  // Restore scroll position back to its correct level when returning
  useEffect(() => {
    if ((catalog || []).length > 0 && (stores || []).length > 0) {
      const savedScroll = sessionStorage.getItem('mph_scrollPosition');
      if (savedScroll) {
        const parsed = parseInt(savedScroll, 10);
        if (parsed > 0) {
          const timeoutId = setTimeout(() => {
            window.scrollTo({ top: parsed, behavior: 'instant' as any });
          }, 180); // robust delay to ensure full rendering across grid and map configurations
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [catalog, stores]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleAddToCartDirect = (item: CatalogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.type === 'SERVICE') {
      // Services must guide to detail for slot booking
      navigate(isDemoMode ? `/demo/item/${item.id}` : `/item/${item.id}`);
    } else {
      addToCart(item, 1);
    }
  };

  // Filter computation
  const filteredItems = filteredByStoreCatalog.filter(item => {
    // Search query constraint
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type constraint
    const matchesType = selectedType === 'ALL' || item.type === selectedType;

    // Category check
    const matchesCategory = !selectedCategory || item.category === selectedCategory;

    // Store filter
    const matchesStore = !selectedStoreId || item.storeId === selectedStoreId;

    return matchesSearch && matchesType && matchesCategory && matchesStore;
  });

  const displayedItems = filteredItems.slice(0, visibleCount);

  const renderFiltersContent = () => (
    <>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-150">
        <span className="flex items-center text-sm font-bold text-brand-blue uppercase tracking-wider">
          <Filter className="w-4 h-4 text-brand-gold mr-2" />
          Categorías
        </span>
        {(selectedCategory || selectedType !== 'ALL' || selectedStoreId) && (
          <button 
            onClick={() => {
              setSelectedCategory(null);
              setSelectedType('ALL');
              setSelectedStoreId(null);
            }}
            className="text-xs text-red-600 hover:underline cursor-pointer font-bold"
          >
            Limpiar
          </button>
        )}
      </div>

      {selectedStoreId && (
        <div className="mb-6 bg-indigo-50 border border-indigo-150 rounded-xl p-3 text-left">
          <span className="block text-[9px] font-black text-indigo-900 tracking-wider uppercase mb-1">
            Filtro de Local Activo
          </span>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-bold text-indigo-950 truncate max-w-[140px]">
              🏪 {filteredStores.find(st => st.id === selectedStoreId)?.name || 'Local Seleccionado'}
            </span>
            <button 
              onClick={() => setSelectedStoreId(null)}
              className="text-[10px] text-red-600 hover:text-red-800 font-extrabold uppercase shrink-0 transition-colors cursor-pointer"
            >
              Quitar
            </button>
          </div>
        </div>
      )}

      {/* Catalog Type Filters */}
      <div className="mb-6">
        <span className="block text-xs font-bold text-gray-500 tracking-wide uppercase mb-3 text-left">
          Tipo de Oferta
        </span>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
              selectedType === 'ALL' 
                ? 'bg-brand-blue text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Todos los ítems</span>
          </button>
          <button
            onClick={() => setSelectedType('PRODUCT')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
              selectedType === 'PRODUCT' 
                ? 'bg-brand-blue text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Productos (Alimentos, accesorios)</span>
          </button>
          <button
            onClick={() => setSelectedType('SERVICE')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
              selectedType === 'SERVICE' 
                ? 'bg-brand-blue text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Servicios (Veterinaria, peluquería)</span>
          </button>
        </div>
      </div>

      {/* Specific Categories Checkboxes */}
      <div className="mb-6">
        <span className="block text-xs font-bold text-gray-500 tracking-wide uppercase mb-3 text-left">
          Salud Natural & Filtros
        </span>
        <div className="space-y-2 text-left">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-all">
              <input
                type="checkbox"
                checked={selectedCategory === cat}
                onChange={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className="rounded-sm border-gray-300 text-green-700 focus:ring-green-500 mr-2.5 h-4 w-4"
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Local Distance Slider */}
      <div className="mb-6">
        <span className="block text-xs font-bold text-gray-500 tracking-wide uppercase mb-2 text-left">
          Tiendas Locales
        </span>
        <div className="flex items-center text-xs text-brand-blue font-bold mb-3">
          <MapPin className="w-3.5 h-3.5 mr-1 text-red-500" />
          <span>A menos de {distance} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-gold"
        />
        <div className="flex justify-between text-2xs text-gray-400 mt-1">
          <span>Hiperlocal (1 km)</span>
          <span>Comuna (30 km)</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-[99%] xl:max-w-[97%] mx-auto px-2 sm:px-3 lg:px-4 py-8">
      {isDemoMode && (
        <div className="bg-amber-50/70 border border-[#DABD83]/40 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-brand-blue shadow-3xs">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.8 rounded-full text-3xs font-extrabold bg-green-700 text-white uppercase tracking-wider mr-3 select-none">
              Modo Demo Activo
            </span>
            <span className="text-xs font-black font-serif">Visualizando Semillero de 150 items en MongoDB</span>
            <p className="text-3xs text-gray-400 mt-1">Has ingresado a la ruta <b>/demo</b>. Aquí se muestran los 3 comercios creados y 50 productos/servicios asignados a cada uno.</p>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="text-xs font-bold text-brand-blue underline hover:text-brand-gold cursor-pointer transition-colors text-left"
          >
            Volver a Producción (/)
          </button>
        </div>
      )}

      {/* Banner Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-12 bg-gray-50 border border-gray-150 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-teal-500/5 to-amber-500/5 mix-blend-multiply" />
        
        <div className="relative max-w-3xl mx-auto text-center py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          


          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-blue mb-4 leading-tight">
            Mascotas Naturales y Felices:<br />
            <span className="text-brand-gold italic">Tu Mall Online Hiperlocal</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-gray-500 text-xs sm:text-sm mb-6">
            Encuentra alimentación orgánica BARF, medicina integrativa y servicios premium a menos de 5 km de tu hogar, sincronizados en tiempo real con el POS de tu tienda favorita.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3.5">
            <button 
              onClick={() => setSelectedCategory('Alimento Barf')}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-2xs font-extrabold uppercase tracking-wide rounded-xl text-white bg-green-700 hover:bg-green-850 shadow-sm transition-all cursor-pointer"
            >
              Descubre Alimentación Ecológica
            </button>
            <button 
              onClick={() => setSelectedType('SERVICE')}
              className="inline-flex items-center px-5 py-2.5 border border-gray-200 text-2xs font-extrabold uppercase tracking-wide rounded-xl text-brand-blue bg-white hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
            >
              Reservar Servicios
            </button>
          </div>

        </div>

        {/* Floating cats illustration background */}
        <div className="absolute right-0 bottom-0 opacity-10 hidden lg:block select-none pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=260&q=80" 
            alt="cat illustration" 
            className="w-48 h-auto"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        
        {/* Sidebar Filters (Image 1 Style) - Desktop Only, Sticky */}
        <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-xl border border-gray-150 shadow-2xs sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto self-start">
          {renderFiltersContent()}
        </aside>

        {/* Catalog Item Grid Area */}
        <div className="flex-1 min-w-0">
          
          {/* Mobile-only Partner Invitation Banner (hidden on xl/PC where right-side column takes over) */}
          <div className="xl:hidden bg-gradient-to-r from-[#102948] to-[#15345c] rounded-xl p-5 border border-blue-950 text-white text-left shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-brand-gold/25 text-brand-gold border border-brand-gold/30 rounded text-3xs font-black uppercase tracking-widest inline-block">
                Espacio de Socios
              </span>
              <h4 className="text-xs sm:text-sm font-serif font-black">¿Ofreces cuidados, veterinaria o productos?</h4>
              <p className="text-4xs text-blue-200 font-sans leading-normal">
                Únete hoy con tu <b>Plan de Prueba de 30 días Gratis</b>. Descubre nuestros planes 2026 (Market & Growth, Control & Omnicanal, y Enterprise & Elite) adaptados para Chile.
              </p>
            </div>
            <button 
              onClick={() => navigate(isDemoMode ? '/demo/enroll' : '/enroll')}
              className="w-full md:w-auto px-4 py-2.5 bg-brand-gold text-[#102948] hover:bg-[#DABD83]/90 font-sans font-extrabold text-3xs uppercase tracking-wider rounded-lg transition-all shadow-md shrink-0 flex items-center justify-center gap-1 cursor-pointer font-serif"
            >
              Enrolar Mi Tienda <ArrowRight className="w-3 h-3 stroke-[3]" />
            </button>
          </div>
          
          {/* Header toolbar for listing */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 mb-5 border-b border-gray-100 gap-4">
            <div>
              <h2 className="text-xl font-serif font-black text-brand-blue">Ecosistema de Tiendas Afiliadas</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Mostrando <span className="font-bold text-brand-blue">{displayedItems.length}</span> de <span className="font-bold text-brand-blue">{filteredItems.length}</span> resultados de calidad seleccionados
              </p>
            </div>

            {/* Quick type tags switcher & Mobile Filter triggers */}
            <div className="relative w-full sm:w-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsFilterSidebarOpen(true)}
                  className="lg:hidden flex items-center justify-center px-3 py-2 bg-white border border-gray-250 rounded-lg text-brand-blue hover:text-brand-gold font-bold text-xs space-x-1 transition-all shrink-0 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Filtros</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
                  className="flex lg:hidden items-center justify-center px-3 py-2 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-900 hover:text-indigo-700 font-bold text-xs space-x-1 transition-all shrink-0 cursor-pointer"
                >
                  {viewMode === 'grid' ? (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                      <span>Ver Mapa</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>Ver Lista</span>
                    </>
                  )}
                </button>
              </div>

              {/* Desktop Toggle View buttons */}
              <div className="hidden lg:flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-150 mr-1.5 shadow-3xs">
                <button
                  type="button"
                  onClick={() => { setViewMode('grid'); setSelectedStoreId(null); }}
                  className={`px-3 py-1.2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-brand-blue shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  📋 Lista de Ítems
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    viewMode === 'map' ? 'bg-white text-indigo-900 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🗺️ Mapa de Tiendas
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Buscar dentro de estos resultados..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-brand-gold outline-hidden"
              />
            </div>
          </div>

          {/* Conditional Layout Selection (List Grid or Interactive Map) */}
          {viewMode === 'map' ? (
            <div className="bg-white rounded-xl border border-gray-150 p-4 sm:p-6 shadow-xs text-left mb-8 animate-fade-in max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-md font-serif font-black text-brand-blue flex items-center gap-1.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Mapa de Comercio Colectivo Masco-Eco
                  </h3>
                  <p className="text-3xs text-gray-500 mt-0.5">Tiendas sincronizadas localizadas geográficamente en tiempo real. Haz clic en un marcador para ver catálogo o agendar.</p>
                </div>
                {/* Visual Map Type Switcher & Legend */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-150 shadow-3xs text-[9px] font-extrabold uppercase">
                    <button
                      type="button"
                      onClick={() => setMapStyle('political')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        mapStyle === 'political' ? 'bg-[#102948] text-white shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      🗺️ Político
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('satellite')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        mapStyle === 'satellite' ? 'bg-[#102948] text-brand-gold shadow-3xs' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      🛰️ Satelital
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-3xs text-gray-500 font-bold bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-lg shrink-0">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> POS Activo
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-brand-gold rounded-full flex items-center justify-center text-[7px] text-white font-extrabold leading-none">🏪</span> Local
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 w-full h-auto lg:h-[480px] items-stretch overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {selectedStoreId && (() => {
                    const activeStoreObj = filteredStores.find(s => s.id === selectedStoreId);
                    if (!activeStoreObj) return null;
                    const storeCatalogCount = filteredByStoreCatalog.filter(it => it.storeId === selectedStoreId).length;
                    return (
                      <motion.div
                        key="sidebar"
                        initial={{ opacity: 0, x: -60, width: 0, marginRight: 0 }}
                        animate={{ opacity: 1, x: 0, width: '100%', maxWidth: 320, marginRight: 0 }}
                        exit={{ opacity: 0, x: -60, width: 0, marginRight: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                        className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-gray-150 flex flex-col p-4 shadow-sm text-brand-blue overflow-y-auto max-h-[480px] lg:max-h-full"
                      >
                        {/* Header with Close option */}
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-150">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-[#102948] text-brand-gold font-serif font-black text-xs uppercase flex items-center justify-center rounded-lg shrink-0 border border-blue-950 shadow-3xs">
                              {activeStoreObj.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <span className="px-1.5 py-0.5 bg-indigo-100 border border-indigo-150 text-indigo-900 rounded text-[7px] font-black uppercase tracking-wider">
                                {activeStoreObj.businessType === 'PRODUCTS_ONLY' ? 'Solo Alimentos' : activeStoreObj.businessType === 'SERVICES_ONLY' ? 'Citas Médicas' : 'Híbrido E-Store'}
                              </span>
                              <h4 className="font-serif font-black text-brand-blue text-xs mt-0.5 line-clamp-1">{activeStoreObj.name}</h4>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedStoreId(null)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-650 hover:bg-gray-100 transition-all cursor-pointer shrink-0 animate-pulse"
                            title="Cerrar panel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Slogan & Description */}
                        <div className="py-2.5 text-left space-y-1">
                          <p className="text-[10px] text-gray-400 italic font-medium leading-relaxed">
                            "{activeStoreObj.slogan || 'Alimentación holística y cuidados premium para animales felices.'}"
                          </p>
                          <p className="text-[10px] text-gray-500 leading-normal font-medium">
                            {activeStoreObj.description || 'Proveedor acreditado del ecosistema de Mascotas Naturales, conectado al inventario ERP integrado.'}
                          </p>
                        </div>

                        {/* Contact Info list */}
                        <div className="space-y-1.5 bg-gray-50/80 p-2.5 rounded-lg border border-gray-150 text-[10px] font-medium text-gray-650 text-left">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-2.8 h-2.8 text-red-500 shrink-0" />
                            <span className="truncate">{activeStoreObj.address || 'Av. Marina Boulevard 1420, SF'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-brand-gold select-none">📞</span>
                            <span>{activeStoreObj.phone || '+1 415-555-0199'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-brand-blue select-none">🛡️</span>
                            <span className="text-emerald-700 font-extrabold flex items-center gap-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> POS Activo ({storeCatalogCount} ítems)
                            </span>
                          </div>
                        </div>

                        {/* Store Catalog preview list of 2 items */}
                        <div className="space-y-1.5 text-left py-2.5 border-t border-gray-150 mt-2.5">
                          <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">
                            Destacados en su local
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {catalog.filter(it => it.storeId === selectedStoreId).slice(0, 2).map(it => (
                              <div 
                                key={it.id} 
                                onClick={() => navigate(isDemoMode ? `/demo/item/${it.id}` : `/item/${it.id}`)}
                                className="bg-white p-1.5 rounded-lg border border-gray-150 flex flex-col justify-between hover:border-brand-gold transition-colors cursor-pointer"
                              >
                                <img src={it.images[0]} alt={it.title} className="w-full h-8 object-cover rounded-xs mb-1 bg-gray-50 bg-center" />
                                <span className="text-[9px] font-extrabold text-brand-blue line-clamp-1">{it.title}</span>
                                <span className="font-mono text-[8px] text-green-700 font-black mt-0.5">${it.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* CTA action buttons */}
                        <div className="mt-auto space-y-1.5 pt-2.5 border-t border-gray-150">
                          <button
                            onClick={() => {
                              setViewMode('grid');
                            }}
                            className="w-full py-2 bg-green-700 hover:bg-green-850 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-lg shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1 leading-none animate-pulse"
                          >
                            Filtrar Catálogo Aquí 📋
                          </button>
                          
                          <button
                            onClick={() => navigate(isDemoMode ? `/demo/store/${selectedStoreId}` : `/store/${selectedStoreId}`)}
                            className="w-full py-2 bg-[#102948] hover:bg-opacity-95 text-brand-gold text-[10px] font-extrabold uppercase tracking-widest rounded-lg border border-blue-900/50 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1 leading-none"
                          >
                            Visitar Tienda ↗
                          </button>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

                <div className="flex-1 relative w-full h-[400px] sm:h-[480px] lg:h-full bg-[#0c1a2e] rounded-xl overflow-hidden border border-[#173052] shadow-inner">
                  
                  <AnyMap 
                    height={480} 
                    provider={mapTileProvider}
                    center={selectedStoreId ? (() => {
                      const st = filteredStores.find(s => s.id === selectedStoreId);
                      const coords = st?.geolocation?.coordinates;
                      return coords && coords.length >= 2 ? [coords[1], coords[0]] as [number, number] : [37.7749, -122.4194];
                    })() : [37.7749, -122.4194]}
                    defaultZoom={12}
                    zoom={selectedStoreId ? 14 : 12.2}
                  >
                    {filteredStores.map((st) => {
                      const coords = st.geolocation?.coordinates;
                      if (!coords || coords.length < 2) return null;
                      const lat = coords[1];
                      const lng = coords[0];
                      const isActive = selectedStoreId === st.id;
                      return (
                        <AnyOverlay 
                          key={st.id}
                          anchor={[lat, lng]}
                        >
                          <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
                            {/* Marker container with animated widening transition styles */}
                            <div 
                              onClick={() => setSelectedStoreId(st.id)}
                              className={`h-9 relative rounded-full flex items-center shadow-lg border cursor-pointer transition-all duration-500 ease-out overflow-hidden whitespace-nowrap ${
                                isActive 
                                  ? 'bg-brand-gold border-brand-gold text-brand-blue font-black scale-105 z-30 px-3.5' 
                                  : 'bg-[#102948] border-blue-900/40 text-white px-2.5 z-20 hover:border-brand-gold hover:bg-opacity-95'
                              }`}
                            >
                              <span className="text-[13px] leading-none select-none shrink-0">
                                {st.businessType === 'SERVICES_ONLY' ? '🏥' : '🏪'}
                              </span>
                              
                              <div className={`transition-all duration-500 ease-out overflow-hidden flex items-center ${
                                isActive 
                                  ? 'max-w-[260px] ml-2.5 opacity-100' 
                                  : 'max-w-0 opacity-0 pointer-events-none'
                              }`}>
                                <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                                  {st.name}
                                </span>
                                {/* Live Synced Dot */}
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 ml-1.5 animate-pulse" />
                              </div>
                            </div>
                            
                            {/* Pin notch with match transition */}
                            <div className={`w-1.5 h-1.5 rotate-45 transform -translate-y-[4px] ${
                              isActive ? 'bg-brand-gold border-brand-gold' : 'bg-[#102948] border-blue-900/40'
                            } border-r border-b z-10 shadow-xs transition-colors duration-500`} />
                          </div>
                        </AnyOverlay>
                      );
                    })}
                  </AnyMap>

                  {/* Calibration Watermark overlay - sitting beautifully on the bottom right */}
                  <div className="absolute bottom-4 right-4 p-2 bg-black/60 backdrop-blur-xs rounded-xl border border-white/10 flex items-center gap-1.5 text-white pointer-events-none z-10 flex-nowrap shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                    <span className="text-[8px] font-mono font-black tracking-widest opacity-90 uppercase whitespace-nowrap shrink-0">
                      GEOLOCALIZADO • {mapStyle === 'satellite' ? 'MAPA SATELITAL' : 'MAPA POLÍTICO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SwiperJS Product Slider Associated to selected store - Only shows up once a store has been selected */}
              {selectedStoreId && (
                <div className="mt-8 pt-6 border-t border-gray-100 animate-fade-in w-full overflow-hidden" id="map-products-slider">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-serif font-black text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                        🛍️ Catálogo {selectedStoreId ? `de ${filteredStores.find(s => s.id === selectedStoreId)?.name}` : 'Colectivo del Ecosistema'}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Explora las ofertas y servicios conectadas por control de stock ERP en vivo.</p>
                    </div>
                    
                    {/* Slider Navigation Arrows */}
                    <div className="flex items-center gap-1.5 font-sans">
                      <button className="swiper-button-prev-custom w-8 h-8 bg-white hover:bg-gray-50 border border-gray-200 text-[#102948] rounded-full flex items-center justify-center shadow-3xs cursor-pointer transition-all">
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </button>
                      <button className="swiper-button-next-custom w-8 h-8 bg-[#102948] hover:bg-opacity-95 text-brand-gold rounded-full flex items-center justify-center shadow-3xs cursor-pointer transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const storeItems = filteredByStoreCatalog.filter(it => it.storeId === selectedStoreId);

                    if (storeItems.length === 0) {
                      return (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          <p className="text-xs text-gray-400 font-bold">Esta tienda no tiene productos disponibles actualmente</p>
                        </div>
                      );
                    }

                    return (
                      <div className="w-full overflow-hidden">
                        <Swiper
                          modules={[Navigation, Pagination]}
                          spaceBetween={16}
                          slidesPerView={1.2}
                          navigation={{
                            nextEl: '.swiper-button-next-custom',
                            prevEl: '.swiper-button-prev-custom',
                          }}
                          breakpoints={{
                            640: { slidesPerView: 2.2 },
                            1024: { slidesPerView: 3.5 }
                          }}
                          className="swiper-store-catalog !pb-3"
                        >
                          {storeItems.map((item) => {
                            const isProduct = item.type === 'PRODUCT';
                            const isFavorite = favorites.includes(item.id);
                            return (
                              <SwiperSlide key={item.id} className="h-auto">
                                <div 
                                  onClick={() => navigate(isDemoMode ? `/demo/item/${item.id}` : `/item/${item.id}`)}
                                  className="group bg-white rounded-xl border border-gray-150 hover:border-brand-gold overflow-hidden hover:shadow-xs transition-all cursor-pointer flex flex-col h-full justify-between"
                                >
                                  <div>
                                    {/* Image container */}
                                    <div className="relative aspect-video w-full bg-gray-50 overflow-hidden">
                                      <img 
                                        src={item.images[0]} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-350" 
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const isFav = favorites.includes(item.id);
                                          const newFavs = isFav 
                                            ? favorites.filter(id => id !== item.id)
                                            : [...favorites, item.id];
                                          setFavorites(newFavs);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 border border-gray-100 shadow-xs transition-all z-10"
                                      >
                                        <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                      </button>
                                      <span className={`absolute top-2 left-2 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider z-10 ${
                                        isProduct ? 'bg-green-100 text-green-800' : 'bg-brand-blue text-white'
                                      }`}>
                                        {isProduct ? 'Producto' : 'Servicio'}
                                      </span>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3 text-left">
                                      <span className="text-[8px] text-green-700 font-extrabold tracking-wider uppercase block mb-0.5">
                                        {item.category}
                                      </span>
                                      <h5 className="font-extrabold text-brand-blue text-xs leading-snug line-clamp-1 group-hover:text-brand-gold transition-colors">
                                        {item.title}
                                      </h5>
                                      <p className="text-[10px] text-gray-400 line-clamp-1 leading-normal mt-0.5">
                                        {item.description}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="p-3 pt-0 text-left">
                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                      <span className="font-mono text-xs font-black text-[#102948]">${item.price.toFixed(2)}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(item);
                                        }}
                                        className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-3xs hover:scale-[1.02] ${
                                          isProduct 
                                            ? 'bg-green-700 hover:bg-green-850 text-white' 
                                            : 'bg-brand-gold hover:bg-opacity-90 text-white'
                                        }`}
                                      >
                                        {isProduct ? 'Añadir' : 'Agendar'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </SwiperSlide>
                            );
                          })}
                        </Swiper>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Grid Products/Services */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed rounded-xl border-gray-200">
                  <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No encontramos ofertas con esos filtros</p>
                  <p className="text-xs text-brand-gold font-semibold mt-1 cursor-pointer hover:underline" onClick={() => { setSelectedCategory(null); setSelectedType('ALL'); setSearchQuery(''); setSelectedStoreId(null); }}>
                    Reestablecer filtros de búsqueda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                  {displayedItems.map((item) => {
                    const store = filteredStores.find(st => st.id === item.storeId);
                    const isProduct = item.type === 'PRODUCT';
                    const stockVal = isProduct ? (item.productDetails?.stockDigital || 0) : 10;
                    const isFavorite = favorites.includes(item.id);

                    return (
                      <div 
                        key={item.id}
                        onClick={() => navigate(isDemoMode ? `/demo/item/${item.id}` : `/item/${item.id}`)}
                        className="group bg-white rounded-xl border border-gray-150 hover:border-brand-gold overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col"
                      >
                        {/* Item Image */}
                        <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-350"
                          />
                          
                          {/* Favorite Button */}
                          <button
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className="absolute top-3 right-3 p-2 bg-white rounded-full text-gray-400 hover:text-red-500 border border-gray-100 shadow-sm transition-all"
                          >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>

                          {/* Distance Badge */}
                          <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-3xs font-bold text-gray-600 flex items-center shadow-xs">
                            <MapPin className="w-2.5 h-2.5 mr-0.5 text-red-500" />
                            1.5 km
                          </span>

                          {/* Mode Badge product/service */}
                          <span className={`absolute top-3 left-3 text-3xs px-2.5 py-0.8 rounded-full font-bold uppercase ${
                            isProduct ? 'bg-green-100 text-green-800' : 'bg-brand-blue text-white'
                          }`}>
                            {isProduct ? 'Producto' : 'Servicio / Cita'}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="p-3 flex flex-col flex-1 text-left">
                          <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                            <span className="text-[10px] text-green-700 font-extrabold tracking-wider uppercase">
                              {item.category}
                            </span>
                            <span className="text-[9px] font-bold text-indigo-900 bg-indigo-50/70 border border-indigo-100/30 px-1.5 py-0.5 rounded truncate max-w-[125px]" title={store?.name || 'Local'}>
                              🏪 {store?.name || 'Local'}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-brand-blue text-[11.5px] leading-snug line-clamp-1 group-hover:text-brand-gold transition-colors">
                            {item.title}
                          </h3>
                          
                          <p className="text-[9.5px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="mt-auto pt-3">
                            <div className="pt-2 border-t border-gray-100 flex items-end justify-between">
                              <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase leading-none mb-1">PVP Público</p>
                                <p className="font-mono text-xs font-black text-brand-blue">${item.price.toFixed(2)}</p>
                              </div>
                              
                              <div className="text-right">
                                {isProduct ? (
                                  <span className={`inline-flex px-1.5 py-0.5 rounded-sm text-[9px] font-black ${
                                    stockVal <= 5 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                  }`}>
                                    Stock: {stockVal} uds
                                  </span>
                                ) : (
                                  <span className="inline-flex px-1.5 py-0.5 rounded-sm bg-brand-lightgold text-indigo-900 text-[9px] font-black border border-indigo-100">
                                    Bloques hoy
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* CTA Add button inside card */}
                            <button
                              onClick={(e) => handleAddToCartDirect(item, e)}
                              className={`mt-2.5 w-full py-1.8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-2xs ${
                                isProduct 
                                  ? 'bg-green-700 hover:bg-green-800 text-white' 
                                  : 'bg-brand-gold hover:bg-brand-gold/90 text-white'
                              }`}
                            >
                              {isProduct ? 'Añadir' : 'Agendar / Reservar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredItems.length > visibleCount && (
                <div className="mt-8 py-6 flex flex-col items-center justify-center text-xs text-gray-400 gap-1 animate-pulse border-t border-gray-50">
                  <ChevronDown className="w-5 h-5 text-brand-gold animate-bounce" />
                  <span className="font-sans font-semibold tracking-wide">Desliza hacia abajo para cargar más productos y servicios...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Partner Sticky Sidebar - Only visible in XL+ viewports (PC Desktop) */}
        <aside className="hidden xl:block w-76 shrink-0 bg-gradient-to-b from-[#102948] via-[#122c4d] to-[#15345c] border border-blue-950 p-5 rounded-xl shadow-md text-white sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto self-start space-y-4 text-left">
          <div className="space-y-1.5">
            <span className="px-2 py-0.5 bg-brand-gold/15 text-brand-gold border border-brand-gold/25 rounded-md text-[9px] font-black uppercase tracking-wider inline-block">
              Socio Proveedor SaaS
            </span>
            <h3 className="font-serif font-black text-xs text-white leading-tight">¿Ofreces Veterinaria, Alimentos o Servicios?</h3>
            <p className="text-[11px] text-blue-200 font-sans leading-relaxed">
              Registra tu comercio con cualquiera de nuestros planes 2026. Al enrolarte tienes 30 días de prueba gratis. Controla tu stock, configura tu web y atiende con el POS.
            </p>
          </div>

          <div className="space-y-2.5 border-t border-blue-900/60 pt-3.5 flex flex-col">
            <div className="flex items-start gap-1.5 text-[10px] text-blue-150 font-sans">
              <Check className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5 stroke-[3]" />
              <span>Página web CMS de Empresa editable</span>
            </div>
            <div className="flex items-start gap-1.5 text-[10px] text-blue-150 font-sans">
              <Check className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5 stroke-[3]" />
              <span>Carro de compras B2C e-commerce</span>
            </div>
            <div className="flex items-start gap-1.5 text-[10px] text-blue-150 font-sans">
              <Check className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5 stroke-[3]" />
              <span>POS Virtual & Control de Inventario</span>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => navigate(isDemoMode ? '/demo/enroll' : '/enroll')}
              className="w-full py-2.5 bg-brand-gold text-[#102948] hover:bg-[#DABD83]/90 font-sans font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer leading-none"
            >
              Enrolar mi Comercio ↗
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile/Tablet Drawer sliding menu for filters */}
      {isFilterSidebarOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop overlay */}
            <div 
              className="absolute inset-0 bg-black/45 transition-opacity" 
              onClick={() => setIsFilterSidebarOpen(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <div className="pointer-events-auto w-screen max-w-xs bg-white shadow-xl flex flex-col h-full transform transition-all duration-300 ease-in-out">
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/55">
                  <span className="flex items-center text-sm font-bold text-brand-blue uppercase tracking-wider">
                    <Filter className="w-4 h-4 text-brand-gold mr-2" />
                    Filtros de Búsqueda
                  </span>
                  <button 
                    onClick={() => setIsFilterSidebarOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-650 hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Body (Scrollable filter contents) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {renderFiltersContent()}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-gray-150 bg-gray-50/55">
                  <button
                    onClick={() => setIsFilterSidebarOpen(false)}
                    className="w-full py-2.5 bg-brand-blue text-white rounded-lg font-bold text-xs uppercase tracking-wide cursor-pointer transition-all hover:bg-brand-blue/90"
                  >
                    Ver {filteredItems.length} resultados
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
