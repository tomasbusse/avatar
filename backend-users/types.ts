/**
 * User management types for the backend-users module
 */

export type UserRole = 'admin' | 'moderator' | 'user' | 'guest';

export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  createdAt: number;
  updatedAt: number;
}

export interface PaginatedUsers {
  users: User[];
  count: number;
  page: number;
  pageSize: number;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}