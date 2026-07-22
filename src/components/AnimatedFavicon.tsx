import { useEffect } from "react";

const SIZE = 32;
const FRAME_COUNT = 24;
const FRAME_MS = 90;

function drawFrame(ctx: CanvasRenderingContext2D, progress: number) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  const r = 7;
  ctx.fillStyle = "#D4AF37";
  ctx.beginPath();
  ctx.roundRect(0, 0, SIZE, SIZE, r);
  ctx.fill();

  const baseline = 25;
  const bars = [
    { x: 8, maxH: 8, phase: 0 },
    { x: 14, maxH: 13, phase: 0.66 },
    { x: 20, maxH: 18, phase: 1.33 },
  ];

  ctx.fillStyle = "#070E1A";
  for (const bar of bars) {
    const wave = (Math.sin((progress + bar.phase) * Math.PI * 2) + 1) / 2;
    const h = bar.maxH * (0.45 + wave * 0.55);
    ctx.beginPath();
    ctx.roundRect(bar.x, baseline - h, 4, h, 1.5);
    ctx.fill();
  }
}

export default function AnimatedFavicon() {
  useEffect(() => {
    const link = document.getElementById("favicon") as HTMLLinkElement | null;
    if (!link) return;

    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const originalHref = link.href;
    const originalType = link.type;

    let frame = 0;
    const interval = window.setInterval(() => {
      frame = (frame + 1) % FRAME_COUNT;
      drawFrame(ctx, frame / FRAME_COUNT);
      link.type = "image/png";
      link.href = canvas.toDataURL("image/png");
    }, FRAME_MS);

    return () => {
      window.clearInterval(interval);
      link.type = originalType;
      link.href = originalHref;
    };
  }, []);

  return null;
}
