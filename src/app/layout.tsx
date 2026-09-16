import "@/styles/globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Platform",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className="min-h-screen font-sans">{children}</body>
  </html>
);

export default RootLayout;
