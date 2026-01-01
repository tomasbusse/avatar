import React from 'react';
import { User, PaginatedUsers } from '../types';

interface UserTableProps {
  data: PaginatedUsers;
  onPageChange: (page: number) => void;
  onUserClick: (userId: string) => void;
}

export function UserTable({ data, onPageChange, onUserClick }: UserTableProps) {
  return (
    <div className="user-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map(user => (
            <tr key={user.id} onClick={() => onUserClick(user.id)}>
              <td>{`${user.firstName} ${user.lastName}`}</td>
              <td>{user.email}</td>
              <td>{user.roles.join(', ')}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button
          disabled={data.page === 1}
          onClick={() => onPageChange(data.page - 1)}
        >
          Previous
        </button>
        <span>Page {data.page}</span>
        <button
          disabled={data.page * data.pageSize >= data.count}
          onClick={() => onPageChange(data.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}