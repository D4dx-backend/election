import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (browser environment)
    if (typeof window !== 'undefined') {
      // Function to update state based on window width
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Set initial value
      checkIsMobile();

      // Add event listener for resize
      window.addEventListener('resize', checkIsMobile);

      // Cleanup
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, []);

  return isMobile;
}