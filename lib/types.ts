export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  title: string;
  color: string;
  created_at: string;
}

export interface Note {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  content: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}
