"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/firebase";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import Link from "next/link";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX } }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AvatarImg({ src, name, className = "" }: { src: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) return <img src={src} alt={name} className={"w-full h-full object-cover " + className} onError={() => setFailed(true)} />
  return <div className={"w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-semibold select-none " + className}>{name?.charAt(0).toUpperCase() || "?"}</div>
}

interface UserProfile {
  name: string; age: number | null; country: string | null; languages: string[];
  bio: string; profilePicture: string; email: string; uid: string; createdAt: any;
  followersCount: number; followingCount: number; followers: string[]; following: string[];
}
interface UserSummary { uid: string; name: string; profilePicture: string; country: string; }

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({ name: "", bio: "" });
  const [picPreview, setPicPreview] = useState("");
  const [newPicB64, setNewPicB64] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeList, setActiveList] = useState<"none" | "followers" | "following">("none");
  const [listUsers, setListUsers] = useState<UserSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setPageLoading(true);
      try {
        const token = await user.getIdToken();
        const [apiRes, fsDoc] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } }),
          getDoc(doc(db, "users", user.uid))
        ]);
        const fsData = fsDoc.exists() ? fsDoc.data() : {};
        let apiData: any = {};
        if (apiRes.ok) { const d = await apiRes.json(); if (d.success) apiData = d.user; }
        const followers: string[] = fsData.followers || [];
        const following: string[] = fsData.following || [];
        const merged: UserProfile = {
          name: fsData.name || user.displayName || "", bio: fsData.bio || "",
          age: apiData.age || fsData.age || null, country: apiData.country || fsData.country || null,
          languages: apiData.languages || fsData.languages || [],
          profilePicture: apiData.profilePicture || fsData.profilePicture || "",
          email: fsData.email || user.email || "", uid: user.uid, createdAt: fsData.createdAt || null,
          followersCount: followers.length, followingCount: following.length, followers, following,
        };
        setProfile(merged); setPicPreview(merged.profilePicture); setFormData({ name: merged.name, bio: merged.bio });
      } catch { setError("Failed to load profile"); } finally { setPageLoading(false); }
    };
    load();
  }, [user]);

  const fetchList = async (type: "followers" | "following") => {
    if (!user || !profile) return;
    if (activeList === type) { setActiveList("none"); return; }
    setActiveList(type); setListLoading(true); setListUsers([]);
    try {
      const uids = type === "followers" ? profile.followers : profile.following;
      const token = await user.getIdToken();
      const results = await Promise.all(uids.map(uid =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ));
      setListUsers(results.filter(r => r.success).map((r: any) => ({ uid: r.user.uid, name: r.user.name || "Unknown", profilePicture: r.user.profilePicture || "", country: r.user.country || "" })));
    } catch {} finally { setListLoading(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try { const b64 = await compressImage(file); setPicPreview(b64); setNewPicB64(b64); }
    catch { setError("Failed to process image."); }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const token = await user.getIdToken();
      await updateDoc(doc(db, "users", user.uid), { name: formData.name.trim(), bio: formData.bio.trim(), updatedAt: new Date() });
      if (newPicB64) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
          method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ profilePicture: newPicB64 }),
        });
      }
      await updateProfile(user, { displayName: formData.name.trim() });
      setProfile(prev => prev ? { ...prev, name: formData.name.trim(), bio: formData.bio.trim(), profilePicture: newPicB64 || prev.profilePicture } : null);
      setNewPicB64(""); setIsEditing(false); setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message || "Failed to update profile"); } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (profile) { setFormData({ name: profile.name, bio: profile.bio }); setPicPreview(profile.profilePicture); setNewPicB64(""); }
    setIsEditing(false); setError("");
  };

  const displayPic = picPreview || profile?.profilePicture || "";

  if (loading || pageLoading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="flex items-center gap-4 mb-6"><div className="w-24 h-24 rounded-full bg-gray-200" /></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 overflow-hidden">
                  <AvatarImg src={displayPic} name={profile?.name || "U"} />
                </div>
                {isEditing && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
              {!isEditing && (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || "No name"}</h1>
                  <p className="text-gray-500 text-sm">{profile?.email}</p>
                  {profile?.country && <p className="text-gray-400 text-sm">{profile.country}</p>}
                </div>
              )}
            </div>
            <button onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
              {isEditing ? "Cancel" : "Edit profile"}
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

          {isEditing ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" rows={4}
                  placeholder="Tell others who you are and what you like to debate..." />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm">
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Bio</h3>
                <p className="text-gray-700">{profile?.bio || <span className="text-gray-400 italic">No bio yet</span>}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div><p className="text-sm text-gray-500">Age</p><p className="font-medium text-gray-900">{profile?.age ?? <span className="text-gray-400">-</span>}</p></div>
                <div><p className="text-sm text-gray-500">Country</p><p className="font-medium text-gray-900">{profile?.country || <span className="text-gray-400">-</span>}</p></div>
                <div><p className="text-sm text-gray-500">Languages</p><p className="font-medium text-gray-900">{profile?.languages?.length ? profile.languages.join(", ") : <span className="text-gray-400">-</span>}</p></div>
              </div>
              <div className="flex gap-8 pt-4 border-t border-gray-100">
                <button onClick={() => fetchList("followers")} className={"text-center transition-colors " + (activeList === "followers" ? "text-primary-600" : "hover:text-primary-600")}>
                  <p className="text-xl font-bold text-gray-900">{profile?.followersCount ?? 0}</p>
                  <p className="text-sm text-gray-400">Followers</p>
                </button>
                <button onClick={() => fetchList("following")} className={"text-center transition-colors " + (activeList === "following" ? "text-primary-600" : "hover:text-primary-600")}>
                  <p className="text-xl font-bold text-gray-900">{profile?.followingCount ?? 0}</p>
                  <p className="text-sm text-gray-400">Following</p>
                </button>
              </div>
              {activeList !== "none" && (
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-600 mb-3 capitalize">{activeList}</h3>
                  {listLoading && <p className="text-sm text-gray-400">Loading...</p>}
                  {!listLoading && listUsers.length === 0 && <p className="text-sm text-gray-400">No {activeList} yet.</p>}
                  <div className="space-y-3">
                    {listUsers.map(u => (
                      <Link key={u.uid} href={"/profile/" + u.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <AvatarImg src={u.profilePicture} name={u.name} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          {u.country && <p className="text-xs text-gray-400">{u.country}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {profile?.createdAt && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-400">Member since {profile.createdAt.toDate?.().toLocaleDateString() || "-"}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
