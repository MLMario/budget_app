import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget App - AI-Powered Budget Tracking",
  description: "Proactive budget management with AI-powered insights",
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
