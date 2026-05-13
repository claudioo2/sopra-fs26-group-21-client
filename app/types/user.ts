export interface User {
  id: string | null;
  name: string | null;
  username: string | null;
  email: string | null;
  token: string | null;
  status: string | null;
  bio: string | null;
  following: User[] | null;
}

export interface UserPreview {
  id: number | null;
  username: string | null;
}