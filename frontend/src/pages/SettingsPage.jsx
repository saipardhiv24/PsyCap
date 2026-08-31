import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/profile");
        setProfile(response.data.data.profile);
        setUsername(response.data.data.profile.username || "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function save() {
    setMessage("");
    try {
      await api.put("/profile", { username });
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(
        error.response?.data?.error?.message || "Could not update profile.",
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-100">
        Loading settings…
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-slate-400">
            Update your username and review your account details.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <div className="mt-2 rounded-2xl bg-slate-950 px-4 py-3 text-slate-100">
                {profile.email || "Not available"}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={save}
                className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Save changes
              </button>
              {message && (
                <span className="text-sm text-slate-300">{message}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
