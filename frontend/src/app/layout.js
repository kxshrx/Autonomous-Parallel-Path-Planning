import './globals.css'

export const metadata = {
  title: 'Autonomous Parallel Path Planning System',
  description: 'Advanced parallel pathfinding algorithms for autonomous navigation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
