import { User, PaginatedUsers, APIResponse } from '../types';

/**
 * Gets paginated list of users with optional filters
 * @param page Page number (1-based)
 * @param pageSize Number of users per page
 * @param filters Optional filters
 * @returns APIResponse with paginated users
 */
export async function listUsers(
  page: number = 1,
  pageSize: number = 10,
  filters?: Partial<User>
): Promise<APIResponse<PaginatedUsers>> {
  try {
    // In a real implementation, this would call Convex query
    const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
      id: `user-${i}`,
      clerkId: `clerk-${i}`,
      email: `user${i}@example.com`,
      firstName: `User${i}`,
      lastName: `Last${i}`,
      roles: i === 0 ? ['admin'] : ['user'],
      createdAt: Date.now() - i * 1000,
      updatedAt: Date.now() - i * 1000
    }));

    const filteredUsers = filters
      ? mockUsers.filter(user => {
          return Object.entries(filters).every(([key, value]) => {
            return user[key as keyof User] === value;
          });
        })
      : mockUsers;

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = filteredUsers.slice(start, end);

    return {
      data: {
        users: paginatedUsers,
        count: filteredUsers.length,
        page,
        pageSize
      },
      success: true
    };
  } catch (error) {
    return { error: 'Failed to fetch users', success: false };
  }
}