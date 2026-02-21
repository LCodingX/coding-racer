import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coding Racer",
  description: "TypeRacer-style typing game for competitive programming code",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-editor-bg text-editor-text antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
