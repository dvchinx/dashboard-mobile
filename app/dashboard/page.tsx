'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Folder, Note } from '@/lib/types';
import FolderCard from '@/components/folders/FolderCard';
import FolderModal from '@/components/folders/FolderModal';
import NoteCard from '@/components/notes/NoteCard';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function DashboardPage() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [favorites, setFavorites] = useState<Note[]>([]);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  /* ── Auth guard ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  /* ── Initial load ───────────────────────────────────────────── */
  useEffect(() => {
    if (user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadFolders(), loadFavorites()]);
    setLoading(false);
  }

  async function loadFolders() {
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (!data) return;
    setFolders(data);

    // Fetch note counts in parallel
    const counts: Record<string, number> = {};
    await Promise.all(
      data.map(async (f) => {
        const { count } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', f.id);
        counts[f.id] = count ?? 0;
      })
    );
    setNoteCounts(counts);
  }

  async function loadFavorites() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false })
      .limit(6);
    if (data) setFavorites(data);
  }

  /* ── Folder CRUD ────────────────────────────────────────────── */
  const handleCreateFolder = async (title: string, color: string) => {
    const { data } = await supabase
      .from('folders')
      .insert({ title, color, user_id: user!.id })
      .select()
      .single();
    if (data) {
      setFolders((p) => [data, ...p]);
      setNoteCounts((p) => ({ ...p, [data.id]: 0 }));
    }
  };

  const handleEditFolder = async (title: string, color: string) => {
    if (!editingFolder) return;
    const { data } = await supabase
      .from('folders')
      .update({ title, color })
      .eq('id', editingFolder.id)
      .select()
      .single();
    if (data) setFolders((p) => p.map((f) => (f.id === data.id ? data : f)));
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder and all its notes?')) return;
    await supabase.from('folders').delete().eq('id', id);
    setFolders((p) => p.filter((f) => f.id !== id));
  };

  /* ── Note actions (from favorites list) ────────────────────── */
  const handleDeleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await supabase.from('notes').delete().eq('id', id);
    setFavorites((p) => p.filter((n) => n.id !== id));
  };

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    await supabase.from('notes').update({ is_favorite: !isFav }).eq('id', id);
    if (isFav) setFavorites((p) => p.filter((n) => n.id !== id));
    else loadFavorites();
  };

  /* ── Render ─────────────────────────────────────────────────── */
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const firstName = (profile?.full_name || user?.email || 'there').split(' ')[0];
  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-zinc-950 pb-10">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg select-none">📝</span>
            <span className="font-bold text-zinc-100 text-sm tracking-tight">Notion Lite</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 hidden sm:block">
              Good day, {firstName}
            </span>
            <button
              onClick={async () => { await signOut(); router.replace('/auth/login'); }}
              className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors
                flex items-center justify-center text-white text-xs font-bold cursor-pointer select-none"
              title="Sign out"
            >
              {initials}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* ── Folders ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
              Folders
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setEditingFolder(null); setModalOpen(true); }}
            >
              + New folder
            </Button>
          </div>

          {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 bg-zinc-900/40
              border border-zinc-800 border-dashed rounded-2xl text-center">
              <div className="text-4xl mb-3 select-none">📁</div>
              <p className="text-zinc-400 text-sm font-medium">No folders yet</p>
              <p className="text-zinc-600 text-xs mt-1">Create a folder to start organising</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setModalOpen(true)}
              >
                Create your first folder
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {folders.map((f) => (
                <FolderCard
                  key={f.id}
                  folder={f}
                  noteCount={noteCounts[f.id]}
                  onEdit={(folder) => { setEditingFolder(folder); setModalOpen(true); }}
                  onDelete={handleDeleteFolder}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Favourites ───────────────────────────────────────── */}
        {favorites.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-yellow-400">★</span> Favourites
            </h2>
            <div className="flex flex-col gap-2">
              {favorites.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onDelete={handleDeleteNote}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <FolderModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingFolder(null); }}
        onSave={editingFolder ? handleEditFolder : handleCreateFolder}
        folder={editingFolder}
      />
    </div>
  );
}
