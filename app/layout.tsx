import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "波形图回放",
  description: "波形图回放",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}