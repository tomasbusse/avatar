import { User, APIResponse } from '../types';

/**
 * Creates a new user in the database
 * @param userData User data to create
 * @returns APIResponse with the created user
 */
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<User>> {
  try {
    // In a real implementation, this would call Convex mutation
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return { data: newUser, success: true };
  } catch (error) {
    return { error: 'Failed to create user', success: false };
  }
}