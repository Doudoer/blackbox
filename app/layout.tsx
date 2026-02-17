import './globals.css'

export const metadata = {
  title: 'Blackbox Chat',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Add suppressHydrationWarning on the root html element to avoid noisy
  // hydration mismatch warnings caused by browser extensions or attributes
  // that differ between server and client. This doesn't "fix" mismatches
  // in the rendered UI, but suppresses the console error when the differences
  // are benign (for example, extensions injecting attributes like data-lt-installed).
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
