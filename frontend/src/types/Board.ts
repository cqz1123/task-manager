// Board interface
export interface Board {
  id: number;
  name: string;
  color?: string;
  invite_code?: string;
  owner_id: number;
  created_at: string;
  updated_at?: string;
  myRole?: 'owner' | 'editor' | 'viewer';
}

// Board with lists interface
export interface BoardWithLists extends Board {
  lists: any[]; // 临时使用 any 类型，需要定义 ListWithCards 接口
}

// Member interface
export interface BoardMember {
  id: number;
  userId: number;
  username: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt?: string;
}

// Member list response interface
export interface MemberListResponse {
  boardId: number;
  boardName: string;
  owner: BoardMember | null;
  members: BoardMember[];
}