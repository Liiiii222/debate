"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/firebase";

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

const PLACEHOLDER_IMG = "/profile-placeholder.png";

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

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [otherCountry, setOtherCountry] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLanguages, setOtherLanguages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [checkingName, setCheckingName] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  // Step 1 validation - name is now required
  const isStep1Valid = email.match(/^\S+@\S+\.\S+$/) && password.length >= 6 && name.trim().length > 0;
  
  // Step 2 validation - at least one field filled or skip
  const hasStep2Data = age.trim().length > 0 || country.trim().length > 0 || languages.length > 0;

  // Password validation
  useEffect(() => {
    if (password.length > 0 && password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
    } else {
      setPasswordError("");
    }
  }, [password]);

  // Generate name suggestions
  const generateNameSuggestions = (baseName: string) => {
    const suggestions = [];
    const randomNumbers = Math.floor(Math.random() * 999) + 1;
    const randomWords = ["debater", "speaker", "thinker", "analyst", "orator"];
    
    suggestions.push(`${baseName}${randomNumbers}`);
    suggestions.push(`${baseName}_${randomWords[Math.floor(Math.random() * randomWords.length)]}`);
    suggestions.push(`${baseName}${Math.floor(Math.random() * 999) + 1}`);
    
    return suggestions.slice(0, 3);
  };

  // Check if name is unique
  const checkNameAvailability = async (nameToCheck: string) => {
    if (!nameToCheck.trim()) return true;
    
    setCheckingName(true);
    try {
      const q = query(collection(db, "users"), where("name", "==", nameToCheck.trim()));
      const snap = await getDocs(q);
      const isAvailable = snap.empty;
      
      if (!isAvailable) {
        setNameSuggestions(generateNameSuggestions(nameToCheck.trim()));
      } else {
        setNameSuggestions([]);
      }
      
      return isAvailable;
    } catch (error) {
      console.error("Error checking name availability:", error);
      return false;
    } finally {
      setCheckingName(false);
    }
  };

  // Debounced name checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (name.trim().length > 0) {
        checkNameAvailability(name);
      } else {
        setNameSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [name]);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isStep1Valid) {
      setError("Please fill in all required fields correctly.");
      return;
    }
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Check if name is unique
      const isNameAvailable = await checkNameAvailability(name.trim());
      if (!isNameAvailable) {
        setError("Account name is already taken. Please choose a different name.");
        setLoading(false);
        return;
      }

      // Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      
      // Update displayName
      await updateProfile(user, { displayName: name.trim(), photoURL: PLACEHOLDER_IMG });
      
      // Process country and languages
      const finalCountry = country === "Other" ? otherCountry : country;
      const finalLanguages = languages.map(lang => lang === "Other" ? otherLanguages[languages.indexOf(lang)] : lang);
      
      // Save user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        name: name.trim(),
        age: age ? Number(age) : null,
        country: finalCountry || null,
        languages: finalLanguages,
        profileImage: PLACEHOLDER_IMG,
        uid: user.uid,
        createdAt: new Date(),
      });
      
      setLoading(false);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Signup failed.");
      setLoading(false);
    }
  }

  function handleSkip() {
    handleStep2(new Event('submit') as any);
  }

  const handleLanguageChange = (selectedLanguages: string[]) => {
    setLanguages(selectedLanguages);
    // Initialize otherLanguages array for new "Other" selections
    const newOtherLanguages = [...otherLanguages];
    selectedLanguages.forEach((lang, index) => {
      if (lang === "Other" && !newOtherLanguages[index]) {
        newOtherLanguages[index] = "";
      }
    });
    setOtherLanguages(newOtherLanguages);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
          <div className={`w-8 h-1 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                placeholder="Choose a unique username"
              />
              {checkingName && name.trim().length > 0 && (
                <div className="text-blue-500 text-sm mt-1">Checking availability...</div>
              )}
              {nameSuggestions.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm text-gray-600 mb-1">Suggestions:</div>
                  <div className="flex flex-wrap gap-2">
                    {nameSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setName(suggestion)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  passwordError ? 'border-red-300' : 'border-gray-300'
                }`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
              {passwordError && <div className="text-red-500 text-sm mt-1">{passwordError}</div>}
              {password.length >= 6 && <div className="text-green-500 text-sm mt-1">✓ Password meets requirements</div>}
            </div>
            
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!isStep1Valid || loading}
            >
              Next
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Age <span className="text-gray-400">(optional)</span></label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={age}
                onChange={e => setAge(e.target.value)}
                min={1}
                max={120}
                placeholder="Enter your age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Country <span className="text-gray-400">(optional)</span></label>
              <SearchableDropdown
                options={COUNTRIES}
                selectedValues={country ? [country] : []}
                onSelectionChange={(values) => setCountry(values[0] || "")}
                placeholder="Select country"
              />
              {country === "Other" && (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                  value={otherCountry}
                  onChange={e => setOtherCountry(e.target.value)}
                  placeholder="Please specify your country"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Languages <span className="text-gray-400">(optional)</span></label>
              <SearchableDropdown
                options={LANGUAGES}
                selectedValues={languages}
                onSelectionChange={handleLanguageChange}
                placeholder="Select languages"
              />
              {languages.includes("Other") && (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mt-2"
                  value={otherLanguages[languages.indexOf("Other")] || ""}
                  onChange={e => {
                    const newOtherLanguages = [...otherLanguages];
                    newOtherLanguages[languages.indexOf("Other")] = e.target.value;
                    setOtherLanguages(newOtherLanguages);
                  }}
                  placeholder="Please specify your language"
                />
              )}
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-gray-500 hover:text-gray-700 text-sm underline focus:outline-none transition-colors"
              disabled={loading}
            >
              Skip for now
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 