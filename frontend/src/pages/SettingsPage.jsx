import { useEffect, useState } from "react";
import PageLayout from "../components/layout/PageLayout.jsx";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  Card,
  Button,
  Avatar,
  Skeleton,
} from "../components/ui/primitives.jsx";
import { SunIcon, MoonIcon, LogOutIcon } from "../components/ui/icons.jsx";

export default function SettingsPage() {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/profile");
        setProfile(response.data.data.profile);
        setUsername(response.data.data.profile?.username || "");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function saveProfile() {
    if (!username.trim()) {
      toast.error("Invalid username", "Username cannot be blank.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/profile", { username: username.trim() });
      toast.success("Profile updated", "Your username has been updated.");
    } catch (error) {
      console.error(error);
      const msg =
        error.response?.data?.error?.message || "Could not update profile.";
      toast.error("Update failed", msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout
      title="Settings"
      subtitle="Manage your profile, preferences, and account"
    >
      <div className="space-y-6 max-w-3xl animate-fade-in">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <Card className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-border pb-6">
                <Avatar
                  name={username || profile?.email || "User"}
                  className="h-16 w-16 text-xl shadow-card"
                />
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    {profile?.username || "Trader"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {profile?.email || "No email available"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={profile?.email || ""}
                    className="h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm font-medium text-muted-foreground cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Display Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving || !username.trim()}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Appearance Card */}
            <Card className="p-6 sm:p-8 space-y-4">
              <h2 className="text-base font-bold text-foreground">
                Appearance
              </h2>
              <p className="text-xs text-muted-foreground">
                Customize how PsyCap looks on your device.
              </p>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <MoonIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <SunIcon className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-foreground capitalize">
                      {theme} mode
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Switch between light and dark themes
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                >
                  Toggle Theme
                </Button>
              </div>
            </Card>

            {/* Account Actions Card */}
            <Card className="p-6 sm:p-8 space-y-4 border-negative/20">
              <h2 className="text-base font-bold text-foreground">
                Account Session
              </h2>
              <p className="text-xs text-muted-foreground">
                Sign out of your current session on this device.
              </p>

              <Button
                variant="negative"
                onClick={() => auth.signOut()}
              >
                <LogOutIcon className="h-4 w-4" />
                Sign Out
              </Button>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
