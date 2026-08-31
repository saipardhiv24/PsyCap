import { useEffect, useState } from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import MobileNav from "./MobileNav.jsx";
import api from "../../utils/api.js";

// Simple in-memory cache so navigating between pages doesn't refetch the
// profile on every mount. Cleared naturally on full reload / sign-out.
let cachedProfile = null;

export function setCachedProfile(profile) {
  cachedProfile = profile;
}

export default function PageLayout({ title, subtitle, children, contentClassName = "" }) {
  const [profile, setProfile] = useState(cachedProfile);

  useEffect(() => {
    if (cachedProfile) return;
    let active = true;
    api
      .get("/profile")
      .then((res) => {
        const p = res.data?.data?.profile;
        if (active && p) {
          cachedProfile = p;
          setProfile(p);
        }
      })
      .catch(() => {
        /* Non-blocking: the shell still renders without a display name. */
      });
    return () => {
      active = false;
    };
  }, []);

  const displayName = profile?.username || profile?.email || "";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar title={title} subtitle={subtitle} displayName={displayName} />
        <main
          className={`mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 ${contentClassName}`}
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
