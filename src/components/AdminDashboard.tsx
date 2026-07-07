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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'inventory' | 'logistics' | 'pos' | 'library' | 'users' | 'super' | 'marketing' | 'blog'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Marketing campaign & growth states ---
  const [activeCommune, setActiveCommune] = useState<'Santiago' | 'Valparaíso' | 'Viña del Mar' | 'Concepción'>('Santiago');
  const [campaignBudget, setCampaignBudget] = useState(60000); // CLP monthly
  const [campaignGoal, setCampaignGoal] = useState<'both' | 'sales' | 'brand'>('both');
  const [allianceFoundations, setAllianceFoundations] = useState(true);
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('Salud Animal');
  const [newBlogBody, setNewBlogBody] = useState('');
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [customDrafts, setCustomDrafts] = useState<Array<{id: string, title: string, category: string, date: string, body?: string}>>([
    { id: '1', title: 'Ley Cholito en Chile: Normativas, multas y tenencia responsable que todo dueño de mascota debe conocer', category: 'Leyes & Derechos', date: '2026-06-12', body: 'La Ley 21.020, conocida como Ley Cholito, establece obligaciones de registro, cuidado, esterilización y sanciones severas por maltrato animal. Al publicar este contenido en tu tienda sumas un 18% más de indexación automática en Google para búsquedas locales.' },
    { id: '2', title: 'Guía de plantas decorativas sumamente comunes en Chile que resultan tóxicas para perros y gatos', category: 'Salud Animal', date: '2026-06-15', body: 'Plantas ornamentales como los lirios, el helecho de interior, la azalea o las hortensias provocan fallas orgánicas graves en mascotas. Ofrece alternativas seguras y posiciona tu marca como experta en medicina preventiva local.' },
    { id: '3', title: '¿Viajar en transporte público con tu perro o gato? Leyes de Metro, trenes y buses interurbanos', category: 'Comunidad & Viajes', date: '2026-06-19', body: 'Aprende los protocolos oficiales de caniles rígidos y arneses para viajar sin multas en el transporte de la Región Metropolitana y Valparaíso. Genera comunidad e impulsa recomendaciones orgánicas.' }
  ]);

  // --- Platform Settings & Announcements states for Super Admin & Merchants ---
  const [platformSettings, setPlatformSettings] = useState<any>({
    commissionRate: 5,
    basicPlanPrice: 19990,
    proPlanPrice: 39990,
    enterprisePlanPrice: 79990,
    activePilotCommunes: ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción'],
    marketingCoFundingRate: 20,
    allowNewRegistrations: true
  });
  const [platformAnnouncements, setPlatformAnnouncements] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingAnn, setSavingAnn] = useState(false);

  // New announcement form fields
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [newAnnType, setNewAnnType] = useState<'GENERAL' | 'MARKETING_PLAN' | 'BUSINESS_GUIDELINES'>('GENERAL');
  const [newAnnImportant, setNewAnnImportant] = useState(false);

  // Editable platform settings states
  const [editCommissionRate, setEditCommissionRate] = useState('5');
  const [editBasicPrice, setEditBasicPrice] = useState('19990');
  const [editProPrice, setEditProPrice] = useState('39990');
  const [editEnterprisePrice, setEditEnterprisePrice] = useState('79990');
  const [editMarketingCoFunding, setEditMarketingCoFunding] = useState('20');
  const [editCommunes, setEditCommunes] = useState<string[]>([]);
  const [newCommuneField, setNewCommuneField] = useState('');
  const [editNewRegistrations, setEditNewRegistrations] = useState(true);
  const [editSearchMultiplier, setEditSearchMultiplier] = useState('1.2');

  // Adoption showcase states
  const [adoptionPets, setAdoptionPets] = useState<any[]>([]);
  const [newPetName, setNewPetName] = useState('');
  const [newPetType, setNewPetType] = useState('Perro');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetAge, setNewPetAge] = useState('');
  const [newPetHealth, setNewPetHealth] = useState('');
  const [newPetFoundation, setNewPetFoundation] = useState('');
  const [newPetDesc, setNewPetDesc] = useState('');
  const [newPetImg, setNewPetImg] = useState('');
  const [savingPet, setSavingPet] = useState(false);

  // Promotional materials states
  const [promotionalMaterials, setPromotionalMaterials] = useState<any[]>([]);
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatDesc, setNewMatDesc] = useState('');
  const [newMatFormat, setNewMatFormat] = useState('PDF');
  const [newMatIconName, setNewMatIconName] = useState('FileText');
  const [newMatDownloadUrl, setNewMatDownloadUrl] = useState('');
  const [savingMaterial, setSavingMaterial] = useState(false);

  const fetchPlatformData = async () => {
    setAnnouncementsLoading(true);
    try {
      const resSet = await fetch('/api/platform/settings');
      if (resSet.ok) {
        const settingsData = await resSet.json();
        setPlatformSettings(settingsData);
        // Initialize editable states
        setEditCommissionRate(String(settingsData.commissionRate));
        setEditBasicPrice(String(settingsData.basicPlanPrice));
        setEditProPrice(String(settingsData.proPlanPrice));
        setEditEnterprisePrice(String(settingsData.enterprisePlanPrice));
        setEditMarketingCoFunding(String(settingsData.marketingCoFundingRate));
        setEditCommunes(settingsData.activePilotCommunes || []);
        setEditNewRegistrations(settingsData.allowNewRegistrations);
        setEditSearchMultiplier(String(settingsData.searchMultiplier || 1.2));
      }
      
      const resAnn = await fetch('/api/platform/announcements');
      if (resAnn.ok) {
        setPlatformAnnouncements(await resAnn.json());
      }

      // Fetch Adoption Pets
      const resAdopt = await fetch('/api/platform/adoption');
      if (resAdopt.ok) {
        setAdoptionPets(await resAdopt.json());
      }

      // Fetch Promotional Materials
      const resPromo = await fetch('/api/platform/promotional');
      if (resPromo.ok) {
        setPromotionalMaterials(await resPromo.json());
      }
    } catch (e) {
      console.error('Error fetching platform data:', e);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/platform/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionRate: Number(editCommissionRate),
          basicPlanPrice: Number(editBasicPrice),
          proPlanPrice: Number(editProPrice),
          enterprisePlanPrice: Number(editEnterprisePrice),
          marketingCoFundingRate: Number(editMarketingCoFunding),
          activePilotCommunes: editCommunes,
          allowNewRegistrations: editNewRegistrations,
          searchMultiplier: Number(editSearchMultiplier)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformSettings(data.settings);
        alert('¡Configuraciones globales publicadas y sincronizadas exitosamente en toda la red!');
      } else {
        alert('Error al guardar configuraciones de plataforma.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateAdoptionPet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName.trim() || !newPetFoundation.trim()) {
      alert('Nombre de la mascota y fundación patrocinadora son requeridos.');
      return;
    }
    setSavingPet(true);
    try {
      const res = await fetch('/api/platform/adoption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPetName.trim(),
          type: newPetType,
          breed: newPetBreed.trim(),
          age: newPetAge.trim(),
          healthStatus: newPetHealth.trim(),
          foundation: newPetFoundation.trim(),
          description: newPetDesc.trim(),
          imageUrl: newPetImg.trim()
        })
      });
      if (res.ok) {
        const newPet = await res.json();
        setAdoptionPets([...adoptionPets, newPet]);
        setNewPetName('');
        setNewPetBreed('');
        setNewPetAge('');
        setNewPetHealth('');
        setNewPetFoundation('');
        setNewPetDesc('');
        setNewPetImg('');
        alert('¡Mascota publicada con éxito en la Vitrina de Adopción de la plataforma!');
      } else {
        alert('Error al publicar mascota para adopción.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setSavingPet(false);
    }
  };

  const handleDeleteAdoptionPet = async (id: string) => {
    if (!window.confirm('¿Deseas retirar esta mascota de la Vitrina de Adopción?')) return;
    try {
      const res = await fetch(`/api/platform/adoption/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdoptionPets(adoptionPets.filter(p => p.id !== id));
        alert('Mascota retirada de la vitrina.');
      }
    } catch (err: any) {
      console.error('Error deleting adoption pet:', err);
    }
  };

  const handleCreatePromotionalMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatTitle.trim() || !newMatDownloadUrl.trim()) {
      alert('El título del material y el link de descarga directa son requeridos.');
      return;
    }
    setSavingMaterial(true);
    try {
      const res = await fetch('/api/platform/promotional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMatTitle.trim(),
          description: newMatDesc.trim(),
          format: newMatFormat,
          iconName: newMatIconName,
          downloadUrl: newMatDownloadUrl.trim()
        })
      });
      if (res.ok) {
        const newMat = await res.json();
        setPromotionalMaterials([...promotionalMaterials, newMat]);
        setNewMatTitle('');
        setNewMatDesc('');
        setNewMatFormat('PDF');
        setNewMatIconName('FileText');
        setNewMatDownloadUrl('');
        alert('¡Nuevo material promocional publicado con éxito para todos los comerciantes socios!');
      } else {
        alert('Fallo al guardar material.');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleDeletePromotionalMaterial = async (id: string) => {
    if (!window.confirm('¿Deseas retirar este material descargable?')) return;
    try {
      const res = await fetch(`/api/platform/promotional/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPromotionalMaterials(promotionalMaterials.filter(m => m.id !== id));
        alert('Material removido.');
      }
    } catch (err: any) {
      console.error('Error deleting material:', err);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) {
      alert('Por favor, indica un título y un contenido.');
      return;
    }
    setSavingAnn(true);
    try {
      const res = await fetch('/api/platform/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAnnTitle.trim(),
          content: newAnnContent.trim(),
          type: newAnnType,
          important: newAnnImportant
        })
      });
      if (res.ok) {
        const publishedAnn = await res.json();
        setPlatformAnnouncements([publishedAnn, ...platformAnnouncements]);
        setNewAnnTitle('');
        setNewAnnContent('');
        setNewAnnType('GENERAL');
        setNewAnnImportant(false);
        alert('¡Comunicado y cambios de políticas publicados con éxito en los paneles de todos los comerciantes!');
      } else {
        alert('Fallo al publicar el comunicado.');
      }
    } catch (err: any) {
      alert('Error de conexión al guardar comunicado: ' + err.message);
    } finally {
      setSavingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comunicado corporativo de la red?')) return;
    try {
      const res = await fetch(`/api/platform/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlatformAnnouncements(platformAnnouncements.filter(a => a.id !== id));
        alert('Comunicado removido correctamente.');
      }
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
    }
  };

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
    fetchPlatformData();
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
    fetchPlatformData();
    startSseConnection(); // Ensure real-time SSE listener is active
  }, []);

  // --- BLOG & REDES SOCIALES STATES & HANDLERS ---
  const [blogPostsList, setBlogPostsList] = useState<any[]>([]);
  const [blogListLoading, setBlogListLoading] = useState(false);
  const [blogFormOpen, setBlogFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  // Form states
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogBannerUrl, setBlogBannerUrl] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogStatus, setBlogStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

  // Preview Platform state
  const [previewPlatform, setPreviewPlatform] = useState<'whatsapp' | 'telegram' | 'X' | 'facebook' | 'threads' | 'instagram' | 'linkedin'>('whatsapp');

  const fetchStoreBlogs = async () => {
    setBlogListLoading(true);
    try {
      const sId = currentUser?.storeId || 'store_1';
      const res = await fetch(`/api/blogs?storeId=${sId}`);
      if (res.ok) {
        const data = await res.json();
        setBlogPostsList(data);
      }
    } catch (err) {
      console.error('Error fetching storefront blogs:', err);
    } finally {
      setBlogListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'blog') {
      fetchStoreBlogs();
    }
  }, [activeTab, currentUser]);

  const toggleUserBlogPermission = async (email: string, currentVal: boolean) => {
    const sId = currentUser?.storeId || 'store_1';
    try {
      const res = await fetch(`/api/stores/${sId}/users/${email}/blog-permission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allowBlog: !currentVal })
      });
      if (res.ok) {
        loadStoreUsers();
      } else {
        alert('No se pudo actualizar el permiso de blog del colaborador.');
      }
    } catch (err) {
      console.error('Error toggling blog permission:', err);
    }
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      alert('Por favor completa el título y el contenido del artículo de blog.');
      return;
    }

    const sId = currentUser?.storeId || 'store_1';
    const authorEmail = currentUser?.email || 'comerciante1@petmall.com';
    const authorName = currentUser?.firstName && currentUser?.lastName 
      ? `${currentUser.firstName} ${currentUser.lastName}` 
      : 'Administrador Empresa';

    const payload = {
      id: editingPost?.id || undefined,
      storeId: sId,
      title: blogTitle,
      slug: blogSlug || blogTitle.toLowerCase().trim().replace(/[\s\W]+/g, '-'),
      excerpt: blogExcerpt || (blogContent.substring(0, 150) + '...'),
      content: blogContent,
      bannerUrl: blogBannerUrl || 'https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=800&q=80',
      authorEmail,
      authorName,
      status: blogStatus,
      tags: blogTags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: editingPost?.createdAt || undefined
    };

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Clear form
        setBlogTitle('');
        setBlogSlug('');
        setBlogBannerUrl('');
        setBlogExcerpt('');
        setBlogContent('');
        setBlogTags('');
        setBlogStatus('PUBLISHED');
        setEditingPost(null);
        setBlogFormOpen(false);
        // Refresh articles
        fetchStoreBlogs();
        alert('Artículo de blog sincronizado correctamente.');
      } else {
        const err = await res.json();
        alert('Error al guardar: ' + (err.error || 'Intenta de nuevo'));
      }
    } catch (err) {
      console.error('Save blog error:', err);
    }
  };

  const handleEditBlogPostClick = (post: any) => {
    setEditingPost(post);
    setBlogTitle(post.title);
    setBlogSlug(post.slug);
    setBlogBannerUrl(post.bannerUrl || '');
    setBlogExcerpt(post.excerpt || '');
    setBlogContent(post.content);
    setBlogTags(post.tags ? post.tags.join(', ') : '');
    setBlogStatus(post.status);
    setBlogFormOpen(true);
  };

  const handleDeleteBlogPost = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este artículo permanentemente?')) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchStoreBlogs();
      } else {
        alert('No se pudo eliminar el artículo.');
      }
    } catch (err) {
      console.error('Delete blog error:', err);
    }
  };

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
                src={currentUser.avatarUrl || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Cpath d='M50 56a16 16 0 100-32 16 16 0 000 32zm0 4c-18.5 0-32 10.5-32 20v4h64v-4c0-9.5-13.5-20-32-20z' fill='%23475569'/%3E%3C/svg%3E"} 
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

            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'blog' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <span className="relative mr-3 flex items-center justify-center">
                <span className="w-4 h-4 rounded-md border border-white/50 text-[10px] flex items-center justify-center font-serif leading-none font-black text-brand-gold bg-white/10 shrink-0">B</span>
              </span>
              Blog & Redes Sociales
              <span className="ml-auto bg-amber-500/10 text-brand-gold text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 border border-amber-500/20">
                Social
              </span>
            </button>

            <button
              onClick={() => setActiveTab('marketing')}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                activeTab === 'marketing' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 mr-3 text-brand-gold" />
              Plan de Marketing & Crecimiento
              <span className="ml-auto bg-emerald-500/10 text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse border border-emerald-500/20">
                Plan 2026
              </span>
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
                      src={currentUser.avatarUrl || "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Cpath d='M50 56a16 16 0 100-32 16 16 0 000 32zm0 4c-18.5 0-32 10.5-32 20v4h64v-4c0-9.5-13.5-20-32-20z' fill='%23475569'/%3E%3C/svg%3E"} 
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

                  <button
                    onClick={() => {
                      setActiveTab('blog');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'blog' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <span className="relative mr-3 flex items-center justify-center">
                      <span className="w-4 h-4 rounded-md border border-white/50 text-[10px] flex items-center justify-center font-serif leading-none font-black text-brand-gold bg-white/10 shrink-0">B</span>
                    </span>
                    Blog & Redes Sociales
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('marketing');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all focus:outline-hidden cursor-pointer ${
                      activeTab === 'marketing' ? 'bg-[#DABD83] text-[#102948] shadow-xs' : 'text-gray-300'
                    }`}
                  >
                    <Tag className="w-4 h-4 mr-3 text-brand-gold" />
                    Plan de Marketing & Crecimiento
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
                {activeTab === 'blog' && 'Blog Corporativo & Marketing de Contenidos'}
                {activeTab === 'super' && 'Panel Súper Administrador Petmall'}
                {activeTab === 'marketing' && 'Estrategia de Crecimiento & Marketing Hub'}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'dashboard' && 'Visión general de ingresos, POS local vs Checkout digital.'}
                {activeTab === 'catalog' && 'Enrola nuevos productos o servicios con campos inteligentes dinámicos.'}
                {activeTab === 'inventory' && 'Monitorea niveles de stock, SKU, pasillos físicos de almacenamiento y compras.'}
                {activeTab === 'logistics' && 'Administra despachos express y confirma pedidos listos.'}
                {activeTab === 'pos' && 'Vende en mostrador con reducción inmediata de existencias.'}
                {activeTab === 'library' && 'Sube y organiza hasta 100 imágenes en carpetas personalizadas para la carga directa de tus productos.'}
                {activeTab === 'users' && 'Vincula y administra los correos autorizados para operar el CMS, condicionado por los límites de tu plan.'}
                {activeTab === 'blog' && 'Redacta artículos y compártelos al instante con previsualizaciones automáticas adaptadas para WhatsApp, X, Facebook, LinkedIn y más.'}
                {activeTab === 'super' && 'Administra y audita comercios enrolados y procesa cierres o bajas con eliminación en cascada.'}
                {activeTab === 'marketing' && 'Plan estratégico B2C/B2B, simulador de pauta en comunas piloto y generador de contenidos.'}
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
                price: `${(platformSettings?.proPlanPrice || 39990).toLocaleString('es-CL')} CLP / mes`,
                commission: `${platformSettings?.commissionRate || 5}% + IVA`,
                maxUsers: '6 usuarios',
                pos: 'POS Táctil en tiempo real unificado por WebSockets',
                support: 'Soporte prioritario rápido',
                features: ['Stock mínimo y mermas', 'Agenda de reservas y turnos caninos', 'Órdenes de compra B2B automáticas']
              };

              if (activePlanType === 'market_growth') {
                planDetails = {
                  price: `${(platformSettings?.basicPlanPrice || 19990).toLocaleString('es-CL')} CLP / mes`,
                  commission: `${(platformSettings?.commissionRate || 5) + 2}% + IVA`,
                  maxUsers: '2 usuarios',
                  pos: 'Modo básico/simulado (sin mermas ni turnos)',
                  support: 'Gestión básica por correo electrónico',
                  features: ['Listado en Marketplace común', 'Registro básico digital', 'Soporte vía tickets']
                };
              } else if (activePlanType === 'enterprise_elite') {
                planDetails = {
                  price: `${(platformSettings?.enterprisePlanPrice || 79990).toLocaleString('es-CL')} CLP / mes`,
                  commission: `${Math.max(1, (platformSettings?.commissionRate || 5) - 2.5)}% + IVA`,
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

            {/* Announcements published by Super Admin */}
            {platformAnnouncements && platformAnnouncements.length > 0 && (
              <div className="bg-amber-50/75 border border-amber-200 rounded-2xl p-5 shadow-3xs space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-700 font-extrabold text-sm select-none">📢</span>
                  <div>
                    <h4 className="text-2xs uppercase tracking-wider font-extrabold text-amber-900 leading-none">Comunicados Oficiales de la Administración Central</h4>
                    <p className="text-4xs text-amber-700 leading-normal mt-0.5 font-semibold">Actualizaciones críticas del modelo de marketing, negocios y pauta de anunciantes</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platformAnnouncements.slice(0, 4).map((ann: any) => (
                    <div key={ann.id} className="bg-white/90 p-4 rounded-xl border border-amber-100 flex flex-col justify-between relative overflow-hidden shadow-3xs hover:shadow-xs transition-shadow">
                      {ann.important && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl tracking-widest border-l border-b border-red-400">
                          URGENTE
                        </span>
                      )}
                      <div>
                        <span className="inline-block text-[8px] font-black text-amber-800 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-400/20 uppercase tracking-widest font-mono">
                          {ann.type === 'MARKETING_PLAN' && '📈 Plan de Marketing'}
                          {ann.type === 'BUSINESS_GUIDELINES' && '💼 Modelo de Negocio'}
                          {ann.type === 'GENERAL' && '🔔 General'}
                        </span>
                        <h5 className="font-serif font-black text-xs text-slate-900 mt-2">{ann.title}</h5>
                        <p className="text-3xs text-slate-600 leading-relaxed mt-1 font-medium">{ann.content}</p>
                      </div>
                      <div className="flex items-center justify-between text-4xs text-slate-400 font-bold mt-4 pt-2 border-t border-gray-100">
                        <span>Petmall Gobierno Central</span>
                        <span className="font-mono">{ann.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        <th className="px-4 py-3.5">Permisos de Blog</th>
                        <th className="px-4 py-3.5">Estado de Cuenta</th>
                        <th className="px-4 py-3.5 rounded-r-xl text-right">Controles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {storeUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-400 font-bold">
                            Cargando lista de usuarios administradores autorizados...
                          </td>
                        </tr>
                      ) : (
                        storeUsers.map((usr) => {
                          const isSelf = usr.email.toLowerCase() === currentUser?.email?.toLowerCase();
                          const fallbackAvatar = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Cpath d='M50 56a16 16 0 100-32 16 16 0 000 32zm0 4c-18.5 0-32 10.5-32 20v4h64v-4c0-9.5-13.5-20-32-20z' fill='%23475569'/%3E%3C/svg%3E";
                          const displayName = usr.firstName && usr.lastName ? `${usr.firstName} ${usr.lastName}` : 'Colaborador Petmall';
                          
                          // Check if active store dynamic plan supports social blog features
                          const isSocialBlogPlan = myStore?.planType === 'control_omnicanal' || myStore?.planType === 'enterprise_elite';

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
                                {usr.role === 'STORE_OWNER' || usr.role === 'SUPER_USER' ? (
                                  <span className="text-[10px] text-[#819B5A] font-black uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Autorizado (Owner)
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="checkbox"
                                      id={`blog-chk-${usr.email}`}
                                      disabled={!isSocialBlogPlan}
                                      checked={!!usr.allowBlog}
                                      onChange={() => toggleUserBlogPermission(usr.email, !!usr.allowBlog)}
                                      className="w-4 h-4 text-[#102948] rounded border-gray-300 focus:ring-[#DABD83] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <span className={`text-[10px] font-extrabold uppercase ${usr.allowBlog && isSocialBlogPlan ? 'text-indigo-600' : 'text-gray-400'}`}>
                                      {!isSocialBlogPlan ? 'Bloqueado por Plan' : (usr.allowBlog ? 'Autorizado' : 'Inactivo')}
                                    </span>
                                  </div>
                                )}
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

            {/* SUPER ADMIN WORKSPACE: PLATFORM BUSINESS SETTINGS AND INSTANT ANNOUNCEMENTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in text-left">
              
              {/* Card 1: Platform-wide Business & Pricing Model Settings */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 space-y-6">
                <div>
                  <span className="text-3xs uppercase text-[#cdaf7a] font-extrabold tracking-widest block mb-1 font-mono">MODELO DE DESARROLLO Y PRECIOS</span>
                  <h3 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#102948]" /> Ajustes de Negocio y Modelo de Pricing
                  </h3>
                  <p className="text-3xs text-gray-400 mt-1">Configura las comisiones globales y los precios mensuales recurrentes por suscripción para la red Petmall Chile.</p>
                </div>

                <form onSubmit={handleSavePlatformSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* commission rate */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tasa de Comisión SaaS (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={editCommissionRate}
                          onChange={(e) => setEditCommissionRate(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                      </div>
                    </div>

                    {/* marketing co-funding */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Co-financiamiento Pauta (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={editMarketingCoFunding}
                          onChange={(e) => setEditMarketingCoFunding(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">%</span>
                      </div>
                    </div>

                    {/* Basic Plan Price */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-450 uppercase mb-1">Plan Basic (CLP / mes)</label>
                      <input
                        type="number"
                        value={editBasicPrice}
                        onChange={(e) => setEditBasicPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                        required
                      />
                    </div>

                    {/* Pro Plan Price */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-450 uppercase mb-1">Plan Pro (CLP / mes)</label>
                      <input
                        type="number"
                        value={editProPrice}
                        onChange={(e) => setEditProPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                        required
                      />
                    </div>

                    {/* Enterprise Plan Price */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-gray-450 uppercase mb-1">Plan Enterprise Elite (CLP / mes)</label>
                      <input
                        type="number"
                        value={editEnterprisePrice}
                        onChange={(e) => setEditEnterprisePrice(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                        required
                      />
                    </div>

                    {/* Search Multiplier */}
                    <div className="flex flex-col">
                      <label className="text-[10px] font-bold text-amber-800 uppercase mb-1">Multiplicador en Buscador (x)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="5.0"
                          value={editSearchMultiplier}
                          onChange={(e) => setEditSearchMultiplier(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 focus:outline-hidden focus:border-amber-400"
                          required
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-amber-600 font-bold">x</span>
                      </div>
                    </div>
                  </div>

                  {/* Active pilot communes tags management */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">Comunas Piloto Activas para Pauta de Marketing</label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 rounded-xl min-h-[44px] border border-gray-150 items-center">
                      {editCommunes.length === 0 ? (
                        <span className="text-4xs text-gray-400 font-bold uppercase px-2 leading-tight">No hay comunas registradas. Añade una comuna local abajo.</span>
                      ) : (
                        editCommunes.map((comm) => (
                          <span 
                            key={comm} 
                            className="inline-flex items-center gap-1 bg-[#102948] text-[#DABD83] text-[10px] font-black pl-2 pr-1.5 py-0.5 rounded-lg border border-[#102948]"
                          >
                            <span>📍 {comm}</span>
                            <button
                              type="button"
                              onClick={() => setEditCommunes(editCommunes.filter(c => c !== comm))}
                              className="text-white hover:text-red-400 font-bold text-[9px] shrink-0 cursor-pointer ml-1 p-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    
                    {/* Add commune utility field */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nueva comuna. Ej: Antofagasta"
                        value={newCommuneField}
                        onChange={(e) => setNewCommuneField(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newCommuneField.trim();
                          if (clean && !editCommunes.includes(clean)) {
                            setEditCommunes([...editCommunes, clean]);
                            setNewCommuneField('');
                          }
                        }}
                        className="px-3 bg-[#102948] hover:bg-slate-900 text-[#DABD83] font-bold text-3xs uppercase rounded-xl flex items-center justify-center cursor-pointer leading-none"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>

                  {/* Toggle new merchant registrations */}
                  <div className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <div>
                      <span className="text-[10px] text-amber-900 font-extrabold uppercase block leading-none">Inscripción General de Nuevas e-Stores</span>
                      <span className="text-[9px] text-amber-700 block max-w-xs mt-1 leading-normal font-semibold">Si se desactiva, impedirá que nuevas tiendas comiencen su enrolamiento por el portal.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditNewRegistrations(!editNewRegistrations)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                        editNewRegistrations ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                        editNewRegistrations ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Actions buttons */}
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-2.5 bg-[#102948] hover:bg-slate-900 text-[#DABD83] font-sans text-3xs font-black uppercase rounded-xl transition-all border border-[#102948] focus:outline-hidden flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
                  >
                    <span>{savingSettings ? 'Guardando ajustes...' : '✓ Sincronizar y Forzar Cambios de Negocios'}</span>
                  </button>
                </form>
              </div>

              {/* Card 2: Platform-wide Active Announcements & Notification Editor */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 space-y-6">
                <div>
                  <span className="text-3xs uppercase text-[#cdaf7a] font-extrabold tracking-widest block mb-1 font-mono">PUBLICACIÓN EN VIVO</span>
                  <h3 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#102948]" /> Publicador de Comunicados y Políticas
                  </h3>
                  <p className="text-3xs text-gray-400 mt-1">Inserta alertas críticas, manuales de marketing con Ley Cholito o actualizaciones del modelo de negocio en la pantalla merchant.</p>
                </div>

                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  {/* Title */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Título del Comunicado Oficial</label>
                    <input
                      type="text"
                      placeholder="Ej: Nuevas Subvenciones de Fiestas Patrias..."
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      required
                    />
                  </div>

                  {/* Category Type selection */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Categoría Temática</label>
                    <select
                      value={newAnnType}
                      onChange={(e) => setNewAnnType(e.target.value as any)}
                      className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold focus:outline-hidden"
                    >
                      <option value="GENERAL">General / Actualización del Portal</option>
                      <option value="MARKETING_PLAN">Plan de Marketing & Pauta de Anunciantes</option>
                      <option value="BUSINESS_GUIDELINES">Modelo de Negocio (Leyes, Comisiones y Precios)</option>
                    </select>
                  </div>

                  {/* Urgent selector checkbox */}
                  <div className="flex items-center gap-2 bg-red-50/55 p-3 rounded-xl border border-red-200">
                    <input
                      type="checkbox"
                      id="urgentAnn"
                      checked={newAnnImportant}
                      onChange={(e) => setNewAnnImportant(e.target.checked)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 rounded accent-red-600 cursor-pointer"
                    />
                    <label htmlFor="urgentAnn" className="text-4xs text-red-900 font-extrabold uppercase select-none cursor-pointer">
                      💥 MARCAR COMO COMUNICADO CRÍTICO OBLIGATORIO (Banner Súper Destacado)
                    </label>
                  </div>

                  {/* Content body */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Cuerpo del Mensaje</label>
                    <textarea
                      placeholder="Redacta los detalles del cambio corporativo. Los comerciantes verán este aviso instantáneamente al recargar su pantalla..."
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      required
                    />
                  </div>

                  {/* Trigger button */}
                  <button
                    type="submit"
                    disabled={savingAnn}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-sans text-3xs font-black uppercase rounded-xl transition-all focus:outline-hidden flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
                  >
                    <span>{savingAnn ? 'Publicando comunicado...' : '📣 Publicar Comunicado en Vivo'}</span>
                  </button>
                </form>

                {/* List of active published announcements for management */}
                <div className="pt-4 border-t border-gray-150 space-y-3">
                  <span className="text-[10px] font-black text-gray-500 uppercase block font-sans">Bitácora de Comunicados Activos ({platformAnnouncements.length})</span>
                  
                  {platformAnnouncements.length === 0 ? (
                    <p className="text-3xs text-gray-400 font-bold uppercase py-4 text-center">No registras comunicados corporativos vigentes.</p>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto divide-y divide-gray-100 pr-1 space-y-2">
                      {platformAnnouncements.map((ann) => (
                        <div key={ann.id} className="pt-2 flex items-start justify-between gap-3 text-left">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {ann.important && <span className="bg-red-100 text-red-800 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">Crítico</span>}
                              <span className="text-[8px] font-mono font-bold text-indigo-700 uppercase bg-slate-100 px-1.5 py-0.2 rounded">
                                {ann.type}
                              </span>
                              <span className="text-4xs text-gray-400 font-bold">{ann.date}</span>
                            </div>
                            <h5 className="text-[11px] font-bold text-gray-900 leading-tight">{ann.title}</h5>
                            <p className="text-3xs text-gray-500 leading-normal line-clamp-2">{ann.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1 rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors cursor-pointer"
                            title="Eliminar comunicado del portal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Dynamic Adoption Showcase Manager */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 space-y-6 lg:col-span-2">
                <div>
                  <span className="text-3xs uppercase text-indigo-700 font-extrabold tracking-widest block mb-1 font-mono">RESPONSABILIDAD SOCIAL CORPORATIVA</span>
                  <h3 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Admin. de Vitrina de Adopción
                  </h3>
                  <p className="text-3xs text-gray-400 mt-1">
                    Gestiona la lista oficial de mascotas rescatadas que aparecen publicadas en la vitrina comunitaria de la plataforma Petmall Chile.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Form */}
                  <form onSubmit={handleCreateAdoptionPet} className="space-y-4 bg-slate-50/65 p-5 rounded-2xl border border-gray-150">
                    <h4 className="text-2xs font-extrabold text-indigo-900 uppercase">Publicar Nueva Mascota</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                        <input
                          type="text"
                          placeholder="Ej: Rocky"
                          value={newPetName}
                          onChange={(e) => setNewPetName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Tipo</label>
                        <select
                          value={newPetType}
                          onChange={(e) => setNewPetType(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-extrabold focus:outline-hidden"
                        >
                          <option value="Perro">🐶 Perro</option>
                          <option value="Gato">🐱 Gato</option>
                          <option value="Otro">🐰 Otro</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Raza / Variedad</label>
                        <input
                          type="text"
                          placeholder="Ej: Mestizo o Siamés"
                          value={newPetBreed}
                          onChange={(e) => setNewPetBreed(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Edad o Tiempo</label>
                        <input
                          type="text"
                          placeholder="Ej: 1 año, 6 meses"
                          value={newPetAge}
                          onChange={(e) => setNewPetAge(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Estado de Salud</label>
                        <input
                          type="text"
                          placeholder="Ej: Sano / Vacunado"
                          value={newPetHealth}
                          onChange={(e) => setNewPetHealth(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Fundación Socios</label>
                        <input
                          type="text"
                          placeholder="Ej: Refugio Patrañas"
                          value={newPetFoundation}
                          onChange={(e) => setNewPetFoundation(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">URL de Foto de la Mascota</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... o vacío para usar default"
                        value={newPetImg}
                        onChange={(e) => setNewPetImg(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:outline-hidden"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Biografía / Datos para postular</label>
                      <textarea
                        placeholder="Describe el temperamento del animal, compatibilidad y cómo ponerse en contacto..."
                        value={newPetDesc}
                        onChange={(e) => setNewPetDesc(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingPet}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-3xs uppercase tracking-wider rounded-xl cursor-pointer shadow-3xs"
                    >
                      {savingPet ? 'Publicando...' : '🐾 Publicar Mascota para Adopción'}
                    </button>
                  </form>

                  {/* Right Column: Collection List */}
                  <div className="space-y-3.5 flex flex-col">
                    <div className="flex justify-between items-center bg-slate-50 px-3.5 py-2 rounded-xl">
                      <span className="text-2xs font-extrabold text-slate-700 uppercase">Mascotas Vigentes ({adoptionPets.length})</span>
                      <span className="text-4xs text-slate-400 font-bold uppercase font-mono">Vitrina Activa</span>
                    </div>

                    {adoptionPets.length === 0 ? (
                      <div className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-2xl">🧸</span>
                        <p className="text-3xs text-gray-400 font-extrabold uppercase mt-2">No hay mascotas registradas actualmente.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {adoptionPets.map((pet: any) => (
                          <div key={pet.id} className="p-3 bg-white border border-gray-150 rounded-2xl hover:border-gray-350 transition-colors flex gap-3 items-center justify-between text-left">
                            <div className="flex gap-3 items-center min-w-0">
                              <img src={pet.imageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=350'} className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="text-[12px] font-black text-slate-900 leading-tight truncate">{pet.name}</h5>
                                  <span className="text-[8px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded uppercase">
                                    {pet.type}
                                  </span>
                                </div>
                                <p className="text-4xs text-slate-400 mt-0.5 truncate font-bold uppercase">📍 Fundación: {pet.foundation}</p>
                                <p className="text-[10px] text-slate-500 leading-normal line-clamp-1">{pet.description || 'Sin descripción.'}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdoptionPet(pet.id)}
                              className="p-1.5 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors cursor-pointer"
                              title="Retirar mascota de la vitrina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Dynamic Promotional Materials Manager */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-gray-150 space-y-6 lg:col-span-2">
                <div>
                  <span className="text-3xs uppercase text-green-700 font-extrabold tracking-widest block mb-1 font-mono">DIFUSIÓN & MARKETING COMERCIAL</span>
                  <h3 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-600" /> Admin. de Material Promocional
                  </h3>
                  <p className="text-3xs text-gray-400 mt-1">
                    Carga los kits gráficos, plantillas de bolsas reutilizables o diseños de calcomanías Petmall para libre descarga de tus tiendas adheridas.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Form */}
                  <form onSubmit={handleCreatePromotionalMaterial} className="space-y-4 bg-slate-50/65 p-5 rounded-2xl border border-gray-150">
                    <h4 className="text-2xs font-extrabold text-green-900 uppercase">Subir Material Promocional</h4>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Título del Material</label>
                      <input
                        type="text"
                        placeholder="Ej: Stickers Oficiales Petmall 2026"
                        value={newMatTitle}
                        onChange={(e) => setNewMatTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Formato</label>
                        <input
                          type="text"
                          placeholder="Ej: PDF o ZIP"
                          value={newMatFormat}
                          onChange={(e) => setNewMatFormat(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold text-gray-500 uppercase mb-1">Estilo de Icono</label>
                        <select
                          value={newMatIconName}
                          onChange={(e) => setNewMatIconName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-extrabold focus:outline-hidden"
                        >
                          <option value="FileText">📄 Archivo de Texto / Poster</option>
                          <option value="FileImage">🖼️ Gráfico / Calcomanía</option>
                          <option value="ShoppingBag">🛍️ Bolsa Oficial</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-gray-400 uppercase mb-1">Link de Descarga Directa (URL)</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        value={newMatDownloadUrl}
                        onChange={(e) => setNewMatDownloadUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono focus:outline-hidden"
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[9px] font-bold text-gray-400 uppercase mb-1">Descripción del Archivo</label>
                      <textarea
                        placeholder="Explica a los comerciantes cómo mandarlo a la imprenta o cómo usar este material..."
                        value={newMatDesc}
                        onChange={(e) => setNewMatDesc(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingMaterial}
                      className="w-full py-2 bg-green-650 hover:bg-green-700 text-white font-black text-3xs uppercase tracking-wider rounded-xl cursor-pointer shadow-3xs"
                    >
                      {savingMaterial ? 'Subiendo...' : '📥 Publicar Recurso Descargable'}
                    </button>
                  </form>

                  {/* Right Column: Current Materials */}
                  <div className="space-y-3.5 flex flex-col">
                    <div className="flex justify-between items-center bg-slate-50 px-3.5 py-2 rounded-xl">
                      <span className="text-2xs font-extrabold text-slate-700 uppercase">Descargas Publicadas ({promotionalMaterials.length})</span>
                      <span className="text-4xs text-slate-400 font-bold uppercase font-mono">Disponibles Socios</span>
                    </div>

                    {promotionalMaterials.length === 0 ? (
                      <div className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-2xl">📁</span>
                        <p className="text-3xs text-gray-400 font-extrabold uppercase mt-2">No has publicado materiales promocionales aún.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {promotionalMaterials.map((mat: any) => (
                          <div key={mat.id} className="p-3 bg-white border border-gray-150 rounded-2xl hover:border-gray-350 transition-all flex gap-3 items-center justify-between text-left">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="text-[11px] font-bold text-slate-900 truncate leading-tight">{mat.title}</h5>
                                <span className="text-[8px] bg-green-50 text-green-700 font-extrabold px-1.5 py-0.2 rounded font-mono">
                                  {mat.format}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal mt-1">{mat.description}</p>
                              <a 
                                href={mat.downloadUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                referrerPolicy="no-referrer"
                                className="text-indigo-600 hover:text-indigo-800 text-3xs font-extrabold uppercase mt-1 inline-block hover:underline"
                              >
                                🔗 Probar link de descarga
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeletePromotionalMaterial(mat.id)}
                              className="p-1.5 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors cursor-pointer"
                              title="Eliminar recurso descargable"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUB-SCREEN 9: INTERACTIVE MARKETING PLAN & PARTNER GROWTH HUB */}
        {activeTab === 'marketing' && (
          <div className="space-y-8 text-left animate-fade-in">
            
            {/* Header Value Proposition Card */}
            <div className="bg-[#102948] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-white/5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-[#DABD83]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-400 text-[#102948] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Estrategia de Crecimiento Omnicanal
                  </span>
                  <span className="bg-white/10 text-[#DABD83] text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-white/10 uppercase">
                    Comuna Piloto: {activeCommune}
                  </span>
                </div>
                
                <h2 className="text-xl md:text-3xl font-serif font-black tracking-tight text-[#DABD83]">
                  Vitrina Digital de Chile para tu Comercio No-Stress
                </h2>
                <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Conectamos de forma directa las pautas digitales de Google Search y Meta Ads con el stock local en tiempo real de tu tienda. Con un mensaje de valor fuerte: <span className="text-[#DABD83] italic font-semibold">"Todo lo que tu mascota necesita, en un solo lugar, confiable y a un clic."</span>
                </p>

                {/* Promoción 3 meses gratis banner */}
                <div className="inline-flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="bg-[#cdaf7a]/20 p-2 rounded-xl border border-[#cdaf7a]/30">
                    <DollarSign className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest block">Beneficio Store Temprano (Socio Fundador)</span>
                    <span className="text-2xs text-white block"><b>¡3 Meses de Suscripción 0% Comisión!</b> Tu comercio cuenta con período de gracia activo hasta el lanzamiento oficial de la comuna piloto.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Google Search & Meta Campaign Simulator */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs space-y-6">
                <div>
                  <span className="text-3xs uppercase text-[#cdaf7a] font-extrabold tracking-widest block mb-1">Métricas Clave & Presupuesto</span>
                  <h3 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-[#102948]" /> Simulador de Pauta e Inversión Hiperlocal
                  </h3>
                  <p className="text-3xs text-gray-400 mt-1">Configura el presupuesto estimado en anuncios pagados para proyectar el tráfico potencial en tu comuna.</p>
                </div>

                <div className="space-y-4">
                  {/* Select Pilot Commune */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-400 uppercase mb-1.5">Comuna Piloto del Anuncio (Configurado por Central)</label>
                    <div className="flex flex-wrap gap-2">
                      {(platformSettings?.activePilotCommunes || ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción']).map((com: string) => (
                        <button
                          key={com}
                          type="button"
                          onClick={() => setActiveCommune(com as any)}
                          className={`px-3 py-1.5 text-3xs font-black rounded-lg text-center transition-all border cursor-pointer ${
                            activeCommune === com
                              ? 'bg-[#102948] text-[#DABD83] border-[#102948]'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          📍 {com}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Range Slider for Budget */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-3xs font-black text-gray-500 uppercase">Presupuesto Mensual Estimado</label>
                      <span className="text-xs font-black text-[#102948] bg-gray-100 px-2 py-0.5 rounded">
                        ${campaignBudget.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15000"
                      max="400000"
                      step="5000"
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(parseInt(e.target.value))}
                      className="w-full accent-[#102948] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-1">
                      <span>Min: $15.000</span>
                      <span>Mágica: $120.000</span>
                      <span>Poderosa: $400.000</span>
                    </div>
                  </div>

                  {/* Campaign Target */}
                  <div className="flex flex-col">
                    <label className="text-3xs font-black text-gray-500 uppercase mb-1.5">Enfoque de Campaña (Optimización)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['both', 'sales', 'brand'] as const).map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => setCampaignGoal(goal)}
                          className={`px-2 py-1.5 text-4xs uppercase tracking-wider font-extrabold rounded-lg text-center transition-all border cursor-pointer ${
                            campaignGoal === goal
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          {goal === 'both' && '🔍 Equilibrio'}
                          {goal === 'sales' && '🛒 Conversión'}
                          {goal === 'brand' && '📣 Alcance'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Calculation Outputs dynamically simulated */}
                {(() => {
                  const cpc = activeCommune === 'Santiago' ? 190 : activeCommune === 'Valparaíso' ? 165 : activeCommune === 'Viña del Mar' ? 160 : activeCommune === 'Concepción' ? 145 : 150;
                  const cr = campaignGoal === 'sales' ? 0.038 : campaignGoal === 'brand' ? 0.016 : 0.026;
                  const estimatedClicks = Math.floor(campaignBudget / cpc);
                  const acquiredCustomers = Math.round(estimatedClicks * cr);
                  const approxCac = Math.round(campaignBudget / (acquiredCustomers || 1));
                  
                  return (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                      <span className="text-[10px] font-extrabold text-[#102948] block">Resultados Proyectados para {activeCommune}</span>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-xl border border-gray-150">
                          <span className="text-[10px] text-gray-400 font-bold block">Visitas Locales Organizadas</span>
                          <span className="text-lg font-mono font-black text-[#102948]">{estimatedClicks.toLocaleString('es-CL')}</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">Clicks con CPC de ${cpc} CLP</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-150">
                          <span className="text-[10px] text-gray-400 font-bold block">Tasa de Conversión</span>
                          <span className="text-lg font-mono font-black text-green-700">{(cr * 100).toFixed(1)}%</span>
                          <p className="text-[9px] text-slate-400 mt-0.5">Meta: {campaignGoal === 'sales' ? 'Venta Directa' : campaignGoal === 'brand' ? 'Notoriedad' : 'Fidelización'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-150 col-span-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold block">Clientes Nuevos para tu Local (Estimado)</span>
                              <span className="text-xl font-sans font-black text-indigo-700">{acquiredCustomers} Clientes</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 font-bold block">CAC Promedio</span>
                              <span className="text-xs font-mono font-bold text-gray-500">${approxCac.toLocaleString('es-CL')} CLP</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (acquiredCustomers / 80) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-2 text-[10px] text-[#102948] font-semibold italic bg-amber-50/75 border border-amber-200 p-3 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 select-none animate-bounce" />
                  <span>Petmall financia y co-administra el {platformSettings?.marketingCoFundingRate || 20}% adicional de la pauta publicitaria en comunas piloto durante la fase de lanzamiento oficial acordada.</span>
                </div>
              </div>

              {/* Right Column: Organic SEO & Social Media Generator */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs space-y-6">
                <div>
                  <span className="text-3xs uppercase text-[#cdaf7a] font-extrabold tracking-widest block mb-1">Marketing de Contenidos & SEO</span>
                  <h3 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#102948]" /> Planeador de Contenido & Ley Cholito
                  </h3>
                  <p className="text-3xs text-gray-400 mt-1">El marketing orgánico te posiciona en Google gratis. Copia o utiliza estos artículos recomendados en tu tienda.</p>
                </div>

                {/* Predeclared Drafts with Copy triggers */}
                <div className="space-y-3.5">
                  {customDrafts.map((draft) => (
                    <div key={draft.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-150 relative overflow-hidden flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="px-2 py-0.5 bg-[#102948]/10 text-[#102948] text-4xs font-bold uppercase rounded tracking-wider">
                            {draft.category}
                          </span>
                          <span className="text-4xs text-gray-400 font-mono font-bold">{draft.date}</span>
                        </div>
                        <h4 className="text-3xs font-black text-[#102948] mt-1.5 leading-tight">{draft.title}</h4>
                        <p className="text-4xs text-gray-400 mt-1 line-clamp-2 leading-normal">{draft.body}</p>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (draft.body) {
                              navigator.clipboard.writeText(`${draft.title}\n\n${draft.body}\n\n#Petmall #TenenciaResponsable #Chile`);
                              setCopiedDraftId(draft.id);
                              setTimeout(() => setCopiedDraftId(null), 2500);
                            }
                          }}
                          className={`px-2 py-1 font-sans text-4xs font-black uppercase rounded transition-all cursor-pointer ${
                            copiedDraftId === draft.id
                              ? 'bg-green-700 text-white'
                              : 'bg-white text-brand-blue border border-gray-250 hover:bg-gray-100 shadow-3xs'
                          }`}
                        >
                          {copiedDraftId === draft.id ? '✓ ¡Copiado!' : '📋 Copiar Borrador'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Blog content submitting simulation */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <span className="text-3xs font-extrabold text-gray-500 uppercase block">Proponer un Nuevo Artículo de Blog del Portal</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Título de la publicación..."
                      value={newBlogTitle}
                      onChange={(e) => setNewBlogTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-150 rounded-xl text-3xs font-semibold focus:outline-hidden"
                    />
                    <select
                      value={newBlogCategory}
                      onChange={(e) => setNewBlogCategory(e.target.value)}
                      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-150 rounded-xl text-3xs font-extrabold focus:outline-hidden"
                    >
                      <option value="Salud Animal">Salud Animal</option>
                      <option value="Nutrición Ecológica">Nutrición Ecológica</option>
                      <option value="Comunidad & Ayuda">Comunidad & Ayuda</option>
                      <option value="Leyes & Derechos">Leyes & Derechos</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Escribe un breve resumen de tu artículo. Ej: 'Beneficios de no dar chocolate a los caninos...'"
                    value={newBlogBody}
                    onChange={(e) => setNewBlogBody(e.target.value)}
                    rows={2}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-150 rounded-xl text-3xs font-semibold focus:outline-hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBlogTitle.trim() || !newBlogBody.trim()) {
                        alert('Completa el título y descripción del artículo.');
                        return;
                      }
                      const newItem = {
                        id: (customDrafts.length + 1).toString(),
                        title: newBlogTitle,
                        category: newBlogCategory,
                        date: new Date().toISOString().split('T')[0],
                        body: newBlogBody
                      };
                      setCustomDrafts([newItem, ...customDrafts]);
                      setNewBlogTitle('');
                      setNewBlogBody('');
                      alert('¡Borrador guardado con éxito! Se cargará dinámicamente en tu sección de contenidos del portal.');
                    }}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-3xs font-semibold uppercase rounded-xl transition-colors cursor-pointer"
                  >
                    Crear & Persistir Borrador SEO
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Alignment block: Foundations & Social Value pact */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-3xs uppercase text-[#cdaf7a] font-extrabold tracking-widest block mb-1">Responsabilidad Social & Reputación</span>
                  <h3 className="text-base font-serif font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Alianza Estratégica para la Adopción Animal
                  </h3>
                  <p className="text-3xs text-gray-400 mt-1">Nuestra estrategia física-digital provee espacio totalmente gratuito a refugios de rescate animal certificados en Chile.</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-3xs font-bold text-gray-500 uppercase">Auspiciar Adopciones</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAllianceFoundations(!allianceFoundations);
                    }}
                    className={`w-12 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                      allianceFoundations ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${
                      allianceFoundations ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center rounded-lg text-xs">1</div>
                    <h4 className="text-3xs font-black text-[#102948] uppercase tracking-wide mt-2">Vitrina de Adopción</h4>
                    <p className="text-4xs text-gray-400 leading-normal mt-1">
                      Habilitarás un feed visible de animales rescatados en tu perfil de tienda, aportando un gran rol comunitario y mejorando tu conversión con dueños de mascotas empáticos.
                    </p>
                  </div>
                  {adoptionPets.length > 0 && (
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 text-left space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Mascotas en Red ({adoptionPets.length})</span>
                      <div className="flex gap-2 items-center overflow-x-auto py-0.5">
                        {adoptionPets.slice(0, 3).map((p: any) => (
                          <div key={p.id} className="relative group shrink-0" title={`${p.name} - ${p.foundation}`}>
                            <img src={p.imageUrl} className="w-8 h-8 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white"></span>
                          </div>
                        ))}
                        {adoptionPets.length > 3 && (
                          <span className="text-4xs text-gray-400 font-bold">+{adoptionPets.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center rounded-lg text-xs">2</div>
                    <h4 className="text-3xs font-black text-[#102948] uppercase tracking-wide mt-2">Multiplicador en Buscador</h4>
                    <p className="text-4xs text-gray-400 leading-normal mt-1">
                      Las tiendas activas que auspician fundaciones suben un factor de multiplicador dinámico en la prioridad de posición de búsqueda del mapa Marketplace Home.
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                    <span className="text-[10px] text-amber-800 uppercase block font-mono font-bold">Multiplicador Activo</span>
                    <span className="text-xl font-bold text-amber-900 font-mono">{(platformSettings?.searchMultiplier || 1.2)}x prioridad</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 bg-green-100 text-green-700 font-extrabold flex items-center justify-center rounded-lg text-xs">3</div>
                    <h4 className="text-3xs font-black text-[#102948] uppercase tracking-wide mt-2">Material Promocional</h4>
                    <p className="text-4xs text-gray-400 leading-normal mt-1">
                      Descarga directo calcomanías oficiales, bolsas ecológicas de Petmall y manuales aprobados por el corporativo central.
                    </p>
                  </div>
                  {promotionalMaterials.length > 0 ? (
                    <div className="space-y-1">
                      {promotionalMaterials.slice(0, 2).map((m: any) => (
                        <a 
                          key={m.id} 
                          href={m.downloadUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          referrerPolicy="no-referrer"
                          className="flex items-center justify-between p-1.5 bg-white border border-gray-200 hover:border-green-300 rounded-lg text-[9px] font-bold text-slate-700 hover:text-green-800 transition-colors"
                        >
                          <span className="truncate max-w-[110px]">🟢 {m.title}</span>
                          <span className="text-[8px] bg-slate-100 text-slate-500 rounded px-1">{m.format}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[9px] text-gray-400 font-bold italic">No hay archivos promocionales cargados aún.</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* SUB-SCREEN 10: BLOG CORPORATIVO & MARKETING DE CONTENIDOS CMS */}
        {activeTab === 'blog' && (
          <div className="space-y-8 text-left animate-fade-in font-sans">
            {/* If store plan does not support blog, show a beautiful upgrade teaser */}
            {!(myStore?.planType === 'control_omnicanal' || myStore?.planType === 'enterprise_elite') ? (
              <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-10 shadow-2xl border border-gray-850 text-center relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-[#DABD83]/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none animate-pulse" />
                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                  <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 text-brand-gold rounded-full px-4 text-xs font-black uppercase tracking-wider">
                    👑 MÓDULO EXCLUSIVO DE CONTENIDOS OMNICANAL
                  </div>
                  <h2 className="text-2xl md:text-4xl font-serif font-black text-[#DABD83] tracking-tight">
                    Multiplica tus Visitas y Ventas con tu Propio Blog Corporativo
                  </h2>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                    Tu plan actual <span className="text-red-400 font-black">"Market & Growth"</span> no cuenta con el sistema de blog unificado ni compartibilidad en redes sociales con previsualizaciones automáticas dinámicas.
                  </p>
                  
                  {/* Grid to show sharing capabilities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs font-mono">WA</div>
                      <h4 className="text-2xs font-extrabold uppercase text-[#DABD83]">WhatsApp & Telegram</h4>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Muestra portadas enriquecidas, descripciones del artículo y links limpios cada vez que compartes por chats privados o grupos locales.
                      </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs font-mono">X</div>
                      <h4 className="text-2xs font-extrabold uppercase text-[#DABD83]">X, Threads & FB</h4>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Formato Cards adaptativo de última generación para captar mayor cantidad de clics directos del usuario y mejorar el SEO local.
                      </p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs font-mono">IG</div>
                      <h4 className="text-2xs font-extrabold uppercase text-[#DABD83]">Instagram & LinkedIn</h4>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Previsualiza publicaciones profesionales con el logotipo corporativo de tu local, elevando la reputación veterinaria.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={async () => {
                        const sId = currentUser?.storeId || 'store_1';
                        try {
                          const res = await fetch(`/api/stores/${sId}/upgrade`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              planType: 'control_omnicanal', 
                              planName: 'Plan Control & Omnicanal 🚀' 
                            })
                          });
                          if (res.ok) {
                            alert('¡Excelente decisión! Tu plan se ha actualizado exitosamente. Disfruta de la creación unificada de contenido en Petmall.');
                            fetchStores();
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="bg-[#DABD83] hover:bg-[#cdaf7a] text-[#102948] font-sans font-black text-xs uppercase px-8 py-4 rounded-2xl transition-all shadow-md tracking-wider cursor-pointer transform hover:scale-101 inline-flex items-center gap-2"
                    >
                      Mejorar a Plan "Control & Omnicanal" <Sparkles className="w-4 h-4" />
                    </button>
                    <p className="text-[8px] text-gray-400 mt-2">Suscripción SaaS se factura mensualmente. Cancela cuando quieras desde tu panel.</p>
                  </div>
                </div>
              </div>
            ) : (
              // Active blog system
              <div className="space-y-8 animate-fade-in">
                {/* 1. Blog Management Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-3xs">
                  <div>
                    <h2 className="font-serif font-black text-[#102948] text-base">Tus Artículos de Blog Publicados</h2>
                    <p className="text-3xs text-gray-450 mt-0.5 font-bold uppercase tracking-wider">
                      Privilegios activos para: dueños y colaboradores autorizados
                    </p>
                  </div>
                  
                  {!(currentUser?.role === 'SUPER_USER' || currentUser?.role === 'STORE_OWNER' || storeUsers?.some(u => u.email.toLowerCase() === currentUser?.email?.toLowerCase() && u.allowBlog)) ? (
                    <div className="px-4 py-2 bg-red-50 border border-red-150 rounded-xl text-3xs text-red-700 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Sin privilegios de redacción de blog para colaborador. Solicítalos a tu administrador principal.
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPost(null);
                        setBlogTitle('');
                        setBlogSlug('');
                        setBlogBannerUrl('');
                        setBlogExcerpt('');
                        setBlogContent('');
                        setBlogTags('');
                        setBlogStatus('PUBLISHED');
                        setBlogFormOpen(true);
                      }}
                      className="bg-[#102948] text-white hover:bg-[#cdaf7a] hover:text-[#102948] font-sans font-black text-xs uppercase px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Escribir Artículo de Blog
                    </button>
                  )}
                </div>

                {/* 2. Blog Creation/Edition Modal or Collapsible Panel */}
                {blogFormOpen && (
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-md grid grid-cols-1 lg:grid-cols-2 gap-8 text-left animate-fade-in">
                    
                    {/* Left Col: The Form fields */}
                    <form onSubmit={handleSaveBlogPost} className="space-y-5">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <h3 className="font-serif font-black text-md text-[#102948]">
                          {editingPost ? '✏️ Editar Artículo de Blog' : '✍️ Crear Nuevo Artículo'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setBlogFormOpen(false)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-450 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">Título del Artículo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Tips de Baño Seco o Nutrición"
                          value={blogTitle}
                          onChange={(e) => {
                            setBlogTitle(e.target.value);
                            setBlogSlug(e.target.value.toLowerCase().trim().replace(/[\s\W]+/g, '-'));
                          }}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:ring-1 focus:ring-[#DABD83] outline-hidden text-[#102948] font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">Slug URL Amigable</label>
                          <input
                            type="text"
                            required
                            placeholder="url-del-articulo"
                            value={blogSlug}
                            onChange={(e) => setBlogSlug(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-indigo-950 font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">Tags (Separados por coma)</label>
                          <input
                            type="text"
                            placeholder="Salud, Nutrición, Tips"
                            value={blogTags}
                            onChange={(e) => setBlogTags(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-[#102948] font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">Imagen de Portada (URL)</label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/... o vacío para usar default"
                          value={blogBannerUrl}
                          onChange={(e) => setBlogBannerUrl(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-[#102948] font-medium"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">Resumen Informativo (Excerpt)</label>
                        <textarea
                          rows={2}
                          placeholder="Engancha a tus usuarios en redes sociales..."
                          value={blogExcerpt}
                          onChange={(e) => setBlogExcerpt(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2 text-xs text-[#102948] font-medium"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] text-gray-450 font-extrabold uppercase block tracking-wider">Cuerpo / Contenido</label>
                          <span className="text-[8px] text-emerald-600 uppercase font-black tracking-wider">Editor En Vivo</span>
                        </div>
                        <textarea
                          rows={6}
                          required
                          placeholder="Escribe recomendaciones, consejos sanitarios, juguetes interactivos de soga, etc..."
                          value={blogContent}
                          onChange={(e) => setBlogContent(e.target.value)}
                          className="w-full bg-slate-50 border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-800"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="space-x-2">
                          <span className="text-[10px] text-gray-400 font-extrabold uppercase">Estado:</span>
                          <select
                            value={blogStatus}
                            onChange={(e) => setBlogStatus(e.target.value as any)}
                            className="bg-slate-50 border border-gray-200 text-xs px-3 py-1.5 rounded-lg text-[#102948] font-bold cursor-pointer font-sans"
                          >
                            <option value="PUBLISHED">Publicado (Activo)</option>
                            <option value="DRAFT">Borrador Secreto</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBlogFormOpen(false)}
                            className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer font-sans"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-[#102948] text-[#DABD83] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#cdaf7a] hover:text-[#102948] transition-all shadow-xs cursor-pointer font-sans"
                          >
                            Sincronizar Articulo
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Right Col: Social Network Dynamic Card Live Previewer */}
                    <div className="space-y-5 bg-slate-50 p-6 rounded-3xl border border-gray-150 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[#102948] font-serif font-black text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          Simulador en Redes Sociales (Social Previews Live)
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          Cada artículo publicado en Petmall está optimizado dinámicamente utilizando tags OG y JSON-LD. Selecciona los botones para ver cómo se estructurará tu contenido:
                        </p>

                        {/* Social Platform Selection Tabs */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-b border-gray-200 pb-3">
                          {[
                            { code: 'whatsapp', label: 'WhatsApp' },
                            { code: 'telegram', label: 'Telegram' },
                            { code: 'X', label: 'X (Twitter)' },
                            { code: 'facebook', label: 'Facebook' },
                            { code: 'threads', label: 'Threads' },
                            { code: 'instagram', label: 'Instagram' },
                            { code: 'linkedin', label: 'LinkedIn' },
                          ].map(t => (
                            <button
                              key={t.code}
                              type="button"
                              onClick={() => setPreviewPlatform(t.code as any)}
                              className={`px-2.5 py-1.5 rounded-lg text-4xs font-black transition-colors uppercase tracking-wider cursor-pointer ${
                                previewPlatform === t.code 
                                  ? 'bg-[#102948] text-[#DABD83] shadow-3xs' 
                                  : 'bg-white border rounded-lg text-gray-500 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Mockup Card Box */}
                      <div className="flex-1 py-4 flex items-center justify-center min-h-[240px]">
                        
                        {/* A. WHATSAPP MOCKUP */}
                        {previewPlatform === 'whatsapp' && (
                          <div className="max-w-[340px] w-full bg-[#d9fdd3] text-[#303030] rounded-xl p-3 shadow-xs border border-[#b9e6b4] text-left relative font-sans text-xs">
                            <span className="absolute right-2 bottom-1.5 text-[9px] text-[#667781] font-medium flex items-center gap-1">
                              12:44 pm ✓✓
                            </span>
                            <div className="space-y-2 pb-3 pr-4">
                              <p className="text-[#303030] leading-normal">
                                ¡Hola! miren este artículo veterinario de <b>{myStore.name}</b>, está muy interesante para cuidar a las mascotas:
                              </p>
                              <span className="text-teal-700 underline block font-semibold break-all text-[9px] font-mono">
                                petmall-ecosystem.com/store/{myStore.id}/blog/{blogSlug || 'nutricion-barf'}
                              </span>
                            </div>
                            
                            {/* Rich Preview Box */}
                            <div className="bg-[#cfeec2]/50 rounded-lg overflow-hidden border border-[#b4e0a7]/30 flex flex-col">
                              <div className="flex">
                                <div className="p-3 flex-1 space-y-1">
                                  <span className="text-[10px] text-[#667781] font-black uppercase tracking-wider block">PETMALL STORE BLOG</span>
                                  <h4 className="font-sans font-bold text-gray-900 text-2xs line-clamp-2 leading-snug">
                                    {blogTitle || 'Título del Artículo de mi Blog'}
                                  </h4>
                                  <p className="text-[10px] text-[#667781] line-clamp-2 leading-snug">
                                    {blogExcerpt || 'Breve resumen explicativo que motiva el ingreso.'}
                                  </p>
                                </div>
                                <div className="w-20 h-20 bg-gray-100 shrink-0 border-l border-[#b4e0a7]/30">
                                  <img 
                                    src={blogBannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&q=80'} 
                                    className="w-full h-full object-cover" 
                                    alt="Thumbnail"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* B. TELEGRAM MOCKUP */}
                        {previewPlatform === 'telegram' && (
                          <div className="max-w-[345px] w-full bg-[#ffffff] text-gray-900 rounded-2xl p-3.5 shadow-xs border border-gray-150 text-left font-sans text-xs relative">
                            <div className="space-y-2">
                              <p className="leading-normal">
                                Recomendación de <b>{myStore.name}</b> para el cuidado diario mascotero de la comuna:
                              </p>
                              
                              <div className="border-l-3 border-[#3390ec] pl-3 py-1 space-y-2 bg-slate-50/50 rounded-r-lg pr-2">
                                <span className="text-[#3390ec] font-black text-[10px] block uppercase tracking-wide">
                                  {myStore.name} — Blog Oficial
                                </span>
                                <h4 className="font-bold text-[#000000] text-3xs leading-snug">
                                  {blogTitle || 'Título de Blog Corporativo'}
                                </h4>
                                <p className="text-[10px] text-gray-600 line-clamp-2 leading-normal">
                                  {blogExcerpt || 'Resumen corto optimizado para indexación rápida Open Graph.'}
                                </p>
                                
                                <div className="aspect-[1.91/1] w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-150 relative">
                                  <img 
                                    src={blogBannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80'} 
                                    className="w-full h-full object-cover" 
                                    alt="Banner preview"
                                  />
                                </div>
                              </div>
                            </div>
                            <span className="absolute right-3.5 bottom-1 text-[9px] text-gray-400">12:44 ✓</span>
                          </div>
                        )}

                        {/* C. X (TWITTER) MOCKUP */}
                        {previewPlatform === 'X' && (
                          <div className="max-w-[340px] w-full bg-[#000000] text-white rounded-2xl p-4 shadow-md border border-zinc-800 text-left font-sans text-xs">
                            <div className="flex items-start gap-2.5 pb-2">
                              <div className="w-8 h-8 rounded-full bg-[#102948] text-[#DABD83] shrink-0 font-bold flex items-center justify-center text-3xs border border-white/10 uppercase">
                                {myStore.name.substring(0, 2)}
                              </div>
                              <div>
                                <span className="font-black text-[11px] text-white block">
                                  {myStore.name}
                                </span>
                                <span className="text-[9px] text-zinc-500 block leading-none mt-0.5">
                                  @{myStore.id}_petmall · Reciente
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-zinc-250 mt-1 line-clamp-2 text-3xs leading-relaxed">
                              {blogExcerpt || 'Descubre de primera fuente nuestro último análisis veterinario. ¡Leamos juntos! #Veterinaria #Petmall'}
                            </p>

                            <div className="mt-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col hover:border-zinc-700 transition-colors">
                              <div className="aspect-[1.91/1] w-full bg-zinc-900 border-b border-zinc-800">
                                <img
                                  src={blogBannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80'}
                                  className="w-full h-full object-cover"
                                  alt="Card preview"
                                />
                              </div>
                              <div className="p-3 text-[9px] space-y-1">
                                <span className="text-zinc-500 font-bold block uppercase tracking-widest text-[8px]">PETMALL-ECOSYSTEM.COM</span>
                                <h4 className="font-bold text-white text-3xs truncate">
                                  {blogTitle || 'Título del artículo publicado'}
                                </h4>
                                <p className="text-zinc-400 line-clamp-1 leading-normal">
                                  {blogExcerpt || 'Breve descripción que incita a los usuarios de la red a ingresar de inmediato.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* D. FACEBOOK MOCKUP */}
                        {previewPlatform === 'facebook' && (
                          <div className="max-w-[340px] w-full bg-[#f0f2f5] text-gray-900 rounded-2xl p-0 shadow-xs border border-gray-200 text-left font-sans text-xs overflow-hidden">
                            <div className="p-3.5 bg-white space-y-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white shrink-0 font-extrabold flex items-center justify-center text-xs">f</div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 text-2xs block leading-tight">{myStore.name}</span>
                                  <span className="text-5xs text-gray-500 font-extrabold block uppercase tracking-widest">Patrocinado · Público</span>
                                </div>
                              </div>
                              <p className="text-gray-700 line-clamp-2">
                                {blogExcerpt || 'La medicina preventiva y nutrición adecuada reduce significativamente la tasa de consultas veterinarias habituales.'}
                              </p>
                            </div>

                            <div className="bg-white border-y border-gray-150 cursor-pointer">
                              <div className="aspect-[1.91/1] w-full bg-gray-50">
                                <img
                                  src={blogBannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80'}
                                  className="w-full h-full object-cover"
                                  alt="Facebook preview"
                                />
                              </div>
                              <div className="p-3 bg-gray-100 space-y-0.5 border-t border-gray-150">
                                <span className="text-5xs text-gray-500 font-extrabold uppercase tracking-widest">PETMALL-ECOSYSTEM.COM</span>
                                <h4 className="font-extrabold text-gray-900 text-2xs leading-snug line-clamp-1">{blogTitle || 'Tu Post de Blog'}</h4>
                                <p className="text-[10px] text-gray-500 line-clamp-1">{blogExcerpt || 'Descripción extendida sobre este asombroso artículo.'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* E. THREADS MOCKUP */}
                        {previewPlatform === 'threads' && (
                          <div className="max-w-[340px] w-full bg-[#ffffff] text-black rounded-2xl p-4 shadow-xs border border-gray-150 text-left font-sans text-xs">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center shrink-0">
                                <div className="w-8 h-8 rounded-full bg-black text-white shrink-0 font-bold flex items-center justify-center text-4xs uppercase">
                                  {myStore.name.substring(0, 2)}
                                </div>
                                <div className="w-[1px] bg-gray-200 mt-2 flex-grow" />
                              </div>
                              
                              <div className="space-y-2 flex-1 text-left">
                                <span className="font-extrabold text-[11px] text-gray-950 block">{myStore.id}_petmall</span>
                                <p className="text-gray-800 leading-normal text-3xs">
                                  {blogExcerpt || 'Excelente publicación sobre el valor biológico preventivo que acabamos de soltar.'}
                                </p>
                                
                                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white hover:bg-slate-50 transition-colors">
                                  <div className="aspect-[1.91/1] w-full bg-gray-50">
                                    <img
                                      src={blogBannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80'}
                                      className="w-full h-full object-cover"
                                      alt="Threads preview"
                                    />
                                  </div>
                                  <div className="p-3 text-[9px] space-y-0.5 text-left bg-zinc-50/50">
                                    <span className="text-gray-400 font-extrabold uppercase block text-[8px] tracking-widest">PETMALL SINOPSIS</span>
                                    <h4 className="font-black text-gray-950 leading-tight block">{blogTitle || 'Mi Artículo'}</h4>
                                    <p className="text-gray-500 line-clamp-2 mt-1 leading-normal">{blogExcerpt || 'Descubre todo con formato...'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* F. INSTAGRAM MOCKUP */}
                        {previewPlatform === 'instagram' && (
                          <div className="max-w-[260px] w-full bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden font-sans text-xs">
                            <div className="p-3 flex items-center gap-2 border-b border-gray-100 bg-white">
                              <div className="w-6 h-6 rounded-full bg-linear-to-tr from-yellow-500 via-red-500 to-purple-600 p-[1.5px]">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[8px] uppercase">
                                  {myStore.name.substring(0, 1)}
                                </div>
                              </div>
                              <span className="font-extrabold text-[10px] text-gray-900">{myStore.id}_petmall</span>
                            </div>
                            
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                              <img
                                src={blogBannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80'}
                                className="w-full h-full object-cover"
                                alt="IG feed image"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left">
                                <span className="bg-amber-400 text-black text-[7px] px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider">PREVENTIVO</span>
                                <h4 className="font-serif font-black text-white text-[10px] leading-tight line-clamp-2 mt-1">
                                  {blogTitle || 'Título del Artículo de mi Blog'}
                                </h4>
                              </div>
                            </div>

                            <div className="p-3 text-left space-y-1 bg-white">
                              <p className="line-clamp-2 text-[10px] leading-relaxed">
                                <span className="font-black mr-1 text-gray-950">{myStore.id}_petmall</span>
                                {blogExcerpt || 'Estrechando el lazo con tutorías y guías de cuidado animal orgánico veterinario.'}
                              </p>
                              <span className="text-[8px] text-gray-400 uppercase font-black block mt-1">Hace 2 horas</span>
                            </div>
                          </div>
                        )}

                        {/* G. LINKEDIN MOCKUP */}
                        {previewPlatform === 'linkedin' && (
                          <div className="max-w-[340px] w-full bg-white rounded-xl p-4 shadow-xs border border-gray-200 text-left font-sans text-xs">
                            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black flex items-center justify-center shrink-0">in</div>
                              <div>
                                <span className="font-extrabold text-gray-900 text-[11px] block">{myStore.name}</span>
                                <span className="text-[9px] text-gray-400 block leading-tight">Servicios Veterinarios & Ecommerce B2B</span>
                              </div>
                            </div>

                            <p className="text-gray-700 mt-2 line-clamp-2 text-3xs leading-relaxed">
                              {blogExcerpt || 'Muy entusiasmados de publicar contenido de valor de base científica para aportar en nuestra red corporativa.'}
                            </p>

                            <div className="mt-3 border border-gray-200 bg-slate-50 rounded-lg overflow-hidden hover:bg-slate-100 transition-colors">
                              <div className="aspect-[1.91/1] w-full bg-gray-200 border-b">
                                <img
                                  src={blogBannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80'}
                                  className="w-full h-full object-cover"
                                  alt="LinkedIn preview"
                                />
                              </div>
                              <div className="p-3 space-y-0.5">
                                <h4 className="font-extrabold text-gray-900 text-3xs truncate">{blogTitle || 'Artículo Corporativo Petmall'}</h4>
                                <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-widest text-[8px]">petmall-ecosystem.com · 5 min lectura</span>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Mock share actions */}
                      <div className="bg-[#102948]/5 border border-[#102948]/10 p-3 rounded-2xl flex items-center justify-between text-left">
                        <div className="text-3xs text-[#102948] font-bold">
                          <span className="block uppercase text-[8px] text-[#cdaf7a] font-extrabold">Fórmula Compartible (SEO)</span>
                          Previsualización sintonizada automáticamente
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(`https://petmall-ecosystem.com/store/${myStore.id}/blog/${blogSlug}`);
                            alert(`¡Enlace copiado al portapapeles! Listo para pegar en tu widget de ${previewPlatform.toUpperCase()}`);
                          }}
                          className="px-3.5 py-1.5 bg-[#102948] hover:bg-[#cdaf7a] hover:text-[#102948] text-[#DABD83] rounded-lg text-3xs font-black transition-colors uppercase cursor-pointer"
                        >
                          Copiar Enlace
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Existing Blog Posts Grid Table representation */}
                <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-3xs text-left">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                    <div>
                      <h3 className="font-serif font-black text-[#102948] text-base">Artículos Redactados para tu Tienda</h3>
                      <p className="text-3xs text-gray-400 font-medium leading-none">Los borradores permiten revisión antes de publicarse en la portada.</p>
                    </div>

                    <button
                      onClick={fetchStoreBlogs}
                      className="px-3 py-1.5 border hover:bg-gray-50 text-[#102948] rounded-xl text-3xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Feed
                    </button>
                  </div>

                  {blogListLoading ? (
                    <div className="py-20 text-center text-gray-400 text-xs font-bold font-sans">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#102948]" /> Sincronizando repositorio de contenidos...
                    </div>
                  ) : blogPostsList.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 text-xs font-bold border border-dashed border-gray-200 bg-slate-50 rounded-3xl flex flex-col items-center justify-center space-y-2">
                       <p className="text-[#102948] text-xs font-serif font-black">¡No hay artículos de blog asociados todavía!</p>
                       <p className="text-3xs font-medium max-w-sm text-gray-400 font-sans">Los blogs incrementan el posicionamiento de tu ecommerce en casi un 25%. Haz clic en "Escribir Artículo" para comenzar ahora.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {blogPostsList.map((post) => (
                        <div key={post.id} className="group bg-slate-50 hover:bg-white rounded-2xl border border-gray-150 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                          <div className="relative aspect-video bg-gray-100 overflow-hidden">
                            <img 
                              src={post.bannerUrl || 'https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=600&q=80'} 
                              className="w-full h-full object-cover group-hover:scale-101 transition-all duration-300 pointer-events-none"
                              alt={post.title}
                            />
                            <div className="absolute top-3 left-3 flex gap-1 items-center">
                              <span className={`px-2 py-0.5 rounded-lg text-4xs font-black uppercase text-white shadow-xs ${
                                post.status === 'PUBLISHED' ? 'bg-green-600' : 'bg-amber-500'
                              }`}>
                                {post.status === 'PUBLISHED' ? 'Público' : 'Borrador'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-1.5 text-left">
                              <span className="text-5xs uppercase text-gray-400 font-extrabold tracking-wider block font-sans">
                                📅 {new Date(post.createdAt).toLocaleDateString('es-CL')} | Autor: {post.authorName}
                              </span>
                              <h4 className="font-serif font-black text-xs text-[#102948] leading-snug line-clamp-2">
                                {post.title}
                              </h4>
                              <p className="text-3xs text-gray-450 line-clamp-2 leading-normal">
                                {post.excerpt}
                              </p>
                              
                              <div className="flex flex-wrap gap-1 pt-1.5">
                                {post.tags && post.tags.map((tag: string) => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded text-5xs font-black uppercase tracking-wide">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="border-t border-gray-200/50 pt-3.5 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleEditBlogPostClick(post)}
                                className="text-2xs font-extrabold uppercase text-[#102948] hover:text-[#cdaf7a] hover:underline cursor-pointer"
                              >
                                Editar Artículo
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteBlogPost(post.id)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                title="Eliminar Post"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
