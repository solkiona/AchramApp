// src/providers/PostHogProvider.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";
import { useEffect } from "react";


  if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
      // Enable autocapture (clicks, pageviews, etc.)
      capture_pageview: false,
      capture_pageleave: false,
      // Respect user consent (optional but recommended)
      loaded: (posthog) => {
        if (window.location.hostname === "localhost") {
          posthog.debug();
        }
      },
    });
  }


export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}