// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProviders from "@/providers/ClientProviders"; // We'll create this
import {PostHogProvider} from "@/providers/PostHogProvider";
// import { BiometricGate } from '@/app/BiometricGate';

export const metadata: Metadata = {
  title: "ACHRAMS Passenger App",
  description: "Book your rides with ACHRAMS.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-achrams-background-primary
      min-h-dvh flex flex-col
      " suppressHydrationWarning={true}>
        <main className="flex-1 min-h-0 flex flex-col">

        <ClientProviders>
          {/* <BiometricGate> */}
          <PostHogProvider>
          {children}
          </PostHogProvider>
          {/* </BiometricGate> */}
        </ClientProviders>

        </main>


        
      </body>
    </html>
  );
}