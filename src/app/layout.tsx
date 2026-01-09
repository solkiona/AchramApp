// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders"; // We'll create this
import {PostHogProvider} from "@/providers/PostHogProvider";

export const metadata: Metadata = {
  title: "ACHRAMS Passenger App",
  description: "Book your rides with ACHRAMS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-achrams-background-primary" suppressHydrationWarning={true}>
        <ClientProviders>
          <PostHogProvider>

          {children}

          </PostHogProvider>
        </ClientProviders>
      </body>
    </html>
  );
}