// List interface
export interface List {
  id: number;
  board_id: number;
  title: string;
  order_index: number;
  created_at: string;
}

// List with cards interface
export interface ListWithCards extends List {
  cards: any[];
}