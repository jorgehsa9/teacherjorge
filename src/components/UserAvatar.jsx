import React from 'react';
import { Book, Pencil, Backpack, GraduationCap, Apple, User } from 'lucide-react';

export const avatarOptions = [
  { id: 'book', icon: Book, name: 'Livro', colorHex: '#A855F7' },
  { id: 'pencil', icon: Pencil, name: 'Lápis', colorHex: '#3B82F6' }, 
  { id: 'backpack', icon: Backpack, name: 'Mochila', colorHex: 'var(--success)' },
  { id: 'apple', icon: Apple, name: 'Maçã', colorHex: 'var(--danger)' },
  { id: 'graduation-cap', icon: GraduationCap, name: 'Capelo', colorHex: 'var(--warning)' }
];

const UserAvatar = ({ avatarId, name = '', size = 20, className = '' }) => {
  const avatar = avatarOptions.find(opt => opt.id === avatarId);
  
  if (avatar) {
    const Icon = avatar.icon;
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Icon size={size} style={{ color: avatar.colorHex }} />
      </div>
    );
  }

  // Fallback to initial letter
  return (
    <div className={`flex items-center justify-center font-bold ${className}`}>
      {name.charAt(0).toUpperCase() || 'U'}
    </div>
  );
};

export default UserAvatar;
