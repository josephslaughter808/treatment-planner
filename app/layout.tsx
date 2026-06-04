import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { StartupSplash } from "@/components/startup-splash";
import "./globals.css";
import "./analyst-theme.css";

export const metadata: Metadata = {
  title: "ClearPath Care",
  description: "A pilot medical history and insurance check-in app for dental offices.",
  robots: {
    index: false,
    follow: false
  },
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
