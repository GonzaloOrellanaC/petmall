/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Store as StoreIcon, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { usePetmallStore } from '../store.js';
import publicIsotype from '../../assets/isotype_public_petmall.png';

export default function Navbar() {
  const { cart, currentStore, stores, setCurrentStore, currentUser, logoutUser, sseConnected, isDemoMode } = usePetmallStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link to={isDemoMode ? "/demo" : "/"} className="flex items-center space-x-2">
              <img src={publicIsotype} alt="Isotipo Petmall" className="w-8 h-8 object-contain" />
              <span className="font-serif text-3xl font-bold tracking-tight text-brand-blue">
                Petmall
              </span>
            </Link>

            {/* Store selector removed from header */}


          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Alimento natural para gatos, arena ecologica..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full bg-gray-50 text-sm placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-brand-gold focus:border-brand-gold focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center space-x-4">
            
            {/* Unified Portal & Blogs Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-[#102948]/15 hover:border-[#102948]/30 rounded-full text-[10px] font-black text-brand-blue uppercase tracking-wider transition-all select-none cursor-pointer bg-slate-50/70 hover:bg-slate-50"
              >
                <span>Portal & Blogs</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <>
                  {/* Backdrop click dismisser */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                  
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-gray-150 shadow-lg py-2.5 z-20 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-1 border-b border-gray-100 mb-2">
                      <span className="block text-[9px] font-black uppercase text-gray-400 tracking-wider">Comunidad y Accesos</span>
                    </div>

                    {/* 1. Blogs & Novedades Option */}
                    <Link
                      to={isDemoMode ? "/demo/blogs" : "/blogs"}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 text-xs text-slate-700 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1.5 shrink-0" />
                      <div>
                        <span className="block font-black text-brand-blue uppercase tracking-wide text-3xs">Blogs & Novedades</span>
                        <span className="block text-[9px] text-gray-450 mt-0.5 normal-case font-medium">Ciencia, leyes, eventos y salud animal</span>
                      </div>
                    </Link>

                    {/* 1b. Adopciones Cercanas Option */}
                    <Link
                      to={isDemoMode ? "/demo/adopciones" : "/adopciones"}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 text-xs text-slate-700 transition-colors border-t border-gray-50"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mt-1.5 shrink-0" />
                      <div>
                        <span className="block font-black text-rose-700 uppercase tracking-wide text-3xs">Adopciones Cercanas</span>
                        <span className="block text-[9px] text-gray-450 mt-0.5 normal-case font-medium">Busca mascotas en adopción por distancia</span>
                      </div>
                    </Link>

                    {/* 1c. Red de Envíos Privados Option */}
                    <Link
                      to={isDemoMode ? "/demo/delivery-portal" : "/delivery-portal"}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 text-xs text-slate-700 transition-colors border-t border-gray-50"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1.5 shrink-0" />
                      <div>
                        <span className="block font-black text-amber-700 uppercase tracking-wide text-3xs">Envíos Privados Independientes</span>
                        <span className="block text-[9px] text-gray-450 mt-0.5 normal-case font-medium">Inscríbete como repartidor o cotiza despachos locales</span>
                      </div>
                    </Link>

                    {/* 2. Commerce Entry / Admin Action */}
                    {currentUser ? (
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 text-xs text-indigo-750 transition-colors border-t border-gray-50"
                        >
                          <span className="w-2 h-2 rounded-full bg-indigo-650 mt-1.5 shrink-0" />
                          <div>
                            <span className="block font-black text-indigo-750 uppercase tracking-wide text-3xs">CMS Administrativo</span>
                            <span className="block text-[9px] text-gray-450 mt-0.5 normal-case font-medium">Gestiona tu comercio o veterinaria</span>
                          </div>
                        </Link>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2 px-3.5">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              logoutUser();
                              navigate('/');
                            }}
                            className="w-full text-left font-black uppercase tracking-wider text-4xs text-red-650 hover:underline py-1 cursor-pointer"
                          >
                            🔒 Salir de la Cuenta
                          </button>
                        </div>
                      </>
                    ) : (
                      <Link
                        to="/auth/login"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-start space-x-3 px-3.5 py-2.5 hover:bg-slate-50 text-xs text-slate-700 transition-colors border-t border-gray-50 animate-fade-in"
                      >
                        <User className="w-4 h-4 text-gray-450 mt-0.5 shrink-0" />
                        <div>
                          <span className="block font-black text-brand-blue uppercase tracking-wide text-3xs">Acceso Comercios</span>
                          <span className="block text-[9px] text-gray-450 mt-0.5 normal-case font-medium">Ingreso veterinarias y tiendas socias</span>
                        </div>
                      </Link>
                    )}

                  </div>
                </>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-gray-700 hover:text-brand-gold transition-all cursor-pointer"
            >
              <ShoppingCart className="w-5.2 h-5.2" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-gold text-white font-sans text-3xs font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full ring-2 ring-white">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cart Slider Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            
            {/* Backdrop overlay */}
            <div 
              className="absolute inset-0 bg-black/45 transition-opacity" 
              onClick={() => setIsCartOpen(false)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md bg-white shadow-xl flex flex-col">
                <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                    <h2 className="text-lg font-serif font-bold text-brand-blue">Carrito de Compras / Reservas</h2>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <span className="sr-only">Cerrar</span>
                      ✕
                    </button>
                  </div>

                  <div className="mt-8">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 flex flex-col items-center">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">Tu carrito de Petmall está vacío.</p>
                        <p className="text-gray-400 text-xs mt-1">Explora alimentos naturales o agenda un servicio para tu mascota.</p>
                      </div>
                    ) : (
                      <div className="flow-root">
                        <ul className="-my-6 divide-y divide-gray-100">
                          {cart.map((cartItem, idx) => (
                            <li key={idx} className="flex py-6">
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                                <img
                                  src={cartItem.item.images[0]}
                                  alt={cartItem.item.title}
                                  className="h-full w-full object-cover object-center"
                                />
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-sm font-medium text-gray-900">
                                    <h3 className="font-semibold text-brand-blue line-clamp-1">
                                      {cartItem.item.title}
                                    </h3>
                                    <p className="ml-4 font-mono font-bold text-gray-800">
                                      ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500 capitalize">
                                    {cartItem.item.type === 'PRODUCT' ? 'Producto' : 'Servicio Reservado'}
                                  </p>
                                  
                                  {cartItem.bookingSchedule && (
                                    <div className="mt-1.5 p-1.5 bg-yellow-50/50 rounded-sm border border-yellow-100 text-xs text-amber-800">
                                      <p className="font-medium">
                                        📅 {cartItem.bookingSchedule.date} a las {cartItem.bookingSchedule.timeSlot}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-1 items-end justify-between text-xs">
                                  <p className="text-gray-500">
                                    Cant: <span className="font-bold text-gray-850">{cartItem.quantity}</span>
                                  </p>

                                  <button
                                    onClick={() => usePetmallStore.getState().removeFromCart(cartItem.item.id, cartItem.bookingSchedule?.timeSlot)}
                                    className="font-medium text-red-600 hover:text-red-500"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6 bg-gray-50">
                    <div className="flex justify-between text-sm text-gray-900">
                      <p className="text-gray-500 font-medium">Subtotal Estimado</p>
                      <p className="font-mono text-lg font-bold text-brand-blue">${cartTotal.toFixed(2)}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Sincronización instantánea de stock asegurada con almacén físico del POS.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          navigate(isDemoMode ? '/demo/checkout' : '/checkout');
                        }}
                        className="flex w-full items-center justify-center rounded-md border border-transparent bg-brand-gold px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-gold/90 transition-all font-sans"
                      >
                        Iniciar Pago Seguro
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
