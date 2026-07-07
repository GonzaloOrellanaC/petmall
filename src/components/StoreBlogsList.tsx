import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { 
  ArrowLeft, Building2, Eye, ThumbsUp, ThumbsDown, 
  MessageSquare, BookOpen, Clock, Calendar, User, Search
} from 'lucide-react';
import { Store, BlogPost } from '../types.js';

export default function StoreBlogsList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stores, isDemoMode } = usePetmallStore();

  const [store, setStore] = useState<Store | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const toSlug = (text: string) => 
    text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  useEffect(() => {
    const found = stores.find(s => s.id === id || toSlug(s.name) === id);
    if (found) {
      setStore(found);
      fetchBlogs(found.id);
    } else {
      setLoading(false);
    }
  }, [id, stores]);

  const fetchBlogs = async (storeIdVal: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blogs?storeId=${storeIdVal}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.filter((p: any) => p.status === 'PUBLISHED'));
      }
    } catch (err) {
      console.error('Error fetching blogs in list:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.tags && post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  // Totals calculations for the summary block
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalDislikes = posts.reduce((sum, p) => sum + (p.dislikes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  const activePrimary = store?.branding?.colors?.primary || '#102948';
  const activeAccent = store?.branding?.colors?.accent || '#DABD83';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center font-sans space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{ borderColor: activePrimary }}></div>
        <p className="text-xs font-bold text-gray-500">Cargando bitácora de novedades...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500 space-y-4">
        <Building2 className="w-12 h-12 text-gray-350 mx-auto" />
        <h3 className="font-serif font-black text-gray-800 text-lg">Empresa no encontrada</h3>
        <p className="text-xs font-medium">La tienda especificada no existe en la red Petmall.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          Volver a Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      
      {/* 1. Shop Banner Context */}
      <div className="bg-white border-b border-gray-150 py-4 shadow-3xs sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(isDemoMode ? `/demo/store/${store.id}` : `/store/${store.id}`)}
            className="flex items-center gap-2 text-2xs uppercase tracking-wider font-extrabold text-gray-505 hover:text-gray-900 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a {store.name}
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-4xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-150 rounded-full">
              Canal Oficial
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        
        {/* 2. Header & Stats Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-150 shadow-xs text-left grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Brand Presentation */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-4">
              {store.logoUrl ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 shrink-0">
                  <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-105 shrink-0">
                  <Building2 className="w-7 h-7 text-indigo-700" />
                </div>
              )}
              <div>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase font-sans tracking-widest">📖 Bitácora Digital Colectiva</span>
                <h1 className="text-xl sm:text-2xl font-serif font-black text-gray-850 tracking-tight leading-none mt-1">
                  Blogs & Novedades
                </h1>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">
              Explora los mejores consejos, investigaciones científicas, guías de estilo de vida orgánico y novedades de nutrición redactados por el equipo experto de <b>{store.name}</b>.
            </p>
          </div>

          {/* Stats Summary Panel */}
          <div className="bg-gray-102 border border-gray-150 rounded-2xl p-4 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-450 text-center">Resumen de Evaluación Canal</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-3xs">
                <div className="flex justify-center mb-1 text-indigo-650">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="block text-xs font-black text-gray-900 leading-none">{totalViews}</span>
                <span className="text-[8px] text-gray-405 font-bold uppercase mt-0.5 block">Vistas</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-3xs">
                <div className="flex justify-center mb-1 text-emerald-600">
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <span className="block text-xs font-black text-gray-900 leading-none">{totalLikes}</span>
                <span className="text-[8px] text-gray-405 font-bold uppercase mt-0.5 block">Likes</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-3xs">
                <div className="flex justify-center mb-1 text-rose-550">
                  <ThumbsDown className="w-4 h-4" />
                </div>
                <span className="block text-xs font-black text-gray-900 leading-none">{totalDislikes}</span>
                <span className="text-[8px] text-gray-405 font-bold uppercase mt-0.5 block">Dislikes</span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-[9px] text-gray-400 font-semibold italic text-center">
                📚 Biblioteca activa con {posts.length} guías publicadas
              </span>
            </div>
          </div>

        </div>

        {/* 3. Search Bar Filter */}
        <div className="relative text-left">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar guías por palabra clave, tema o etiqueta (#Nutrición)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-700 focus:border-indigo-700 transition-all font-medium"
          />
        </div>

        {/* 4. Blog Posts Grid List */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-150 space-y-3">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="font-serif font-black text-gray-850 text-base">Sin publicaciones coincidentes</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto font-sans font-medium">No se han encontrado guías de bitácora bajo el parámetro de búsqueda especificado en este local o canal digital.</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-2xs font-extrabold uppercase py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-gray-600 cursor-pointer"
              >
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const commentsCount = post.comments?.length || 0;
              return (
                <div 
                  key={post.id} 
                  className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-3xs hover:shadow-2xs transition-all duration-300 flex flex-col hover:translate-y-[-2px]"
                >
                  {/* cover image */}
                  <div className="relative aspect-video bg-gray-50 overflow-hidden">
                    <img 
                      src={post.bannerUrl || 'https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=600&q=80'} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(isDemoMode ? `/demo/store/${store.id}/blogs/${post.id}` : `/store/${store.id}/blogs/${post.id}`)}
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-lg text-4xs font-black text-gray-700 uppercase shadow-xs">
                      {post.tags?.[0] || 'Consejo'}
                    </div>
                  </div>

                  {/* item info block */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-left">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-4xs font-bold text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {post.authorName}
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString('es-CL')}
                        </span>
                      </div>

                      <h3 
                        onClick={() => navigate(isDemoMode ? `/demo/store/${store.id}/blogs/${post.id}` : `/store/${store.id}/blogs/${post.id}`)}
                        className="font-serif font-black text-sm text-gray-850 hover:opacity-80 transition-all leading-snug cursor-pointer line-clamp-2"
                      >
                        {post.title}
                      </h3>

                      <p className="text-3xs text-gray-400 line-clamp-2 font-sans leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* interactive review counters & submit link */}
                    <div className="pt-3.5 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex gap-3 text-4xs text-gray-400 font-extrabold uppercase">
                        <span className="flex items-center gap-1" title={`${post.views || 0} visitas`}>
                          <Eye className="w-3.5 h-3.5 text-gray-400" /> {post.views || 0}
                        </span>
                        <span className="flex items-center gap-0.5" title={`${post.likes || 0} likes`}>
                          <ThumbsUp className="w-3 h-3 text-emerald-555" /> {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1" title={`${commentsCount} comentarios`}>
                          <MessageSquare className="w-3 h-3 text-indigo-555" /> {commentsCount}
                        </span>
                      </div>

                      <button
                        onClick={() => navigate(isDemoMode ? `/demo/store/${store.id}/blogs/${post.id}` : `/store/${store.id}/blogs/${post.id}`)}
                        className="text-3xs font-serif font-black uppercase tracking-wider cursor-pointer underline hover:opacity-80"
                        style={{ color: activePrimary }}
                      >
                        Leer Completo &rarr;
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
  );
}
