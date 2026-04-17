export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar: string | null;
  created_at: Date;
}

export interface Board {
  id: number;
  name: string;
  color: string;
  owner_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface List {
  id: number;
  board_id: number;
  title: string;
  order_index: number;
  created_at: Date;
}

export interface Card {
  id: number;
  list_id: number;
  title: string;
  description: string | null;
  due_date: Date | null;
  assignee_id: number | null;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}