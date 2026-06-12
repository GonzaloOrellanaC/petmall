/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { Key, Mail, Lock, Eye, EyeOff, Sparkles, Check, AlertCircle } from 'lucide-react';
import cmsIsotype from '../../assets/isotype_cms_petmall.png';

export default function AdminLogin({ view = 'login' }: { view?: 'login' | 'forgot' | 'reset' }) {
  const { loginUser, isDemoMode } = usePetmallStore();
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();

  // Form local states
  const [email, setEmail] = useState('manager@petmall.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Password validation checks
  const isMinLength = newPassword.length >= 8;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulating authentication roles
    const isSuper = email.toLowerCase() === 'super@petmall.com';
    const resolvedRole = isSuper ? 'SUPER_USER' : 'STORE_OWNER';
    loginUser(email, resolvedRole);
    alert(`Ingreso exitoso como ${resolvedRole}. Redirigiendo a panel protegido...`);
    navigate('/admin/dashboard');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      alert(`Token JWT enviado con éxito a ${forgotEmail}. En ambiente real, por favor revisa tu correo institucional.`);
    }, 400);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    setResetSuccess(true);
    setTimeout(() => {
      alert('Contraseña actualizada con éxito con alto nivel de cifrado. Ahora puedes iniciar sesión.');
      navigate('/auth/login');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Desktop mockup layout from Image 3 Propuesta A */}
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-100">
        
        {/* Left Side Pane (Image 3 Propuesta A: Navy Blue brand header) */}
        <div className="md:w-[45%] bg-[#102948] p-10 flex flex-col justify-between text-left sm:rounded-l-3xl">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <img src={cmsIsotype} alt="Isotipo Petmall CMS" className="w-8 h-8 object-contain" />
              <span className="font-serif text-3xl font-extrabold tracking-tight text-[#DABD83] block">
                Petmall
              </span>
            </div>
            
            <h2 className="text-[#DABD83] text-4xl font-extrabold tracking-tight mt-16 leading-tight">
              {view === 'login' && 'Acceso al CMS'}
              {view === 'forgot' && 'Restaurar Contraseña'}
              {view === 'reset' && 'Cambiar Contraseña'}
            </h2>
            <p className="text-gray-300 text-xs mt-4 leading-relaxed font-sans font-light">
              Petmall es una herramienta SaaS ERP exclusiva de administración. Sincroniza al instante stocks de POS físicos en tiendas de mascotas con la disponibilidad de catálogo en el Marketplace B2C.
            </p>
          </div>

          <div className="mt-12 md:mt-24">
            <button 
              onClick={() => navigate('/')}
              className="px-5 py-2.2 bg-[#DABD83] text-[#102948] font-bold text-2xs uppercase tracking-wider rounded-lg hover:bg-opacity-90 font-sans transition-all focus:outline-hidden"
            >
              Volver al Mall Público
            </button>
          </div>
        </div>

        {/* Right Side Pane (Auth form) */}
        <div className="flex-1 bg-white p-10 flex flex-col justify-center">
          
          {/* VIEW: LOGIN FORM */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6 text-left">
              <div className="flex flex-col">
                <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Institucional</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@petmall.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contraseña</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-2xs">
                <button
                  type="button"
                  onClick={() => navigate('/auth/forgot-password')}
                  className="font-bold text-[#DABD83] hover:underline hover:text-[#102948] transition-colors focus:outline-hidden"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <span className="text-gray-400 font-medium">Soporte CMS</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#DABD83] text-[#102948] font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#DABD83]/95 cursor-pointer shadow-md transition-all focus:outline-hidden"
              >
                Ingresar al Dashboard
              </button>

              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-3xs text-gray-400 font-medium">
                  ¿Nuevo Comercio? <a href="#" onClick={(e) => { e.preventDefault(); navigate(isDemoMode ? '/demo/enroll' : '/enroll'); }} className="text-[#DABD83] font-bold hover:underline">Registrar Comercio (Plan de 30 Días)</a>
                </p>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <div className="space-y-6 text-left">
              {forgotSent ? (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 text-center">
                  <Mail className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-sm text-green-900">Enlace de recuperación enviado</h3>
                  <p className="text-3xs text-green-700/95 mt-1 leading-relaxed">
                    Hemos despachado un token JWT seguro al correo ingresado con validez por 15 minutos.
                  </p>
                  <button 
                    onClick={() => navigate('/auth/reset-password/jwt_sample_token')}
                    className="mt-4 text-xs font-semibold text-[#102948] hover:underline block mx-auto"
                  >
                    Simular Click en Link de Correo ↗
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-6">
                  <div className="flex flex-col">
                    <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Institucional</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        placeholder="colegio-vet@petmall.com"
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#DABD83] text-[#102948] font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#DABD83]/95 cursor-pointer shadow-md transition-all focus:outline-hidden"
                  >
                    Enviar Token de Recuperación
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/auth/login')}
                      className="text-2xs font-bold text-[#DABD83] hover:underline"
                    >
                      Volver al Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VIEW: RESET PASSWORD/CHANGE PASSWORD */}
          {view === 'reset' && (
            <div className="space-y-6 text-left">
              {resetSuccess ? (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 text-center">
                  <Sparkles className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <h3 className="font-bold text-sm text-green-900">¡Contraseña Cambiada!</h3>
                  <p className="text-3xs text-green-700/95 mt-1 leading-relaxed">
                    Tu nueva contraseña se guardó de forma cifrada de alta integridad. Ya puedes iniciar sesión.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-6">
                  
                  <div className="flex flex-col">
                    <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nueva Contraseña</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-2xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#DABD83] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Password rules meters */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-2xs">
                    <div className="flex items-center space-x-2">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-3xs ${isMinLength ? 'bg-green-600' : 'bg-gray-300'}`}>✓</span>
                      <span className={isMinLength ? 'text-green-800 font-bold' : 'text-gray-400'}>Mínimo 8 caracteres</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-3xs ${hasMixedCase ? 'bg-green-600' : 'bg-gray-300'}`}>✓</span>
                      <span className={hasMixedCase ? 'text-green-800 font-bold' : 'text-gray-400'}>Mayúsculas y Minúsculas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-3xs ${hasSymbol ? 'bg-green-600' : 'bg-gray-300'}`}>✓</span>
                      <span className={hasSymbol ? 'text-green-800 font-bold' : 'text-gray-400'}>Símbolo Especial (!@#$)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#DABD83] text-[#102948] font-sans font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#DABD83]/95 cursor-pointer shadow-md transition-all focus:outline-hidden"
                  >
                    Registrar Nueva Contraseña
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
