import { redirect } from 'next/navigation';

export default function RootPage() {
  // Automatically send anyone visiting the home page to the secure dashboard
  redirect('/dashboard');
}