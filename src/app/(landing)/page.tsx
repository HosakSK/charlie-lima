"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the B738 checklist directly
    router.replace('/b738');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      color: '#00BDB1',
      fontSize: '1.2rem',
      fontWeight: 600
    }}>
      Loading B738 Checklist...
    </div>
  );
}
