'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Folder } from '@/lib/types';

const COLORS = [
  '#7c3aed', // violet
  '#2563eb', // blue
  '#0891b2', // cyan
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#db2777', // pink
  '#ea580c', // orange
];

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, color: string) => Promise<void>;
  folder?: Folder | null;
}

export default function FolderModal({ isOpen, onClose, onSave, folder }: FolderModalProps) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(folder?.title ?? '');
      setColor(folder?.color ?? COLORS[0]);
      setError('');
    }
  }, [isOpen, folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Folder name is required');
    setLoading(true);
    try {
      await onSave(title.trim(), color);
      onClose();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={folder ? 'Edit folder' : 'New folder'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          placeholder="e.g. Work, Ideas, Personal…"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(''); }}
          error={error}
          autoFocus
        />

        <div>
          <span className="text-sm font-medium text-zinc-300 block mb-2">Color</span>
          <div className="flex gap-2.5 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all duration-150 cursor-pointer ${
                  color === c
                    ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110'
                    : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" loading={loading}>
            {folder ? 'Save changes' : 'Create folder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
