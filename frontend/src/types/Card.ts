// Card interface
export interface Card {
  id: number;
  list_id: number;
  title: string;
  description?: string;
  due_date?: string;
  assignee_id?: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Card creation data interface
export interface CardCreateData {
  listId: number;
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: number;
}