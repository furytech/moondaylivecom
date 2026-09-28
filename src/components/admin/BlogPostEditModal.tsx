import React, { useState, useEffect } from 'react';
import { BlogPostRow, BlogCategory, CATEGORIES, SIGNS, categoryPath, signImageUrl } from '../../lib/blog/posts';
import { X, Save, Sparkles, Send, Eye, RefreshCw, Image as ImageIcon, Calendar, FileText, Tag, User } from 'lucide-react';

interface BlogPostEditModalProps {
  post: BlogPostRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (postData: Partial<BlogPostRow>) => Promise<void>;
  onPublishToggle: (id: string, currentStatus: string) => Promise<void>;
}

export const BlogPostEditModal: React.FC<BlogPostEditModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
  onPublishToggle,
}) => {
  if (!isOpen) return null;

  const isNew = !post?.id;
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [category, setCategory] = useState<BlogCategory>(post?.category || 'Transits');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [keywords, setKeywords] = useState((post?.keywords || []).join(', '));
  const [author, setAuthor] = useState(post?.author || 'Moonday Live Team');
  const [reviewedBy, setReviewedBy] = useState(post?.reviewed_by || 'Moonday Live Astrologer');
  const [zodiacSignTag, setZodiacSignTag] = useState(post?.zodiac_sign_tag || '');
  const [imageUrl, setImageUrl] = useState(post?.image_url || '');
  const [status, setStatus] = useState(post?.status || 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setCategory(post.category || 'Transits');
      setExcerpt(post.excerpt || '');
      setContent(post.content || '');
      setKeywords((post.keywords || []).join(', '));
      setAuthor(post.author || 'Moonday Live Team');
      setReviewedBy(post.reviewed_by || 'Moonday Live Astrologer');
      setZodiacSignTag(post.zodiac_sign_tag || '');
      setImageUrl(post.image_url || '');
      setStatus(post.status || 'draft');
    } else {
      setTitle('');
      setSlug('');
      setCategory('Transits');
      setExcerpt('');
      setContent('');
      setKeywords('');
      setAuthor('Moonday Live Team');
      setReviewedBy('Moonday Live Astrologer');
      setZodiacSignTag('');
      setImageUrl('');
      setStatus('draft');
    }
    setSaveSuccess(false);
  }, [post]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (isNew && !slug) {
      const generatedSlug = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      alert('Title and Slug are required.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedKeywords = keywords
        .split(',')
        .map((k) => k.trim().replace(/^#/, ''))
        .filter(Boolean);

      const resolvedImage = imageUrl.trim() || (zodiacSignTag ? signImageUrl(zodiacSignTag) : '') || '';

      await onSave({
        ...(post?.id ? { id: post.id } : {}),
        title,
        slug: slug.trim().toLowerCase(),
        category,
        excerpt,
        content,
        keywords: parsedKeywords,
        author,
        reviewed_by: reviewedBy,
        zodiac_sign_tag: zodiacSignTag || null,
        image_url: resolvedImage || null,
        status: status as any,
        published_at: status === 'published' ? (post?.published_at || new Date().toISOString()) : null,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: unknown) {
      console.error('Error saving blog post:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isPublished = status === 'published';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                {isNew ? 'Create New Journal Post' : `Edit: ${title || 'Untitled Post'}`}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    isPublished
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {slug ? `/blog/${categoryPath(category)}/${slug}` : 'Set custom slug & content'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Edit vs Preview */}
        <div className="flex items-center px-6 py-2 border-b border-slate-800 bg-slate-950/30 gap-2">
          <button
            type="button"
            onClick={() => setPreviewTab('edit')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              previewTab === 'edit'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Editor Fields
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('preview')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              previewTab === 'preview'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Markdown Preview
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {previewTab === 'edit' ? (
            <>
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Article Title:
                  </label>
                  <input
                    type="text"
                    value={title}
                    placeholder="e.g. Moon in Aries: Cardinal Ignition"
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    URL Slug:
                  </label>
                  <input
                    type="text"
                    value={slug}
                    placeholder="e.g. transit-aries"
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Category, Zodiac Sign, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BlogCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Zodiac Sign Tag (Optional):
                  </label>
                  <select
                    value={zodiacSignTag}
                    onChange={(e) => setZodiacSignTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">None / General</option>
                    {SIGNS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Publication Status:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Excerpt / Social Preview Summary:
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  placeholder="Brief summary of the article..."
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                />
              </div>

              {/* Markdown Content */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Article Markdown Body:
                </label>
                <textarea
                  rows={9}
                  value={content}
                  placeholder="Full article body in Markdown..."
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
                />
              </div>

              {/* Image URL & Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Cover Image URL:
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    placeholder="https://.../transit-images/aries.png"
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Keywords / Tags (comma separated):
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    placeholder="Moon in Aries, Lunar Transit, Fire Element"
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Author & Reviewed By */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Author Attribution:
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Reviewed By:
                  </label>
                  <input
                    type="text"
                    value={reviewedBy}
                    onChange={(e) => setReviewedBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 bg-slate-950/60 p-6 rounded-xl border border-slate-800">
              <h1 className="text-2xl font-bold text-white tracking-tight">{title || 'Untitled Post'}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {category}
                </span>
                {zodiacSignTag && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {zodiacSignTag}
                  </span>
                )}
                <span>• By {author}</span>
              </div>
              {imageUrl && (
                <div className="max-w-xs overflow-hidden rounded-xl border border-slate-800">
                  <img src={imageUrl} alt={title} className="w-full h-auto object-cover" />
                </div>
              )}
              {excerpt && <p className="text-sm text-slate-300 italic border-l-2 border-indigo-500 pl-3">{excerpt}</p>}
              <div className="pt-4 border-t border-slate-800 whitespace-pre-wrap text-sm text-slate-200 font-sans leading-relaxed">
                {content}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Journal blog post saved successfully to Supabase!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isNew ? 'Create Post' : 'Save Changes'}</span>
          </button>

          <div className="flex items-center gap-2">
            {!isNew && post?.id && (
              <button
                type="button"
                onClick={() => onPublishToggle(post.id!, post.status)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  isPublished
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                }`}
              >
                {isPublished ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Unpublish (Set to Draft)</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Now</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
