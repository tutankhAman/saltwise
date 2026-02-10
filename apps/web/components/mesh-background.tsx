"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

interface MeshBackgroundProps {
  colors?: string[];
  opacity?: number;
}

export function MeshBackground({
  colors = ["#ffffff", "#f0fdf4", "#dcfce7", "#f0fff4", "#e6fffa", "#ffffff"],
  opacity = 1,
}: MeshBackgroundProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden bg-background">
      <MeshGradient
        colors={colors}
        distortion={0.8}
        grainMixer={0}
        grainOverlay={0}
        height={dimensions.height}
        offsetX={0.08}
        speed={0.42}
        swirl={0.6}
        width={dimensions.width}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-white/20 dark:bg-black/25"
        style={{ opacity }}
      />
    </div>
  );
}
