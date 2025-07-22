"use client";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  name: string;
  age?: number;
  country?: string;
  languages: string[];
  profileImage?: string;
}

interface UserSearchProps {
  placeholder?: string;
  className?: string;
}

export default function UserSearch({ placeholder = "Search for users...", className = "" }: UserSearchProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || !user) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users || []);
          setShowResults(true);
        } else {
          console.error('Search failed:', response.statusText);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, user]);

  const handleUserClick = (user: User) => {
    router.push(`/user/${user.uid}`);
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => searchResults.length > 0 && setShowResults(true)}
        className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-700 placeholder-gray-400 transition"
        style={{ background: 'none', boxShadow: 'none' }}
      />
      
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((user) => (
            <button
              key={user.uid}
              onClick={() => handleUserClick(user)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{user.name}</div>
                <div className="text-sm text-gray-500 truncate">
                  {user.age && `${user.age} years`}
                  {user.age && user.country && ' • '}
                  {user.country}
                  {user.languages.length > 0 && (user.age || user.country) && ' • '}
                  {user.languages.slice(0, 2).join(', ')}
                  {user.languages.length > 2 && '...'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchTerm.trim() && searchResults.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-center">
            No users found
          </div>
        </div>
      )}
    </div>
  );
} 