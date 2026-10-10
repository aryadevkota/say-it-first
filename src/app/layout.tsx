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
      <body className="min-h-screen antialiased selection:bg-teal-subtle selection:text-teal-brand">
        {children}
      </body>
    </html>
  );
}
