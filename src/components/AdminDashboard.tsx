/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import cmsIsotype from '../../assets/isotype_cms_petmall.png';
import { 
  BarChart, Database, Truck, ShoppingBag, 
  MapPin, AlertTriangle, Check, RefreshCw, Layers, Sparkles, 
  Trash2, Plus, Mail, Upload, Calendar, Clock, DollarSign, Tag, Search,
  Menu, X, Eye, Folder, FolderPlus, Image as ImageIcon, LogOut, Users
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { CatalogItem, Order, OrderStatus, SaaSPayment } from '../types.js';

export default function AdminDashboard() {
  const { 
    currentUser, isDemoMode, catalog, fetchCatalog, orders, fetchOrders, createCatalogItem, 
    updateOrderStatus, submitPosSale, sseConnected, startSseConnection,
    logoutUser, stores, fetchStores
  } = usePetmallStore();
  
  const navigate = useNavigate();
  
  // Tab Routing
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'inventory' | 'logistics' | 'pos' | 'library' | 'users' | 'super'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- SaaS Subscription Payments state and fetching ---
  const [saasPaymentsList, setSaasPaymentsList] = useState<SaaSPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const fetchSaasPayments = async () => {
    setPaymentsLoading(true);
    try {
      const url = currentUser?.role === 'SUPER_USER'
        ? '/api/saas-payments'
        : `/api/saas-payments?storeId=${currentUser?.storeId || 'store_1'}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Sort payments so PENDING is at the top or planned date order
        data.sort((a: SaaSPayment, b: SaaSPayment) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());
        setSaasPaymentsList(data);
      }
    } catch (e) {
      console.error('Error fetching SaaS payments:', e);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchSaasPayments();
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser?.role === 'SUPER_USER') {
      setActiveTab('super');
    }
  }, [currentUser]);

  useEffect(() => {
    fetchStores();
    fetchCatalog();
    fetchOrders();
    startSseConnection(); // Ensure real-time SSE listener is active
  }, []);

  // --- TAB 7: USER MANAGEMENT SYSTEM STATES ---
  const [storeUsers, setStoreUsers] = useState<{ email: string; role: string; storeId?: string; firstName?: string; lastName?: string; avatarUrl?: string }[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState('');
  const [newUserRole, setNewUserRole] = useState<'STORE_OWNER' | 'STORE_STAFF'>('STORE_STAFF');
  const [userSuccessMessage, setUserSuccessMessage] = useState('');
  const [userErrorMessage, setUserErrorMessage] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  const loadStoreUsers = async () => {
    const sId = currentUser?.storeId || 'store_1';
    try {
      const res = await fetch(`/api/stores/${sId}/users`);
      if (res.ok) {
        const data = await res.json();
        setStoreUsers(data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  useEffect(() => {
    loadStoreUsers();
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadStoreUsers();
    }
  }, [activeTab]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    
    setUserLoading(true);
    setUserSuccessMessage('');
    setUserErrorMessage('');

    const sId = currentUser?.storeId || 'store_1';
    try {
      const res = await fetch(`/api/stores/${sId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim().toLowerCase(),
          role: newUserRole,
          firstName: newUserFirstName.trim(),
          lastName: newUserLastName.trim(),
          avatarUrl: newUserAvatarUrl.trim()
        })
      });

      if (res.ok) {
        setUserSuccessMessage('¡Usuario administrador agregado exitosamente con accesos activos!');
        setNewUserEmail('');
        setNewUserFirstName('');
        setNewUserLastName('');
        setNewUserAvatarUrl('');
        loadStoreUsers();
      } else {
        const err = await res.json();
        setUserErrorMessage(err.error || 'No se pudo agregar el usuario.');
      }
    } catch (err: any) {
      setUserErrorMessage('Error de red: ' + err.message);
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    if (emailToDelete.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('No puedes auto-eliminarte de este panel.');
      return;
    }
    if (!confirm(`¿Estás seguro de revocar los accesos del usuario ${emailToDelete}?`)) return;

    const sId = currentUser?.storeId || 'store_1';
    try {
      const res = await fetch(`/api/stores/${sId}/users/${encodeURIComponent(emailToDelete)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Usuario eliminado correctamente.');
        loadStoreUsers();
      } else {
        alert('Fallo al eliminar el usuario.');
      }
    } catch (err: any) {
      alert('Error de red al eliminar usuario: ' + err.message);
    }
  };

  // --- TAB 1: DASHBOARD METRICS CALCULATORS ---
  const physicalSalesTotal = orders.filter(o => o.customerId === 'pos_customer').reduce((acc, curr) => acc + curr.total, 0);
  const digitalSalesTotal = orders.filter(o => o.customerId !== 'pos_customer').reduce((acc, curr) => acc + curr.total, 0);
  const totalGMV = physicalSalesTotal + digitalSalesTotal;
  
  const myStore = stores.find(s => s.id === currentUser?.storeId) || stores[0];
  
  // Calculate simulated margins based on wholesale values
  const totalCost = catalog.reduce((acc, curr) => {
    const cost = curr.productDetails?.costPrice || (curr.price * 0.4); // assume 40% cost for service
    return acc + cost;
  }, 0);
  const averageMarginPercent = ((totalGMV - (totalCost * 0.05)) / (totalGMV || 1)) * 100;

  // Alerts calculations
  const lowStockItems = catalog.filter(i => 
    i.type === 'PRODUCT' && 
    (i.productDetails?.stockPhysical || 0) <= (i.productDetails?.reorderThreshold || 5)
  );

  // --- TAB 2: CATALOG ITEM CREATION FORM ---
  // --- STATE FOR IMAGE LIBRARY SYSTEM (Max 100 images, folders organization) ---
  interface LibraryImage {
    id: string;
    url: string;
    name: string;
    folder: string;
  }

  const DEFAULT_FOLDERS = ['General', 'Alimentos', 'Servicios', 'Accesorios'];
  const DEFAULT_LIBRARY_IMAGES: LibraryImage[] = [
    { id: '1', name: 'Alimento Premium', url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80', folder: 'Alimentos' },
    { id: '2', name: 'Snacks Naturales', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80', folder: 'Alimentos' },
    { id: '3', name: 'Higiene & Brillo', url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500&q=80', folder: 'Accesorios' },
    { id: '4', name: 'Juguete Interactivo', url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500&q=80', folder: 'Accesorios' },
    { id: '5', name: 'Consulta Veterinaria', url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&q=80', folder: 'Servicios' },
    { id: '6', name: 'Estética Canina', url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=500&q=80', folder: 'Servicios' }
  ];

  const RANDOM_PET_IMAGES = [
    'https://images.unsplash.com/photo-1544568100-847a948585b9?w=500&q=80',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&q=80',
    'https://images.unsplash.com/photo-1537151608828-ea2b117b6b86?w=500&q=80',
    'https://images.unsplash.com/photo-1477884213984-b971a17708d3?w=500&q=80',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=500&q=80',
    'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=500&q=80',
    'https://images.unsplash.com/photo-1535268647977-a403b69fc756?w=500&q=80',
    'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=500&q=80',
    'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=500&q=80'
  ];

  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem('petmall_library_folders');
    return saved ? JSON.parse(saved) : DEFAULT_FOLDERS;
  });

  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>(() => {
    const saved = localStorage.getItem('petmall_library_images');
    return saved ? JSON.parse(saved) : DEFAULT_LIBRARY_IMAGES;
  });

  const [activeLibraryFolder, setActiveLibraryFolder] = useState<string>('General');
  const [newFolderName, setNewFolderName] = useState('');
  const [libraryUploadName, setLibraryUploadName] = useState('');
  const [libraryUploadUrl, setLibraryUploadUrl] = useState('');
  const [isLibraryFolderCreatorOpen, setIsLibraryFolderCreatorOpen] = useState(false);

  // Modal selection state inside catalog creation
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [modalActiveFolder, setModalActiveFolder] = useState('General');

  useEffect(() => {
    localStorage.setItem('petmall_library_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('petmall_library_images', JSON.stringify(libraryImages));
  }, [libraryImages]);

  const [formType, setFormType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('12990'); // CLP Default
  const [formCat, setFormCat] = useState('Alimento Barf');
  const [formImages, setFormImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80',
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Product details
  const [prodSku, setProdSku] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodCost, setProdCost] = useState('5000'); // CLP Default
  const [prodPhysicalStock, setProdPhysicalStock] = useState('15');
  const [prodDigitalStock, setProdDigitalStock] = useState('12');
  const [prodThreshold, setProdThreshold] = useState('5');
  const [supplierName, setSupplierName] = useState("Nature's Pet Distribution");
  const [supplierEmail, setSupplierEmail] = useState('orders@naturespet.com');

  // Service details
  const [servDuration, setServDuration] = useState('60');
  const [servCapacity, setServCapacity] = useState('2');
  const [servSpecialist, setServSpecialist] = useState('Dr. Carlos Valencia');

  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    try {
      const payload: Partial<CatalogItem> = {
        type: formType,
        title: formTitle,
        description: formDesc,
        price: Number(formPrice),
        category: formCat,
        images: formImages.length > 0 ? formImages : (formType === 'PRODUCT' 
          ? ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&q=80']
          : ['https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=500&q=80']),
        productDetails: formType === 'PRODUCT' ? {
          sku: prodSku || 'SKU-' + Date.now().toString().slice(-6),
          barcode: prodBarcode || '7423' + Math.floor(Math.random()*1000000000),
          costPrice: Number(prodCost),
          stockPhysical: Number(prodPhysicalStock),
          stockDigital: Number(prodDigitalStock),
          reorderThreshold: Number(prodThreshold),
          supplierInfo: { name: supplierName, email: supplierEmail }
        } : undefined,
        serviceDetails: formType === 'SERVICE' ? {
          durationMinutes: Number(servDuration),
          capacityPerSlot: Number(servCapacity),
          specialistName: servSpecialist,
          slotsAvailable: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '18:00' }
          ]
        } : undefined
      };

      await createCatalogItem(payload);
      alert('¡Ítem del catálogo añadido y propagado instantáneamente a todas las pantallas!');
      
      // Reset form
      setFormTitle('');
      setFormDesc('');
      setProdSku('');
      setProdBarcode('');
      setActiveTab('inventory'); // guide to check list
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- TAB 4: LOGISTICS - SEPARATE ACTIVE ORDERS ---
  const listPreparing = orders.filter(o => o.status === 'PREPARING');
  const listReady = orders.filter(o => o.status === 'READY' || o.status === 'BOOKED');
  const listInTransit = orders.filter(o => o.status === 'IN_TRANSIT');
  const listDelivered = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED');

  // --- TAB 5: QUICK POS TERMINAL (ECO-TECH Proposal B mockup style) ---
  const [posSearch, setPosSearch] = useState('');
  const [posCart, setPosCart] = useState<{ item: CatalogItem, quantity: number }[]>([]);
  const [posSuccessMsg, setPosSuccessMsg] = useState('');

  const filterPosCatalog = catalog.filter(i => 
    i.type === 'PRODUCT' &&
    (i.title.toLowerCase().includes(posSearch.toLowerCase()) || 
     i.productDetails?.sku.toLowerCase().includes(posSearch.toLowerCase()) ||
     i.productDetails?.barcode === posSearch)
  );

  const addPosCart = (item: CatalogItem) => {
    const existing = posCart.find(i => i.item.id === item.id);
    if (existing) {
      setPosCart(posCart.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setPosCart([...posCart, { item, quantity: 1 }]);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = catalog.find(i => i.productDetails?.barcode === posSearch);
    if (found) {
      addPosCart(found);
      setPosSearch('');
    } else {
      alert('Código de barras no detectado. Te recomendamos buscar por el SKU o nombre del producto.');
    }
  };

  const handlePosCheckout = async () => {
    if (posCart.length === 0) return;
    try {
      const itemsPayload = posCart.map(c => ({
        itemId: c.item.id,
        quantity: c.quantity
      }));

      // Runs through safety transaction concurrency locks
      const res = await submitPosSale(itemsPayload);
      if (res.success) {
        setPosSuccessMsg(`Venta procesada con éxito. ID: ${res.order?.id}`);
        setPosCart([]);
        setPosSearch('');
        setTimeout(() => setPosSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      alert(`Error Concurrente del POS: ${err.message}`);
    }
  };

  const posTotal = posCart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);

  return (
    <div className="flex flex-col lg:flex-row bg-gray-100 lg:h-screen lg:overflow-hidden w-full">
      
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden lg:flex w-64 bg-[#102948] text-white shrink-0 flex-col justify-between select-none h-full">
        <div>
          {/* Logo brand */}
          <div className="p-6 border-b border-gray-800 flex flex-col items-start space-y-1">
            <div className="flex items-center space-x-2">
              <img src={cmsIsotype} alt="Isotipo Petmall CMS" className="w-8 h-8 object-contain" />
              <span className="font-serif text-2xl font-bold tracking-tight text-[#DABD83]">
                Petmall
              </span>
            </div>
            <span className="font-sans text-3xs tracking-widest text-[#DABD83] uppercase font-bold pl-0.5 mt-0.5 opacity-80">
              CMS ENTERPRICE
            </span>
          </div>

          {/* User Profile Info Card */}
          {currentUser && (
            <div className="mx-4 my-4 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center space-x-3 text-left">
              <img 
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'} 
                alt={`${currentUser.firstName} ${currentUser.lastName}`}
                className="w-10 h-10 rounded-full bg-gray-200 border-2 border-[#DABD83] object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {currentUser.firstName || 'Colaborador'} {currentUser.lastName || 'Petmall'}
                </h4>
                <p className="text-[10px] text-[#DABD83] font-medium truncate font-mono">
                  {currentUser.role}
                </p>
                <p className="text-[9px] text-gray-400 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          )}

          {/* Nav list */}
          <nav className="p-4 space-y-1.5 text-left">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <BarChart className="w-4 h-4 mr-3" />
              Resumen del Negocio
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'catalog' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <Layers className="w-4 h-4 mr-3" />
              Ingreso de Catálogo
            </button>

            <button
              onClick={() => {
                setActiveTab('inventory');
                fetchCatalog();
              }}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'inventory' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <Database className="w-4 h-4 mr-3" />
              Control de Existencias
            </button>

            <button
              onClick={() => setActiveTab('logistics')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'logistics' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <Truck className="w-4 h-4 mr-3" />
              Gestión de Despachos
              {orders.filter(o => o.status === 'PREPARING').length > 0 && (
                <span className="ml-auto bg-[#102948] text-[#DABD83] text-3xs font-extrabold px-1.5 py-0.5 rounded-full border border-[#DABD83] animate-bounce">
                  {orders.filter(o => o.status === 'PREPARING').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'library' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <ImageIcon className="w-4 h-4 mr-3 text-[#DABD83]" />
              Biblioteca de Imágenes
              <span className="ml-auto bg-white/10 text-white text-3xs font-semibold px-2 py-0.5 rounded-full">
                {libraryImages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'users' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <Users className="w-4 h-4 mr-3" />
              Gestión de Usuarios
            </button>

            {currentUser?.role === 'SUPER_USER' && (
              <button
                onClick={() => setActiveTab('super')}
                className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-bold transition-all focus:outline-hidden cursor-pointer border ${
                  activeTab === 'super' 
                    ? 'bg-[#DABD83] text-[#102948] border-[#DABD83] shadow-md' 
                    : 'text-amber-400 bg-amber-950/20 border-amber-900/30 hover:bg-amber-950/40'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-3 text-brand-gold" />
                Control de Tiendas Súper
              </button>
            )}

            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-[#15803d] hover:text-white transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'pos' ? 'bg-[#16a34a] text-white shadow-xs' : 'text-green-400 bg-green-950/10'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mr-3" />
              Punto de Venta Físico (POS)
            </button>
          </nav>
        </div>

        {/* Brand foot labels */}
        <div className="p-6 border-t border-gray-800 text-3xs text-gray-400 font-semibold text-left space-y-4">
          <div>
            <p className="flex items-center text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              OMNICANAL ACTIVO
            </p>
            <p className="mt-1">Petmall SaaS ERP v6.4.2</p>
          </div>
          <button
            onClick={() => {
              logoutUser();
              navigate('/auth/login');
            }}
            className="flex items-center justify-center w-full px-3 py-2 bg-red-950/40 text-red-300 hover:bg-red-900/50 transition-all font-sans rounded-xl border border-red-500/20 text-3xs font-extrabold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" /> Cerrar Sesión CMS
          </button>
        </div>
      </aside>

      {/* Mobile/Tablet Sliding Sidebar Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop overlay */}
            <div 
              className="absolute inset-0 bg-black/60 transition-opacity" 
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <div className="pointer-events-auto w-screen max-w-xs bg-[#102948] text-white shadow-xl flex flex-col h-full transform transition-all duration-300 ease-in-out">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between col-span-1">
                  <div className="flex flex-col items-start space-y-1">
                    <div className="flex items-center space-x-2">
                      <img src={cmsIsotype} alt="Isotipo Petmall CMS" className="w-8 h-8 object-contain" />
                      <span className="font-serif text-xl font-bold tracking-tight text-[#DABD83]">
                        Petmall
                      </span>
                    </div>
                    <span className="font-sans text-3xs tracking-widest text-[#DABD83] uppercase font-bold pl-0.5 mt-0.5 opacity-80">
                      CMS ENTERPRICE
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5 text-[#DABD83]" />
                  </button>
                </div>

                {/* User Profile Info Card */}
                {currentUser && (
                  <div className="mx-4 my-4 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center space-x-3 text-left">
                    <img 
                      src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120'} 
                      alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      className="w-10 h-10 rounded-full bg-gray-200 border-2 border-[#DABD83] object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {currentUser.firstName || 'Colaborador'} {currentUser.lastName || 'Petmall'}
                      </h4>
                      <p className="text-[10px] text-[#DABD83] font-medium truncate font-mono">
                        {currentUser.role}
                      </p>
                      <p className="text-[9px] text-gray-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Nav list */}
                <nav className="p-4 space-y-1.5 text-left flex-1">
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'dashboard' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <BarChart className="w-4 h-4 mr-3" />
                    Resumen del Negocio
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('catalog');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'catalog' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <Layers className="w-4 h-4 mr-3" />
                    Ingreso de Catálogo
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('inventory');
                      fetchCatalog();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'inventory' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <Database className="w-4 h-4 mr-3" />
                    Control de Existencias
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('logistics');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'logistics' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <Truck className="w-4 h-4 mr-3" />
                    Gestión de Despachos
                    {orders.filter(o => o.status === 'PREPARING').length > 0 && (
                      <span className="ml-auto bg-[#102948] text-[#DABD83] text-3xs font-extrabold px-1.5 py-0.5 rounded-full border border-[#DABD83] animate-bounce">
                        {orders.filter(o => o.status === 'PREPARING').length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('library');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'library' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 mr-3 text-[#DABD83]" />
                    Biblioteca de Imágenes
                    <span className="ml-auto bg-white/10 text-white text-3xs font-semibold px-2 py-0.5 rounded-full">
                      {libraryImages.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('users');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'users' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4 mr-3" />
                    Gestión de Usuarios
                  </button>

                  {currentUser?.role === 'SUPER_USER' && (
                    <button
                      onClick={() => {
                        setActiveTab('super');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-bold transition-all focus:outline-hidden cursor-pointer border ${
                        activeTab === 'super' 
                          ? 'bg-[#DABD83] text-[#102948] border-[#DABD83] shadow-md' 
                          : 'text-amber-400 bg-amber-950/20 border-amber-900/40 hover:bg-amber-950/40'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mr-3 text-[#DABD83]" />
                      Control de Tiendas Súper
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab('pos');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-[#15803d] hover:text-white transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'pos' ? 'bg-[#16a34a] text-white shadow-xs' : 'text-green-400 bg-green-950/10'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 mr-3" />
                    Punto de Venta Físico (POS)
                  </button>
                </nav>

                {/* Brand foot labels */}
                <div className="p-6 border-t border-gray-800 text-3xs text-gray-400 font-semibold text-left space-y-4">
                  <div>
                    <p className="flex items-center text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                      OMNICANAL ACTIVO
                    </p>
                    <p className="mt-1">Petmall SaaS ERP v6.4.2</p>
                  </div>
                  <button
                    onClick={() => {
                      logoutUser();
                      setIsMobileMenuOpen(false);
                      navigate('/auth/login');
                    }}
                    className="flex items-center justify-center w-full px-3 py-2 bg-red-950/40 text-red-300 hover:bg-red-900/50 transition-all font-sans rounded-xl border border-red-500/20 text-3xs font-extrabold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Cerrar Sesión CMS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Workspace screen */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto lg:h-screen w-full">
        
        {/* Workspace dynamic header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-gray-200 gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white border border-gray-250 text-[#102948] hover:bg-gray-50 cursor-pointer"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-black text-[#102948] tracking-tight">
                {activeTab === 'dashboard' && 'Estadísticas del Negocio'}
                {activeTab === 'catalog' && 'Creador Inteligente de Catálogo'}
                {activeTab === 'inventory' && 'Tabla de Existencias Sincronizadas'}
                {activeTab === 'logistics' && 'Despachos de Delivery Hiperlocal'}
                {activeTab === 'pos' && 'Punto de Venta de Caja Físico — Caja 1'}
                {activeTab === 'library' && 'Biblioteca de Imágenes Omnicanal'}
                {activeTab === 'users' && 'Gestión de Personal & Administradores'}
                {activeTab === 'super' && 'Panel Súper Administrador Petmall'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'dashboard' && 'Visión general de ingresos, POS local vs Checkout digital.'}
                {activeTab === 'catalog' && 'Enrola nuevos productos o servicios con campos inteligentes dinámicos.'}
                {activeTab === 'inventory' && 'Monitorea niveles de stock, SKU, pasillos físicos de almacenamiento y compras.'}
                {activeTab === 'logistics' && 'Administra despachos express y confirma pedidos listos.'}
                {activeTab === 'pos' && 'Vende en mostrador con reducción inmediata de existencias.'}
                {activeTab === 'library' && 'Sube y organiza hasta 100 imágenes en carpetas personalizadas para la carga directa de tus productos.'}
                {activeTab === 'users' && 'Vincula y administra los correos autorizados para operar el CMS, condicionado por los límites de tu plan.'}
                {activeTab === 'super' && 'Administra y audita comercios enrolados y procesa cierres o bajas con eliminación en cascada.'}
              </p>
            </div>
          </div>


        </header>

        {/* --- DYNAMIC BODY SCREENS --- */}

        {/* SUB-SCREEN 1: DASHBOARD (Metrics & Graphs SVG) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 text-left">
            
            {/* Ficha de Suscripción CLP & Enlace de e-Store */}
            {(() => {
              const activePlanType = myStore?.planType || 'control_omnicanal';
              const activePlanName = myStore?.planName || 'Plan Control & Omnicanal 🚀';
              
              let planDetails = {
                price: '59.990 CLP / mes',
                commission: '4.5% + IVA',
                maxUsers: '6 usuarios',
                pos: 'POS Táctil en tiempo real unificado por WebSockets',
                support: 'Soporte prioritario rápido',
                features: ['Stock mínimo y mermas', 'Agenda de reservas y turnos caninos', 'Órdenes de compra B2B automáticas']
              };

              if (activePlanType === 'market_growth') {
                planDetails = {
                  price: '24.990 CLP / mes',
                  commission: '7.0% + IVA',
                  maxUsers: '2 usuarios',
                  pos: 'Modo básico/simulado (sin mermas ni turnos)',
                  support: 'Gestión básica por correo electrónico',
                  features: ['Listado en Marketplace común', 'Registro básico digital', 'Soporte vía tickets']
                };
              } else if (activePlanType === 'enterprise_elite') {
                planDetails = {
                  price: '149.900 CLP / mes',
                  commission: '2.5% + IVA',
                  maxUsers: 'Ilimitado',
                  pos: 'Avanzado con arqueos de caja registradoras y turnos',
                  support: 'Soporte dedicado las 24 horas del día (24/7)',
                  features: ['Landing page editable (CMS) propia', 'SEO orgánico local optimizado', 'Multi-sucursal (+35.000 CLP sucursal extra)', 'Inventario predictivo']
                };
              }

              const storeSlug = myStore?.name
                ? myStore.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                : 'mi-empresa';

              return (
                <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-3xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-2 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-4xs font-extrabold uppercase tracking-wide">
                        Suscripción Activa de esta Plataforma
                      </span>
                      <span className="text-4xs text-indigo-900 border border-indigo-200 bg-indigo-50 px-2 py-0.5 rounded-lg font-bold font-mono">VIGENTE DESDE 01/JUL/2026</span>
                    </div>
                    <h3 className="text-lg font-serif font-black text-[#102948] flex flex-wrap items-center gap-2">
                      <span>{activePlanName}</span>
                      {myStore?.isTrial && <span className="bg-[#DABD83]/20 text-indigo-950 text-4xs font-bold px-2 py-0.5 rounded-full border border-[#DABD83]/40">Prueba Gratis en Curso ({myStore.trialDaysLeft} Días)</span>}
                    </h3>
                    <div className="text-3xs text-gray-500 font-sans space-y-1">
                      <p>• <b>Costo Fijo Mensual:</b> <span className="text-[#102948] font-bold">{planDetails.price}</span></p>
                      <p>• <b>Comisión Marketplace (Take Rate):</b> {planDetails.commission}</p>
                      <p>• <b>Límite de Administración:</b> Hasta {planDetails.maxUsers} administradores</p>
                      <p>• <b>Punto de Venta (POS):</b> {planDetails.pos}</p>
                      <p>• <b>Nivel de Soporte:</b> {planDetails.support}</p>
                    </div>
                    
                    {/* URL slug display */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gray-50/50 p-2.5 rounded-lg border">
                      <div className="text-left w-full sm:w-auto">
                        <span className="text-[10px] text-gray-450 font-bold uppercase leading-none block">Web de Perfil Oficial de la Empresa:</span>
                        <p className="text-3xs text-gray-400 leading-normal mt-0.5">Visita la e-store oficial autogestionada directamente en Petmall.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs font-extrabold bg-[#102948]/5 text-indigo-900 px-3 py-1.5 rounded-lg border border-[#102948]/10 select-all">
                          /store/{storeSlug}
                        </span>
                        <button
                          onClick={() => navigate(isDemoMode ? `/demo/store/${storeSlug}` : `/store/${storeSlug}`)}
                          className="px-3 py-1.5 bg-[#102948] text-white hover:bg-[#cdaf7a] text-3xs font-black uppercase rounded-lg transition-all shadow-3xs shrink-0 cursor-pointer"
                        >
                          Ir a la Web ↗
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between h-full text-left">
                    <span className="text-4xs font-extrabold text-indigo-900 tracking-wider uppercase block mb-1">Ecosistema ERP Autorizado</span>
                    <ul className="text-3xs text-indigo-700 font-semibold space-y-1.5 flex-1 mt-2">
                      {planDetails.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-indigo-500 font-bold">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-4xs text-indigo-500 font-medium mt-3 leading-relaxed">
                      Soporte y sincronización total incluidos.
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SaaS Platform Bills Table — transparent compliance with system-agreed dates */}
            <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-3xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-serif font-black text-[#102948] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Historial de Cobros y Pagos de la Plataforma SaaS
                  </h3>
                  <p className="text-[10px] text-gray-450 uppercase font-extrabold tracking-wider mt-0.5">
                    Conciliación Transparente de Fechas Acordadas por el Sistema
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchSaasPayments}
                  className="px-2.5 py-1.5 bg-gray-50 text-[#102948] hover:bg-gray-100 font-sans text-4xs font-bold rounded-lg border border-gray-200 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Sincronizar Pagos
                </button>
              </div>

              {paymentsLoading ? (
                <p className="text-3xs text-gray-400 py-4 text-center font-bold">Cargando transacciones acordadas...</p>
              ) : saasPaymentsList.length === 0 ? (
                <p className="text-3xs text-gray-400 py-4 text-center font-bold">Tu tienda se encuentra en periodo de gracia/trial sin cargos programados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-3xs text-gray-500 font-sans">
                    <thead className="bg-[#102948]/5 text-[#102948] font-black uppercase text-[10px] tracking-wider rounded-lg border-b border-gray-150">
                      <tr>
                        <th className="px-3 py-2.5 rounded-l-lg">Periodo Facturación</th>
                        <th className="px-3 py-2.5">Fecha Acordada</th>
                        <th className="px-3 py-2.5">Fecha Ejecución</th>
                        <th className="px-3 py-2.5">Monto Fijado</th>
                        <th className="px-3 py-2.5">Método Cobro</th>
                        <th className="px-3 py-2.5">Estado</th>
                        <th className="px-3 py-2.5 rounded-r-lg text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {saasPaymentsList.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-3 font-extrabold text-[#102948]">{payment.billingPeriod}</td>
                          <td className="px-3 py-3 font-mono">{payment.plannedDate}</td>
                          <td className="px-3 py-3 font-mono text-gray-400">
                            {payment.executionDate || <span className="italic">Pendiente</span>}
                          </td>
                          <td className="px-3 py-3 font-black text-gray-800">${payment.amount.toLocaleString('es-CL')} CLP</td>
                          <td className="px-3 py-3 text-gray-400 text-[10px]">{payment.paymentMethod}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              payment.status === 'PAID' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            }`}>
                              {payment.status === 'PAID' ? '✓ EJECUTADO' : '● EXPIRA PRONTO'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            {payment.status !== 'PAID' ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`¿Ejecutar pago acordado de $${payment.amount.toLocaleString('es-CL')} CLP correspondiente a ${payment.billingPeriod} via PAT?`)) {
                                    try {
                                      const res = await fetch(`/api/saas-payments/${payment.id}/execute`, { method: 'POST' });
                                      if (res.ok) {
                                        alert('Pago de suscripción procesado exitosamente por la pasarela automática.');
                                        await fetchSaasPayments();
                                      } else {
                                        alert('No se pudo simular el pago automático de la cuota.');
                                      }
                                    } catch (err: any) {
                                      alert('Error de red al procesar el cobro: ' + err.message);
                                    }
                                  }
                                }}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white transition-all font-black uppercase rounded text-4xs cursor-pointer shadow-3xs"
                              >
                                Cobrar Ahora PAT
                              </button>
                            ) : (
                              <span className="text-4xs text-emerald-600 font-black uppercase">Sincronizado</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-4xs text-slate-400 mt-2 font-mono leading-relaxed">
                * El Ecosistema Petmall procesa de manera segura los pagos anuales o mensuales los días 5 de cada ciclo pactado en apego a los términos contratados.
              </p>
            </div>

            {/* Interactive CMS Customize Store banner */}
            <div className="bg-linear-to-r from-[#102948] to-[#1d3f6d] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-[#1d3f6d] hover:border-brand-gold/40 transition-colors duration-300">
              <div>
                <span className="px-2.5 py-0.5 bg-[#DABD83]/20 text-[#DABD83] border border-[#DABD83]/30 rounded-lg text-4xs font-extrabold uppercase tracking-wide">
                  Paleta & Branding Corporativo
                </span>
                <h3 className="text-base font-serif font-black mt-1.5 text-white">Consola de Personalización Autorizada</h3>
                <p className="text-3xs text-gray-300 font-sans mt-0.5 max-w-xl leading-relaxed">
                  Como administrador certificado desde el CMS, puedes personalizar y testear las tonalidades de color de tu tienda corporativa, logos personalizados, catálogo y la experiencia interactiva omnicanal.
                </p>
              </div>
              <button 
                onClick={() => {
                  const storeId = currentUser?.storeId || 'store_1';
                  navigate(isDemoMode ? `/demo/store/${storeId}?adminMode=true` : `/store/${storeId}?adminMode=true`);
                }}
                className="px-4 py-2.5 bg-[#DABD83] hover:bg-[#cdaf7a] text-[#102948] font-sans font-black text-2xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 active:scale-95"
              >
                🛠️ Personalizar mi tienda
              </button>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
               <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-3xs font-extrabold text-gray-404 uppercase tracking-widest block mb-1">GMV Total Mensual</span>
                  <span className="text-2xl font-serif font-black text-[#102948] block">${totalGMV.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-3xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-sm border border-green-200 mt-4 inline-block w-fit">
                  ↑ +14.6% vs mes anterior
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-3xs font-extrabold text-[#102948]/60 uppercase tracking-widest block mb-1">Ventas del POS Físico</span>
                  <span className="text-2xl font-serif font-black text-[#102948] block">${physicalSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-3xs text-gray-400 mt-4">
                  Caja e integraciones offline
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-3xs font-extrabold text-gray-404 uppercase tracking-widest block mb-1">Ventas Digitales</span>
                  <span className="text-2xl font-serif font-black text-[#102948] block">${digitalSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-3xs text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-sm border border-teal-200 mt-4 inline-block w-fit">
                  Ecommerce habilitado
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs flex flex-col justify-between">
                <div>
                  <span className="text-3xs font-extrabold text-gray-404 uppercase tracking-widest block mb-1">Margen Neto Promedio</span>
                  <span className="text-2xl font-serif font-black text-[#102948] block">{averageMarginPercent.toFixed(1)}%</span>
                </div>
                <div className="text-3xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200 mt-4 inline-block w-fit">
                  Optimizado por ventas directas
                </div>
              </div>

            </div>

            {/* Performance Graphics - Render beautiful native SVGs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Bar Chart representing mensual performance (Image 4 top left style) */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs">
                <h3 className="text-sm font-bold text-[#102948] tracking-tight mb-6">Ventas Totales Mensuales (Digital vs Físico)</h3>
                
                {/* SVG Bar chart */}
                <div className="h-64 flex items-end justify-between px-4 pb-2 pt-4 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 border-b border-gray-100 h-0" />
                  <div className="absolute inset-x-0 top-[25%] border-b border-gray-100 h-0" />
                  <div className="absolute inset-x-0 top-[50%] border-b border-gray-100 h-0" />
                  <div className="absolute inset-x-0 top-[75%] border-b border-gray-100 h-0" />

                  {/* Render 5 bars representing representative months */}
                  {[
                    { label: 'Feb', digital: 450, physical: 600 },
                    { label: 'Mar', digital: 520, physical: 650 },
                    { label: 'Abr', digital: 680, physical: 550 },
                    { label: 'May', digital: 850, physical: 720 },
                    { label: 'Jun (Hoy)', digital: 940, physical: 810 },
                  ].map((data, index) => {
                    const digHeight = (data.digital / 1000) * 100; // percent height
                    const phyHeight = (data.physical / 1000) * 100;
                    
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 h-full justify-end z-10">
                        <div className="flex space-x-2.5 items-end justify-center w-full h-[85%]">
                          {/* Digital bar */}
                          <div 
                            style={{ height: `${digHeight}%` }} 
                            className="w-4 bg-[#0541B9] rounded-t-xs transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
                          >
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#102948] text-white px-2 py-0.5 rounded-sm text-3xs font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                              ${data.digital * 150}
                            </span>
                          </div>

                          {/* Physical bar */}
                          <div 
                            style={{ height: `${phyHeight}%` }} 
                            className="w-4 bg-[#DABD83] rounded-t-xs transition-all duration-500 hover:opacity-90 relative group cursor-pointer"
                          >
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#102948] text-white px-2 py-0.5 rounded-sm text-3xs font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                              ${data.physical * 150}
                            </span>
                          </div>
                        </div>
                        <span className="text-2xs font-bold text-gray-400 mt-2.5">{data.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center space-x-6 mt-4 text-2xs font-semibold text-gray-500">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 bg-[#0541B9] rounded-full mr-1.5" /> Ventas Digitales (Marketplace)</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 bg-[#DABD83] rounded-full mr-1.5" /> Ventas POS Presencial</span>
                </div>
              </div>

               {/* Pie Chart representing Category allocations (Image 4 top right) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-2xs text-center flex flex-col justify-between">
                <h3 className="text-xs font-bold text-[#102948] tracking-tight pb-3 border-b mb-4">Categorías Top de Rendimiento</h3>
                
                {/* SVG Circle chart diagram */}
                <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Circle 1 */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ddd" strokeWidth="2.5" />
                    {/* Alimento */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#DABD83" strokeWidth="3" strokeDasharray="50 100" strokeDashoffset="0" />
                    {/* Medicinas */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#102948" strokeWidth="3" strokeDasharray="30 100" strokeDashoffset="-50" />
                    {/* Paseos */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#15803d" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-80" />
                  </svg>
                  
                  <div className="absolute flex flex-col justify-center items-center">
                    <span className="font-serif text-lg font-extrabold text-[#102948]">Petmall</span>
                    <span className="text-3xs text-gray-400 uppercase tracking-widest font-black">2026</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-2xs text-left max-w-xs mx-auto text-gray-650 font-medium">
                  <div className="flex justify-between items-center"><span className="flex items-center"><span className="w-2 h-2 bg-[#DABD83] rounded-full mr-2" />Alimentos naturales</span><span>50%</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center"><span className="w-2 h-2 bg-[#102948] rounded-full mr-2" />Fármacos y Vet</span><span>30%</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center"><span className="w-2 h-2 bg-green-700 rounded-full mr-2" />Peluquerías y Paseos</span><span>20%</span></div>
                </div>
              </div>

            </div>

            {/* Critical stock warnings panel */}
            <div className="bg-amber-50/40 rounded-xl border border-amber-150 p-5">
              <div className="flex items-center space-x-2.5 mb-3.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="font-serif text-sm font-black text-amber-800">Alertas de Reposición Inmediata</span>
              </div>
              
              {lowStockItems.length === 0 ? (
                <p className="text-2xs text-green-800">✓ Todos los stocks de productos digitales y tiendas centrales están sobre el nivel crítico.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-lg border border-amber-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-[#102948] block">{item.title}</span>
                        <span className="text-3xs font-mono text-gray-400">SKU: {item.productDetails?.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-3xs text-red-600 font-extrabold block">Stock: {item.productDetails?.stockPhysical} uds</span>
                        <button 
                          onClick={() => {
                            alert(`Órden de compra enviada prioritariamente al email ${item.productDetails?.supplierInfo.email} de ${item.productDetails?.supplierInfo.name}`);
                          }}
                          className="text-3xs font-black text-[#DABD83] underline uppercase cursor-pointer"
                        >
                          Emitir O.C.
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SUB-SCREEN 2: CATALOG FORM CREATOR (Two columns: Slider + Image manager on left, Form on Right) */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Dynamic catalog header panel */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl border border-gray-150 gap-4 text-left">
              <div>
                <h3 className="font-serif text-lg font-black text-[#102948]">Registro Inteligente Omnicanal</h3>
                <p className="text-2xs text-gray-400 font-semibold mt-1">
                  Ingresa nuevos productos o servicios. Los precios se consideran automáticos en <b>Pesos Chilenos (CLP $)</b>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#819B5A] text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-xs transition-all hover:bg-opacity-90 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-[#DABD83]" />
                <span>Vista Previa del Producto</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: SWIPER IMAGE CAROUSEL & REFERENCE ADDER */}
              <div className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col text-left">
                <div>
                  <span className="block text-2xs font-extrabold text-[#102948] tracking-widest uppercase mb-3">
                    Carrusel de Referencia (SwiperJS)
                  </span>
                  {formImages.length === 0 ? (
                    <div className="w-full h-64 bg-gray-50 rounded-xl border border-dashed border-gray-250 flex flex-col justify-center items-center text-center p-6">
                      <Upload className="w-8 h-8 text-gray-300 mb-2" />
                      <span className="text-xs text-gray-400 font-bold">Sin imágenes cargadas</span>
                      <p className="text-3xs text-gray-400 mt-1">Sube URLs personalizadas o selecciona presets abajo.</p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden shadow-2xs border border-gray-100">
                      <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={10}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        className="w-full h-64 bg-gray-50"
                      >
                        {formImages.map((img, idx) => (
                          <SwiperSlide key={idx} className="relative flex justify-center items-center">
                            <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setFormImages(formImages.filter((_, i) => i !== idx));
                              }}
                              className="absolute top-2.5 right-2.5 p-1.5 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition shadow-md cursor-pointer z-10"
                              title="Eliminar imagen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  )}
                </div>

                {/* Input box to add custom URL */}
                <div className="space-y-2">
                  <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider block">
                    Vincular Imagen por URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... o similar"
                      className="flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl.trim()) {
                          setFormImages([...formImages, newImageUrl.trim()]);
                          setNewImageUrl('');
                        }
                      }}
                      className="px-4 py-2.5 bg-[#102948] text-[#DABD83] rounded-xl font-bold text-xs hover:bg-opacity-95 cursor-pointer whitespace-nowrap"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Biblioteca Selector Button */}
                <div className="pt-4 border-t border-gray-100">
                  <span className="block text-2xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Carga Inteligente de Imágenes
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setModalActiveFolder('General');
                      setIsLibraryModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#102948] text-[#DABD83] hover:bg-opacity-95 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Folder className="w-4.5 h-4.5 text-[#DABD83]" />
                    <span>Seleccionar de Biblioteca</span>
                  </button>
                  <p className="text-3xs text-gray-400 mt-2 text-center font-medium">
                    Explora y selecciona tus imágenes organizadas por carpetas.
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: MAIN DATA SUBMISSION FORM */}
              <form onSubmit={handleCreateCatalogItem} className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 space-y-6 text-left">
                {/* PRODUCT / SERVICE Switcher (Mockup 4 style) */}
                <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                  <span className="text-2xs font-extrabold text-[#102948] tracking-widest uppercase mb-3">
                    ¿Qué estás ingresando al Mall hoy?
                  </span>
                  
                  <div className="relative bg-gray-100 p-1 rounded-2xl flex w-full max-w-sm border">
                    <button
                      type="button"
                      onClick={() => setFormType('PRODUCT')}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all focus:outline-hidden cursor-pointer ${
                        formType === 'PRODUCT'
                          ? 'bg-[#102948] text-[#DABD83] shadow-md'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      PRODUCTO FÍSICO
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('SERVICE')}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all focus:outline-hidden cursor-pointer ${
                        formType === 'SERVICE'
                          ? 'bg-[#102948] text-[#DABD83] shadow-md'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      SERVICIO CON CITA
                    </button>
                  </div>
                </div>

                {/* General Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="flex flex-col sm:col-span-2">
                    <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre o Título Descriptivo</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder={formType === 'PRODUCT' ? 'Alimento Gato Orgánico Natural 1kg' : 'Consulta Veterinaria General en Clínica'}
                      className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white animate-transition"
                    />
                  </div>

                  <div className="flex flex-col sm:col-span-2">
                    <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descripción Técnica</label>
                    <textarea
                      value={formDesc}
                      rows={2}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Escribe detalles acerca del producto o del servicio que el cliente final visualizará."
                      className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white animate-transition"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-2">PVP Cobrado al Público (CLP $)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="12990"
                      className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white animate-transition"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoría Principal</label>
                    <select
                      value={formCat}
                      onChange={(e) => setFormCat(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white"
                    >
                      <option value="Alimento Barf">Alimento Barf</option>
                      <option value="Salud Natural">Salud Natural</option>
                      <option value="Vegano">Vegano</option>
                      <option value="Paseadores">Paseadores (Servicio)</option>
                      <option value="Veterinarios">Veterinarios (Servicio)</option>
                    </select>
                  </div>

                </div>

                {/* DYNAMIC FORM SEGMENTS */}
                {formType === 'PRODUCT' ? (
                  <div className="border-t border-gray-150 pt-6 space-y-6">
                    <span className="block text-xs font-extrabold text-[#102948] uppercase tracking-wider">
                      Detalles de Almacenamiento & Inventario (Atributos Exclusivos Producto)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      
                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Código SKU Producto</label>
                        <input
                          type="text"
                          value={prodSku}
                          onChange={(e) => setProdSku(e.target.value)}
                          placeholder="CAT-FOOD-NEW-04"
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Código de Barras (EAN-13)</label>
                        <input
                          type="text"
                          value={prodBarcode}
                          onChange={(e) => setProdBarcode(e.target.value)}
                          placeholder="7423849129"
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Coste de Compra Mayorista (CLP $)</label>
                        <input
                          type="number"
                          step="1"
                          value={prodCost}
                          onChange={(e) => setProdCost(e.target.value)}
                          placeholder="5000"
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Existencias Físicas en POS</label>
                        <input
                          type="number"
                          value={prodPhysicalStock}
                          onChange={(e) => setProdPhysicalStock(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Existencias Digitales para App</label>
                        <input
                          type="number"
                          value={prodDigitalStock}
                          onChange={(e) => setProdDigitalStock(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Umbral Stock de Compra Crítico</label>
                        <input
                          type="number"
                          value={prodThreshold}
                          onChange={(e) => setProdThreshold(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col sm:col-span-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                        <span className="font-bold text-[#102948] mb-2.5 block">Información de Distribuidor / Proveedor</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Proveedor Nombre"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            className="px-4 py-2.5 bg-white border rounded-lg text-xs"
                          />
                          <input
                            type="email"
                            placeholder="Email Pedidos Proveedor"
                            value={supplierEmail}
                            onChange={(e) => setSupplierEmail(e.target.value)}
                            className="px-4 py-2.5 bg-white border rounded-lg text-xs"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-150 pt-6 space-y-6">
                    <span className="block text-xs font-extrabold text-[#102948] uppercase tracking-wider">
                      Horarios & Gestión de Citas (Atributos Exclusivos Servicio)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      
                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Duración de Bloque (Minutos)</label>
                        <input
                          type="number"
                          value={servDuration}
                          onChange={(e) => setServDuration(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Capacidad Simultánea por Bloque</label>
                        <input
                          type="number"
                          value={servCapacity}
                          onChange={(e) => setServCapacity(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-2xs font-bold text-gray-400 uppercase mb-2">Especialista / Médico Veterinario</label>
                        <input
                          type="text"
                          value={servSpecialist}
                          onChange={(e) => setServSpecialist(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                        />
                      </div>

                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-6 border-t border-gray-150 text-right">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#102948] text-[#DABD83] font-sans font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-opacity-95 shadow-md cursor-pointer transition-all"
                  >
                    Registrar Ítem en Ecosistema
                  </button>
                </div>
              </form>
            </div>

            {/* PREVIEW MODAL */}
            {isPreviewOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60">
                <div className="relative bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col text-left space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <h3 className="font-serif text-lg font-black text-[#102948] flex items-center">
                      <Sparkles className="w-5 h-5 text-[#819B5A] mr-2" />
                      Vista Previa de Ficha
                    </h3>
                    <button
                      onClick={() => setIsPreviewOpen(false)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="border rounded-xl overflow-hidden shadow-xs bg-gray-50/50">
                    {formImages.length === 0 ? (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        Sin imágenes de referencia
                      </div>
                    ) : (
                      <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={0}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        className="w-full h-56 bg-white"
                      >
                        {formImages.map((img, idx) => (
                          <SwiperSlide key={idx} className="flex justify-center items-center">
                            <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    )}

                    <div className="p-5 text-left space-y-3.5 bg-white">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="inline-block bg-[#819B5A]/15 text-[#819B5A] text-3xs font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1">
                            {formCat}
                          </span>
                          <h4 className="font-serif text-lg font-bold text-gray-900 tracking-tight">
                            {formTitle || 'Alimento o Servicio de Prueba'}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-[#0541B9] block">
                            ${Number(formPrice || 0).toLocaleString('es-CL')}
                          </span>
                          <span className="text-3xs text-gray-400 uppercase tracking-wider font-extrabold">Pesos Chilenos</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed border-t pt-3">
                        {formDesc || 'Por favor ingresa una descripción para previsualizar los detalles comerciales.'}
                      </p>

                      <div className="bg-[#102948]/5 rounded-lg p-3 border border-[#102948]/10 text-3xs space-y-1 text-gray-650">
                        <span className="font-extrabold uppercase text-[#102948]">Ficha de Datos Técnicos:</span>
                        <div><b>Tipo:</b> {formType === 'PRODUCT' ? 'Producto Físico en POS' : 'Servicio / Cita de Agenda'}</div>
                        {formType === 'PRODUCT' ? (
                          <>
                            <div><b>SKU:</b> {prodSku || 'EAN-Autogenerado'}</div>
                            <div><b>Stock Inicial POS:</b> {prodPhysicalStock} uds</div>
                            <div><b>Stock Inicial Web (App):</b> {prodDigitalStock} uds</div>
                          </>
                        ) : (
                          <>
                            <div><b>Especialista asignado:</b> {servSpecialist}</div>
                            <div><b>Duración Bloque:</b> {servDuration} minutos</div>
                            <div><b>Capacidad por Bloque:</b> {servCapacity} mascotas</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="w-full py-3 bg-[#102948] text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-opacity-95"
                  >
                    Entendido / Volver al editor
                  </button>
                </div>
              </div>
            )}

            {/* SELECTION MODAL FROM IMAGE LIBRARY */}
            {isLibraryModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60">
                <div className="relative bg-white max-w-4xl w-full rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-left">
                  
                  {/* Modal Header */}
                  <div className="p-5 border-b flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="font-serif text-lg font-black text-[#102948] flex items-center">
                        <Folder className="w-5 h-5 text-[#819B5A] mr-2" />
                        Seleccionar desde Biblioteca de Imágenes
                      </h3>
                      <p className="text-3xs text-gray-400 font-semibold mt-0.5">
                        Haz clic sobre las imágenes para añadirlas o removerlas de la ficha del producto actual.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLibraryModalOpen(false)}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-655 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-row overflow-hidden flex-1 h-full min-h-0">
                    
                    {/* Modal Sidebar - Folder Picker */}
                    <div className="w-1/4 border-r p-4 space-y-1 overflow-y-auto bg-gray-50 shrink-0">
                      <span className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b">
                        Carpetas
                      </span>
                      {folders.map(folder => {
                        const count = libraryImages.filter(img => img.folder === folder).length;
                        const isActive = modalActiveFolder === folder;
                        return (
                          <button
                            key={folder}
                            type="button"
                            onClick={() => setModalActiveFolder(folder)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-3xs font-bold text-left transition-all cursor-pointer ${
                              isActive 
                                ? 'bg-[#102948] text-[#DABD83]' 
                                : 'text-gray-650 hover:bg-white border hover:border-gray-200'
                            }`}
                          >
                            <span className="truncate">{folder}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/15 text-[#DABD83]' : 'bg-gray-200 text-gray-650'}`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Modal Body - Image Grid Viewer */}
                    <div className="w-3/4 p-6 overflow-y-auto min-h-0 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-xs font-bold text-gray-700">
                          {modalActiveFolder} &mdash; Haz clic para seleccionar
                        </span>
                        <span className="text-3xs font-semibold bg-[#819B5A]/15 text-[#819B5A] px-2 py-0.5 rounded-full">
                          Seleccionadas para ficha: {formImages.length}
                        </span>
                      </div>

                      {libraryImages.filter(img => img.folder === modalActiveFolder).length === 0 ? (
                        <div className="py-16 text-center border border-dashed rounded-xl bg-gray-50 flex flex-col justify-center items-center">
                          <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                          <span className="text-xs font-bold">No hay imágenes en esta carpeta</span>
                          <p className="text-3xs text-gray-400 mt-1">
                            Puedes subir imágenes a esta carpeta yendo a la pestaña <b>Biblioteca de Imágenes</b> del menú lateral.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {libraryImages.filter(img => img.folder === modalActiveFolder).map((image) => {
                            const isSelected = formImages.includes(image.url);
                            return (
                              <button
                                key={image.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormImages(formImages.filter(url => url !== image.url));
                                  } else {
                                    setFormImages([...formImages, image.url]);
                                  }
                                }}
                                className={`border rounded-xl overflow-hidden shadow-4xs text-left group relative flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                                  isSelected 
                                    ? 'ring-4 ring-[#819B5A]/85 border-[#819B5A] bg-[#819B5A]/5' 
                                    : 'border-gray-150 hover:border-gray-300'
                                }`}
                              >
                                <div className="w-full h-24 overflow-hidden bg-white relative shrink-0">
                                  <img 
                                    src={image.url} 
                                    alt={image.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 bg-[#819B5A] text-white p-1 rounded-full shadow-xs">
                                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                    </div>
                                  )}
                                </div>
                                <div className="p-2 bg-white flex-1 flex items-center">
                                  <span className="text-[10px] text-gray-900 font-bold truncate line-clamp-1 w-full" title={image.name}>
                                    {image.name}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t bg-gray-50/50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setFormImages([]);
                      }}
                      className="px-4 py-2 border border-gray-250 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Limpiar todo
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLibraryModalOpen(false)}
                      className="px-6 py-2 bg-[#102948] text-[#DABD83] hover:bg-opacity-95 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    >
                      Confirmar y Cerrar
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* SUB-SCREEN 6: BIBLIOTECA DE IMÁGENES */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            {/* Library Header info */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
              <div>
                <h3 className="font-serif text-lg font-black text-[#102948]">Gestor de Biblioteca de Imágenes</h3>
                <p className="text-2xs text-gray-400 font-semibold mt-1">
                  Organiza tus imágenes en carpetas personalizadas. Límite de carga de hasta <b>100 imágenes en total</b>.
                </p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-700">Progreso de Capacidad:</span>
                  <span className={`text-xs font-black ${libraryImages.length >= 90 ? 'text-red-650' : 'text-[#819B5A]'}`}>
                    {libraryImages.length} / 100
                  </span>
                </div>
                <div className="w-48 bg-gray-100 h-2 rounded-full mt-1.5 overflow-hidden border">
                  <div 
                    className={`h-full rounded-full transition-all duration-305 ${
                      libraryImages.length >= 90 ? 'bg-red-600' : libraryImages.length >= 75 ? 'bg-yellow-500' : 'bg-[#819B5A]'
                    }`}
                    style={{ width: `${Math.min(100, (libraryImages.length / 100) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: FOLDER LIST MANAGER */}
              <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-6 space-y-6 text-left">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-2xs font-extrabold text-[#102948] tracking-widest uppercase">
                    Carpetas / Categorías
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLibraryFolderCreatorOpen(!isLibraryFolderCreatorOpen)}
                    className="p-1 text-[#819B5A] hover:text-[#5d733e] font-extrabold flex items-center space-x-1 cursor-pointer"
                    title="Nueva Carpeta"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span className="text-3xs tracking-wider uppercase">Nueva</span>
                  </button>
                </div>

                {/* Inline Folder Creator */}
                {isLibraryFolderCreatorOpen && (
                  <div className="p-3.5 bg-gray-50 border rounded-xl space-y-3">
                    <span className="block text-3xs font-extrabold text-gray-500 uppercase tracking-wider">Crear Nueva Carpeta</span>
                    <input
                      type="text"
                      placeholder="Nombre de la carpeta (Ej: Mascotas)"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border rounded-lg text-xs font-semibold focus:outline-hidden"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLibraryFolderCreatorOpen(false);
                          setNewFolderName('');
                        }}
                        className="px-2.5 py-1 text-3xs font-bold text-gray-500 hover:text-gray-700 bg-white border rounded-md cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sanitized = newFolderName.trim();
                          if (!sanitized) return;
                          if (folders.map(f => f.toLowerCase()).includes(sanitized.toLowerCase())) {
                            alert('Ya existe una carpeta con ese nombre.');
                            return;
                          }
                          setFolders([...folders, sanitized]);
                          setActiveLibraryFolder(sanitized);
                          setNewFolderName('');
                          setIsLibraryFolderCreatorOpen(false);
                        }}
                        className="px-2.5 py-1 text-3xs font-bold text-white bg-[#819B5A] hover:bg-[#6c824c] rounded-md cursor-pointer"
                      >
                        Crear
                      </button>
                    </div>
                  </div>
                )}

                {/* Folder List Buttons */}
                <div className="space-y-1">
                  {folders.map((folder) => {
                    const count = libraryImages.filter(img => img.folder === folder).length;
                    const isActive = activeLibraryFolder === folder;
                    return (
                      <div key={folder} className="group flex items-center justify-between w-full rounded-xl transition-all">
                        <button
                          type="button"
                          onClick={() => setActiveLibraryFolder(folder)}
                          className={`flex-1 flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold text-left focus:outline-hidden cursor-pointer ${
                            isActive 
                              ? 'bg-[#102948] text-[#DABD83] shadow-xs' 
                              : 'text-gray-655 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Folder className={`w-4 h-4 mr-2.5 shrink-0 ${isActive ? 'text-[#DABD83]' : 'text-gray-405'}`} />
                          <span className="truncate">{folder}</span>
                          <span className={`ml-auto text-3xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/15 text-[#DABD83]' : 'bg-gray-100 text-gray-500'}`}>
                            {count}
                          </span>
                        </button>

                        {/* Delete Custom Folder */}
                        {!DEFAULT_FOLDERS.includes(folder) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Estás seguro de que deseas eliminar la carpeta "${folder}"? Las imágenes de esta carpeta se moverán automáticamente a "General".`)) {
                                setFolders(folders.filter(f => f !== folder));
                                setLibraryImages(libraryImages.map(img => img.folder === folder ? { ...img, folder: 'General' } : img));
                                if (activeLibraryFolder === folder) {
                                  setActiveLibraryFolder('General');
                                }
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-55 rounded-xl transition-all cursor-pointer ml-1"
                            title="Eliminar carpeta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: IMAGES IN SELECTED FOLDER */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Image Upload Form */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 text-left space-y-4">
                  <span className="block text-2xs font-extrabold text-[#102948] tracking-widest uppercase pb-2 border-b">
                    Añadir Nueva Imagen a Carpeta: <span className="text-[#819B5A] italic">"{activeLibraryFolder}"</span>
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-3xs font-bold text-gray-400 uppercase mb-1.5">Nombre de la imagen</label>
                      <input
                        type="text"
                        placeholder="Ej: Alimento Gato Orgánico"
                        value={libraryUploadName}
                        onChange={(e) => setLibraryUploadName(e.target.value)}
                        className="px-3.5 py-2 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-3xs font-bold text-gray-400 uppercase mb-1.5 flex justify-between items-center">
                        <span>URL de la imagen</span>
                        <button
                          type="button"
                          onClick={() => {
                            const randomIndex = Math.floor(Math.random() * RANDOM_PET_IMAGES.length);
                            setLibraryUploadUrl(RANDOM_PET_IMAGES[randomIndex]);
                            if (!libraryUploadName.trim()) {
                              setLibraryUploadName(`Foto de Biblioteca #${Math.floor(Math.random() * 900) + 100}`);
                            }
                          }}
                          className="text-[#819B5A] hover:underline font-bold text-[10px] lowercase cursor-pointer"
                        >
                          Generar demo aleatoria ⚡
                        </button>
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... o similar"
                        value={libraryUploadUrl}
                        onChange={(e) => setLibraryUploadUrl(e.target.value)}
                        className="px-3.5 py-2 bg-gray-50 border rounded-xl text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <p className="text-3xs text-gray-400 font-semibold">
                      Tip: Presiona el botón de demo rápida para poblar velozmente la galería de pruebas.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const name = libraryUploadName.trim();
                        const url = libraryUploadUrl.trim();
                        if (!name || !url) {
                          alert('Por favor, ingresa tanto el nombre como la URL del recurso.');
                          return;
                        }
                        if (libraryImages.length >= 100) {
                          alert('Has alcanzado el límite máximo de 100 imágenes en tu biblioteca de recursos Petmall.');
                          return;
                        }
                        const newImg: LibraryImage = {
                          id: Date.now().toString(),
                          name,
                          url,
                          folder: activeLibraryFolder
                        };
                        setLibraryImages([...libraryImages, newImg]);
                        setLibraryUploadName('');
                        setLibraryUploadUrl('');
                      }}
                      className="px-5 py-2.5 bg-[#102948] text-[#DABD83] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-opacity-95 shadow-sm transition-all cursor-pointer"
                    >
                      Añadir Imagen a Biblioteca
                    </button>
                  </div>
                </div>

                {/* Image Grid of Selected Folder */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 text-left space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-2xs font-extrabold text-[#102948] tracking-widest uppercase">
                      Imágenes Cargadas en {activeLibraryFolder} ({libraryImages.filter(img => img.folder === activeLibraryFolder).length})
                    </span>
                  </div>

                  {libraryImages.filter(img => img.folder === activeLibraryFolder).length === 0 ? (
                    <div className="py-12 flex flex-col items-center text-center justify-center border border-dashed rounded-xl bg-gray-50 text-gray-450">
                      <ImageIcon className="w-10 h-10 text-gray-355 mb-2" />
                      <span className="text-xs font-bold">No hay imágenes en esta carpeta</span>
                      <p className="text-3xs text-gray-400 mt-1">Sube una URL arriba o genera una foto de prueba demo.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {libraryImages.filter(img => img.folder === activeLibraryFolder).map((image) => (
                        <div key={image.id} className="border border-gray-150 rounded-xl overflow-hidden shadow-2xs group relative bg-gray-50 flex flex-col justify-between">
                          <div className="w-full h-32 overflow-hidden bg-white relative">
                            <img 
                              src={image.url} 
                              alt={image.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de eliminar "${image.name}" de la biblioteca?`)) {
                                    setLibraryImages(libraryImages.filter(img => img.id !== image.id));
                                  }
                                }}
                                className="p-1 px-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-3xs font-extrabold uppercase shadow-sm cursor-pointer"
                                title="Eliminar de biblioteca"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-2.5 bg-white space-y-1.5 border-t">
                            <span className="block text-3xs text-gray-905 font-bold truncate" title={image.name}>
                              {image.name}
                            </span>
                            
                            {/* Move folder option */}
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-gray-400 font-semibold">Mover a:</span>
                              <select
                                value={image.folder}
                                onChange={(e) => {
                                  setLibraryImages(libraryImages.map(img => img.id === image.id ? { ...img, folder: e.target.value } : img));
                                }}
                                className="text-[10px] font-bold text-[#819B5A] bg-transparent border-0 py-0 pl-1 pr-4 focus:ring-0 cursor-pointer focus:outline-hidden"
                              >
                                {folders.map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* SUB-SCREEN 3: INVENTORY TABLE */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-2xs text-left">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="font-serif text-base font-black text-[#102948]">Inventario Unificado Omnicanal</h3>
                <p className="text-3xs text-gray-455 uppercase font-bold tracking-wider mt-0.5">Sincronización instantánea POS & Marketplace</p>
              </div>
              <button 
                onClick={fetchCatalog}
                className="text-xs text-[#102948] hover:underline flex items-center font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#DABD83]" /> Refrescar Base de Datos
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-3xs font-extrabold text-gray-400 uppercase tracking-widest text-left">
                    <th className="p-4 pl-6">Foto / SKU</th>
                    <th className="p-4">Ítem / Tipo</th>
                    <th className="p-4">Existencia POS (Física)</th>
                    <th className="p-4">Existencia Web (Digital)</th>
                    <th className="p-4"> Wholesales Coste</th>
                    <th className="p-4">PVP</th>
                    <th className="p-4 text-center">Estado Alerta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs">
                  {catalog.map((item) => {
                    const isProduct = item.type === 'PRODUCT';
                    const stockPhys = isProduct ? (item.productDetails?.stockPhysical || 0) : 'N/A (Cita)';
                    const stockDigital = isProduct ? (item.productDetails?.stockDigital || 0) : 'N/A (Cita)';
                    const wholesaleCost = isProduct ? `$${item.productDetails?.costPrice}` : 'N/A';
                    
                    // Alert color checks
                    let alertBadge = <span className="bg-green-150 text-green-800 text-2xs px-2.5 py-0.5 rounded-full font-bold">Suficiente</span>;
                    if (isProduct) {
                      const threshold = item.productDetails?.reorderThreshold || 5;
                      if ((item.productDetails?.stockPhysical || 0) <= threshold) {
                        alertBadge = <span className="bg-red-100 text-red-800 text-2xs px-2.5 py-0.5 rounded-full font-bold">Crítico</span>;
                      } else if ((item.productDetails?.stockPhysical || 0) <= threshold + 5) {
                        alertBadge = <span className="bg-yellow-100 text-amber-800 text-2xs px-2.5 py-0.5 rounded-full font-bold">Alerta</span>;
                      }
                    } else {
                      alertBadge = <span className="bg-[#CCB492]/25 text-[#102948] text-2xs px-2.5 py-0.5 rounded-full font-bold border border-[#CCB492]/50">Capacidad: {item.serviceDetails?.capacityPerSlot}</span>;
                    }

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6 flex items-center space-x-3.5">
                          <img src={item.images[0]} alt="" className="w-10 h-10 object-cover rounded-md border" />
                          <span className="font-mono text-3xs font-bold text-gray-500">
                            {isProduct ? item.productDetails?.sku : 'SERV-CAP'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-[#102948] block">{item.title}</span>
                          <span className="text-3xs px-2 py-0.5 uppercase bg-gray-100 text-gray-600 rounded-sm font-semibold mt-1 inline-block">
                            {item.type}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-[#102948]">{stockPhys}</td>
                        <td className="p-4 font-mono font-bold text-teal-700">{stockDigital}</td>
                        <td className="p-4 font-mono text-gray-500">{wholesaleCost}</td>
                        <td className="p-4 font-mono font-bold text-[#102948]">${item.price.toFixed(2)}</td>
                        <td className="p-4 text-center">{alertBadge}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-SCREEN 4: LOGISTICS DELIVERY BOARD */}
        {activeTab === 'logistics' && (
          <div className="space-y-6 text-left">
            <div className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif text-base font-black text-[#102948]">Centro de Despacho & Control Logístico</h3>
                <p className="text-3xs text-gray-450 uppercase font-black">Monitorea estados de pedidos en tiempo real con geolocalización</p>
              </div>
              <div className="flex space-x-3 text-xs">
                <span className="flex items-center text-[#16a34a] font-bold"><span className="w-2.5 h-2.5 bg-[#16a34a] rounded-full mr-1.5 animate-pulse" /> SgTo. Despachos Local</span>
              </div>
            </div>

            {/* Kanban Columns (Logistics layout Image 4 center) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Column 1: Pendientes / Preparando */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <span className="text-xs font-extrabold text-[#102948] uppercase">Pendientes ({listPreparing.length})</span>
                  <span className="w-5 h-5 bg-[#102948] text-white rounded-full flex items-center justify-center text-3xs font-bold">{listPreparing.length}</span>
                </div>
                <div className="space-y-3">
                  {listPreparing.map(o => (
                    <div key={o.id} className="bg-white p-4.5 rounded-lg border shadow-3xs space-y-3">
                      <div className="flex justify-between text-3xs font-bold text-gray-500 border-b pb-1.5">
                        <span>Ref ID: <span className="font-mono text-[#102948]">{o.id}</span></span>
                        <span className="capitalize text-green-700">{o.orderType.toLowerCase().replace(/_/g, ' ')}</span>
                      </div>
                      <p className="font-bold text-xs text-[#102948]" id={`customer-${o.id}`}>{o.customerName || 'Cliente'}</p>
                      
                      <div className="bg-yellow-50 text-amber-800 text-3xs p-1.5 rounded-sm font-semibold border border-yellow-100">
                        Total: ${o.total.toFixed(2)}
                      </div>

                      <button
                        onClick={() => updateOrderStatus(o.id, 'READY')}
                        className="w-full py-1.5 bg-[#DABD83] text-[#102948] rounded-md font-bold text-3xs uppercase tracking-wider cursor-pointer font-sans"
                        id={`btn-ready-${o.id}`}
                      >
                        Marcar Listo para Envíos
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Listas / Reservadas */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <span className="text-xs font-extrabold text-[#102948] uppercase">Para Despacho / Citas ({listReady.length})</span>
                  <span className="w-5 h-5 bg-[#DABD83] text-[#102948] rounded-full flex items-center justify-center text-3xs font-bold">{listReady.length}</span>
                </div>
                <div className="space-y-3">
                  {listReady.map(o => (
                    <div key={o.id} className="bg-white p-4.5 rounded-lg border shadow-3xs space-y-3">
                      <div className="flex justify-between text-3xs font-bold text-gray-500 border-b pb-1.5">
                        <span>Ref ID: <span className="font-mono text-[#102948]">{o.id}</span></span>
                        <span className="capitalize text-[#DABD83]">{o.status}</span>
                      </div>
                      <p className="font-bold text-xs text-[#102948]" id={`customer-ready-${o.id}`}>{o.customerName}</p>

                      {o.orderType === 'SERVICE_BOOKING' ? (
                        <div className="bg-blue-50/50 text-[#102948] text-3xs p-1.5 rounded-sm font-semibold border border-blue-100">
                          📅 {o.items[0]?.bookingSchedule?.date} | Horario: {o.items[0]?.bookingSchedule?.timeSlot}
                        </div>
                      ) : (
                        <div className="bg-gray-50 text-gray-500 text-3xs p-1.5 rounded-sm font-semibold border">
                          Listo para asignar motorista.
                        </div>
                      )}

                      {o.orderType !== 'SERVICE_BOOKING' ? (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'IN_TRANSIT')}
                          className="w-full py-1.5 bg-[#102948] text-white rounded-md font-bold text-3xs uppercase tracking-wider cursor-pointer font-sans"
                        >
                          Asignar Ruta & Enviar
                        </button>
                      ) : (
                        <button
                          onClick={() => updateOrderStatus(o.id, 'COMPLETED')}
                          className="w-full py-1.5 bg-[#16a34a] text-white rounded-md font-bold text-3xs uppercase tracking-wider cursor-pointer font-sans"
                        >
                          Concluir Cita
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: En Ruta */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <span className="text-xs font-extrabold text-[#102948] uppercase">En Ruta ({listInTransit.length})</span>
                  <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-3xs font-bold">{listInTransit.length}</span>
                </div>
                <div className="space-y-3">
                  {listInTransit.map(o => (
                    <div key={o.id} className="bg-white p-4.5 rounded-lg border shadow-3xs space-y-3">
                      <div className="flex justify-between text-3xs font-bold text-gray-500 border-b pb-1.5">
                        <span>Ref ID: <span className="font-mono text-[#102948]">{o.id}</span></span>
                        <span className="text-teal-700 font-extrabold uppercase">En Reparto</span>
                      </div>
                      <p className="font-bold text-xs text-[#102948]">{o.customerName}</p>

                      <div className="text-3xs text-gray-500 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 animate-bounce shrink-0" />
                        <span className="line-clamp-1">Dirección: Providencia, CL</span>
                      </div>

                      <button
                        onClick={() => updateOrderStatus(o.id, 'DELIVERED')}
                        className="w-full py-1.5 bg-green-750 text-white hover:bg-green-800 rounded-md font-bold text-2xs uppercase tracking-wider cursor-pointer font-sans bg-green-700"
                      >
                        Confirmar Recibido / Entregado
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Entregado / Completado */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <span className="text-xs font-extrabold text-[#102948] uppercase">Entregados ({listDelivered.length})</span>
                  <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-3xs font-bold">{listDelivered.length}</span>
                </div>
                <div className="space-y-3">
                  {listDelivered.map(o => (
                    <div key={o.id} className="bg-white p-4.5 rounded-lg border border-gray-250 opacity-75 shadow-3xs space-y-2">
                      <div className="flex justify-between text-3xs font-bold text-gray-500 mb-1">
                        <span>Ref ID: <span className="font-mono text-gray-900">{o.id}</span></span>
                        <span className="text-green-700 font-bold uppercase">Entregado</span>
                      </div>
                      <p className="font-bold text-xs text-gray-650 line-clamp-1">{o.customerName}</p>
                      <div className="flex items-center text-3xs text-[#16a34a] font-bold">
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span>Sincronizado POS & Digital</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUB-SCREEN 5: POINT OF SALE Terminal Register (Mockup 4 bottom right "Propuesta B Eco-Tech") */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            
            {/* Quick Catalog Touch Panel (Left) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-150 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-black text-[#102948] mb-4">Registro Rápido de Venta de Caja</h3>
                
                {/* Search Bar matching barcode scanner */}
                <form onSubmit={handleBarcodeSubmit} className="relative w-full mb-6">
                  <input
                    type="text"
                    required
                    placeholder="Escribe el nombre del ítem o escanea el código de barras..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#DABD83] outline-hidden text-[#102948] font-semibold"
                  />
                  <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#DABD83] hover:text-[#102948] transition-colors">
                    <Search className="w-5 h-5" />
                  </button>
                </form>

                {/* Grid items helper buttons */}
                <span className="block text-3xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">
                  Productos Disponibles en Tienda Física (POS)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filterPosCatalog.map((item) => {
                    const physStock = item.productDetails?.stockPhysical || 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addPosCart(item)}
                        className="p-3.5 rounded-xl border border-gray-150 hover:border-[#DABD83] text-left flex items-center space-x-3 transition-all cursor-pointer bg-gray-50 hover:bg-white"
                      >
                        <img src={item.images[0]} alt="" className="w-10 h-10 object-cover rounded-md border" />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-[#102948] text-xs block truncate">{item.title}</span>
                          <span className="text-3xs text-gray-400 font-mono block">SKU: {item.productDetails?.sku}</span>
                          <span className={`text-2xs font-extrabold block mt-0.5 ${physStock <= 5 ? 'text-red-650' : 'text-gray-500'}`}>
                            Stock físico: {physStock} uds
                          </span>
                        </div>
                        <div className="font-mono text-xs font-bold text-[#102948]">${item.price.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-50/50 p-3.5 rounded-lg border border-amber-100 text-3xs text-amber-900 font-medium leading-relaxed mt-6">
                💡 Al concretar una venta física en este POS, el "Lock Manager" bloqueará concurrentemente estos IDs de producto en base de datos. Esto previene que un cliente en el checkout del Marketplace B2C compre el mismo artículo si quedaba la última unidad en existencia.
              </div>
            </div>

            {/* Quick checkout Ledger column on right */}
            <div className="lg:col-span-5 bg-[#102948] text-white rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-[#DABD83] text-base font-black mb-4 pb-3 border-b border-gray-800">
                  Resumen Venta POS
                </h3>

                {posSuccessMsg && (
                  <div className="bg-green-700 text-white p-3 rounded-lg text-2xs mb-4 font-bold animate-pulse">
                    {posSuccessMsg}
                  </div>
                )}

                {posCart.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 select-none">
                    <ShoppingBag className="w-10 h-10 mx-auto text-gray-500 mb-3.5" />
                    <p className="text-xs">Ledger de caja física vacío.</p>
                    <p className="text-3xs text-gray-500 mt-1">Busca y añade ítems desde el panel izquierdo.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-800 border-b border-gray-800 mb-6">
                    {posCart.map((c, i) => (
                      <li key={i} className="py-3.5 flex justify-between items-center text-xs">
                        <div className="min-w-0 pr-4">
                           <span className="font-bold text-gray-250 block truncate">{c.item.title}</span>
                           <span className="text-3xs text-gray-500 font-mono block">SKU: {c.item.productDetails?.sku}</span>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="flex items-center bg-gray-800 text-[#DABD83] px-2 py-0.5 rounded-sm font-mono font-bold">
                            <span className="text-2xs">x{c.quantity}</span>
                          </div>
                          <div className="font-mono text-[#DABD83] font-bold">
                            ${(c.item.price * c.quantity).toFixed(2)}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setPosCart(posCart.filter(item => item.item.id !== c.item.id))}
                            className="text-red-400 hover:text-red-500 font-bold focus:outline-hidden"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                {/* Total box */}
                <div className="flex justify-between items-baseline pt-4 border-t border-gray-800">
                  <span className="text-xs text-gray-400 font-bold uppercase">Total Cobro Caja</span>
                  <span className="font-mono text-2xl font-black text-[#DABD83]">${posTotal.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={handlePosCheckout}
                  className={`w-full mt-6 py-3.5 rounded-xl font-bold font-sans text-xs uppercase tracking-widest text-center transition-all ${
                    posCart.length === 0 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#DABD83] text-[#102948] hover:bg-opacity-95 shadow-md cursor-pointer'
                  }`}
                >
                  Concretar Venta Caja ($)
                </button>
              </div>

            </div>

          </div>
        )}

        {/* SUB-SCREEN 7: USER MANAGEMENT SYSTEM */}
        {activeTab === 'users' && (
          <div className="space-y-8 text-left animate-fadeIn">
            
            {/* Info and limit indicator cards */}
            {(() => {
              const activePlanType = myStore?.planType || 'control_omnicanal';
              const activePlanName = myStore?.planName || 'Plan Control & Omnicanal 🚀';
              
              const maxUsers = activePlanType === 'market_growth' ? 2 : activePlanType === 'control_omnicanal' ? 6 : Infinity;
              const maxUsersLabel = isFinite(maxUsers) ? `${maxUsers} administradores` : 'Ilimitados';
              
              const percentUsed = isFinite(maxUsers) ? Math.min(100, (storeUsers.length / maxUsers) * 100) : 0;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Active Plan info */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-3xs">
                    <span className="text-4xs font-extrabold text-[#DABD83] uppercase tracking-wider block mb-1">
                      Plan de Suscripción Actual
                    </span>
                    <h4 className="text-base font-serif font-black text-[#102948]">{activePlanName}</h4>
                    <p className="text-3xs text-gray-500 mt-2 font-semibold">
                      • Límite de Personal: <span className="text-[#102948] font-bold">{maxUsersLabel}</span>
                    </p>
                    <p className="text-3xs text-gray-500 mt-1 font-semibold">
                      • Usuarios Registrados: <span className="text-[#102948] font-bold">{storeUsers.length}</span>
                    </p>
                  </div>

                  {/* Limit visual percentage */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-3xs flex flex-col justify-between">
                    <div>
                      <span className="text-4xs font-extrabold text-indigo-900 uppercase tracking-wider block mb-1">
                        Consumo de Cupos de Colaboradores
                      </span>
                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-lg font-black text-[#102948]">
                          {storeUsers.length} <span className="text-xs text-gray-400">/ {isFinite(maxUsers) ? maxUsers : '∞'}</span>
                        </span>
                        {isFinite(maxUsers) && (
                          <span className="text-3xs font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            {percentUsed.toFixed(0)}% Utilizado
                          </span>
                        )}
                      </div>
                    </div>
                    {isFinite(maxUsers) && (
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-3 border border-gray-200">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentUsed >= 90 ? 'bg-red-650' : percentUsed >= 70 ? 'bg-yellow-500' : 'bg-green-600'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Recommendation banner upgrade */}
                  <div className="bg-gradient-to-br from-indigo-900 to-[#102948] rounded-2xl p-6 text-white border border-indigo-950 flex flex-col justify-between">
                    <div>
                      <span className="text-5xs bg-[#DABD83] text-[#102948] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block mb-1.5 shadow-2xs font-mono">
                        ¿Necesitas más personal?
                      </span>
                      <p className="text-3xs text-gray-200 leading-relaxed font-sans mt-1 font-light">
                        Sube a nuestro plan de nivel corporativo <b>Elite</b> para desbloquear la creación de usuarios administradores totalmente <b>ilimitados</b>, ideales para multi-sucursales.
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-4xs text-[#DABD83] font-extra-bold hover:underline cursor-pointer block">
                        Ver planes de actualización ↗
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Main Interactive Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Card (Left Col) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-150 p-6 shadow-3xs">
                <h3 className="font-serif text-base font-black text-[#102948] mb-4 flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-green-50 text-[#819B5A] border border-green-200">
                    <Plus className="w-4 h-4" />
                  </span>
                  <span>Agregar Nuevo Usuario</span>
                </h3>

                <form onSubmit={handleAddUser} className="space-y-4">
                  {userSuccessMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-3xs font-semibold text-[#819B5A]">
                      ✓ {userSuccessMessage}
                    </div>
                  )}

                  {userErrorMessage && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-3xs font-semibold text-red-650">
                      ⚠ {userErrorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Andrés"
                        value={newUserFirstName}
                        onChange={(e) => setNewUserFirstName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-[#DABD83] outline-hidden text-[#102948] font-bold"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">
                        Apellido
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Salas"
                        value={newUserLastName}
                        onChange={(e) => setNewUserLastName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-[#DABD83] outline-hidden text-[#102948] font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">
                      Correo Electrónico Corporativo
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="colaborador@tuempresa.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#DABD83] outline-hidden text-[#102948] font-semibold pl-10"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">
                      Foto de Perfil (Opcional - URL)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... o vacío"
                      value={newUserAvatarUrl}
                      onChange={(e) => setNewUserAvatarUrl(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#DABD83] outline-hidden text-[#102948] font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">
                      Rol & Nivel de Permisos
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#DABD83] outline-hidden text-[#102948] font-bold cursor-pointer"
                    >
                      <option value="STORE_STAFF">Personal de Tienda (STORE_STAFF) — Vista de POS y Entregas</option>
                      <option value="STORE_OWNER">Administrador Principal (STORE_OWNER) — Acceso Completo</option>
                    </select>
                    <p className="text-[10px] text-gray-450 leading-normal pl-1">
                      El personal de tienda solo operará el Punto de Venta (POS) y visualización de inventarios mínimos para acelerar el mostrador.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={userLoading}
                    className="w-full bg-[#102948] hover:bg-[#cdaf7a] hover:text-[#102948] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    {userLoading ? 'Procesando en vivo...' : 'Vincular Administrador'}
                  </button>
                </form>
              </div>

              {/* Users list (Right Col) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-150 p-6 shadow-3xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 text-left">
                  <div>
                    <h3 className="font-serif text-base font-black text-[#102948]">Lista de Administradores Autorizados</h3>
                    <p className="text-3xs text-gray-400 font-semibold leading-normal">
                      Cuentas con derechos de inicio de sesión integrados en este comercio.
                    </p>
                  </div>
                  <button 
                    onClick={loadStoreUsers}
                    className="px-3 py-1.5 border hover:bg-gray-50 text-[#102948] rounded-xl text-3xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-once" /> Sincronizar Cuentas
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-500 font-sans">
                    <thead className="bg-[#102948]/5 text-[#102948] font-black uppercase text-[10px] tracking-wider rounded-lg border-b border-gray-150">
                      <tr>
                        <th className="px-4 py-3.5 rounded-l-xl">Usuario</th>
                        <th className="px-4 py-3.5">Email de Colaborador</th>
                        <th className="px-4 py-3.5">Rol Designado</th>
                        <th className="px-4 py-3.5">Estado de Cuenta</th>
                        <th className="px-4 py-3.5 rounded-r-xl text-right">Controles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {storeUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400 font-bold">
                            Cargando lista de usuarios administradores autorizados...
                          </td>
                        </tr>
                      ) : (
                        storeUsers.map((usr) => {
                          const isSelf = usr.email.toLowerCase() === currentUser?.email?.toLowerCase();
                          const fallbackAvatar = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120';
                          const displayName = usr.firstName && usr.lastName ? `${usr.firstName} ${usr.lastName}` : 'Colaborador Petmall';
                          return (
                            <tr key={usr.email} className={`hover:bg-gray-50/50 transition-colors ${isSelf ? 'bg-yellow-50/30' : ''}`}>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={usr.avatarUrl || fallbackAvatar} 
                                    className="w-8 h-8 rounded-full border border-gray-200 object-cover shrink-0" 
                                    alt={displayName}
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-[#102948] flex items-center gap-1.5">
                                      {displayName}
                                      {isSelf && (
                                        <span className="bg-[#DABD83] text-[#102948] text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-[#102948]/10 whitespace-nowrap">
                                          Tú (Activo)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-mono font-bold text-[#102948]">
                                <span>{usr.email}</span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-4xs font-extrabold ${usr.role === 'STORE_OWNER' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'bg-gray-105 text-gray-700 border border-gray-250'}`}>
                                  {usr.role}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="flex items-center gap-1.5 text-[#819B5A] text-2xs font-extrabold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  Habilitado
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(usr.email)}
                                  disabled={isSelf}
                                  className={`p-2 rounded-lg transition-all ${isSelf ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-red-550 hover:bg-red-50 border border-transparent hover:border-red-200 cursor-pointer'}`}
                                  title={isSelf ? "No puedes auto-revocar tu acceso al CMS" : `Eliminar acceso para ${usr.email}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 bg-[#DABD83]/5 p-4 rounded-xl border border-[#DABD83]/20 flex items-start gap-3">
                  <span className="p-1 rounded-lg bg-yellow-105 border border-yellow-300 text-yellow-700 shrink-0 font-bold block">⚠</span>
                  <div className="text-3xs text-[#102948] leading-normal font-semibold">
                    <p className="font-bold uppercase text-indigo-950">Lineamientos de Seguridad Multidispositivo:</p>
                    <p className="mt-1">
                      Cualquier colaborador agregado mediante este panel podrá iniciar sesión inmediatamente utilizando los portales unificados del CMS Petmall. Recuerda resguardar los niveles de permisos asignados para cuidar la integridad del comercio.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUB-SCREEN 8: SUPER ADMINISTRADOR PANEL (Only for Role SUPER_USER) */}
        {activeTab === 'super' && (
          <div className="space-y-8 text-left">
            
            {/* Super Admin Welcome Hero */}
            <div className="bg-[#102948] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-white/5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-[#DABD83]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="bg-amber-400 text-[#102948] text-3xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Portal de Gobierno Central
                  </span>
                  <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight mt-1 text-[#DABD83]">
                    ¡Bienvenida, Súper Administradora {currentUser?.firstName || 'Sofía'}!
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    Operas con credenciales raíz con revocación unificada. Puedes visualizar la red completa de tiendas SaaS agregadas en vivo y borrar comercios inactivos o caducos con purgas encadenadas completas (Productos, Categorías, y Colaboradores).
                  </p>
                </div>
                
                {/* Meta stats badge */}
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0 font-sans text-center grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-300 font-bold uppercase">Total Comercios</p>
                    <p className="text-lg font-black text-[#DABD83]">{stores.length}</p>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <p className="text-[10px] text-gray-300 font-bold uppercase">Catálogo Global</p>
                    <p className="text-lg font-black text-[#DABD83]">{catalog.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main stores management section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-serif font-black text-base text-gray-900">Módulo de Auditoría de Red de Comercios</h3>
                  <p className="text-4xs text-gray-400 uppercase font-extrabold tracking-widest mt-0.5">Control de Persistencia en Cascada</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await fetchStores();
                    await fetchCatalog();
                  }}
                  className="px-3 py-1.5 bg-gray-50 text-[#102948] hover:bg-gray-100 font-sans text-3xs font-bold rounded-xl border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Recargar Servidores
                </button>
              </div>

              {/* Stores audit table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500 font-sans">
                  <thead className="bg-[#102948]/5 text-[#102948] font-black uppercase text-[10px] tracking-wider rounded-lg border-b border-gray-150">
                    <tr>
                      <th className="px-4 py-3.5 rounded-l-xl">Logotipo / Comercio</th>
                      <th className="px-4 py-3.5">Administrador Contacto</th>
                      <th className="px-4 py-3.5">Plan / Demo</th>
                      <th className="px-4 py-3.5">Artículos Catálogo</th>
                      <th className="px-4 py-3.5 rounded-r-xl text-right">Controles Root</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400 font-bold">
                          No hay tiendas registradas en la plataforma de forma temporal.
                        </td>
                      </tr>
                    ) : (
                      stores.map((store) => {
                        const itemsCount = catalog.filter((item) => item.storeId === store.id).length;
                        return (
                          <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                            
                            {/* Logo and metadata */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg select-none shrink-0"
                                  style={{ 
                                    backgroundColor: (store.branding as any)?.colors?.primary || '#102948',
                                    color: (store.branding as any)?.colors?.accent || '#DABD83'
                                  }}
                                >
                                  {store.name.substring(0, 1).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-extrabold text-[#102948] block text-[13px]">{store.name}</span>
                                  <span className="text-[10px] font-mono text-gray-400">ID: {store.id}</span>
                                </div>
                              </div>
                            </td>

                            {/* Admin mail contact */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-[#102948] text-2xs font-mono">{store.email || store.ownerId || 'S/D'}</span>
                                <span className="text-4xs text-gray-400 mt-0.5">Ubicación: {store.address || 'Santiago, Chile'}</span>
                              </div>
                            </td>

                            {/* Plan level */}
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                  {store.planName || store.planType?.toUpperCase() || 'PLAN BÁSICO'}
                                </span>
                                <span className="block text-4xs text-gray-400 font-semibold font-mono">
                                  {store.demo ? '🔴 MODO TRIAL (PRUEBA)' : '🟢 ADQUIRIDO COMPLETO'}
                                </span>
                              </div>
                            </td>

                            {/* Catalog stock calculation */}
                            <td className="px-4 py-4">
                              <span className="text-[#102948] font-black text-2xs font-mono">
                                {itemsCount} items
                              </span>
                              <span className="text-4xs text-gray-450 block mt-0.5">enlazados en bd</span>
                            </td>

                            {/* Actions with double security cascades confirmation */}
                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={async () => {
                                  const confirm1 = window.confirm(`[SEGURIDAD SUPER ADMIN]\n\n¿Estás absolutamente segura de que deseas ELIMINAR la tienda "${store.name}"?\n\nEsta acción eliminará de forma irreversible:\n- Los productos y servicios vinculados al catálogo corporativo de esta tienda (${itemsCount} items).\n- Todos los usuarios administradores y colaboradores asociados.\n\n¿Deseas continuar?`);
                                  
                                  if (!confirm1) return;

                                  const confirm2 = window.confirm(`[ÚLTIMA CONFIRMACIÓN DE CASCADE DIRECT]\n\nPor favor reconfirma la baja definitiva para "${store.name}". Esta acción destruirá los registros inmediatamente de Mongo / Memory.`);
                                  
                                  if (confirm2) {
                                    try {
                                      const res = await fetch(`/api/stores/${store.id}`, {
                                        method: 'DELETE'
                                      });
                                      if (res.ok) {
                                        alert('La tienda, catálogo, servicios y usuarios asociados han sido eliminados de manera exitosa.');
                                        await fetchStores();
                                        await fetchCatalog();
                                      } else {
                                        const err = await res.json();
                                        alert('Error al eliminar tienda: ' + err.error);
                                      }
                                    } catch (err: any) {
                                      alert('Error de red: ' + err.message);
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 transition-all font-bold text-3xs uppercase tracking-wider rounded-xl border border-red-200 hover:border-transparent flex items-center justify-center gap-1.5 ml-auto cursor-pointer"
                                title="Baja definitiva instantánea con eliminación en cascada"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Borrar Tienda Cascada
                              </button>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Warning label */}
              <div className="mt-6 pt-4 border-t border-gray-100 bg-[#102948]/5 p-4 rounded-xl border border-[#102948]/10 flex items-start gap-3">
                <span className="p-1 rounded-lg bg-red-150 border border-red-300 text-red-700 shrink-0 font-bold block bg-amber-50">⚠</span>
                <div className="text-3xs text-[#102948] leading-normal font-semibold">
                  <p className="font-bold uppercase text-red-950">Procedimiento Seguro de Baja de Comercios:</p>
                  <p className="mt-1 text-slate-600">
                    La eliminación de una tienda es inmediata y destruye registros relacionados mediante una operación cascading de base de datos activa o fallback en memoria. Asegúrate de respaldar previamente al comerciante si es que obedece a un cese programado de operaciones.
                  </p>
                </div>
              </div>

            </div>

            {/* SaaS Platform Bills Table for Sofia (SUPER ADMIN) — full transparency over system-agreed dates */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-serif font-black text-base text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#cdaf7a]" /> Consola de Facturación SaaS y Conciliación de Pagos (Auditoría Central)
                  </h3>
                  <p className="text-4xs text-gray-400 uppercase font-extrabold tracking-widest mt-0.5">Control Centralizado de Cobros y Fechas Pactadas por Comercio</p>
                </div>
                <button
                  type="button"
                  onClick={fetchSaasPayments}
                  className="px-3 py-1.5 bg-gray-50 text-[#102948] hover:bg-gray-100 font-sans text-3xs font-bold rounded-xl border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Sincronizar Pagos
                </button>
              </div>

              {paymentsLoading ? (
                <p className="text-xs text-gray-400 py-8 text-center font-bold">Cargando bitácora de convenios pactados...</p>
              ) : saasPaymentsList.length === 0 ? (
                <p className="text-xs text-gray-400 py-8 text-center font-bold">No se registran acuerdos de facturación vigentes en la red.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 font-sans">
                    <thead className="bg-[#102948]/5 text-[#102948] font-black uppercase text-[10px] tracking-wider rounded-lg border-b border-gray-150">
                      <tr>
                        <th className="px-4 py-3.5 rounded-l-xl">E-Store / Id</th>
                        <th className="px-4 py-3.5">Periodo Cobro</th>
                        <th className="px-4 py-3.5">Fecha Acordada</th>
                        <th className="px-4 py-3.5">Monto Pactado</th>
                        <th className="px-4 py-3.5 font-mono">Último Intento de Cobro</th>
                        <th className="px-4 py-3.5">Estado Cobro</th>
                        <th className="px-4 py-3.5 rounded-r-xl text-right">Controles manuales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {saasPaymentsList.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-extrabold text-[#102948] text-2xs block">{payment.storeName}</span>
                            <span className="text-[9px] text-gray-400 block font-mono">Store: {payment.storeId}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-sans text-2xs font-extrabold text-[#102948]">{payment.billingPeriod}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-mono text-2xs block">{payment.plannedDate}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5 font-sans italic">{payment.paymentMethod}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-black text-[#102948] text-2xs">${payment.amount.toLocaleString('es-CL')} CLP</span>
                            <span className="text-[9px] text-gray-450 block font-mono">Modo: Auto-PAT</span>
                          </td>
                          <td className="px-4 py-4 font-mono text-2xs text-gray-500">
                            {payment.executionDate ? (
                              <span className="text-emerald-700 font-bold bg-green-50/70 border border-green-200 px-1.5 py-0.5 rounded">✓ Cobrado el {payment.executionDate}</span>
                            ) : (
                              <span className="text-red-700 font-bold bg-red-50/70 border border-red-200 px-1.5 py-0.5 rounded">✕ Cuota de suscripción pendiente</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              payment.status === 'PAID'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {payment.status === 'PAID' ? '✓ CONCILIADO' : '● EXIGIBLE'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {payment.status !== 'PAID' ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(`¿Como Súper Administrador, forzar procesamiento inmediato del pago automático (PAT) de $${payment.amount.toLocaleString('es-CL')} CLP de la tienda "${payment.storeName}"?`)) {
                                    try {
                                      const res = await fetch(`/api/saas-payments/${payment.id}/execute`, { method: 'POST' });
                                      if (res.ok) {
                                        alert('Procesamiento completado. El estado del pago en la base de datos se ha actualizado a PAID.');
                                        await fetchSaasPayments();
                                      } else {
                                        alert('No se pudo registrar la simulación del cobro.');
                                      }
                                    } catch (err: any) {
                                      alert('Error: ' + err.message);
                                    }
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-[#102948] text-[#DABD83] hover:bg-slate-900 transition-all font-bold text-3xs uppercase tracking-wide rounded-lg cursor-pointer"
                              >
                                Forzar Cobro PAT
                              </button>
                            ) : (
                              <span className="text-3xs text-emerald-600 font-black uppercase">Consolidado en BD</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
