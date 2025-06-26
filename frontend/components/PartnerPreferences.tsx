"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";

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

// Searchable Dropdown Component
interface SearchableDropdownProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
  maxHeight?: string;
}

function SearchableDropdown({ options, selectedValues, onSelectionChange, placeholder, maxHeight = "200px" }: SearchableDropdownProps) {
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
      {/* Selected values display */}
      <div className="min-h-[42px] border border-gray-300 rounded-md p-2 bg-white">
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((value) => (
            <span
              key={value}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
            >
              {value}
              <button
                type="button"
                onClick={() => handleRemoveSelection(value)}
                className="ml-1 text-primary-600 hover:text-primary-800"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {selectedValues.length === 0 ? placeholder : ""}
          </button>
        </div>
      </div>

      {/* Dropdown */}
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
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    selectedValues.includes(option) ? 'bg-primary-50 text-primary-700' : ''
                  }`}
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

interface PartnerPreferencesProps {
  onPreferencesSubmit: (preferences: {
    ageRange: string;
    languages: string[];
    otherLanguages: string[];
    countries: string[];
    otherCountries: string[];
    debateFormats: string[];
  }) => void;
  onBack: () => void;
}

export default function PartnerPreferences({ onPreferencesSubmit, onBack }: PartnerPreferencesProps) {
  const [preferences, setPreferences] = useState({
    ageRange: "Any age",
    languages: [] as string[],
    otherLanguages: [] as string[],
    countries: [] as string[],
    otherCountries: [] as string[],
    debateFormats: [] as string[],
  });
  const [invitedFriend, setInvitedFriend] = useState<string>("");
  // Placeholder for mutual friends (to be fetched from backend in the future)
  const mutualFriends: { id: string; username: string }[] = [];

  const ageRanges = [
    "14-17",
    "18-25",
    "26-35",
    "36-45",
    "46-55",
    "56-65",
    "65+",
    "Any age",
  ];
  const debateFormats = ["Video", "Voice", "Text", "Any format"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPreferencesSubmit(preferences);
  };

  const handleChange = (field: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleLanguageChange = (selectedLanguages: string[]) => {
    const newOtherLanguages = [...preferences.otherLanguages];
    selectedLanguages.forEach((lang, index) => {
      if (lang === "Other" && !newOtherLanguages[index]) {
        newOtherLanguages[index] = "";
      }
    });
    
    setPreferences(prev => ({
      ...prev,
      languages: selectedLanguages,
      otherLanguages: newOtherLanguages
    }));
  };

  const handleCountryChange = (selectedCountries: string[]) => {
    const newOtherCountries = [...preferences.otherCountries];
    selectedCountries.forEach((country, index) => {
      if (country === "Other" && !newOtherCountries[index]) {
        newOtherCountries[index] = "";
      }
    });
    
    setPreferences(prev => ({
      ...prev,
      countries: selectedCountries,
      otherCountries: newOtherCountries
    }));
  };

  const handleDebateFormatChange = (format: string) => {
    setPreferences((prev) => {
      const newFormats = prev.debateFormats.includes(format)
        ? prev.debateFormats.filter((f) => f !== format)
        : [...prev.debateFormats, format];
      if (format === "Any format") {
        return { ...prev, debateFormats: ["Any format"] };
      }
      if (format !== "Any format" && newFormats.includes("Any format")) {
        return { ...prev, debateFormats: newFormats.filter((f) => f !== "Any format") };
      }
      return { ...prev, debateFormats: newFormats };
    });
  };

  const isFormValid = preferences.debateFormats.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Partner Preferences</h1>
        <div></div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invite a Friend Option */}
          <div>
            <label htmlFor="inviteFriend" className="block text-sm font-medium text-gray-700 mb-2">
              Invite a Friend
            </label>
            {mutualFriends.length === 0 ? (
              <div className="text-gray-500 text-sm py-2 px-3 bg-gray-100 rounded">
                You have no friends yet
              </div>
            ) : (
              <select
                id="inviteFriend"
                value={invitedFriend}
                onChange={(e) => setInvitedFriend(e.target.value)}
                className="input-field"
              >
                <option value="">Select a friend to invite</option>
                {mutualFriends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.username}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-400 mt-1">
              A friend is someone you follow and who follows you back. Once you have mutual followers, they will appear here.
            </p>
          </div>

          <div>
            <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 mb-2">
              Age Range *
            </label>
            <select
              id="ageRange"
              value={preferences.ageRange}
              onChange={(e) => handleChange("ageRange", e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select age range</option>
              {ageRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-2">
              Languages *
            </label>
            <SearchableDropdown
              options={LANGUAGES}
              selectedValues={preferences.languages}
              onSelectionChange={handleLanguageChange}
              placeholder="Select languages"
            />
            {preferences.languages.includes("Other") && (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                value={preferences.otherLanguages[preferences.languages.indexOf("Other")] || ""}
                onChange={(e) => {
                  const newOtherLanguages = [...preferences.otherLanguages];
                  newOtherLanguages[preferences.languages.indexOf("Other")] = e.target.value;
                  setPreferences(prev => ({ ...prev, otherLanguages: newOtherLanguages }));
                }}
                placeholder="Please specify your preferred language"
              />
            )}
          </div>

          <div>
            <label htmlFor="countries" className="block text-sm font-medium text-gray-700 mb-2">
              Countries *
            </label>
            <SearchableDropdown
              options={COUNTRIES}
              selectedValues={preferences.countries}
              onSelectionChange={handleCountryChange}
              placeholder="Select countries"
            />
            {preferences.countries.includes("Other") && (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                value={preferences.otherCountries[preferences.countries.indexOf("Other")] || ""}
                onChange={(e) => {
                  const newOtherCountries = [...preferences.otherCountries];
                  newOtherCountries[preferences.countries.indexOf("Other")] = e.target.value;
                  setPreferences(prev => ({ ...prev, otherCountries: newOtherCountries }));
                }}
                placeholder="Please specify your preferred country"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Debate Formats *
            </label>
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
            <button type="button" onClick={onBack} className="btn-secondary">
              Back
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 