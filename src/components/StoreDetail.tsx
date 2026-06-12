import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { 
  Building2, Phone, Mail, MapPin, ArrowLeft, ShieldCheck, 
  Sparkles, Star, ShoppingBag, Calendar, Check, ExternalLink, Brush
} from 'lucide-react';
import { CatalogItem, Store } from '../types.js';

export default function StoreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { stores, catalog, isDemoMode, addToCart } = usePetmallStore();

  const queryParams = new URLSearchParams(location.search);
  const isAdminMode = queryParams.get('adminMode') === 'true';

  const [store, setStore] = useState<Store | null>(null);
  const [themeMode, setThemeMode] = useState<'MARKETPLACE' | 'CMS' | 'CUSTOM'>('MARKETPLACE');
  
  // Custom color selectors
  const [customPrimary, setCustomPrimary] = useState('#102948');
  const [customAccent, setCustomAccent] = useState('#DABD83');

  // Load store
  useEffect(() => {
    const toSlug = (text: string) => 
      text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const found = stores.find(s => s.id === id || toSlug(s.name) === id);
    if (found) {
      setStore(found);
      if (found.branding?.colors?.primary) {
        setCustomPrimary(found.branding.colors.primary);
      }
      if (found.branding?.colors?.accent) {
        setCustomAccent(found.branding.colors.accent);
      }
    }
  }, [id, stores]);

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-serif font-bold text-gray-700">Comercio No Encontrado</h3>
        <p className="text-xs text-gray-500 mt-1">El comercio seleccionado no existe en la base de datos o ha sido despublicado.</p>
        <button 
          onClick={() => navigate(isDemoMode ? '/demo' : '/')} 
          className="mt-6 px-4 py-2 bg-[#102948] text-white hover:bg-opacity-90 font-sans font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Portal General
        </button>
      </div>
    );
  }

  // Define active primary and accent color based on choice
  let activePrimary = '#102948';
  let activeAccent = '#DABD83';

  if (themeMode === 'MARKETPLACE') {
    activePrimary = '#102948';
    activeAccent = '#DABD83';
  } else if (themeMode === 'CMS') {
    activePrimary = '#0b2240';
    activeAccent = '#cfa86b';
  } else {
    activePrimary = customPrimary;
    activeAccent = customAccent;
  }

  // Filter catalog items of this specific store
  const storeItems = catalog.filter(i => i.storeId === store.id);
  const products = storeItems.filter(i => i.type === 'PRODUCT');
  const services = storeItems.filter(i => i.type === 'SERVICE');

  // Business type description
  const businessTypeLabel = 
    store.businessType === 'PRODUCTS_ONLY' ? 'Venta de Productos Exclusivos' :
    store.businessType === 'SERVICES_ONLY' ? 'Reserva de Cuidado & Servicios' : 'Ecosistema Integral (Productos & Servicios)';

  // Static fallback attributes if they are missing
  const storeDesc = store.description || 'Bienvenido a nuestro comercio corporativo afiliado. Somos un espacio veterinario dedicado integralmente al bienestar de tu mascota, con altos estándares de selección de nutrientes raw, dietas bio-apropiadas y accesorios totalmente orgánicos, biodegradables y ecológicos.';
  const storeSlogan = store.slogan || 'Cuidado natural, transparente y sustentable para tu fiel compañero.';
  const storeEmail = store.email || `${store.id}@petmall-ecosystem.com`;
  const storePhone = store.phone || '+56 9 8472 9130';
  const storeAddress = store.address || 'Av. Vitacura 4120, Las Condes — Santiago de Chile';
  
  const logoUrl = store.logoUrl || (store.id === 'store_1' 
    ? 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=150&q=80'
    : store.id === 'store_2'
      ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&q=80'
      : 'https://images.unsplash.com/photo-1535268647977-a403b69fc756?w=150&q=80');

  const bannerUrl = store.bannerUrl || (store.id === 'store_2'
    ? 'https://images.unsplash.com/photo-1477884213984-b971a17708d3?w=1200&q=80'
    : 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200&q=80');

  return (
    <div className="w-full pb-16 bg-gray-50 min-h-screen" style={{ '--store-p': activePrimary, '--store-a': activeAccent } as React.CSSProperties}>
      
      {/* 1. Header Banner & Profiling Card */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-900">
        <img 
          src={bannerUrl} 
          alt={store.name} 
          className="w-full h-full object-cover opacity-75 blur-2xs hover:blur-none transition-all duration-700" 
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Navigation Action Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={() => navigate(isDemoMode ? '/demo' : '/')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-2xs font-bold font-sans hover:bg-white hover:text-gray-900 transition-all shadow-lg cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Marketplace
          </button>
        </div>
      </div>

      {/* 2. Overlapping Corporate Profile Details Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-8 justify-between">
          
          {/* Main Info Left Column */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
              <img 
                src={logoUrl} 
                alt="Logo Empresa" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="text-left py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-3xs font-extrabold tracking-wide uppercase">
                  {businessTypeLabel}
                </span>
                
                {store.isTrial && (
                  <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-3xs font-extrabold tracking-wide uppercase flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> {store.planName || 'Prueba de 30 días'} ({store.trialDaysLeft} Días Restantes)
                  </span>
                )}
                
                {isAdminMode && (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 rounded-lg text-3xs font-black uppercase tracking-wider flex items-center gap-1 shadow-3xs animate-pulse">
                    🛠️ MODO CMS ACTIVO (Editable)
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-serif font-black text-gray-900 mt-2 select-text" style={{ color: activePrimary }}>
                {store.name}
              </h1>
              <p className="text-xs text-gray-500 font-sans italic font-medium mt-1 select-text">
                "{storeSlogan}"
              </p>

              {/* Bio description */}
              <div className="mt-4 text-2xs md:text-xs text-gray-600 font-sans leading-relaxed select-text max-w-2xl">
                {storeDesc}
              </div>

              {/* Información de la Web Corporativa en la plataforma */}
              <div className="mt-4 p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <div>
                  <h4 className="text-3xs font-extrabold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-700 animate-pulse" /> Sitio Web Propio en la Plataforma
                  </h4>
                  <p className="text-[11px] text-indigo-700 font-medium mt-1">
                    Ficha y landing page corporativa oficial dentro del ecosistema ERP de <b>Petmall</b>.
                  </p>
                </div>
                <div className="bg-white/80 border border-indigo-150 px-3 py-1.5 rounded-lg shrink-0">
                  <span className="text-[10px] font-sans text-gray-400 block font-bold uppercase leading-none">Dirección de Empresa Corporativa:</span>
                  <span className="text-[11px] font-mono font-black text-indigo-900 mt-0.5 block select-all">
                    /store/{store.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || store.id}
                  </span>
                </div>
              </div>

              {/* Contact meta-data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 text-2xs font-sans text-gray-500 select-text">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" style={{ color: activeAccent }} />
                  <span className="font-semibold text-gray-700">{storeEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-2xs font-sans text-gray-500 select-text">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" style={{ color: activeAccent }} />
                  <span className="font-semibold text-gray-700">{storePhone}</span>
                </div>
                <div className="flex items-center gap-2 text-2xs font-sans text-gray-500 sm:col-span-2 select-text">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" style={{ color: activeAccent }} />
                  <span className="font-medium">{storeAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Dynamic Customizer Right Column */}
          {isAdminMode && (
            <div className="w-full lg:w-80 bg-gray-50 rounded-2xl p-5 border border-gray-150 flex flex-col">
              <div className="flex items-center gap-2 text-2xs font-extrabold text-[#102948] tracking-wider uppercase mb-4">
                <Brush className="w-4 h-4" style={{ color: activePrimary }} />
                Personalización de Marca
              </div>

              <p className="text-3xs text-gray-500 leading-relaxed font-sans mb-4">
                Configura y testea los colores corporativos primarios de la empresa en tiempo real antes de desplegarlos al CMS o Marketplace.
              </p>

              <div className="space-y-3">
                {/* Preset buttons */}
                <div>
                  <label className="text-3xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Plantillas por Defecto</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setThemeMode('MARKETPLACE')}
                      className={`px-3 py-2 text-3xs font-bold rounded-xl border transition-all cursor-pointer ${themeMode === 'MARKETPLACE' ? 'bg-[#102948] text-white border-transparent shadow-xs' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      Estilo Marketplace
                    </button>
                    <button 
                      onClick={() => setThemeMode('CMS')}
                      className={`px-3 py-2 text-3xs font-bold rounded-xl border transition-all cursor-pointer ${themeMode === 'CMS' ? 'bg-[#0b2240] text-white border-transparent shadow-xs' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                    >
                      Estilo CMS Corporate
                    </button>
                  </div>
                </div>

                {/* Custom selector toggle */}
                <div>
                  <button 
                    onClick={() => setThemeMode('CUSTOM')}
                    className={`w-full px-3 py-2 text-3xs font-bold rounded-xl border transition-all cursor-pointer ${themeMode === 'CUSTOM' ? 'bg-indigo-900 text-white border-transparent shadow-xs' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                  >
                    ✨ Usar Colores Personalizados
                  </button>
                </div>

                {themeMode === 'CUSTOM' && (
                  <div className="space-y-2 border-t border-gray-200 pt-3 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-semibold text-gray-600 font-sans">Color Primario:</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={customPrimary} 
                          onChange={(e) => setCustomPrimary(e.target.value)}
                          className="w-8 h-6 bg-transparent border border-gray-200 rounded-md cursor-pointer shrink-0" 
                        />
                        <span className="text-3xs font-mono font-medium text-gray-500 uppercase">{customPrimary}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-3xs font-semibold text-gray-600 font-sans">Color Secundario:</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={customAccent} 
                          onChange={(e) => setCustomAccent(e.target.value)}
                          className="w-8 h-6 bg-transparent border border-gray-200 rounded-md cursor-pointer shrink-0" 
                        />
                        <span className="text-3xs font-mono font-medium text-gray-500 uppercase">{customAccent}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Active Theme Preview palette indicator */}
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-3xs font-bold text-gray-400 uppercase">Paleta Activa:</span>
                <div className="flex gap-1.5">
                  <span className="w-4 h-4 rounded-full shadow-xs border border-white" style={{ backgroundColor: activePrimary }} title="Primario" />
                  <span className="w-4 h-4 rounded-full shadow-xs border border-white" style={{ backgroundColor: activeAccent }} title="Acento" />
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* 3. Catalog Products & Services Showcases */}
      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Products Column (2/3 size) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div className="text-left">
                <h3 className="text-lg font-serif font-black flex items-center gap-2 text-gray-800">
                  <ShoppingBag className="w-5 h-5" style={{ color: activePrimary }} />
                  Catálogo de Productos
                </h3>
                <p className="text-3xs text-gray-400 mt-0.5">Disponibles para envío a todo el país o click & collect.</p>
              </div>
              <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-3xs font-extrabold">
                {products.length} productos
              </span>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-sans text-xs flex flex-col items-center justify-center">
                <p>No se encontraron productos registrados para esta empresa todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.slice(0, 12).map((item) => {
                  const stock = item.productDetails?.stockDigital || 0;
                  return (
                    <div key={item.id} className="group bg-white rounded-2xl border border-gray-150 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between">
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <img 
                          src={item.images[0]} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                        />
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-lg text-4xs font-black text-gray-700 uppercase shadow-xs">
                          {item.category}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between text-left">
                        <div>
                          <h4 className="font-serif font-black text-xs text-gray-850 hover:text-gray-900 line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-4xs text-gray-400 mt-1 line-clamp-2 font-sans font-medium">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                          <div>
                            <span className="text-3xs text-gray-400 font-sans block">Precio</span>
                            <span className="font-serif font-black text-gray-900" style={{ color: activePrimary }}>
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          
                          <button 
                            disabled={stock <= 0}
                            onClick={() => {
                              addToCart(item, 1);
                              alert('Se ha agregado al carro de compras B2C');
                            }}
                            className="bg-[#102948] text-white hover:bg-opacity-95 font-sans font-bold text-3xs uppercase py-2 px-3.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                            style={{ backgroundColor: activePrimary }}
                          >
                            {stock > 0 ? 'Agregar Carro' : 'Agotado'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Services Column (1/3 size) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div className="text-left">
                <h3 className="text-lg font-serif font-black flex items-center gap-2 text-gray-800">
                  <Calendar className="w-5 h-5" style={{ color: activePrimary }} />
                  Cuidado & Servicios
                </h3>
                <p className="text-3xs text-gray-400 mt-0.5">Reservas directas con especialistas.</p>
              </div>
              <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-3xs font-extrabold">
                {services.length} servicios
              </span>
            </div>

            {services.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-sans text-xs flex flex-col items-center justify-center">
                <p>No se ofrecen servicios de cuidado hoy en este local.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((item) => {
                  const duration = item.serviceDetails?.durationMinutes || 45;
                  const specialist = item.serviceDetails?.specialistName || 'Especialista';
                  return (
                    <div key={item.id} className="p-4 rounded-xl border border-gray-150 text-left hover:shadow-xs transition-all space-y-3 bg-white">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-serif font-black text-2xs text-gray-850 leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-4xs text-gray-400 mt-1 font-sans line-clamp-1">{specialist}</p>
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-150 rounded text-4xs font-sans font-bold text-gray-500">
                            ⏳ {duration} min
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-50 pt-2 flex items-center justify-between">
                        <span className="font-serif font-black text-gray-850 text-xs text-brand-blue">
                          ${item.price.toFixed(2)}
                        </span>
                        
                        <button 
                          onClick={() => {
                            navigate(isDemoMode ? `/demo/item/${item.id}` : `/item/${item.id}`);
                          }}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-transparent font-bold text-3xs rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                        >
                          Reservar Agenda <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
