"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import posthog from "posthog-js";

// Initialize PostHog (skip in local dev to avoid 431 header size errors)
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NODE_ENV !== "development") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
  });
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "'Satoshi', sans-serif",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
