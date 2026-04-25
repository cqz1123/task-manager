// Board interface
export interface Board {
  id: number;
  name: string;
  color?: string;
  owner_id: number;
  created_at: string;
  updated_at?: string;
}

// Board with lists interface
export interface BoardWithLists extends Board {
  lists: any[]; // 临时使用 any 类型，需要定义 ListWithCards 接口
}