import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Teach me anything',
  description: 'Learn any concept explained like ChatGPT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

