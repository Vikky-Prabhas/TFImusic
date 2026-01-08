import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

export const metadata: Metadata = {
  title: "TFI Tapes - Telugu Film Industry Mixtapes",
  description: "Create and play retro-style cassette mixtapes with Telugu Film Industry songs. A nostalgic music experience powered by JioSaavn.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TFI Tapes",
  },
  icons: {
    icon: [
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

import { PwaRegister } from "@/components/pwa-register";
import { RotatePrompt } from "@/components/ui/rotate-prompt";
import { PlaybackProvider } from "@/components/providers/playback-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${pressStart2P.variable} font-sans bg-black text-white`}
      >
        <PlaybackProvider>
          <PwaRegister />
          {children}
        </PlaybackProvider>
      </body>
    </html>
  );
}
