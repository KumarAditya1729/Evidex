import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import { TopNav } from "@/components/top-nav";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "Evidex Evidence Platform",
  description: "Upload digital evidence, anchor cryptographic proofs on-chain, and verify authenticity globally."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="font-[var(--font-body)]">
        <Providers>
          <TopNav />
          <main className="mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
