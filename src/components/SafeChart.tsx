import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SafeChartProps {
  children: React.ReactNode;
  height?: number | string;
  className?: string;
  minHeight?: number;
}

/**
 * SafeChart prevents Recharts "width/height <= 0" warnings by:
 * 1. Ensuring the component is mounted.
 * 2. Using ResizeObserver to verify the container has solid dimensions (> 0) before rendering the chart.
 * 3. Providing a consistent loading/placeholder state while initialising.
 */
export function SafeChart({ children, height = '100%', className, minHeight = 300 }: SafeChartProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      
      // Only set dimensions if they are valid (greater than 0)
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    
    // Immediate check
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={cn("w-full relative", className)}
      style={{ height, minHeight: typeof height === 'number' ? height : minHeight }}
    >
      {isMounted && dimensions && dimensions.width > 0 && dimensions.height > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/20 rounded-2xl border border-dashed border-gray-100 backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 text-indigo-400 animate-spin mb-2" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Initialising Graph...</p>
        </div>
      )}
    </div>
  );
}
