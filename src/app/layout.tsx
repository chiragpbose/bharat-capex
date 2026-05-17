import type { Metadata } from "next"
import { DM_Sans, Space_Grotesk, DM_Mono } from "next/font/google"
import { Nav } from "@/components/layout/nav"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: {
    default: "BharatCapex",
    template: "%s | BharatCapex",
  },
  description:
    "Track every policy, tender, and company powering India's industrial buildout.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <div className="flex-1 -mt-2">{children}</div>
      </body>
    </html>
  )
}
