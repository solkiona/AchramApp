// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders"; // We'll create this

export const metadata: Metadata = {
  title: "ACHRAMS Passenger App",
  description: "Book your airport transfer with ACHRAMS.",
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
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}