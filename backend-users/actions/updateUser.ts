import { User, APIResponse } from '../types';

/**
 * Updates an existing user
 * @param userId ID of user to update
 * @param updates Partial user data to update
 * @returns APIResponse with updated user
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'clerkId' | 'createdAt'>>
): Promise<APIResponse<User>> {
  try {
    // In a real implementation, this would call Convex mutation
    const updatedUser: User = {
      id: userId,
      clerkId: 'temp',
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      roles: ['user'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...updates
    };
    return { data: updatedUser, success: true };
  } catch (error) {
    return { error: 'Failed to update user', success: false };
  }
}