import React, { useState } from 'react';
import { UserRole } from '../types';

interface RoleSelectorProps {
  initialRoles: UserRole[];
  onRolesChange: (roles: UserRole[]) => void;
}

export function RoleSelector({ initialRoles, onRolesChange }: RoleSelectorProps) {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(initialRoles);
  const allRoles: UserRole[] = ['admin', 'moderator', 'user', 'guest'];

  const handleRoleToggle = (role: UserRole) => {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    
    setSelectedRoles(newRoles);
    onRolesChange(newRoles);
  };

  return (
    <div className="role-selector">
      {allRoles.map(role => (
        <label key={role}>
          <input
            type="checkbox"
            checked={selectedRoles.includes(role)}
            onChange={() => handleRoleToggle(role)}
          />
          {role}
        </label>
      ))}
    </div>
  );
}