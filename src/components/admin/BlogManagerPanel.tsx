import React, { useState } from 'react';
import { BlogPostRow, BlogCategory, CATEGORIES, categoryPath } from '../../lib/blog/posts';
import { 
  BookOpen, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Send,
  FileText,
  Filter,
  Sparkles
} from 'lucide-react';

interface BlogManagerPanelProps {
  posts: BlogPostRow[];
  loading: boolean;
  onSelectEditPost: (post: BlogPostRow) => void;
  onCreateNewPost: () => void;
  onPublishToggle: (id: string, currentStatus: string) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const BlogManagerPanel: React.FC<BlogManagerPanelProps> = ({
  posts,
  loading,
  onSelectEditPost,
  onCreateNewPost,
  onPublishToggle,
  onDeletePost,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status !== 'published').length;
  const transitPostsCount = posts.filter((p) => p.category === 'Transits').length;

  const filteredPosts = posts.filter((post) => {
    // Status filter
    if (statusFilter === 'published' && post.status !== 'published') return false;
    if (statusFilter === 'draft' && post.status === 'published') return false;

    // Category filter
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = (post.title || '').toLowerCase().includes(q);
      const matchSlug = (post.slug || '').toLowerCase().includes(q);
      const matchSign = (post.zodiac_sign_tag || '').toLowerCase().includes(q);
      const matchExcerpt = (post.excerpt || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSlug && !matchSign && !matchExcerpt) return false;
    }

    return true;
  });

  const handleToggle = async (id: string, status: string) => {
    setActionLoadingId(id);
    try {
      await onPublishToggle(id, status);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      setActionLoadingId(id);
      try {
        await onDeletePost(id);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <BookOpen className="w-3.5 h-3.5" />
                Journal & Blog Engine
              </span>
              <span className="text-xs text-slate-500">
                Live Editorial Management
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Moonday Live Journal Articles & Synced Transits
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Approving any transit automatically publishes its corresponding journal article. Manage, edit, or unpublish posts below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Refresh blog posts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onCreateNewPost}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 border border-indigo-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>New Journal Post</span>
            </button>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 font-medium">Total Articles</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-white">{posts.length}</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 font-medium">Published Live</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-emerald-400">{publishedCount}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400/60" />
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 font-medium">Drafts / In Queue</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-amber-400">{draftCount}</span>
              <Clock className="w-4 h-4 text-amber-400/60" />
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-xs text-slate-400 font-medium">Transit Articles</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-indigo-400">{transitPostsCount}</span>
              <Sparkles className="w-4 h-4 text-indigo-400/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        {/* Status Filter Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'published'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Published ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'draft'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Drafts ({draftCount})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Search title, slug, sign..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts List / Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
          <p className="text-xs font-medium">Loading Journal articles from database...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No journal posts match your filters</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter, or click "New Journal Post" to publish a new article.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map((post) => {
            const isPublished = post.status === 'published';
            const isLoadingThis = actionLoadingId === post.id;
            const liveUrl = `/blog/${categoryPath(post.category)}/${post.slug}`;

            return (
              <div
                key={post.id || post.slug}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Card Top Row: Badges & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {post.category}
                      </span>
                      {post.zodiac_sign_tag && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {post.zodiac_sign_tag}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isPublished ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Draft
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title & Slug */}
                  <h3 className="font-bold text-white text-base tracking-tight mb-1 group-hover:text-indigo-300 transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-3">
                    <span className="truncate">{post.slug}</span>
                    {isPublished && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                        title="View live post on site"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    )}
                  </div>

                  {/* Excerpt preview */}
                  <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {post.excerpt || 'No summary provided.'}
                  </p>
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {post.published_at
                      ? `Published ${new Date(post.published_at).toLocaleDateString()}`
                      : post.created_at
                      ? `Created ${new Date(post.created_at).toLocaleDateString()}`
                      : 'Draft'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Publish / Unpublish Toggle */}
                    {post.id && (
                      <button
                        type="button"
                        onClick={() => handleToggle(post.id!, post.status)}
                        disabled={isLoadingThis}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isPublished
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        } disabled:opacity-50`}
                        title={isPublished ? 'Unpublish post (revert to draft)' : 'Publish post live now'}
                      >
                        {isPublished ? (
                          <>
                            <RefreshCw className={`w-3 h-3 ${isLoadingThis ? 'animate-spin' : ''}`} />
                            <span>Unpublish</span>
                          </>
                        ) : (
                          <>
                            <Send className={`w-3 h-3 ${isLoadingThis ? 'animate-spin' : ''}`} />
                            <span>Publish</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => onSelectEditPost(post)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                      title="Edit article"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-400" />
                      <span>Edit</span>
                    </button>

                    {/* Delete button */}
                    {post.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id!, post.title)}
                        disabled={isLoadingThis}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
