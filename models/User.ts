export type UserId = string;

export interface User {
  id: UserId;
  name: string;
  email?: string;
  createdAt: string; // ISO date string
}
