import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#1B2A4A]/5 via-white to-[#D4AF37]/5 items-center justify-center p-4">
      {children}
    </div>
  );
}