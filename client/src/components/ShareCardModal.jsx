import React, { useEffect, useRef, useState } from 'react';
import { XIcon, DownloadIcon, ShareIcon } from './Icons';

// ─── Canvas constants ──────────────────────────────────────────────────────────

const W = 1080;
const H = 1350;

const DAY_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2',
  '#059669', '#d97706', '#ea580c', '#dc2626',
];
const DAYS_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// Rounded-rect fill — works on all browsers (roundRect polyfill via arcTo)
function fillRR(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
  ctx.fill();
}

function formatWeekRange(iso) {
  if (!iso) return '';
  const mon = new Date(iso + 'T00:00:00Z');
  const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
  const fmt = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${mon.toLocaleDateString('en-US', fmt)} – ${sun.toLocaleDateString('en-US', { ...fmt, year: 'numeric' })}`;
}

// ─── Card renderer ─────────────────────────────────────────────────────────────

function drawCard(canvas, entries, weekStart) {
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // Subtle dot-grid texture
  ctx.fillStyle = '#1e293b';
  for (let gx = 40; gx < W; gx += 48)
    for (let gy = 40; gy < H; gy += 48) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.5, 0, Math.PI * 2); ctx.fill();
    }

  // ── Top accent bar
  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, '#10b981');
  barGrad.addColorStop(1, '#059669');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, W, 12);

  // ── Brand name
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign    = 'center';
  ctx.fillStyle    = '#10b981';
  ctx.font = 'bold 44px Inter, system-ui, sans-serif';
  ctx.fillText("What's Simmering?", W / 2, 84);

  // ── Week title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 68px Inter, system-ui, sans-serif';
  ctx.fillText("This Week's Menu", W / 2, 168);

  // ── Week date
  ctx.fillStyle = '#64748b';
  ctx.font = '32px Inter, system-ui, sans-serif';
  ctx.fillText(formatWeekRange(weekStart), W / 2, 218);

  // ── Divider
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth   = 2;
  ctx.beginPath(); ctx.moveTo(80, 244); ctx.lineTo(W - 80, 244); ctx.stroke();

  // ── Day slots
  const slotY0 = 260;
  const slotH  = 136;
  const slotGap = 6;

  for (let i = 0; i < 7; i++) {
    const entry = entries[i];
    const y     = slotY0 + i * (slotH + slotGap);
    const col   = DAY_COLORS[i];

    // Slot background
    ctx.fillStyle = '#1e293b';
    fillRR(ctx, 60, y, W - 120, slotH, 16);

    // Left accent strip
    ctx.fillStyle = col;
    fillRR(ctx, 60, y, 10, slotH, [8, 0, 0, 8]);

    if (entry) {
      // Day abbreviation
      ctx.fillStyle = col;
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(DAYS_SHORT[i], 90, y + 44);

      if (entry.type === 'out') {
        // Eating-out slot — render label in muted italic instead of "Not planned yet"
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 36px Inter, system-ui, sans-serif';
        ctx.fillText(entry.label || 'Eating out', 90, y + 92);
      } else {
        // Meal name
        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 42px Inter, system-ui, sans-serif';
        ctx.fillText(truncate(entry.mainName || entry.main?.name || '—', 30), 90, y + 92);

        // Sides
        const sideNames = entry.sideNames ||
          (entry.sides || []).map(s => s.name).filter(Boolean);
        if (sideNames.length) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '26px Inter, system-ui, sans-serif';
          ctx.fillText(truncate('with ' + sideNames.join(', '), 46), 90, y + 124);
        }
      }
    } else {
      // Empty slot
      ctx.fillStyle = col + '66';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(DAYS_SHORT[i], 90, y + 44);

      ctx.fillStyle = '#475569';
      ctx.font = '32px Inter, system-ui, sans-serif';
      ctx.fillText('Not planned yet', 90, y + 92);
    }
  }

  // ── Footer divider
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth   = 2;
  ctx.beginPath(); ctx.moveTo(80, H - 80); ctx.lineTo(W - 80, H - 80); ctx.stroke();

  // ── Footer branding
  ctx.fillStyle = '#10b981';
  ctx.font      = 'bold 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("What's Simmering? · Weekly Meal Planner", W / 2, H - 44);

  ctx.fillStyle = '#334155';
  ctx.font      = '22px Inter, system-ui, sans-serif';
  ctx.fillText('Plan smarter. Cook better.', W / 2, H - 14);
}

// ─── Modal component ───────────────────────────────────────────────────────────

export function ShareCardModal({ entries, weekStart, onClose }) {
  const canvasRef    = useRef(null);
  const [busy, setBusy]           = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const canShare = typeof navigator.share === 'function';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    document.fonts.ready.then(() => drawCard(canvas, entries, weekStart));
  }, [entries, weekStart]);

  const getBlob = () =>
    new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'));

  const handleDownload = async () => {
    setBusy(true);
    const blob = await getBlob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `simmer-week-${weekStart || 'plan'}.png`,
    });
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setBusy(false);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleShare = async () => {
    if (!canShare) return;
    setBusy(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], `whats-simmering-week-${weekStart}.png`, { type: 'image/png' });
      const shareData = navigator.canShare?.({ files: [file] })
        ? { files: [file], title: "This week's dinners — What's Simmering?", text: 'Check out my weekly meal plan!' }
        : { title: "This week's dinners on What's Simmering?", url: window.location.origin };
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('[Share]', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-xs bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden">

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-0">
          <div className="h-1 w-10 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-slate-100 text-sm">Share your week</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Download or share as an image</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <XIcon size={13} />
          </button>
        </div>

        {/* Canvas preview */}
        <div className="p-3 bg-slate-950/60">
          <div
            className="relative overflow-hidden rounded-xl border border-slate-800"
            style={{ aspectRatio: `${W}/${H}` }}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 px-4 pb-5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-3 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <DownloadIcon size={14} />
            {downloaded ? 'Saved!' : 'Download PNG'}
          </button>

          {canShare && (
            <button
              type="button"
              onClick={handleShare}
              disabled={busy}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-60 px-3 py-2.5 text-sm font-semibold text-slate-100 transition-colors"
            >
              <ShareIcon size={14} />
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
