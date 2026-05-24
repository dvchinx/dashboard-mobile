'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Note } from '@/lib/types';
import Spinner from '@/components/ui/Spinner';

/* ── Debounce hook ─────────────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

export default function NotePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id: noteId } = useParams<{ id: string }>();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [loading, setLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  const debouncedTitle = useDebounce(title, 700);
  const debouncedContent = useDebounce(content, 700);

  /* ── Auth guard ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  /* ── Load ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (user && noteId) loadNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, noteId]);

  async function loadNote() {
    setLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user!.id)
      .single();

    if (!data) { router.replace('/dashboard'); return; }
    setNote(data);
    setTitle(data.title);
    setContent(data.content ?? '');
    setLoading(false);
    // Mark initialized after next tick so the debounce doesn't trigger on mount
    setTimeout(() => { initialized.current = true; }, 50);
  }

  /* ── Auto-resize textarea ───────────────────────────────────── */
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [content]);

  /* ── Mark unsaved when user types ──────────────────────────── */
  useEffect(() => {
    if (initialized.current) setSaveStatus('unsaved');
  }, [title, content]);

  /* ── Auto-save (debounced) ──────────────────────────────────── */
  useEffect(() => {
    if (!initialized.current || !note) return;
    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedContent]);

  async function save() {
    if (!note) return;
    setSaveStatus('saving');
    const { error } = await supabase.from('notes').update({
      title: debouncedTitle.trim() || 'Untitled',
      content: debouncedContent,
      updated_at: new Date().toISOString(),
    }).eq('id', note.id);
    setSaveStatus(error ? 'unsaved' : 'saved');
  }

  /* ── Actions ────────────────────────────────────────────────── */
  const toggleFav = async () => {
    if (!note) return;
    const updated = !note.is_favorite;
    await supabase.from('notes').update({ is_favorite: updated }).eq('id', note.id);
    setNote({ ...note, is_favorite: updated });
  };

  const deleteNote = async () => {
    if (!note || !confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', note.id);
    router.push(`/folders/${note.folder_id}`);
  };

  /* ── Render ─────────────────────────────────────────────────── */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const statusLabel =
    saveStatus === 'saving' ? (
      <span className="text-xs text-zinc-500 animate-pulse">Saving…</span>
    ) : saveStatus === 'unsaved' ? (
      <span className="text-xs text-amber-500/80">Unsaved</span>
    ) : (
      <span className="text-xs text-zinc-700">Saved</span>
    );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => note && router.push(`/folders/${note.folder_id}`)}
            className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors cursor-pointer"
          >
            ← Back
          </button>

          <div className="flex items-center gap-1">
            {statusLabel}
            <button
              onClick={toggleFav}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base
                transition-colors cursor-pointer ml-1
                ${note?.is_favorite ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400'}`}
              title={note?.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
            >
              {note?.is_favorite ? '★' : '☆'}
            </button>
            <button
              onClick={deleteNote}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600
                hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer text-base"
              title="Delete note"
            >
              🗑️
            </button>
          </div>
        </div>
      </header>

      {/* ── Editor ─────────────────────────────────────────────── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 pt-7 pb-20">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full bg-transparent text-[1.85rem] font-bold text-zinc-100
            placeholder-zinc-800 outline-none border-none mb-5 leading-tight tracking-tight"
        />

        {/* Separator */}
        <div className="h-px bg-zinc-800/80 mb-6" />

        {/* Content */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing…"
          className="w-full bg-transparent text-zinc-300 placeholder-zinc-800
            outline-none border-none text-[0.9375rem] leading-[1.75] min-h-[50vh]
            font-[inherit]"
        />
      </div>
    </div>
  );
}
