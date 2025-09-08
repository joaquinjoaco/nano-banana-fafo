import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const plusJakartaSans = localFont({
  src: "./fonts/PlusJakartaSans-VariableFont_wght.ttf",
  display: "block",
  preload: true,
});

export const metadata: Metadata = {
  title: "Try it on",
  description: "Yes, try it on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${plusJakartaSans.className}`}>
        {children}
      </body>
    </html>
  )
}
