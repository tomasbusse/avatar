import { User, APIResponse, PaginatedUsers } from '../types';
import { listUsers, updateUser, deleteUser } from '../actions';

/**
 * Admin API endpoints for user management
 */

export async function adminGetUsers(
  page: number,
  pageSize: number,
  filters?: Partial<User>
): Promise<APIResponse<PaginatedUsers>> {
  return listUsers(page, pageSize, filters);
}

export async function adminUpdateUser(
  userId: string,
  updates: Partial<User>
): Promise<APIResponse<User>> {
  return updateUser(userId, updates);
}

export async function adminDeleteUser(userId: string): Promise<APIResponse<undefined>> {
  return deleteUser(userId);
}