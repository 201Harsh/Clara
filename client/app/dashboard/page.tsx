"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AxiosInstance from "../config/AxiosInstance";
import { useAuthStore } from "../store/auth-store";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { accessToken, setAccessToken } = useAuthStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const hasAttemptedRefresh = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      const urlToken = searchParams.get("token");

      if (urlToken) {
        // 1. Login success from Google redirect
        setAccessToken(urlToken);
        // Replace the URL instantly to hide the token from the address bar
        router.replace("/dashboard");
        setIsInitializing(false);
      } else if (!accessToken && !hasAttemptedRefresh.current) {
        // 2. Page was refreshed. Attempt to recover session via cookie.
        hasAttemptedRefresh.current = true;
        try {
          const { data } = await AxiosInstance.get("/users/refresh");
          setAccessToken(data.accessToken);
          setIsInitializing(false);
        } catch (error) {
          console.error("Refresh failed (401/404). Terminating session.");
          // Only redirect if the refresh ACTUALLY fails (e.g., cookie expired)
          router.replace("/signup?error=SessionExpired");
        }
      } else if (accessToken) {
        // 3. User is navigating normally, token is safe in RAM.
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [searchParams, accessToken, setAccessToken, router]);

  // Prevent the white flash by rendering a dark loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#05000a] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-purple-400 font-mono text-sm tracking-widest animate-pulse">
          RESTORING SECURE SESSION...
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
