import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { 
  Building2, Mail, Phone, MapPin, Sparkles, Check, 
  ArrowRight, ShieldAlert, Award, ChevronRight, LayoutTemplate,
  Search, RefreshCw
} from 'lucide-react';
import { Map, Marker, Overlay, Draggable } from 'pigeon-maps';
const AnyMap = Map as any;
const AnyOverlay = Overlay as any;
const AnyDraggable = Draggable as any;

import cmsIsotype from '../../assets/isotype_cms_petmall.png';

interface PlanOption {
  type: 'market_growth' | 'control_omnicanal' | 'enterprise_elite';
  name: string;
  price: string;
  description: string;
  features: string[];
}

export default function AdminEnrollment() {
  const { enrollStore, loginUser } = usePetmallStore();
  const navigate = useNavigate();

  // Onboarding phase states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Interactive Map & Geolocation state variables
  const [mapSearchAddress, setMapSearchAddress] = useState('');
  const [markerCoords, setMarkerCoords] = useState<[number, number]>([-33.45694, -70.64827]); // Lat, Lng default Santiago (Chile)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.45694, -70.64827]);
  const [mapZoom, setMapZoom] = useState(13);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');
  
  // Custom design details
  const [businessType, setBusinessType] = useState<'PRODUCTS_ONLY' | 'SERVICES_ONLY' | 'HYBRID'>('HYBRID');
  const [theme, setTheme] = useState<'A' | 'B'>('A');
  const [primaryColor, setPrimaryColor] = useState('#0b2240');
  const [accentColor, setAccentColor] = useState('#DABD83');

  // Plan Selected
  const [selectedPlan, setSelectedPlan] = useState<'market_growth' | 'control_omnicanal' | 'enterprise_elite'>('control_omnicanal');

  // Loading/Success animation triggers
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Custom interactive email & password change simulation
  const [emailOpened, setEmailOpened] = useState(false);
  const [createdPassword, setCreatedPassword] = useState('password123');
  const [confirmCreatedPassword, setConfirmCreatedPassword] = useState('password123');
  const [passwordSavedSuccessfully, setPasswordSavedSuccessfully] = useState(false);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Available plans matching user requirements
  const plans: PlanOption[] = [
    {
      type: 'market_growth',
      name: 'Plan Market & Growth 🛒',
      price: '$24.990 CLP / mes',
      description: 'Ideal para tiendas emergentes, paseadores y estéticas caninas.',
      features: [
        'Prueba de 30 días gratis',
        'Pago Anual: $19.990 CLP/mes ($239.880 CLP total)',
        'Comisión Marketplace: 7.0% + IVA',
        'Máximo 2 usuarios administradores',
        'Punto de Venta (POS): Básico/simulado',
        'Presencia: Listado en el Marketplace Petmall',
        'Soporte básico por correo electrónico'
      ]
    },
    {
      type: 'control_omnicanal',
      name: 'Plan Control & Omnicanal 🚀',
      price: '$59.990 CLP / mes',
      description: 'El corazón de tu negocio: control de inventario y venta física-digital.',
      features: [
        'Prueba de 30 días gratis',
        'Pago Anual: $47.990 CLP/mes ($575.880 CLP total)',
        'Comisión Marketplace: 4.5% + IVA',
        'Máximo 6 usuarios administradores',
        'Blog de la tienda (Compartibilidad enriquecida en WhatsApp, Telegram, X, Facebook, LinkedIn, etc.)',
        'Punto de Venta (POS) en tiempo real',
        'Alertas de stock mínimo y mermas',
        'Órdenes de compra B2B automáticas',
        'Agenda de reservas y turnos caninos',
        'Soporte prioritario rápido'
      ]
    },
    {
      type: 'enterprise_elite',
      name: 'Plan Enterprise & Elite 👑',
      price: '$149.900 CLP / mes',
      description: 'Poder absoluto multi-sucursal, control financiero y marca premium.',
      features: [
        'Prueba de 30 días gratis',
        'Pago Anual: $119.990 CLP/mes ($1.439.880 CLP total)',
        'Comisión Marketplace: 2.5% + IVA',
        'Usuarios administradores ILIMITADOS',
        'Blog premium ilimitado con previsualización SEO enriquecida',
        'Sucursal adicional: +$35.000 CLP/mes',
        'POS avanzado: Arqueos, cajas y turnos',
        'Sitio Web Propio (CMS) & SEO Local',
        'Inventario predictivo multi-bodega',
        'Soporte dedicado las 24 horas (24/7)'
      ]
    }
  ];

  // Colors template loading presets
  const applyPreset = (preset: 'MARKETPLACE' | 'CMS') => {
    if (preset === 'MARKETPLACE') {
      setPrimaryColor('#102948');
      setAccentColor('#DABD83');
    } else {
      setPrimaryColor('#0b2240');
      setAccentColor('#cfa86b');
    }
  };

  const currentPlanObj = plans.find(p => p.type === selectedPlan)!;

  // Map & geocoding helper functions
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapSearchAddress.trim()) {
      setSearchFeedback('⚠️ Ingresa una dirección para buscar en el mapa.');
      return;
    }
    setSearchLoading(true);
    setSearchFeedback('🔍 Buscando dirección...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchAddress)}&limit=1`, {
        headers: {
          'Accept-Language': 'es',
          'User-Agent': 'PetmallPartnerOnboarding/1.0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMarkerCoords([lat, lon]);
          setMapCenter([lat, lon]);
          setMapZoom(16);
          setSearchFeedback(`✓ Ubicado en: ${data[0].display_name.split(',')[0]} (puedes ajustar con un clic)`);
        } else {
          setSearchFeedback('❌ No se encontró. Prueba agregando una comuna, región o país.');
        }
      } else {
        setSearchFeedback('❌ Error al conectar con servidor de mapas.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setSearchFeedback('❌ Error técnico al geolocalizar.');
    } finally {
      setSearchLoading(false);
    }
  };

  const geocodeAddressText = async (text: string) => {
    if (!text.trim()) return;
    setSearchLoading(true);
    setSearchFeedback('🔍 Geolocalizando dirección sincronizada...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`, {
        headers: {
          'Accept-Language': 'es',
          'User-Agent': 'PetmallPartnerOnboarding/1.0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMarkerCoords([lat, lon]);
          setMapCenter([lat, lon]);
          setMapZoom(16);
          setSearchFeedback('✓ Sincronizado y ubicado con éxito en el mapa (puedes ajustar con un clic).');
        } else {
          setSearchFeedback('⚠️ Sincronizado, pero no se geolocalizó exacto. Mueve el pin manual.');
        }
      } else {
        setSearchFeedback('⚠️ Sincronizado. Error de proveedor GIS.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setSearchFeedback('⚠️ Sincronizado, pero falló conexión.');
    } finally {
      setSearchLoading(false);
    }
  };

  const syncWithMainAddress = () => {
    if (!address.trim()) {
      alert('Por favor, primero ingresa la dirección en el campo "Dirección Física del Local".');
      return;
    }
    setMapSearchAddress(address);
    geocodeAddressText(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Por favor, ingresa el nombre de tu empresa y el correo administrativo de contacto.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        slogan: slogan || 'Bienestar integral para las mascotas',
        description: description || 'Somos profesionales avocados al amor por los animales y la entrega de productos biológicamente apropiados para su nutrición.',
        phone: phone || '+56 9 8472 9130',
        address: address || 'Santiago, Chile',
        businessType,
        branding: {
          theme,
          colors: {
            primary: primaryColor,
            accent: accentColor
          }
        },
        planType: selectedPlan,
        planName: currentPlanObj.name,
        demo: true, // All dynamically registered stores on preview are placed as demo/trial for safety!
        geolocation: {
          type: 'Point',
          coordinates: [markerCoords[1], markerCoords[0]] // [longitude, latitude] GeoJSON order
        }
      };

      const result = await enrollStore(payload);
      if (result.success) {
        setSuccess(true);
        // We do NOT log in immediately anymore.
        // The user must open the simulated email link below on screen as requested!
      }
    } catch (err: any) {
      alert('Error al enrolar comercio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (createdPassword !== confirmCreatedPassword) {
      setPasswordError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }
    if (createdPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setPasswordError('');
    setPasswordSavedSuccessfully(true);
    loginUser(email, 'STORE_OWNER');

    setTimeout(() => {
      navigate('/admin/dashboard');
    }, 2800);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col justify-between">
      
      {/* Visual background decor elements */}
      <div className="absolute top-0 inset-x-0 h-96 bg-[#102948]/10 -skew-y-3 origin-top-left -z-10" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-12 w-full">
        
        {/* Onboarding Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src={cmsIsotype} alt="Petmall Logo" className="w-10 h-10 object-contain" />
            <span className="font-serif text-3xl font-extrabold tracking-tight text-[#102948]">
              Petmall Partner
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-black text-gray-900 leading-tight">
            Únete al Ecosistema Omnicanal de Tiendas de Mascotas
          </h2>
          <p className="text-2xs md:text-xs text-gray-500 font-sans mt-2 leading-relaxed">
            Completa tus datos iniciales corporativos hoy y obtén acceso total inmediato por <span className="font-bold text-indigo-900">30 días de prueba gratuita</span> en el plan que más se adapte a tu operación.
          </p>
        </div>

        {/* Dynamic Success Splash Screen & Simulated Onboarding flow */}
        {success ? (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            
            {/* Step Header */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-left flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-[#102948] text-lg font-serif font-black">Fase 1 Completada: ¡Comercio Registrado!</h3>
                <p className="text-xs text-gray-650 mt-1 font-sans">
                  Tu comercio <strong>"{name}"</strong> de plan <span className="font-bold text-indigo-900">{currentPlanObj.name}</span> se ha creado en el sistema. Ahora, para garantizar la máxima seguridad, debes establecer tu contraseña para activar tu CMS y stock físico.
                </p>
              </div>
            </div>

            {/* Email dispatch simulator card */}
            {!passwordSavedSuccessfully ? (
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-150 text-left space-y-6">
                
                {/* Simulator explanation badge */}
                <div className="flex items-center gap-2 p-3 bg-indigo-50/70 border border-indigo-150 rounded-2xl text-2xs font-extrabold text-[#102948]">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span>SIMULADOR DE EMAIL SANDBOX (ACTIVADO): Se ha despachado un token seguro a {email}</span>
                </div>

                {/* Simulated Webmail frame */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-3xs font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#102948]" /> Bandeja de Entrada Simulada (User Sandbox)
                    </span>
                    <span className="bg-[#DABD83]/20 text-[#102948] text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {!emailOpened ? "1 Correo Nuevo" : "Leyendo Correo"}
                    </span>
                  </div>

                  {/* Mail Row */}
                  {!emailOpened ? (
                    <div 
                      onClick={() => setEmailOpened(true)}
                      className="p-5 bg-white hover:bg-gray-50/80 cursor-pointer flex items-center justify-between transition-colors border-b border-gray-100"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 animate-pulse" />
                        <div className="min-w-0">
                          <p className="font-black text-xs text-[#102948] truncate">Soporte Petmall Onboarding</p>
                          <p className="font-semibold text-2xs text-[#102948] truncate">Asunto: Genera tu contraseña exclusiva de administrador para {name}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-extrabold shrink-0 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        ABRIR CORREO ✉️
                      </span>
                    </div>
                  ) : (
                    <div className="bg-white p-6 border-b border-gray-100 space-y-5">
                      {/* Mail Header */}
                      <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between text-2xs gap-1">
                        <div>
                          <p className="font-bold text-[#102948]"><span className="text-gray-400 font-normal">De:</span> onboarding@petmall.com</p>
                          <p className="font-bold text-[#102948]"><span className="text-gray-400 font-normal">Para:</span> {email}</p>
                        </div>
                        <span className="text-4xs text-gray-400 font-mono">Recibido hace un instante</span>
                      </div>

                      {/* Mail Body */}
                      <div className="text-2xs text-gray-600 leading-relaxed space-y-4 font-sans">
                        <p className="font-bold text-[#102948]">¡Estimado aliado de {name}!</p>
                        <p>
                          Te damos una cordial bienvenida a <strong>Petmall Partner</strong>, el ecosistema omnicanal de administración ERP y marketplace para tiendas de mascotas preferida en el país.
                        </p>
                        <p>
                          Tu registro inicial se completó correctamente. Como medida crítica para posibilitar la sincronización en vivo del stock de tu POS físico y evitar duplicación de ventas, requerimos que establezcas tu contraseña exclusiva para proteger tu acceso administrativo.
                        </p>
                        <p>
                          Por favor, completa el formulario y haz clic en el siguiente enlace para activar tu dashboard:
                        </p>
                      </div>

                      {/* CTA Password generation form inside Mail */}
                      <form onSubmit={handleRegisterPasswordSubmit} className="mt-6 pt-5 border-t border-gray-100 text-left space-y-4 max-w-md bg-gray-50/50 p-5 rounded-2xl border border-gray-150">
                        <h4 className="text-xs font-black text-[#102948] flex items-center gap-1.5">
                          🔑 Fase 2: Establecer Contraseña
                        </h4>
                        
                        {passwordError && (
                          <div className="p-3 bg-red-50 border border-red-150 text-[11px] text-red-800 font-medium rounded-xl flex items-center gap-1.5">
                            <span>⚠️ {passwordError}</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-450 font-extrabold uppercase tracking-wider block">
                            Tu Correo Administrativo
                          </label>
                          <input 
                            type="text" 
                            disabled 
                            value={email}
                            className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-2xs font-mono font-bold text-gray-500 cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-450 font-extrabold uppercase tracking-wider block">
                            Nueva Contraseña de Acceso
                          </label>
                          <input 
                            type="text" 
                            required 
                            value={createdPassword}
                            onChange={(e) => setCreatedPassword(e.target.value)}
                            placeholder="Escribe tu contraseña"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-2xs font-bold text-[#102948] focus:ring-1 focus:ring-[#DABD83] outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-450 font-extrabold uppercase tracking-wider block">
                            Confirmar Contraseña
                          </label>
                          <input 
                            type="text" 
                            required 
                            value={confirmCreatedPassword}
                            onChange={(e) => setConfirmCreatedPassword(e.target.value)}
                            placeholder="Confirma la contraseña"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-2xs font-bold text-[#102948] focus:ring-1 focus:ring-[#DABD83] outline-hidden"
                          />
                        </div>

                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-150 text-[10px] text-amber-900 leading-normal">
                          <p className="font-bold flex items-center gap-1">
                            <span>💡 Modo de Pruebas:</span>
                          </p>
                          <p className="text-amber-800">
                            Por comodidad para testers en la plataforma virtual, hemos prellenado una contraseña genérica (<strong>password123</strong>), pero tienes la libertad de modificarla. ¡Toma nota de ella para tus próximos ingresos de testeo!
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-[#DABD83] hover:bg-[#DABD83]/90 text-[#102948] font-bold text-2xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Generar Password & Iniciar Sesión <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </form>

                    </div>
                  )}
                </div>

                {/* Quick actions row */}
                {emailOpened && (
                  <div className="text-right">
                    <button 
                      type="button"
                      onClick={() => setEmailOpened(false)} 
                      className="text-4xs text-gray-400 font-bold hover:underline uppercase tracking-wider"
                    >
                      ← Cerrar Correo y Volver a Bandeja
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Saved Successfully screen
              <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-950/10 text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-bounce border border-blue-200">
                  <Sparkles className="w-8 h-8 text-indigo-650" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-serif font-black text-gray-900">¡Contraseña Activada Exitosamente!</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans max-w-md mx-auto">
                    Se registró tu contraseña con nivel superior de criptografía y tu cuenta <strong>"{email}"</strong> ha quedado activa. Tu portal administrativo CMS y ERP ya está listo para arrancar.
                  </p>
                </div>

                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-3xs font-extrabold text-[#102948] flex items-center justify-center gap-2 max-w-sm mx-auto">
                  <span>🔑 ACCESO ADMINISTRADOR DE: <strong>{name.toUpperCase()}</strong></span>
                </div>

                <p className="text-4xs text-gray-400 animate-pulse font-sans">
                  Autologín activo. Redirigiéndote a tu ERP y POS de Petmall en segundos...
                </p>
              </div>
            )}

          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT / CENTER: Store Config Form Fields (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Form Block 1: Corporate Space */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 text-left space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                  <span className="p-1.5 bg-indigo-50 text-[#102948] rounded-xl shrink-0"><Building2 className="w-4 h-4" /></span>
                  <div>
                    <h3 className="font-serif font-black text-sm text-gray-900">1. Identidad de la Empresa</h3>
                    <p className="text-4xs text-gray-400">Datos públicos de cara al consumidor final.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Nombre Institucional de la Tienda *</label>
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Veterinaria El Bosque & Petshop" 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-brand-gold focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Email Administrativo (Contacto & Login) *</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej. admin@elbosquetest.com" 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-brand-gold focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Slogan field */}
                  <div className="flex flex-col sm:col-span-2">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Eslogan de Marca</label>
                    <input 
                      type="text" 
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="Ej. El cuidado que ellos se merecen, cerca de ti" 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-brand-gold focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Description field */}
                  <div className="flex flex-col sm:col-span-2">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Descripción Profesional / Quiénes Somos</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe la propuesta única de bienestar, alimentos de calidad, especialistas asignados o veterinarios que ofrece tu tienda..." 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-brand-gold focus:outline-hidden transition-all resize-none"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider mb-1.5">Teléfono Directo de Atención</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. +56 9 1234 5678" 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-brand-gold focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Address field */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-555 uppercase tracking-wider mb-1.5">Dirección Física del Local</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Av. Andrés Bello 213, Providencia" 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-brand-gold focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Interactive Map Block */}
                  <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-gray-100 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-500 animate-pulse" /> Geolocalización del Local en Marketplace
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium font-sans">
                          Ingresa una dirección específica para ubicar el pin o reubica el pin manualmente con un clic en el mapa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={syncWithMainAddress}
                        className="self-start sm:self-center px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors font-sans text-4xs font-bold rounded-lg border border-indigo-200/50 flex items-center gap-1 cursor-pointer shadow-3xs"
                      >
                        <RefreshCw className="w-3 h-3" /> Sincronizar Dirección Física
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={mapSearchAddress}
                          onChange={(e) => setMapSearchAddress(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSearchAddress();
                            }
                          }}
                          placeholder="Escribe para centrar el pin (ej: Providencia 237, Santiago)..."
                          className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-2xs font-semibold focus:ring-1 focus:ring-brand-gold focus:outline-hidden transition-all"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchAddress()}
                        disabled={searchLoading}
                        className="px-3.5 py-2 bg-[#102948] hover:bg-slate-900 text-white text-2xs font-black rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-xs disabled:bg-gray-300 shrink-0"
                      >
                        {searchLoading ? '...' : 'Buscar'}
                      </button>
                    </div>

                    {searchFeedback && (
                      <p className={`text-[10px] font-bold font-sans ${searchFeedback.startsWith('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                        {searchFeedback}
                      </p>
                    )}

                    {/* Simple Map Container with explicitly declared height to prevent collapse */}
                    <div className="relative w-full h-[260px] bg-[#102948]/5 rounded-2xl overflow-hidden border border-gray-200 shadow-3xs">
                      <AnyMap
                        height={260}
                        center={mapCenter}
                        zoom={mapZoom}
                        onBoundsChanged={({ center, zoom }: { center: [number, number], zoom: number }) => {
                          setMapCenter(center);
                          setMapZoom(zoom);
                        }}
                        provider={(x: number, y: number, z: number) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`}
                      >
                        <AnyDraggable 
                          anchor={markerCoords} 
                          onDragEnd={(anchor: [number, number]) => {
                            if (anchor) {
                              setMarkerCoords(anchor);
                            }
                          }}
                        >
                          <div className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
                            {/* Pin shape */}
                            <div className="px-2.5 py-1 bg-[#102948] border border-brand-gold text-brand-gold font-sans font-black rounded-lg shadow-md text-[9px] flex items-center gap-1 cursor-grab active:cursor-grabbing select-none whitespace-nowrap">
                              <span>🏪 Mi Local (Arrástrame)</span>
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            </div>
                            <div className="w-2.5 h-2.5 rotate-45 transform -translate-y-[6px] bg-[#102948] border-r border-b border-brand-gold" />
                          </div>
                        </AnyDraggable>
                      </AnyMap>

                      {/* Map Coordinate Watermark info */}
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/65 backdrop-blur-xs rounded-lg text-white pointer-events-none text-[8px] font-mono font-bold flex gap-2">
                        <span>LAT: {markerCoords[0].toFixed(5)}</span>
                        <span>LON: {markerCoords[1].toFixed(5)}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-mono italic leading-relaxed">
                      * Arrastra con el mouse el pin "🏪 Mi Local" sobre el mapa para ajustar la geolocalización de tu entrada o estacionamiento, sin alterar el campo de dirección física de arriba.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Block 2: Operations & Branding Customizer */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 text-left space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                  <span className="p-1.5 bg-amber-50 text-orange-600 rounded-xl shrink-0"><LayoutTemplate className="w-4 h-4" /></span>
                  <div>
                    <h3 className="font-serif font-black text-sm text-gray-900">2. Operación y Diseño Corporativo</h3>
                    <p className="text-4xs text-gray-400">Configuración temática predeterminada para el marketplace.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Business Category Selection */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider mb-2">Giro del Negocio</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all">
                        <input 
                          type="radio" 
                          name="business_type" 
                          checked={businessType === 'PRODUCTS_ONLY'}
                          onChange={() => setBusinessType('PRODUCTS_ONLY')}
                          className="text-[#102948] focus:ring-0 cursor-pointer"
                        />
                        Solo Productos
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all">
                        <input 
                          type="radio" 
                          name="business_type" 
                          checked={businessType === 'SERVICES_ONLY'}
                          onChange={() => setBusinessType('SERVICES_ONLY')}
                          className="text-[#102948] focus:ring-0 cursor-pointer"
                        />
                        Solo Servicios
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all">
                        <input 
                          type="radio" 
                          name="business_type" 
                          checked={businessType === 'HYBRID'}
                          onChange={() => setBusinessType('HYBRID')}
                          className="text-[#102948] focus:ring-0 cursor-pointer"
                        />
                        Híbrido (Ambos)
                      </label>
                    </div>
                  </div>

                  {/* Layout Theme standard selection */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider mb-2">Plantilla Layout</label>
                    <div className="grid grid-cols-1 gap-2">
                       <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-150">
                        <input 
                          type="radio" 
                          name="theme_type" 
                          checked={theme === 'A'}
                          onChange={() => setTheme('A')}
                          className="cursor-pointer"
                        />
                        Tema A: Clásico
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-150">
                        <input 
                          type="radio" 
                          name="theme_type" 
                          checked={theme === 'B'}
                          onChange={() => setTheme('B')}
                          className="cursor-pointer"
                        />
                        Tema B: Sostenible
                      </label>
                    </div>
                  </div>

                  {/* Preset Colors Selection */}
                  <div className="flex flex-col space-y-3">
                    <label className="text-3xs font-black text-gray-500 uppercase tracking-wider block">Propuestas de Color</label>
                    <div className="flex flex-col gap-2">
                      <button 
                        type="button" 
                        onClick={() => applyPreset('MARKETPLACE')}
                        className="px-3 py-1.5 text-4xs font-black text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-left flex items-center justify-between"
                      >
                        Palette Marketplace
                        <span className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#102948]" />
                          <span className="w-2 h-2 rounded-full bg-[#DABD83]" />
                        </span>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyPreset('CMS')}
                        className="px-3 py-1.5 text-4xs font-black text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-left flex items-center justify-between"
                      >
                        Palette CMS Corporate
                        <span className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#0b2240]" />
                          <span className="w-2 h-2 rounded-full bg-[#cfa86b]" />
                        </span>
                      </button>
                    </div>
                    
                    {/* Custom Color picking lines */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1">
                      <span className="text-4xs text-gray-400 font-semibold">Tono Picker:</span>
                      <div className="flex gap-1.5 shrink-0">
                        <input 
                          type="color" 
                          value={primaryColor} 
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border border-transparent bg-transparent shrink-0" 
                        />
                        <input 
                          type="color" 
                          value={accentColor} 
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border border-transparent bg-transparent shrink-0" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT SIDEBAR: Plans Selection Panel (Span 1) */}
            <div className="space-y-6">
              
              <div className="bg-[#102948] rounded-3xl p-6 shadow-xl border border-blue-900/40 text-white text-left">
                <div className="flex items-center gap-2 mb-4 border-b border-blue-950 pb-3">
                  <Award className="w-5 h-5 text-brand-gold animate-pulse shrink-0" />
                  <div>
                    <h3 className="font-serif font-black text-xs uppercase tracking-wider text-brand-gold">3. Selecciona tu Plan</h3>
                    <p className="text-4xs text-blue-300">¡Todos incluyen 30 días liberados de test!</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {plans.map((pl) => {
                    const isSelected = selectedPlan === pl.type;
                    return (
                      <div 
                        key={pl.type}
                        onClick={() => setSelectedPlan(pl.type)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-indigo-950/60 border-brand-gold shadow-md' : 'bg-blue-950/20 border-blue-900/30 hover:bg-blue-900/20'}`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-2xs font-extrabold tracking-tight text-white">{pl.name}</h4>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-brand-gold bg-brand-gold text-[#102948]' : 'border-blue-800'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </div>
                        <p className="text-4xs text-blue-200 font-medium mt-1 leading-normal">{pl.description}</p>
                        
                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-indigo-900 space-y-1">
                            {pl.features.map((ft, i) => (
                              <div key={i} className="flex items-start gap-1 text-3xs text-blue-100 font-sans">
                                <span className="text-brand-gold mr-0.5 font-bold">✓</span>
                                <span className="leading-tight">{ft}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit button inside plans panel to stay visible */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-brand-gold text-[#102948] font-sans font-bold text-2xs uppercase tracking-widest rounded-xl hover:bg-[#DABD83]/90 transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando Ecosistema...' : (
                    <>
                      Registrar Comercio & Plan <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Legal Info disclaimer */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-left flex gap-3 text-3xs font-medium text-amber-800/90 leading-relaxed font-sans shadow-xs">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-bold text-amber-900">Periodo de Prueba Inteligente</p>
                  Al enrolarte en el plan <strong className="text-amber-950 uppercase">"{currentPlanObj.name}"</strong>, se iniciará una variable exclusiva de pruebas por 30 días para evaluar facturación y stock sin cargos reales.
                </div>
              </div>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}
