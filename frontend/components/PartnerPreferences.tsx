"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe", "Other"
];

const LANGUAGES = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Burmese", "Catalan", "Cebuano", "Chinese (Cantonese)", "Chinese (Mandarin)", "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian", "Filipino", "Finnish", "French", "Galician", "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", "Luxembourgish", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Nepali", "Norwegian", "Odia", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", "Scots Gaelic", "Serbian", "Sesotho", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", "Tagalog", "Tajik", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu", "Other"
];

interface SearchableDropdownProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
}

function SearchableDropdown({ options, selectedValues, onSelectionChange, placeholder }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOptionClick = (option: string) => {
    const newSelection = selectedValues.includes(option)
      ? selectedValues.filter(val => val !== option)
      : [...selectedValues, option];
    onSelectionChange(newSelection);
  };

  const handleRemoveSelection = (option: string) => {
    onSelectionChange(selectedValues.filter(val => val !== option));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${selectedValues.includes(option) ? 'bg-primary-50 text-primary-700' : ''}`}
                >
                  {option}
                </button>
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

interface Friend {
  uid: string;
  name: string;
  age?: number;
  country?: string;
  languages: string[];
  profileImage?: string;
}

interface PartnerPreferencesProps {
  onPreferencesSubmit: (preferences: {
    ageRange: string;
    languages: string[];
    countries: string[];
    debateFormats: string[];
  }) => void;
  onBack: () => void;
}

export default function PartnerPreferences({ onPreferencesSubmit, onBack }: PartnerPreferencesProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    ageRange: "Any age",
    languages: [] as string[],
    countries: [] as string[],
    debateFormats: [] as string[],
  });
  const [invitedFriend, setInvitedFriend] = useState<string>("");
  const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const ageRanges = ["14-17", "18-25", "26-35", "36-45", "46-55", "56-65", "65+", "Any age"];
  const debateFormats = ["Video", "Voice", "Text", "Any format"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPreferencesSubmit(preferences);
  };

  const handleDebateFormatChange = (format: string) => {
    setPreferences((prev) => {
      if (format === "Any format") {
        return { ...prev, debateFormats: ["Any format"] };
      }
      const newFormats = prev.debateFormats.includes(format)
        ? prev.debateFormats.filter((f) => f !== format)
        : [...prev.debateFormats.filter(f => f !== "Any format"), format];
      return { ...prev, debateFormats: newFormats };
    });
  };

  const isFormValid = preferences.debateFormats.length > 0;

  useEffect(() => {
    const loadFriends = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/friends`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMutualFriends(data.friends || []);
        }
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoadingFriends(false);
      }
    };
    loadFriends();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-secondary">← Back</button>
        <h1 className="text-3xl font-bold text-gray-900">Partner Preferences</h1>
        <div></div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Profile info reminder */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            💡 Matching is based on your real profile — make sure your age, country, and languages are filled in under <strong>Your Information</strong> for the best results.
          </div>

          {/* Invite a Friend */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invite a Friend</label>
            {loadingFriends ? (
              <div className="text-gray-500 text-sm py-2 px-3 bg-gray-100 rounded">Loading friends...</div>
            ) : mutualFriends.length === 0 ? (
              <div className="text-gray-500 text-sm py-2 px-3 bg-gray-100 rounded">You have no friends yet</div>
            ) : (
              <select value={invitedFriend} onChange={(e) => setInvitedFriend(e.target.value)} className="input-field">
                <option value="">Select a friend to invite</option>
                {mutualFriends.map((friend) => (
                  <option key={friend.uid} value={friend.uid}>{friend.name}</option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-400 mt-1">A friend is someone you follow and who follows you back.</p>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Partner Age Range</label>
            <select
              value={preferences.ageRange}
              onChange={(e) => setPreferences(prev => ({ ...prev, ageRange: e.target.value }))}
              className="input-field"
            >
              {ageRanges.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Your partner must fall in this age range. Choose "Any age" to match with anyone.
            </p>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partner Languages
              <span className="ml-2 text-xs text-gray-400 font-normal">(leave empty for any)</span>
            </label>
            <SearchableDropdown
              options={LANGUAGES}
              selectedValues={preferences.languages}
              onSelectionChange={(langs) => setPreferences(prev => ({ ...prev, languages: langs }))}
              placeholder="Select languages — or leave empty for any"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your partner must speak at least one of these languages. Leave empty to match with any language.
            </p>
          </div>

          {/* Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partner Countries
              <span className="ml-2 text-xs text-gray-400 font-normal">(leave empty for any)</span>
            </label>
            <SearchableDropdown
              options={COUNTRIES}
              selectedValues={preferences.countries}
              onSelectionChange={(countries) => setPreferences(prev => ({ ...prev, countries: countries }))}
              placeholder="Select countries — or leave empty for any"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your partner must be from one of these countries. Leave empty to match with any country.
            </p>
          </div>

          {/* Debate Formats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Debate Format *</label>
            <div className="space-y-2">
              {debateFormats.map((format) => (
                <label key={format} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.debateFormats.includes(format)}
                    onChange={() => handleDebateFormatChange(format)}
                    className="mr-2"
                  />
                  <span className="text-sm">{format}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onBack} className="btn-secondary">Back</button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find a Partner
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
