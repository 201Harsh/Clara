"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/auth-store";
import AxiosInstance from "../config/AxiosInstance";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken, setAccessToken } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Prevents the refresh logic from firing twice in React Strict Mode
  const hasAttemptedRefresh = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      const urlToken = searchParams.get("token");

      if (urlToken) {
        // 1. Initial Login from Google
        setAccessToken(urlToken);
        // Use Next.js router to clean the URL safely
        router.replace("/dashboard");
        setIsInitializing(false);
      } else if (!accessToken && !hasAttemptedRefresh.current) {
        // 2. Page Refresh Recovery
        hasAttemptedRefresh.current = true;
        try {
          const { data } = await AxiosInstance.get("/users/refresh");
          setAccessToken(data.accessToken);
          setIsInitializing(false);
        } catch (error) {
          console.error("Session refresh failed. Redirecting to login.");
          router.replace("/signup?error=SessionExpired");
        }
      } else if (accessToken) {
        // 3. Already secured in memory
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [searchParams, accessToken, setAccessToken, router]);

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
