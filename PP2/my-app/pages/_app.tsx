import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-900 to-red-800 text-white min-h-screen">
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main className="px-4">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

