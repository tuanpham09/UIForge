import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UIForge",
  description: "AI-native product experience and UI specification platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
