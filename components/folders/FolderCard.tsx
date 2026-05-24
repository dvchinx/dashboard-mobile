'use client';

import { useRouter } from 'next/navigation';
import { Folder } from '@/lib/types';

interface FolderCardProps {
  folder: Folder;
  noteCount?: number;
  onEdit: (folder: Folder) => void;
  onDelete: (folderId: string) => void;
}

export default function FolderCard({
  folder,
  noteCount = 0,
  onEdit,
  onDelete,
}: FolderCardProps) {
  const router = useRouter();

  return (
    <div
      className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4 cursor-pointer
        hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-150 group active:scale-[0.97]"
      onClick={() => router.push(`/folders/${folder.id}`)}
    >
      {/* Color icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 shrink-0"
        style={{ backgroundColor: `${folder.color}22`, border: `1.5px solid ${folder.color}55` }}
      >
        📁
      </div>

      <h3 className="font-semibold text-zinc-100 text-sm truncate leading-snug">
        {folder.title}
      </h3>
      <p className="text-xs text-zinc-600 mt-0.5">
        {noteCount} {noteCount === 1 ? 'note' : 'notes'}
      </p>

      {/* Colour dot bottom-right */}
      <div
        className="absolute bottom-3.5 right-3.5 w-2 h-2 rounded-full"
        style={{ backgroundColor: folder.color }}
      />

      {/* Hover actions */}
      <div
        className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(folder)}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-zinc-700
            text-zinc-500 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(folder.id)}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-900/40
            text-zinc-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
