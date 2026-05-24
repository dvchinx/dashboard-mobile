'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Folder, Note } from '@/lib/types';
import NoteCard from '@/components/notes/NoteCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';

export default function FolderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id: folderId } = useParams<{ id: string }>();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [creating, setCreating] = useState(false);

  /* ── Auth guard ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  /* ── Load ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (user && folderId) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, folderId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadFolder(), loadNotes()]);
    setLoading(false);
  }

  async function loadFolder() {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .eq('user_id', user!.id)
      .single();
    if (data) setFolder(data);
    else router.replace('/dashboard');
  }

  async function loadNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('folder_id', folderId)
      .order('updated_at', { ascending: false });
    if (data) setNotes(data);
  }

  /* ── Create note ────────────────────────────────────────────── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return setTitleError('Give your note a title.');
    setCreating(true);

    const { data } = await supabase
      .from('notes')
      .insert({
        title: newTitle.trim(),
        content: '',
        folder_id: folderId,
        user_id: user!.id,
      })
      .select()
      .single();

    setCreating(false);
    if (data) router.push(`/notes/${data.id}`);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setNewTitle('');
    setTitleError('');
  };

  /* ── Note actions ───────────────────────────────────────────── */
  const handleDelete = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', noteId);
    setNotes((p) => p.filter((n) => n.id !== noteId));
  };

  const handleToggleFav = async (noteId: string, isFav: boolean) => {
    const { data } = await supabase
      .from('notes')
      .update({ is_favorite: !isFav })
      .eq('id', noteId)
      .select()
      .single();
    if (data) setNotes((p) => p.map((n) => (n.id === noteId ? data : n)));
  };

  /* ── Render ─────────────────────────────────────────────────── */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-10">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-zinc-400 hover:text-zinc-100 text-sm transition-colors shrink-0 cursor-pointer"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: folder?.color ?? '#7c3aed' }}
              />
              <h1 className="text-sm font-semibold text-zinc-100 truncate">{folder?.title}</h1>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            + New note
          </Button>
        </div>
      </header>

      {/* ── Notes ──────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-zinc-900/40
            border border-zinc-800 border-dashed rounded-2xl text-center">
            <div className="text-4xl mb-3 select-none">📄</div>
            <p className="text-zinc-400 text-sm font-medium">No notes yet</p>
            <p className="text-zinc-600 text-xs mt-1">Create your first note in this folder</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
              Create note
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-zinc-600 mb-1">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
            {notes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFav}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Create modal ───────────────────────────────────────── */}
      <Modal isOpen={createOpen} onClose={closeCreate} title="New note">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="Untitled note…"
            value={newTitle}
            onChange={(e) => { setNewTitle(e.target.value); setTitleError(''); }}
            error={titleError}
            autoFocus
          />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeCreate}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={creating}>
              Create & open
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
