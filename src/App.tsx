/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { usePetmallStore } from './store.js';

// Layout Shared Header Components
import Navbar from './components/Navbar.js';

// Public Marketplace B2C Views
import MarketplaceHome from './components/MarketplaceHome.js';
import ItemDetail from './components/ItemDetail.js';
import CheckoutPage from './components/CheckoutPage.js';
import StoreDetail from './components/StoreDetail.js';
import AdminEnrollment from './components/AdminEnrollment.js';

// Merchant Auth Views
import AdminLogin from './components/AdminLogin.js';

// Private ERP B2B SaaS Dashboard
import AdminDashboard from './components/AdminDashboard.js';

// Route Guard to protect administrative dashboards (/admin/*)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = usePetmallStore();

  if (!currentUser) {
    // If not authenticated, redirect to merchant access point
    console.warn('[RouteGuard] Acceso bloqueado para usuario invitado. Redirigiendo a /auth/login...');
    return <Navigate to="/auth/login" replace />;
  }

  // Double-check roles
  if (currentUser.role !== 'STORE_OWNER' && currentUser.role !== 'STORE_STAFF' && currentUser.role !== 'SUPER_USER') {
    console.error('[RouteGuard] Permisos insuficientes. Redirigiendo a home...');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Global Main Layout wrapping
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-3xs text-gray-400 font-semibold select-none">
        <p>© 2026 Petmall Inc. Ecosistema Omnicanal Integrado. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

// Path watcher to synchronize isDemoMode with URL path automatically
function PathWatcher() {
  const { isDemoMode, setDemoMode } = usePetmallStore();
  const location = useLocation();

  useEffect(() => {
    const isPathDemo = location.pathname === '/demo' || location.pathname.startsWith('/demo/');
    if (isDemoMode !== isPathDemo) {
      console.log(`[PathWatcher] Syncing isDemoMode with path: ${isPathDemo}`);
      setDemoMode(isPathDemo);
    }
  }, [location.pathname, isDemoMode, setDemoMode]);

  return null;
}

export default function App() {
  const { startSseConnection, fetchStores, fetchCatalog, fetchOrders } = usePetmallStore();

  useEffect(() => {
    // Bootstrap initial data & setup live stream connection
    startSseConnection();
    fetchStores();
    fetchCatalog();
    fetchOrders();
  }, []);

  return (
    <BrowserRouter>
      <PathWatcher />
      <Routes>
        
        {/* === A. FLUJO PÚBLICO (Marketplace B2C) === */}
        <Route 
          path="/" 
          element={
            <MainLayout>
              <MarketplaceHome />
            </MainLayout>
          } 
        />
        
        <Route 
          path="/item/:id" 
          element={
            <MainLayout>
              <ItemDetail />
            </MainLayout>
          } 
        />
        
        <Route 
          path="/checkout" 
          element={
            <MainLayout>
              <CheckoutPage />
            </MainLayout>
          } 
        />
        
        <Route 
          path="/store/:id" 
          element={
            <MainLayout>
              <StoreDetail />
            </MainLayout>
          } 
        />
        
        <Route 
          path="/enroll" 
          element={
            <MainLayout>
              <AdminEnrollment />
            </MainLayout>
          } 
        />

        {/* === DEMO ENVIRONMENT ROUTING === */}
        <Route 
          path="/demo" 
          element={
            <MainLayout>
              <MarketplaceHome />
            </MainLayout>
          } 
        />
        <Route 
          path="/demo/item/:id" 
          element={
            <MainLayout>
              <ItemDetail />
            </MainLayout>
          } 
        />
        <Route 
          path="/demo/checkout" 
          element={
            <MainLayout>
              <CheckoutPage />
            </MainLayout>
          } 
        />
        
        <Route 
          path="/demo/store/:id" 
          element={
            <MainLayout>
              <StoreDetail />
            </MainLayout>
          } 
        />
        <Route 
          path="/demo/enroll" 
          element={
            <MainLayout>
              <AdminEnrollment />
            </MainLayout>
          } 
        />

        {/* === B. FLUJO DE AUTENTICACIÓN DE COMERCIANTES === */}
        <Route path="/auth/login" element={<AdminLogin view="login" />} />
        <Route path="/auth/forgot-password" element={<AdminLogin view="forgot" />} />
        <Route path="/auth/reset-password/:token" element={<AdminLogin view="reset" />} />

        {/* === C. FLUJO PRIVADO ADMIN/ERP B2B SaaS (ProtectedRoute) === */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* We reuse the rich dashboard module that contains corresponding fast tab selection */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Redirects */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
