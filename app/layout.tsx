import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import TabBar from "@/components/TabBar";

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
        <StoreProvider>
          <main className="app">{children}</main>
          <TabBar />
        </StoreProvider>
      </body>
    </html>
  );
}
