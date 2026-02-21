"use client";

import { useEffect, useState } from "react";

interface CountdownOverlayProps {
  onComplete: () => void;
}

export default function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="text-center">
        {count > 0 ? (
          <span className="text-9xl font-bold text-orange animate-bounce">
            {count}
          </span>
        ) : (
          <span className="text-7xl font-bold text-teal">GO!</span>
        )}
      </div>
    </div>
  );
}
