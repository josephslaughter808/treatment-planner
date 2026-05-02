import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { StartupSplash } from "@/components/startup-splash";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearPath Care",
  description: "A provider-guided tool for explaining diagnoses, imaging findings, and treatment steps.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png"
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClearPath Care"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StartupSplash />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
