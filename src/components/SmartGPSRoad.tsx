import React, { useRef, useEffect, useState } from "react";

interface SmartGPSRoadProps {
  className?: string;
  opacity?: number;
  showRoad?: boolean;
}

export const SmartGPSRoad: React.FC<SmartGPSRoadProps> = ({ 
  className = "absolute inset-0 w-full h-full", 
  opacity: _opacity = 0.5,
  showRoad = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const path = [
      { x: 0, y: dimensions.height * 0.8 },
      { x: dimensions.width * 0.2, y: dimensions.height * 0.7 },
      { x: dimensions.width * 0.5, y: dimensions.height * 0.85 },
      { x: dimensions.width * 0.8, y: dimensions.height * 0.6 },
      { x: dimensions.width, y: dimensions.height * 0.5 },
    ];

    const pings: { x: number; y: number; startTime: number }[] = [];

    function drawGlowBackground() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      const gradient = ctx.createRadialGradient(
        dimensions.width / 2, dimensions.height / 2, 0,
        dimensions.width / 2, dimensions.height / 2, dimensions.width / 1.5
      );
      gradient.addColorStop(0, "rgba(37, 99, 235, 0.15)");
      gradient.addColorStop(0.5, "rgba(37, 99, 235, 0.08)");
      gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      if (showRoad) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.strokeStyle = "rgba(37, 99, 235, 0.3)";
        ctx.lineWidth = 60;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 15]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function drawCarAndPings() {
      const currentTime = (Date.now() - startTime) / 1000;
      const duration = 10;
      const progress = (currentTime % duration) / duration;

      const segmentCount = path.length - 1;
      const segmentIndex = Math.floor(progress * segmentCount);
      const segmentProgress = (progress * segmentCount) % 1;

      const start = path[segmentIndex];
      const end = path[segmentIndex + 1];

      if (!start || !end) return;

      const carX = start.x + (end.x - start.x) * segmentProgress;
      const carY = start.y + (end.y - start.y) * segmentProgress;

      if (Math.floor(currentTime) > pings.length) {
        pings.push({ x: carX, y: carY, startTime: Date.now() });
      }

      const now = Date.now();
      for (let i = pings.length - 1; i >= 0; i--) {
        const ping = pings[i];
        const age = (now - ping.startTime) / 1000;
        if (age > 2) {
          pings.splice(i, 1);
          continue;
        }

        const radius = age * 30;
        const op = 1 - age / 2;
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(37, 99, 235, ${op})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(carX, carY);
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      ctx.rotate(angle);
      
      ctx.shadowColor = "rgba(37, 99, 235, 0.5)";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#593cfb";
      ctx.beginPath();
      ctx.roundRect(-15, -8, 30, 16, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillRect(5, -6, 5, 12);
      
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(12, -6, 3, 3);
      ctx.fillRect(12, 3, 3, 3);
      
      ctx.restore();

      ctx.beginPath();
      ctx.arc(carX, carY, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    function animate() {
      drawGlowBackground();
      drawCarAndPings();
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
