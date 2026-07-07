import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { 
  Building2, Eye, ThumbsUp, MessageSquare, BookOpen, Clock, Calendar, 
  User, Search, ArrowRight, Star, Heart, TrendingUp, Sparkles, Filter, ListFilter
} from 'lucide-react';
import { Store, BlogPost } from '../types.js';

type SortOption = 'NEWEST' | 'MOST_COMMENTED' | 'MOST_REACTED' | 'MOST_VIEWED';

export default function GlobalBlogsList() {
  const navigate = useNavigate();
  const { stores, isDemoMode } = usePetmallStore();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering and Sorting
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');

  // Filter stores based on demo mode:
  const filteredStores = stores.filter(st => {
    const isDemoStore = !!st.demo;
    return isDemoMode ? isDemoStore : !isDemoStore;
  });

  const allowedStoreIds = new Set(filteredStores.map(st => st.id));

  useEffect(() => {
    fetchAllBlogs();
  }, [isDemoMode]);

  const fetchAllBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/blogs');
      if (res.ok) {
        const data: BlogPost[] = await res.json();
        // Only show published blogs that belong to current context (demo or standard stores)
        const visible = data.filter(p => p.status === 'PUBLISHED' && allowedStoreIds.has(p.storeId));
        setPosts(visible);
      }
    } catch (err) {
      console.error('Error fetching global blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique tags/categories across all visible posts
  const allTags = Array.from(
    new Set(
      posts.flatMap(p => p.tags || [])
    )
  ).sort();

  // Filter logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag = selectedTag ? post.tags?.includes(selectedTag) : true;
    const matchesStore = selectedStoreId ? post.storeId === selectedStoreId : true;

    return matchesSearch && matchesTag && matchesStore;
  });

  // Sort logic
  const sortedAndFilteredPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'MOST_COMMENTED') {
      const bComments = b.comments?.length || 0;
      const aComments = a.comments?.length || 0;
      return bComments - aComments;
    }
    if (sortBy === 'MOST_REACTED') {
      const bLikes = b.likes || 0;
      const aLikes = a.likes || 0;
      return bLikes - aLikes;
    }
    if (sortBy === 'MOST_VIEWED') {
      const bViews = b.views || 0;
      const aViews = a.views || 0;
      return bViews - aViews;
    }
    return 0;
  });

  // Summary Metrics calculations
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
  const totalStoresWithBlogs = Array.from(new Set(posts.map(p => p.storeId))).length;

  // Find popular featured post (with most likes + views)
  const featuredPost = posts.reduce<BlogPost | null>((best, current) => {
    if (!best) return current;
    const currentScore = (current.likes || 0) * 3 + (current.views || 0);
    const bestScore = (best.likes || 0) * 3 + (best.views || 0);
    return currentScore > bestScore ? current : best;
  }, null);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4 font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto border-[#102948]"></div>
        <p className="text-xs font-bold text-gray-500">Conectando con la gran bitácora de novedades Petmall...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Hero Header Section */}
      <div className="bg-[#102948] text-white overflow-hidden relative">
        {/* Subtle geometric overlay shapes */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/60 via-slate-900/80 to-[#102948] opacity-90" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10 text-left">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest font-sans">Bitácora Colectiva de Novedades</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight leading-none text-white">
              Blogs, Ciencia & <br />
              <span className="text-[#cfa86b] italic">Consejos Veterinarios</span>
            </h1>
            
            <p className="text-sm text-slate-350 leading-relaxed font-sans max-w-2xl font-medium">
              Tu salud animal comienza con el conocimiento. Explora los artículos científicos, guías de nutrición biológica, novedades y aportes colectivos construidos por la red de veterinarias y tiendas de especialidad en Petmall.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">
        
        {/* Real-time statistics Bento Box */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs text-left">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Biblioteca Global</span>
            <span className="block text-2xl font-black text-gray-850 font-serif mt-1">{posts.length}</span>
            <span className="text-3xs text-gray-500 mt-1 block">Guías certificadas activas</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs text-left">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Participación Médica</span>
            <span className="block text-2xl font-black text-gray-850 font-serif mt-1">{totalStoresWithBlogs}</span>
            <span className="text-3xs text-gray-500 mt-1 block">Veterinarias colaborando</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs text-left">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Interacción del Tutor</span>
            <span className="block text-2xl font-black text-emerald-650 font-serif mt-1">+{totalComments}</span>
            <span className="text-3xs text-gray-500 mt-1 block">Aportes y debates en hilos</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs text-left bg-gradient-to-tr from-amber-50/50 to-white">
            <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              Lectura Popular
            </span>
            <span className="block text-2xl font-black text-gray-850 font-serif mt-1">+{totalViews}</span>
            <span className="text-3xs text-gray-500 mt-1 block">Visitas de tutores hoy</span>
          </div>
        </div>

        {/* Popular Featured Post Highlights (Only if comments or posts populate) */}
        {featuredPost && (
          <div className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs text-left grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* cover image */}
            <div className="lg:col-span-7 relative aspect-video lg:aspect-auto min-h-64 bg-slate-100 overflow-hidden">
              <img 
                src={featuredPost.bannerUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80'} 
                alt={featuredPost.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-[#102948] text-[#cfa86b] text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                🔥 Más Popular de la Red
              </div>
            </div>

            {/* details body */}
            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const postStore = stores.find(s => s.id === featuredPost.storeId);
                    return postStore ? (
                      <div className="flex items-center gap-2">
                        {postStore.logoUrl ? (
                          <img src={postStore.logoUrl} alt={postStore.name} className="w-5 h-5 rounded-xs object-cover border border-gray-100" />
                        ) : (
                          <Building2 className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">{postStore.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide">Colaborador Petmall</span>
                    );
                  })()}
                </div>

                <h2 className="text-lg sm:text-xl font-serif font-black text-gray-850 leading-tight">
                  {featuredPost.title}
                </h2>

                <p className="text-3xs text-gray-500 leading-relaxed font-sans font-medium line-clamp-3">
                  {featuredPost.excerpt}
                </p>

                <div className="flex flex-wrap gap-1">
                  {featuredPost.tags?.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3.5 text-3xs text-gray-400 font-bold uppercase">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {featuredPost.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-emerald-600" /> {featuredPost.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-indigo-650" /> {featuredPost.comments?.length || 0}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const targetStore = stores.find(s => s.id === featuredPost.storeId);
                    const storeSlug = targetStore ? targetStore.id : featuredPost.storeId;
                    const pathUrl = isDemoMode
                      ? `/demo/store/${storeSlug}/blogs/${featuredPost.id}`
                      : `/store/${storeSlug}/blogs/${featuredPost.id}`;
                    navigate(pathUrl);
                  }}
                  className="px-4 py-2 bg-[#102948] hover:opacity-90 text-white font-sans font-black text-3xs uppercase tracking-wider rounded-xl shadow-3xs cursor-pointer flex items-center gap-1 transition-all"
                >
                  Leer Artículo <ArrowRight className="w-3 h-3 text-amber-300" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Navigation Toolbar: Search, Filters & Sorters */}
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-3xs space-y-5 text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search inputs */}
            <div className="md:col-span-8 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Buscar por título, temas, diagnóstico o recomendación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-2xs font-sans text-gray-800 placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-[#102948] focus:bg-white transition-all font-semibold"
              />
            </div>

            {/* Store Filter Selector */}
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <select
                className="w-full bg-slate-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-2xs font-sans text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#102948] focus:bg-white appearance-none cursor-pointer transition-all font-semibold"
                value={selectedStoreId || ''}
                onChange={(e) => setSelectedStoreId(e.target.value || null)}
              >
                <option value="">Filtrar por Veterinaria / Tienda</option>
                {filteredStores.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Quick Categories & Sorting block */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center pt-3 border-t border-gray-50">
            
            {/* Category selection chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-black uppercase text-gray-400 mr-1.5 tracking-wider font-sans">
                Temas Claves:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-xl text-4xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                  selectedTag === null
                    ? 'bg-[#102948] text-[#cfa86b] border-[#102948]'
                    : 'bg-white text-gray-500 border-gray-150 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-4xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#102948] text-[#cfa86b] border-[#102948]'
                      : 'bg-white text-gray-500 border-gray-150 hover:bg-slate-50'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 bg-slate-50 border border-gray-150 p-1 rounded-xl">
              <span className="text-[8px] font-black uppercase text-gray-400 px-2 tracking-wider">
                Ordenar por:
              </span>
              <button
                onClick={() => setSortBy('NEWEST')}
                className={`px-2.5 py-1 text-4xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                  sortBy === 'NEWEST' ? 'bg-white text-[#102948] shadow-3xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Recientes
              </button>
              <button
                onClick={() => setSortBy('MOST_COMMENTED')}
                className={`px-2.5 py-1 text-4xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                  sortBy === 'MOST_COMMENTED' ? 'bg-white text-[#102948] shadow-3xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Debatidos
              </button>
              <button
                onClick={() => setSortBy('MOST_REACTED')}
                className={`px-2.5 py-1 text-4xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                  sortBy === 'MOST_REACTED' ? 'bg-white text-[#102948] shadow-3xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Útiles
              </button>
              <button
                onClick={() => setSortBy('MOST_VIEWED')}
                className={`px-2.5 py-1 text-4xs font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                  sortBy === 'MOST_VIEWED' ? 'bg-white text-[#102948] shadow-3xs' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Vistos
              </button>
            </div>

          </div>

          {/* Reset Filters strip if filters are active */}
          {(selectedTag || selectedStoreId || searchQuery) && (
            <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-2">
              <span className="text-4xs text-amber-800 font-bold uppercase">
                ⚙️ Filtros activos: {selectedTag ? `#${selectedTag}` : ''} {selectedStoreId ? '• Veterinaria específica' : ''} {searchQuery ? `• "${searchQuery}"` : ''}
              </span>
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedStoreId(null);
                  setSearchQuery('');
                }}
                className="text-4xs font-black uppercase text-amber-900 underline hover:opacity-85 cursor-pointer"
              >
                Limpiar todo
              </button>
            </div>
          )}

        </div>

        {/* Global Blog Grid Results */}
        {sortedAndFilteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-150 space-y-4">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-serif font-black text-gray-850 text-base">Sin publicaciones coincidentes</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">Ningún artículo de bitácora coincide con el criterio ingresado. Intenta reduciendo los filtros o buscando temas generales como "Nutrición".</p>
            <button
              onClick={() => {
                setSelectedTag(null);
                setSelectedStoreId(null);
                setSearchQuery('');
              }}
              className="px-4 py-2 border border-gray-200 hover:bg-slate-50 transition-all font-semibold rounded-xl text-xs text-gray-650 cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredPosts.map((post) => {
              const matchedStore = stores.find(s => s.id === post.storeId);
              const storeName = matchedStore?.name || 'Veterinaria Asociada';
              const commentsCount = post.comments?.length || 0;
              const storePrimaryColor = matchedStore?.branding?.colors?.primary || '#102948';

              return (
                <div 
                  key={post.id} 
                  className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-3xs hover:shadow-2xs transition-all duration-300 flex flex-col hover:translate-y-[-2px] text-left"
                >
                  {/* Banner Image */}
                  <div className="relative aspect-video bg-gray-50 overflow-hidden">
                    <img 
                      src={post.bannerUrl || 'https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=600&q=80'} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-all duration-300 cursor-pointer"
                      onClick={() => {
                        const targetStore = stores.find(s => s.id === post.storeId);
                        const storeSlug = targetStore ? targetStore.id : post.storeId;
                        const pUrl = isDemoMode
                          ? `/demo/store/${storeSlug}/blogs/${post.id}`
                          : `/store/${storeSlug}/blogs/${post.id}`;
                        navigate(pUrl);
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-lg text-4xs font-black text-gray-800 uppercase shadow-xs">
                      {post.tags?.[0] || 'Novedad'}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                        <span className="flex items-center gap-1.5 font-bold text-gray-650">
                          {matchedStore?.logoUrl ? (
                            <img src={matchedStore.logoUrl} alt={storeName} className="w-4 h-4 rounded-xs object-cover border border-gray-150" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5" />
                          )}
                          {storeName}
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString('es-CL')}
                        </span>
                      </div>

                      <h3 
                        onClick={() => {
                          const targetStore = stores.find(s => s.id === post.storeId);
                          const storeSlug = targetStore ? targetStore.id : post.storeId;
                          const pUrl = isDemoMode
                            ? `/demo/store/${storeSlug}/blogs/${post.id}`
                            : `/store/${storeSlug}/blogs/${post.id}`;
                          navigate(pUrl);
                        }}
                        className="font-serif font-black text-sm text-gray-850 hover:opacity-85 transition-all leading-snug cursor-pointer line-clamp-2"
                      >
                        {post.title}
                      </h3>

                      <p className="text-3xs text-gray-400 line-clamp-2 font-sans leading-relaxed font-semibold">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Footer action elements */}
                    <div className="pt-3.5 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex gap-3 text-4xs text-gray-405 font-black uppercase">
                        <span className="flex items-center gap-1" title={`${post.views || 0} visitas`}>
                          <Eye className="w-3.5 h-3.5 text-gray-400" /> {post.views || 0}
                        </span>
                        <span className="flex items-center gap-0.5" title={`${post.likes || 0} de utilidad`}>
                          <ThumbsUp className="w-3 h-3 text-emerald-555" /> {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1" title={`${commentsCount} comentarios`}>
                          <MessageSquare className="w-3 h-3 text-indigo-555" /> {commentsCount}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const targetStore = stores.find(s => s.id === post.storeId);
                          const storeSlug = targetStore ? targetStore.id : post.storeId;
                          const pUrl = isDemoMode
                            ? `/demo/store/${storeSlug}/blogs/${post.id}`
                            : `/store/${storeSlug}/blogs/${post.id}`;
                          navigate(pUrl);
                        }}
                        className="text-3xs font-serif font-black uppercase tracking-wider cursor-pointer underline hover:opacity-80-all"
                        style={{ color: storePrimaryColor }}
                      >
                        Ver Completo &rarr;
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
