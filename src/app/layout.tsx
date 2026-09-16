import "@/styles/globals.css";

import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { fonts } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  robots: { index: true, follow: true },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className={cn("min-h-screen font-sans", fonts)}>
      <ThemeProvider attribute="class">{children}</ThemeProvider>
    </body>
  </html>
);

export default RootLayout;
