import { redirect } from 'next/navigation'

export default function HomePage() {
  // Folder groups like (auth) are not part of the public URL; redirect to /login
  redirect('/login')
}
