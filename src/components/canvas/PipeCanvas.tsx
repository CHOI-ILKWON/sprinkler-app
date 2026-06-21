import { useRef, useEffect } from 'react';
import type { PipeCalcResult } from '../../types';

interface PipeCanvasProps {
  result: PipeCalcResult | null;
}

export default function PipeCanvas({ result }: PipeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 800;
    const H = 120 + result.roomDetails.length * 90;
    canvas.width  = W;
    canvas.height = H;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, W, H);

    const RISER_X = 60;
    const MAIN_Y  = 60;
    const ROOM_GAP = 110;

    // 입상관
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(RISER_X, 20);
    ctx.lineTo(RISER_X, H - 20);
    ctx.stroke();

    // 라벨: 입상관
    ctx.fillStyle = '#93c5fd';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('입상관', RISER_X, 14);
    ctx.fillText(result.riserPipe.size, RISER_X, H - 6);

    result.roomDetails.forEach((rd, i) => {
      const roomY = MAIN_Y + i * ROOM_GAP;

      // 주배관 (가로)
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(RISER_X, roomY);
      ctx.lineTo(220, roomY);
      ctx.stroke();

      // 교차관
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(220, roomY);
      ctx.lineTo(420, roomY);
      ctx.stroke();

      // 가지관들
      const branchCount = rd.hxCount;
      const branchSpacing = 160 / Math.max(branchCount, 1);
      for (let b = 0; b < branchCount; b++) {
        const bx = 430 + b * branchSpacing;
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, roomY);
        ctx.lineTo(bx, roomY + 50);
        ctx.stroke();

        // 헤드
        ctx.beginPath();
        ctx.arc(bx, roomY + 58, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }

      // 실 이름 라벨
      ctx.fillStyle = '#f9fafb';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(rd.room.name, 222, roomY - 8);

      // 배관 라벨들
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px sans-serif';
      ctx.fillText(`주관 ${rd.cumulativePipe.size}`, RISER_X + 4, roomY - 4);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText(`교차관 ${rd.crossPipe.size}`, 222, roomY + 10);
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(`가지관 ${rd.branchPipe.size}`, 432, roomY - 4);
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(`${rd.heads}헤드 / ${rd.roomFlow}LPM`, 222, roomY - 20);
    });
  }, [result]);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-800 rounded-lg border border-gray-700 text-gray-500 text-sm">
        배관 계통도가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <canvas ref={canvasRef} className="rounded-lg" />
    </div>
  );
}
