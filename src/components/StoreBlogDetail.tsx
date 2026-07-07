import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePetmallStore } from '../store.js';
import { 
  ArrowLeft, Eye, ThumbsUp, ThumbsDown, MessageSquare, 
  Send, User, Calendar, ShieldCheck, Heart, AlertCircle, Sparkles,
  Share2, Copy
} from 'lucide-react';
import { Store, BlogPost, BlogComment } from '../types.js';

export default function StoreBlogDetail() {
  const { id, blogId } = useParams<{ id: string; blogId: string }>();
  const navigate = useNavigate();
  const { stores, currentUser, isDemoMode } = usePetmallStore();

  const [store, setStore] = useState<Store | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Comment forms state
  const [rootCommentText, setRootCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyCommentText, setReplyCommentText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const toSlug = (text: string) => 
    text.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  // 1. Fetch Store and then original BlogPost item
  useEffect(() => {
    const foundStore = stores.find(s => s.id === id || toSlug(s.name) === id);
    if (foundStore) {
      setStore(foundStore);
      fetchSinglePost(foundStore.id);
    } else {
      setLoading(false);
    }
  }, [id, blogId, stores]);

  const fetchSinglePost = async (storeIdVal: string) => {
    try {
      const res = await fetch(`/api/blogs?storeId=${storeIdVal}`);
      if (res.ok) {
        const postsList: BlogPost[] = await res.json();
        const foundPost = postsList.find(p => p.id === blogId);
        if (foundPost) {
          setPost(foundPost);
          // Increment views on load
          incrementViews(foundPost.id);
        } else {
          setErrorMessage('El artículo especificado no se encuentra en esta veterinaria.');
        }
      }
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setErrorMessage('Error al conectar con la bitácora corporativa.');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (pId: string) => {
    try {
      const res = await fetch(`/api/blogs/${pId}/view`, { method: 'POST' });
      if (res.ok) {
        const updatedPost = await res.json();
        setPost(updatedPost);
      }
    } catch (e) {
      console.warn('Silent issue registering view count:', e);
    }
  };

  // 2. Reactions & evaluations trigger
  const handleReact = async (action: 'like' | 'dislike') => {
    if (!currentUser) {
      alert('🔒 Debes haber iniciado sesión para poder evaluar esta publicación.');
      return;
    }
    
    // Check role eligibility: CUSTOMER or platform users
    const acceptedRoles = ['CUSTOMER', 'STORE_OWNER', 'STORE_STAFF', 'SUPER_USER'];
    if (!acceptedRoles.includes(currentUser.role)) {
      alert('🔒 Lo sentimos, solo los usuarios compradores registrados y usuarios de la plataforma pueden evaluar.');
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${post?.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email: currentUser.email }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Error al calificar.');
      }
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  // 3. Comments submit triggers
  const handleAddComment = async (parentId?: string) => {
    if (!currentUser) {
      alert('🔒 Identificación requerida: Debes iniciar sesión para comentar.');
      return;
    }

    const acceptedRoles = ['CUSTOMER', 'STORE_OWNER', 'STORE_STAFF', 'SUPER_USER'];
    if (!acceptedRoles.includes(currentUser.role)) {
      alert('Privilegios insuficientes para comentar.');
      return;
    }

    const textToSubmit = parentId ? replyCommentText : rootCommentText;
    if (!textToSubmit.trim()) {
      alert('Por favor redacta un contenido válido.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/blogs/${post?.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: currentUser.email,
          authorRole: currentUser.role,
          content: textToSubmit,
          parentId
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPost(updated);
        if (parentId) {
          setReplyCommentText('');
          setReplyToId(null);
        } else {
          setRootCommentText('');
        }
      } else {
        const errData = await res.json();
        alert(errData.error || 'Fallo al guardar comentario.');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Helper utility to render simple formatted text blocks (markdown support)
  const renderFormattedContent = (content: string) => {
    if (!content) return null;
    return content.split('\n\n').map((block, index) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('### ')) {
        return <h4 key={index} className="text-sm font-black font-serif text-gray-800 mt-5 mb-2 uppercase tracking-wide">{trimmed.replace('### ', '')}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={index} className="text-base font-black font-serif text-gray-800 mt-6 mb-3 border-b border-gray-100 pb-1.5">{trimmed.replace('## ', '')}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={index} className="text-lg font-black font-serif text-gray-900 mt-8 mb-4">{trimmed.replace('# ', '')}</h2>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <ul key={index} className="list-disc pl-5 my-3 space-y-1.5 text-xs text-gray-650 leading-relaxed font-sans">
            {trimmed.split('\n').map((li, i) => (
              <li key={i}>{li.replace(/^[\s-*]+/, '')}</li>
            ))}
          </ul>
        );
      }
      if (trimmed.match(/^\d+\.\s/)) {
        return (
          <ol key={index} className="list-decimal pl-5 my-3 space-y-1.5 text-xs text-gray-650 leading-relaxed font-sans">
            {trimmed.split('\n').map((li, i) => (
              <li key={i}>{li.replace(/^\d+\.\s+/, '')}</li>
            ))}
          </ol>
        );
      }
      if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
        return <p key={index} className="italic text-xs my-3 text-indigo-700 font-sans leading-relaxed">{trimmed.replace(/\*/g, '')}</p>;
      }
      return <p key={index} className="text-xs text-gray-700 font-sans leading-relaxed my-3">{trimmed}</p>;
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_USER':
        return <span className="bg-purple-100 border border-purple-200 text-purple-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">💻 Plataforma Petmall</span>;
      case 'STORE_OWNER':
        return <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">👑 Dueño del Local</span>;
      case 'STORE_STAFF':
        return <span className="bg-teal-100 border border-teal-200 text-teal-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">🩺 Veterinario/Staff</span>;
      default:
        return <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">🛍️ Cliente Verificado</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4 font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto border-[#102948]"></div>
        <p className="text-xs font-bold text-gray-500">Cargando artículo de la bitácora...</p>
      </div>
    );
  }

  if (errorMessage || !store || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-serif font-black text-gray-800 text-lg">Guía no disponible</h3>
        <p className="text-sm font-medium">{errorMessage || 'El recurso solicitado no existe o no tiene los permisos necesarios.'}</p>
        <button 
          onClick={() => navigate(isDemoMode ? `/demo/store/${id}` : `/store/${id}`)} 
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-2xs uppercase tracking-wider font-extrabold rounded-xl transition-all cursor-pointer"
        >
          Volver a la Tienda
        </button>
      </div>
    );
  }

  const activePrimary = store.branding?.colors?.primary || '#102948';
  const activeAccent = store.branding?.colors?.accent || '#DABD83';

  // Extract comments hierarchy
  const commentsList: BlogComment[] = post.comments || [];
  const rootComments = commentsList.filter(c => !c.parentId);

  const renderCommentNode = (comment: BlogComment, depth = 0) => {
    const childReplies = commentsList.filter(c => c.parentId === comment.id);
    const isReplying = replyToId === comment.id;

    return (
      <div key={comment.id} className="space-y-4">
        {/* Comment main box */}
        <div 
          className={`p-4 rounded-2xl border transition-all text-left space-y-3 bg-white ${
            depth > 0 ? 'ml-6 sm:ml-10 border-indigo-100 shadow-3xs' : 'border-gray-150'
          }`}
        >
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <span className="block text-3xs font-black text-gray-800 leading-tight">{comment.authorEmail}</span>
                <span className="block text-[9px] text-gray-400 mt-0.5">{new Date(comment.createdAt).toLocaleString('es-CL')}</span>
              </div>
            </div>
            {getRoleBadge(comment.authorRole)}
          </div>

          <p className="text-2xs text-gray-750 font-medium font-sans leading-relaxed whitespace-pre-line pl-1">
            {comment.content}
          </p>

          {/* Action Row - reply initiator (only for auth customer / staff) */}
          <div className="flex justify-end pt-1 border-t border-gray-50">
            {currentUser ? (
              <button
                onClick={() => {
                  if (isReplying) {
                    setReplyToId(null);
                  } else {
                    setReplyToId(comment.id);
                    setReplyCommentText('');
                  }
                }}
                className="text-[10px] text-indigo-700 hover:text-indigo-950 font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                💬 {isReplying ? 'Cancelar Respuesta' : 'Responder e iniciar hilo'}
              </button>
            ) : (
              <span className="text-[9px] text-gray-400 italic">🔒 Identifícate para responder</span>
            )}
          </div>
        </div>

        {/* Reply sub form */}
        {isReplying && (
          <div className={`p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 text-left space-y-3 ${depth > 0 ? 'ml-6 sm:ml-10' : ''}`}>
            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 block">
              ✍️ Respondiendo al hilo de {comment.authorEmail.split('@')[0]}
            </span>
            <div className="relative">
              <textarea
                placeholder="Escribe tu respuesta aquí para generar un hilo de debate..."
                value={replyCommentText}
                onChange={(e) => setReplyCommentText(e.target.value)}
                maxLength={400}
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-2xs font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-700 focus:border-indigo-700"
              />
              <div className="text-right text-[9px] text-gray-400 mr-1 mt-0.5">
                {replyCommentText.length}/400 caracteres
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReplyToId(null)}
                className="px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-55 text-[10px] font-bold text-gray-600 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleAddComment(comment.id)}
                disabled={submitLoading || !replyCommentText.trim()}
                className="px-3.5 py-1.5 bg-indigo-700 text-white font-sans font-black text-[10px] uppercase rounded-lg hover:bg-indigo-850 flex items-center gap-1 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Enviar Respuesta <Send className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}

        {/* Recursive rendering of children (depth tracking) */}
        {childReplies.length > 0 && (
          <div className="relative">
            {/* Visual left thread connector bracket */}
            <div className="absolute left-[13px] sm:left-[21px] top-0 bottom-4 w-px bg-indigo-100" />
            
            <div className="space-y-4">
              {childReplies.map(reply => renderCommentNode(reply, depth + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Evaluation active flags
  const userHasLiked = currentUser ? post.likedBy?.includes(currentUser.email) : false;
  const userHasDisliked = currentUser ? post.dislikedBy?.includes(currentUser.email) : false;

  const isEligibleToComment = currentUser && ['CUSTOMER', 'STORE_OWNER', 'STORE_STAFF', 'SUPER_USER'].includes(currentUser.role);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-left">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-gray-150 py-4 shadow-3xs sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(isDemoMode ? `/demo/store/${store.id}/blogs` : `/store/${store.id}/blogs`)}
            className="flex items-center gap-2 text-2xs uppercase tracking-wider font-extrabold text-gray-505 hover:text-gray-900 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ver todas las publicaciones
          </button>
          
          <span className="text-3xs uppercase font-extrabold tracking-wider text-gray-450">
            {store.name} &bull; Bitácora de Novedades
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* 2. Main Article Content */}
        <article className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
          
          {/* Banner cover */}
          <div className="relative aspect-video max-h-96 w-full bg-slate-900">
            <img 
              src={post.bannerUrl || 'https://images.unsplash.com/photo-1541599540903-216a46ca1bf0?w=800&q=80'} 
              alt={post.title} 
              className="w-full h-full object-cover opacity-90"
            />
            
            {/* Tag / Category Badge Overlay */}
            {post.tags && post.tags.length > 0 && (
              <div className="absolute bottom-5 left-5 flex gap-1.5 flex-wrap">
                {post.tags.map(t => (
                  <span key={t} className="px-3 py-1 bg-white/95 backdrop-blur-xs text-[9px] font-black uppercase text-gray-800 rounded-lg tracking-wider shadow-sm">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            
            {/* Author / Metadata space */}
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-105 flex items-center justify-center text-gray-600 border border-gray-200">
                  <User className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-3xs text-gray-450 font-bold uppercase block tracking-wider mt-0.5">Autor de la publicación</span>
                  <span className="text-xs font-black text-gray-800 leading-tight block">{post.authorName}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block tracking-wider">Fecha de Edición</span>
                  <span className="text-2xs font-extrabold text-indigo-750 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="text-center bg-gray-50 px-3.5 py-1 rounded-xl border border-gray-150 inline-flex items-center gap-1.5 shrink-0">
                  <Eye className="w-3.5 h-3.5 text-gray-450" />
                  <span className="text-2xs font-black text-gray-850">{post.views || 0} vistas</span>
                </div>
              </div>
            </div>

            {/* Title Display typography */}
            <h1 className="text-xl sm:text-3xl font-serif font-black text-gray-850 tracking-tight leading-tight">
              {post.title}
            </h1>

            {/* Body copy paragraphs */}
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {renderFormattedContent(post.content)}
            </div>

            {/* Evaluation & Reactions (Me gusta, No me gusta) */}
            <div className="pt-8 border-t border-gray-150 flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              <div className="text-left space-y-1.5 self-start">
                <h4 className="text-2xs font-black text-gray-850 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                  ¿Te ha sido útil este artículo?
                </h4>
                <p className="text-3xs text-gray-500 font-medium">Ayúdanos a calificar la publicación para orientar a más tutores.</p>
              </div>

              {/* Like / Dislike trigger buttons */}
              <div className="flex items-center gap-3 self-end sm:self-auto uppercase font-sans font-black text-4xs">
                
                <button
                  onClick={() => handleReact('like')}
                  className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 border transition-all cursor-pointer shadow-3xs ${
                    userHasLiked 
                      ? 'bg-emerald-500 text-white border-emerald-500' 
                      : 'bg-white text-gray-600 border-gray-150 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${userHasLiked ? 'text-white' : 'text-emerald-600'}`} />
                  Me Útil ({post.likes || 0})
                </button>

                <button
                  onClick={() => handleReact('dislike')}
                  className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 border transition-all cursor-pointer shadow-3xs ${
                    userHasDisliked 
                      ? 'bg-rose-500 text-white border-rose-500' 
                      : 'bg-white text-gray-600 border-gray-150 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsDown className={`w-3.5 h-3.5 ${userHasDisliked ? 'text-white' : 'text-rose-500'}`} />
                  No tanto ({post.dislikes || 0})
                </button>

              </div>

            </div>

            {/* Role eligibility alert block for unauthenticated users */}
            {!currentUser && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3 mt-4 text-left">
                <AlertCircle className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-black text-indigo-850 block uppercase tracking-wider">🔒 Zona Privada de Tutoría Colectiva</span>
                  <span className="text-3xs text-gray-500 block leading-normal mt-0.5">
                    Para poder comentar, calificar publicaciones o responder a discusiones de médicos, por favor ingresa con tu cuenta desde la barra de navegación del marketplace.
                  </span>
                </div>
              </div>
            )}

            {/* Social Sharing Widget */}
            <div className="mt-6 p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-3xl border border-gray-150 text-left">
              <span className="block text-3xs font-extrabold text-[#102948] uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> COMPARTIR ARTÍCULO CON VISTA PREVIA
              </span>
              <p className="text-[10px] text-gray-500 leading-normal mb-4">
                ¿Te parece útil esta guía? Compártela con otros cuidadores de mascotas. Al compartir, se mostrará una tarjeta interactiva con la foto de portada, el título y el extracto científico del artículo.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] font-extrabold">
                <button
                  type="button"
                  onClick={() => {
                    const shareUrl = window.location.href;
                    navigator.clipboard?.writeText(shareUrl);
                    alert('✓ ¡Enlace del artículo copiado con éxito!');
                  }}
                  className="px-2 py-2 bg-white hover:bg-slate-50 border border-gray-200 text-gray-800 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  Copiar Link
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Lee este excelente artículo en Petmall: "' + post.title + '" ' + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl flex items-center justify-center gap-1 transition-colors text-center cursor-pointer"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl flex items-center justify-center gap-1 transition-colors text-center cursor-pointer"
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Lee "' + post.title + '" en el blog de Petmall!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-xl flex items-center justify-center gap-1 transition-colors text-center cursor-pointer"
                >
                  X / Threads
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Lee "' + post.title + '" en el blog de Petmall!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-xl flex items-center justify-center gap-1 transition-colors text-center cursor-pointer"
                >
                  Telegram
                </a>
              </div>
            </div>

          </div>
        </article>

        {/* 3. Threaded Comments list container */}
        <div className="space-y-6">
          
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-xs sm:text-sm font-black font-serif text-gray-850 flex items-center gap-2 uppercase tracking-wide">
              <MessageSquare className="w-4 h-4 text-indigo-700" />
              Foro & Discusiones ({commentsList.length} aportes)
            </h3>
            
            <span className="text-4xs text-gray-400 font-extrabold uppercase">
              Hilos de conversación habilitados
            </span>
          </div>

          {/* Root comments form */}
          {isEligibleToComment && (
            <div className="bg-white p-5 rounded-3xl border border-gray-150 shadow-3xs space-y-3">
              <span className="text-[9px] font-black text-gray-405 block uppercase tracking-wider">
                ✍️ Contribuir con tu opinión como: <span className="text-gray-900">{currentUser?.email}</span>
              </span>
              <textarea
                placeholder="Escribe tu observación general para iniciar una conversación pública..."
                value={rootCommentText}
                onChange={(e) => setRootCommentText(e.target.value)}
                maxLength={600}
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-2xs font-sans text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-700 focus:border-indigo-700 font-semibold"
              />
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <span className="text-[9px] text-gray-400">
                  {rootCommentText.length}/600 caracteres máximo
                </span>
                
                <button
                  onClick={() => handleAddComment()}
                  disabled={submitLoading || !rootCommentText.trim()}
                  className="px-5 py-2 bg-[#102948] hover:bg-opacity-95 text-white font-sans font-black text-3xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  style={{ backgroundColor: activePrimary }}
                >
                  Publicar Aporte <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Comments Tree list render */}
          {rootComments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-150 font-sans space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
              <h5 className="font-serif font-black text-gray-800 text-xs">Sin comentarios por el momento</h5>
              <p className="text-3xs text-gray-405 max-w-sm mx-auto font-medium">Sé el primero en aportar. Tu feedback ayuda a la veterinaria a elaborar material de mayor precisión.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {rootComments.map(comment => renderCommentNode(comment))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
