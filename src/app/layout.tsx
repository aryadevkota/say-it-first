import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Say It First — Social Cue & Conversation Sandbox',
  description: 'Neurodiversity-affirming conversation sandbox powered by affective computing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0F141C] text-slate-100 min-h-screen antialiased selection:bg-[#8B5CF6]/30">
        {children}
      </body>
    </html>
  );
}
