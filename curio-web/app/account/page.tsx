// app/account/page.tsx
// This is the main account page where users can view and edit their profile information. It fetches additional profile data from the backend and allows saving it. It also shows info from Clerk about the user's account.

"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  IdCard,
  GraduationCap,
  Calendar,
  Save,
  LogOut,
} from "lucide-react";

type StudentProfile = {
  age?: number;
  grade?: string;
  school?: string;
  goals?: string;
};

async function fetchAccountProfile(): Promise<StudentProfile> {
  const res = await fetch("/api/account", { cache: "no-store" });
  if (!res.ok) return {};
  const json = (await res.json()) as any;
  return json?.profile ?? {};
}

async function saveAccountProfile(profile: StudentProfile): Promise<StudentProfile | null> {
  const res = await fetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  return json?.profile ?? null;
}

export default function AccountPage() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const userId = user?.id ?? null;

  const clerkName = useMemo(() => {
    if (!user) return "—";
    const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return full || user.username || "—";
  }, [user]);

  const primaryEmail = useMemo(() => {
    if (!user) return "—";
    const email = user.primaryEmailAddress?.emailAddress;
    return email || "—";
  }, [user]);

  const createdAt = useMemo(() => {
    if (!user?.createdAt) return "—";
    try {
      return new Date(user.createdAt).toLocaleDateString();
    } catch {
      return "—";
    }
  }, [user]);

  // Backend “app profile”
  const [profile, setProfile] = useState<StudentProfile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const clerkUserId = user?.id ? String(user.id) : "";

useEffect(() => {
  if (!isLoaded) return;

  if (!clerkUserId) {
    setLoadingProfile(false);
    return;
  }

  let cancelled = false;

  (async () => {
    setLoadingProfile(true);
    const p = await fetchAccountProfile();
    if (!cancelled) {
      setProfile(p || {});
      setLoadingProfile(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [isLoaded, clerkUserId]);



  const handleSave = async () => {
    const saved = await saveAccountProfile(profile);
    if (saved) {
      setProfile(saved); // keep UI in sync with server
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1200);
    } else {
      alert("Save failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/sign-in" });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-gray-600">Loading account…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="text-lg font-semibold text-gray-900">Account</div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Profile card */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">Profile</div>
              <div className="text-sm text-gray-500">From your sign-in (Clerk)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <IdCard className="w-4 h-4" />
                <span>Name</span>
              </div>
              <div className="text-gray-900 font-medium">{clerkName}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <div className="text-gray-900 font-medium break-all">{primaryEmail}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <UserIcon className="w-4 h-4" />
                <span>User ID</span>
              </div>
              <div className="text-gray-900 font-mono text-sm break-all">{clerkUserId ?? "—"}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span>Created</span>
              </div>
              <div className="text-gray-900 font-medium">{createdAt}</div>
            </div>
          </div>
        </section>

        {/* Student info card */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">Student info</div>
              <div className="text-sm text-gray-500">Used to personalize your learning experience</div>
            </div>
          </div>

          {loadingProfile ? (
            <div className="text-sm text-gray-500 mb-4">Loading your info…</div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Age</label>
              <input
                type="number"
                min={5}
                max={100}
                value={profile.age ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    age: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Grade</label>
              <input
                type="text"
                placeholder="e.g., 8th, 10th"
                value={profile.grade ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, grade: e.target.value || undefined }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">School (optional)</label>
              <input
                type="text"
                value={profile.school ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, school: e.target.value || undefined }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-2">Goals (optional)</label>
              <textarea
                rows={3}
                value={profile.goals ?? ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, goals: e.target.value || undefined }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                placeholder="What do you want to build or learn?"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {savedToast ? <span className="text-sky-700 font-medium">Saved ✓</span> : " "}
            </div>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-700 text-white hover:bg-sky-800"
              disabled={!clerkUserId}
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
