import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/provider/theme-provider";
import QueryProvider from "@/components/provider/query-provider";
import "./globals.css";
import { ThemeDebug } from "./ThemeDebug";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Annosetu",
  description: "Food sharing platform",
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
        suppressHydrationWarning // ← prevents body-level mismatch warnings
      >
        <QueryProvider>
          <ThemeProvider>
            <Navbar />
            {children}
            <Footer />
            <ThemeDebug />
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#333",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "12px 16px",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#22c55e",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
