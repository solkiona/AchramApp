// hooks/useKeyboardOffset.ts
import { useEffect, useState } from 'react';

export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      setOffset(window.innerHeight - vv.height - vv.offsetTop);
    };

    vv.addEventListener('resize', handleResize);
    handleResize();
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  return offset;
}