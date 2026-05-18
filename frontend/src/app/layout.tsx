import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { BRAND } from "@/lib/brand";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.name} — Encrypted forms on-chain`,
  description:
    "Create private forms and polls with FHE. Every answer encrypted on Base Sepolia via Fhenix CoFHE.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
