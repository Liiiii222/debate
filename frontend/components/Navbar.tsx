'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import UserSearch from './UserSearch'
import { useRef } from 'react';
import { db } from '@/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Burmese", "Catalan", "Cebuano", "Chinese (Cantonese)", "Chinese (Mandarin)", "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian", "Filipino", "Finnish", "French", "Galician", "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Nepali", "Norwegian", "Odia", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", "Tagalog", "Tajik", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu", "Other"
];

function SearchableDropdown({ options, selectedValues, onSelectionChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const filteredOptions = options.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleOptionClick = (option) => {
    const newSelection = selectedValues.includes(option)
      ? selectedValues.filter(val => val !== option)
      : [...selectedValues, option];
    onSelectionChange(newSelection);
  };
  const handleRemoveSelection = (option) => {
    onSelectionChange(selectedValues.filter(val => val !== option));
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div ref={dropdownRef} className="relative">
      <div className="min-h-[42px] border border-gray-300 rounded-md p-2 bg-white">
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((value) => (
            <span key={value} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
              {value}
              <button type="button" onClick={() => handleRemoveSelection(value)} className="ml-1 text-primary-600 hover:text-primary-800">×</button>
            </span>
          ))}
          <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            {selectedValues.length === 0 ? placeholder : ""}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" autoFocus />
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button key={option} type="button" onClick={() => handleOptionClick(option)} className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${selectedValues.includes(option) ? 'bg-primary-50 text-primary-700' : ''}`}>{option}</button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  // Modal state
  const [showInfoModal, setShowInfoModal] = useState(false)
  // Replace infoForm and related logic to support languages as an array
  const [infoForm, setInfoForm] = useState({ age: '', country: '', languages: [] });
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [infoSuccess, setInfoSuccess] = useState('')

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Fetch user info for modal
  const fetchUserInfo = async () => {
    setInfoLoading(true);
    setInfoError('');
    setInfoSuccess('');
    
    try {
      if (!user) throw new Error('Not authenticated');
      
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 404) {
          // User doesn't exist in MongoDB yet, this is normal for new users
          setInfoForm({
            age: '',
            country: '',
            languages: []
          });
          return;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setInfoForm({
          age: data.user.age ? String(data.user.age) : '',
          country: data.user.country || '',
          languages: Array.isArray(data.user.languages) ? data.user.languages : (data.user.language ? [data.user.language] : [])
        });
      } else {
        throw new Error(data.error || 'Failed to load user info');
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
      setInfoError(err instanceof Error ? err.message : 'Failed to load user info');
    } finally {
      setInfoLoading(false);
    }
  };

  const openInfoModal = () => {
    setShowInfoModal(true)
    fetchUserInfo()
  }
  const closeInfoModal = () => {
    setShowInfoModal(false);
    setInfoError('');
    setInfoSuccess('');
    setInfoLoading(false);
  };
  const handleInfoChange = (e) => {
    setInfoForm({ ...infoForm, [e.target.name]: e.target.value });
    // Clear any previous errors when user starts typing
    if (infoError) setInfoError('');
  };
  const handleLanguagesChange = (langs) => {
    setInfoForm({ ...infoForm, languages: langs });
    if (infoError) setInfoError('');
  };
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoError('');
    setInfoSuccess('');
    
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Validate form data
      const age = infoForm.age ? Number(infoForm.age) : undefined;
      if (age !== undefined && (isNaN(age) || age < 0 || age > 120)) {
        throw new Error('Age must be between 0 and 120');
      }
      
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          age: age,
          country: infoForm.country.trim() || undefined,
          languages: infoForm.languages
        })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setInfoSuccess('Information updated successfully!');
        // Update the form with the returned data to ensure consistency
        setInfoForm({
          age: data.user.age ? String(data.user.age) : '',
          country: data.user.country || '',
          languages: Array.isArray(data.user.languages) ? data.user.languages : (data.user.language ? [data.user.language] : [])
        });
        setTimeout(() => closeInfoModal(), 1500);
      } else {
        throw new Error(data.error || 'Failed to update user info');
      }
    } catch (err) {
      console.error('Error updating user info:', err);
      setInfoError(err instanceof Error ? err.message : 'Failed to update user info');
    } finally {
      setInfoLoading(false);
    }
  };

  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      // Delete Firestore user doc
      await deleteDoc(doc(db, 'users', user.uid));
      // Delete Firebase Auth user
      await deleteUser(user);
      setShowDeleteModal(false);
      router.push('/login');
    } catch (err) {
      alert('Failed to delete account: ' + (err?.message || err));
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Debate
              </Link>
            </div>
            <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              Debate
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
            {/* Search bar */}
            <UserSearch className="w-56" />
            {/* Auth/Profile section */}
            {user ? (
              <div className="flex items-center space-x-3 ml-4">
                <div className="relative group">
                  <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-colors">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user.displayName || 'User'}</div>
                      <div className="text-gray-500">{user.email}</div>
                    </div>
                    {/* Your Information button */}
                    <button
                      onClick={openInfoModal}
                      className="block w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-gray-100 transition-colors font-medium"
                    >
                      Your Information
                    </button>
                    <Link
                      href="/profile"
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Sign Out
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete Your Account
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link href="/login" className="text-gray-600 hover:text-primary-600 font-medium px-3 py-1 rounded transition">Log In</Link>
                <Link href="/signup" className="text-white bg-primary-600 hover:bg-primary-700 font-medium px-3 py-1 rounded transition">Sign Up</Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </Link>
              {/* Search bar for mobile */}
              <UserSearch className="w-full" />
              {/* Auth/Profile section for mobile */}
              {user ? (
                <div className="flex items-center space-x-3 mt-2">
                  <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'Profile'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-lg font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.displayName || 'User'}</span>
                    <Link href="/profile" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-2">
                  <Link href="/login" className="text-gray-600 hover:text-primary-600 font-medium px-3 py-1 rounded transition">Log In</Link>
                  <Link href="/signup" className="text-white bg-primary-600 hover:bg-primary-700 font-medium px-3 py-1 rounded transition">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold" 
              onClick={closeInfoModal}
              disabled={infoLoading}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit Your Information</h2>
            
            {infoLoading && !infoForm.age && !infoForm.country && !infoForm.languages.length ? (
              // Initial loading state
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input 
                    type="number" 
                    name="age" 
                    min="0" 
                    max="120" 
                    value={infoForm.age} 
                    onChange={handleInfoChange} 
                    disabled={infoLoading}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                    placeholder="Enter your age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input 
                    type="text" 
                    name="country" 
                    value={infoForm.country} 
                    onChange={handleInfoChange} 
                    disabled={infoLoading}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" 
                    placeholder="Enter your country"
                  />
                </div>
                {/* Replace the language input with the multi-select dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                  <SearchableDropdown
                    options={LANGUAGES}
                    selectedValues={infoForm.languages}
                    onSelectionChange={handleLanguagesChange}
                    placeholder="Select languages"
                  />
                </div>
                
                {infoError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{infoError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {infoSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{infoSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="w-full bg-primary-600 text-white rounded-md py-2 font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                  disabled={infoLoading}
                >
                  {infoLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold" onClick={() => setShowDeleteModal(false)}>&times;</button>
            <h2 className="text-lg font-semibold mb-4 text-red-700">Delete Your Account</h2>
            <p className="mb-4 text-gray-700">Are you sure you want to permanently delete your account? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDeleteAccount} className="btn-primary bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
} 