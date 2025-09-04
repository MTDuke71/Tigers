'use client';

import { useEffect } from 'react';
import { CacheService } from '@/services/cacheService';

export function CacheInitializer() {
  useEffect(() => {
    // Initialize cache service when the app loads
    CacheService.initialize().catch(console.error);
  }, []);

  return null; // This component doesn't render anything
}
