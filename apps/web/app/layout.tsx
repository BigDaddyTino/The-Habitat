import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { HabitatHeader } from "@/components/habitat-header";
import { ProgressionToasts } from "@/components/progression-toasts";
import { auth } from "@/auth";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "The Habitat | God's Country",
  description: "A private survival-gaming clubhouse and operations center.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <HabitatHeader />
        <main>{children}</main>
        <ProgressionToasts enabled={Boolean(session?.user?.isActive)} />
      </body>
    </html>
  );
}
