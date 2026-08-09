import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/provider/theme-provider";
import QueryProvider from "@/components/provider/query-provider";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ModernToaster from "@/components/common/ModernToaster";
import InitialSplashScreen from "@/components/common/InitialSplashScreen";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnnaSetu — Share Food, Reduce Waste",
  description:
    "AnnaSetu connects food donors with those in need. Share surplus food, save money, and reduce waste — all in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <ThemeProvider>
            <InitialSplashScreen />
            <Navbar />
            <main className="pb-20 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
            <ModernToaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
