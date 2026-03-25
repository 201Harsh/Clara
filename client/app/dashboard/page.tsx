"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AxiosInstance from "../config/AxiosInstance";
import { useAuthStore } from "../store/auth-store";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken, setAccessToken } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const urlToken = searchParams.get("token");

      if (urlToken) {
        // 1. Initial Login: Save token from URL to Zustand Memory
        setAccessToken(urlToken);

        // 2. Clean the URL (removes ?token=... without refreshing the page)
        window.history.replaceState({}, document.title, "/dashboard");
        setIsInitializing(false);
      } else if (!accessToken) {
        // 3. Page Refresh: Memory wiped. Recover via HttpOnly Refresh Cookie.
        try {
          const { data } = await AxiosInstance.get("/users/refresh");
          setAccessToken(data.accessToken);
          setIsInitializing(false);
        } catch (error) {
          // If refresh fails, they are truly logged out. Send to signup.
          router.push("/signup");
        }
      } else {
        // 4. Already logged in and memory is intact.
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [searchParams, accessToken, setAccessToken, router]);

  // Premium loading state while checking tokens
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-purple-400 font-mono text-sm tracking-widest animate-pulse">
          SECURING UPLINK...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AuthLoader>{children}</AuthLoader>
    </Suspense>
  );
}
