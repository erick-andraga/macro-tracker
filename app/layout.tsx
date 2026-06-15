import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";
import TabBar from "@/components/TabBar";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Macro Tracker",
  description: "Track your daily macros and hit your goals.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Macros" },
};

export const viewport: Viewport = {
  themeColor: "#161719",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StoreProvider>
            <AuthGate>
              <main className="app">{children}</main>
              <TabBar />
            </AuthGate>
          </StoreProvider>
        </AuthProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
