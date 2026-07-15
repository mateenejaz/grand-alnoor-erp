import { redirect } from 'next/navigation';

export default function RootPage() {
  // This sends anyone visiting the home page straight to the dashboard
  redirect('/dashboard');
}