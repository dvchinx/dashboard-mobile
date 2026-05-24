'use client';

import { useRouter } from 'next/navigation';
import { Note } from '@/lib/types';

interface NoteCardProps {
  note: Note;
  onDelete: (noteId: string) => void;
  onToggleFavorite: (noteId: string, isFavorite: boolean) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NoteCard({ note, onDelete, onToggleFavorite }: NoteCardProps) {
  const router = useRouter();
  const preview = note.content
    ? note.content.replace(/\n+/g, ' ').trim().slice(0, 110) +
      (note.content.length > 110 ? '…' : '')
    : 'Empty note';

  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer
        hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-150 group active:scale-[0.99]"
      onClick={() => router.push(`/notes/${note.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-zinc-100 text-sm leading-snug flex-1 line-clamp-1">
          {note.title}
        </h3>

        {/* Actions — appear on hover */}
        <div
          className="flex items-center gap-0.5 shrink-0 -mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleFavorite(note.id, note.is_favorite)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all cursor-pointer
              ${note.is_favorite
                ? 'text-yellow-400'
                : 'text-zinc-700 opacity-0 group-hover:opacity-100 hover:text-yellow-400'
              }`}
            title={note.is_favorite ? 'Unfavourite' : 'Favourite'}
          >
            {note.is_favorite ? '★' : '☆'}
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-700
              hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm cursor-pointer"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-3">{preview}</p>

      <span className="text-[11px] text-zinc-700">{timeAgo(note.updated_at)}</span>
    </div>
  );
}
