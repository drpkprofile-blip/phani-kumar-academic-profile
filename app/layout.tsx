import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Phani Kumar Simhadri | Academic & Research Profile",
  description:
    "Academic and research portfolio of Dr. Phani Kumar Simhadri, Assistant Professor of Mechanical Engineering at ANITS.",
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
