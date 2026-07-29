'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { auth } from '@/firebase'
import { signOut, deleteUser } from 'firebase/auth'
import { useAuth } from '@/contexts/AuthContext'
import UserSearch from './UserSearch'
import { db } from '@/firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe","Other"
]

const LANGUAGES = [
  "Afrikaans","Albanian","Amharic","Arabic","Armenian","Azerbaijani","Basque","Belarusian","Bengali","Bosnian","Bulgarian","Burmese","Catalan","Cebuano","Chinese (Cantonese)","Chinese (Mandarin)","Croatian","Czech","Danish","Dutch","English","Estonian","Filipino","Finnish","French","Galician","Georgian","German","Greek","Gujarati","Haitian Creole","Hausa","Hawaiian","Hebrew","Hindi","Hmong","Hungarian","Icelandic","Igbo","Indonesian","Irish","Italian","Japanese","Javanese","Kannada","Kazakh","Khmer","Korean","Kurdish","Kyrgyz","Lao","Latin","Latvian","Lithuanian","Luxembourgish","Macedonian","Malagasy","Malay","Malayalam","Maltese","Maori","Marathi","Mongolian","Nepali","Norwegian","Odia","Pashto","Persian","Polish","Portuguese","Punjabi","Romanian","Russian","Samoan","Scots Gaelic","Serbian","Sesotho","Shona","Sindhi","Sinhala","Slovak","Slovenian","Somali","Spanish","Sundanese","Swahili","Swedish","Tagalog","Tajik","Tamil","Telugu","Thai","Turkish","Ukrainian","Urdu","Uzbek","Vietnamese","Welsh","Xhosa","Yiddish","Yoruba","Zulu","Other"
]

function SearchableDropdown({ options, selectedValues, onSelectionChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const filtered = options.filter((o: string) => o.toLowerCase().includes(searchTerm.toLowerCase()))
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setIsOpen(false); setSearchTerm('') } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  return (
    <div ref={ref} className="relative">
      <div className="min-h-[42px] border border-gray-300 rounded-md p-2 bg-white">
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((v: string) => (
            <span key={v} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
              {v}<button type="button" onClick={() => onSelectionChange(selectedValues.filter((x: string) => x !== v))} className="ml-1 text-primary-600 hover:text-primary-800">×</button>
            </span>
          ))}
          <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            {selectedValues.length === 0 ? placeholder : ''}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" autoFocus />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? filtered.map((o: string) => (
              <button key={o} type="button" onClick={() => { const s = selectedValues.includes(o) ? selectedValues.filter((x: string) => x !== o) : [...selectedValues, o]; onSelectionChange(s) }} className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${selectedValues.includes(o) ? 'bg-primary-50 text-primary-700' : ''}`}>{o}</button>
            )) : <div className="px-3 py-2 text-gray-500">No options found</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useAuth()
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoForm, setInfoForm] = useState({ age: '', country: '', languages: [] as string[] })
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [infoSuccess, setInfoSuccess] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [profilePicture, setProfilePicture] = useState('')
  const router = useRouter()

  // Auto-fetch profile picture when user loads so navbar avatar shows immediately
  useEffect(() => {
    if (!user) return
    const fetchPic = async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const d = await res.json()
          if (d.success) setProfilePicture(d.user.profilePicture || '')
        }
      } catch {}
    }
    fetchPic()
  }, [user])

  const handleSignOut = async () => { try { await signOut(auth) } catch (e) { console.error(e) } }

  const fetchUserInfo = async () => {
    setInfoLoading(true); setInfoError(''); setInfoSuccess('')
    try {
      if (!user) throw new Error('Not authenticated')
      const token = await user.getIdToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
      if (!res.ok) { if (res.status === 404) { setInfoForm({ age: '', country: '', languages: [] }); return } throw new Error(`HTTP ${res.status}`) }
      const data = await res.json()
      if (data.success) {
        setInfoForm({
          age: data.user.age ? String(data.user.age) : '',
          country: data.user.country || '',
          languages: Array.isArray(data.user.languages) ? data.user.languages : [],
        })
        setProfilePicture(data.user.profilePicture || '')
      } else throw new Error(data.error || 'Failed to load')
    } catch (err: any) { setInfoError(err.message || 'Failed to load user info') }
    finally { setInfoLoading(false) }
  }

  const openInfoModal = () => { setShowInfoModal(true); fetchUserInfo() }
  const closeInfoModal = () => { setShowInfoModal(false); setInfoError(''); setInfoSuccess(''); setInfoLoading(false) }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setInfoLoading(true); setInfoError(''); setInfoSuccess('')
    try {
      if (!user) throw new Error('Not authenticated')
      const age = infoForm.age ? Number(infoForm.age) : undefined
      if (age !== undefined && (isNaN(age) || age < 0 || age > 120)) throw new Error('Age must be between 0 and 120')
      const token = await user.getIdToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, country: infoForm.country.trim() || undefined, languages: infoForm.languages })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success) { setInfoSuccess('Information updated successfully!'); setTimeout(() => closeInfoModal(), 1500) }
      else throw new Error(data.error || 'Failed to update')
    } catch (err: any) { setInfoError(err.message || 'Failed to update user info') }
    finally { setInfoLoading(false) }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    try {
      await deleteUser(user)
      await deleteDoc(doc(db, 'users', user.uid))
      setShowDeleteModal(false); router.push('/login')
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') alert('For security, please log out and log back in, then try deleting your account again right away.')
      else alert('Failed to delete account: ' + (err?.message || err))
    }
  }

  const navAvatar = profilePicture || user?.photoURL

  if (loading) return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">Debate</Link>
          <div className="w-9 h-9 bg-gray-200 animate-pulse rounded-full"></div>
        </div>
      </div>
    </nav>
  )

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">Debate</Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
            <UserSearch className="w-56" />
            {user ? (
              <div className="flex items-center space-x-3 ml-4">
                <div className="relative group">
                  <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                    {navAvatar ? (
                      <img src={navAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-lg font-bold">{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user.displayName || 'User'}</div>
                      <div className="text-gray-500 text-xs truncate">{user.email}</div>
                    </div>
                    <button onClick={openInfoModal} className="block w-full text-left px-4 py-2 text-sm text-primary-700 hover:bg-gray-100 font-medium">Your Information</button>
                    <Link href="/profile" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                    <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
                    <button onClick={() => setShowDeleteModal(true)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete Account</button>
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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              <UserSearch className="w-full" />
              {user ? (
                <div className="flex items-center space-x-3 mt-2">
                  <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                    {navAvatar ? <img src={navAvatar} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-gray-400 text-lg font-bold">{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.displayName || 'User'}</span>
                    <button onClick={openInfoModal} className="text-sm text-primary-600 hover:text-primary-700 text-left">Your Information</button>
                    <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700 text-left">Sign Out</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-2">
                  <Link href="/login" className="text-gray-600 hover:text-primary-600 font-medium px-3 py-1 rounded">Log In</Link>
                  <Link href="/signup" className="text-white bg-primary-600 hover:bg-primary-700 font-medium px-3 py-1 rounded">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Your Information Modal — age, country, languages only */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold" onClick={closeInfoModal} disabled={infoLoading}>×</button>
            <h2 className="text-lg font-semibold mb-5">Edit Your Information</h2>

            {infoLoading && !infoForm.age && !infoForm.country && !infoForm.languages.length ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i}><div className="h-4 bg-gray-200 rounded w-1/4 mb-2"/><div className="h-10 bg-gray-200 rounded"/></div>)}
              </div>
            ) : (
              <form onSubmit={handleInfoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age <span className="text-gray-400 font-normal">(recommended)</span></label>
                  <input type="number" name="age" min="0" max="120" value={infoForm.age} onChange={e => setInfoForm(f => ({ ...f, age: e.target.value }))} disabled={infoLoading} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100" placeholder="Enter your age" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-gray-400 font-normal">(recommended)</span></label>
                  <SearchableDropdown options={COUNTRIES} selectedValues={infoForm.country ? [infoForm.country] : []} onSelectionChange={(vals: string[]) => setInfoForm(f => ({ ...f, country: vals[0] || '' }))} placeholder="Select country" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages <span className="text-gray-400 font-normal">(recommended)</span></label>
                  <SearchableDropdown options={LANGUAGES} selectedValues={infoForm.languages} onSelectionChange={(langs: string[]) => setInfoForm(f => ({ ...f, languages: langs }))} placeholder="Select languages" />
                </div>

                {infoError && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{infoError}</div>}
                {infoSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{infoSuccess}</div>}

                <button type="submit" disabled={infoLoading} className="w-full bg-primary-600 text-white rounded-md py-2 font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center">
                  {infoLoading ? (
                    <><svg className="animate-spin mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Saving...</>
                  ) : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold" onClick={() => setShowDeleteModal(false)}>×</button>
            <h2 className="text-lg font-semibold mb-4 text-red-700">Delete Your Account</h2>
            <p className="mb-4 text-gray-700 text-sm">Are you sure you want to permanently delete your account? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDeleteAccount} className="btn-primary bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
