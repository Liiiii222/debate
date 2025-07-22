"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface UserProfile {
  uid: string;
  name: string;
  age?: number;
  country?: string;
  languages: string[];
  bio?: string;
  profileImage?: string;
  isFollowing: boolean;
}

export default function UserProfilePage({ params }: { params: { uid: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !params.uid) return;

      setLoadingProfile(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
          setFollowing(data.profile.isFollowing);
        } else if (response.status === 404) {
          setError("User not found");
        } else {
          setError("Failed to load profile");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    if (user && params.uid) {
      loadProfile();
    }
  }, [user, params.uid]);

  const handleFollow = async () => {
    if (!user || !profile) return;

    try {
      const token = await user.getIdToken();
      const method = following ? 'DELETE' : 'POST';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${profile.uid}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFollowing(!following);
      } else {
        console.error('Follow action failed:', response.statusText);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header with profile picture and follow button */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
                  {profile.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt={profile.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-3xl font-bold">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  <div className="text-gray-600 space-y-1">
                    {profile.age && <p>{profile.age} years old</p>}
                    {profile.country && <p>From {profile.country}</p>}
                  </div>
                </div>
              </div>
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-md transition-colors ${
                  following
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}

            {/* Languages */}
            {profile.languages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((language) => (
                    <span
                      key={language}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 