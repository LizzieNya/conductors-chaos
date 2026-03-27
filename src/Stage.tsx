import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore, type OrchestraSection, type SectionVisual } from './store';
import { audioMixer } from './audio/mixer';
import { chaosEngine } from './chaos/engine';
import { useUpgradeStore } from './upgrades';

// Section layout on stage
const SECTION_BOUNDS: Record<OrchestraSection, { x: number; y: number; w: number; h: number }> = {
  strings:    { x: 40,  y: 260, w: 200, h: 140 },
  woodwinds:  { x: 560, y: 260, w: 200, h: 140 },
  brass:      { x: 250, y: 130, w: 300, h: 120 },
  percussion: { x: 280, y: 30,  w: 240, h: 90  },
};

const SECTION_COLORS: Record<OrchestraSection, { normal: string; glow: string }> = {
  strings:    { normal: '#3b82f6', glow: '#60a5fa' },
  woodwinds:  { normal: '#10b981', glow: '#34d399' },
  brass:      { normal: '#f59e0b', glow: '#fbbf24' },
  percussion: { normal: '#8b5cf6', glow: '#a78bfa' },
};

const SECTION_LABELS: Record<OrchestraSection, string> = {
  strings: '🎻 Strings',
  woodwinds: '🎵 Woodwinds',
  brass: '🎺 Brass',
  percussion: '🥁 Percussion',
};

// Floating score popup system
interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // 0-1
}

interface CelebrationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const scorePopups: ScorePopup[] = [];
const celebrationParticles: CelebrationParticle[] = [];

// Power-up icons
const POWERUP_ICONS: Record<string, string> = {
  speed: '⚡',
  shield: '🛡️',
  freeze: '❄️',
  score: '💰',
};

const POWERUP_COLORS: Record<string, string> = {
  speed: '#fbbf24',
  shield: '#22c55e',
  freeze: '#60a5fa',
  score: '#f472b6',
};

function drawPowerUp(ctx: CanvasRenderingContext2D, x: number, y: number, type: string, time: number, collected: boolean) {
  if (collected) return;

  ctx.save();
  
  // Floating animation
  const floatY = y + Math.sin(time * 3) * 5;
  
  // Glow
  const grad = ctx.createRadialGradient(x, floatY, 0, x, floatY, 25);
  grad.addColorStop(0, POWERUP_COLORS[type] + '40');
  grad.addColorStop(1, POWERUP_COLORS[type] + '00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, floatY, 25, 0, Math.PI * 2);
  ctx.fill();
  
  // Icon background
  ctx.fillStyle = POWERUP_COLORS[type];
  ctx.beginPath();
  ctx.arc(x, floatY, 18, 0, Math.PI * 2);
  ctx.fill();
  
  // Icon
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(POWERUP_ICONS[type], x, floatY);
  
  // Sparkle particles
  for (let i = 0; i < 3; i++) {
    const angle = (time * 2 + i * (Math.PI * 2 / 3));
    const sparkleX = x + Math.cos(angle) * 28;
    const sparkleY = floatY + Math.sin(angle) * 28;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawChaosWarning(ctx: CanvasRenderingContext2D, section: OrchestraSection, time: number) {
  const bounds = SECTION_BOUNDS[section];
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  
  ctx.save();
  
  // Pulsing warning indicator
  const pulse = Math.sin(time * 8) * 0.3 + 0.7;
  
  // Warning circle
  ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, 40 + pulse * 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Warning icon
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 10;
  ctx.fillText('⚠️', cx, cy - 50);
  ctx.shadowBlur = 0;
  
  ctx.restore();
}

function spawnScorePopup(x: number, y: number, text: string, color: string) {
  scorePopups.push({ x, y, text, color, life: 1 });
}

function spawnCelebration(cx: number, cy: number) {
  const colors = ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#fff'];
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 4;
    celebrationParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 4,
      life: 1,
    });
  }
}

// Track last known fix states to detect transitions
const lastSectionVisuals: Record<string, string> = {
  strings: 'normal', woodwinds: 'normal', brass: 'normal', percussion: 'normal',
};

// Combo splash system
interface SplashText {
  text: string;
  life: number;
  color: string;
}
let activeSplash: SplashText | null = null;
let lastCombo = 0;

// Draw a single musician silhouette
function drawMusician(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  state: SectionVisual,
  chaosType: import('./store').ChaosType | null,
  sectionType: OrchestraSection,
  time: number,
  index: number
) {
  ctx.save();

  // Animate based on state
  let offsetX = 0;
  let offsetY = 0;
  let bodyTilt = 0;
  const phase = time * 2 + index * 0.7;

  if (state === 'normal' || state === 'fixed') {
    // Gentle sway with body lean
    offsetX = Math.sin(phase) * 2;
    offsetY = Math.cos(phase * 0.5) * 1;
    bodyTilt = Math.sin(phase) * 0.04;
  } else if (state === 'chaotic') {
    if (chaosType === 'sleepy') {
       // Slow nodding off
       offsetX = Math.sin(phase * 0.5) * 5;
       offsetY = Math.abs(Math.cos(phase * 0.25)) * 10;
       bodyTilt = Math.sin(phase * 0.5) * 0.1;
    } else if (chaosType === 'hyperactive') {
       // Violent shaking
       offsetX = Math.sin(phase * 20) * 8;
       offsetY = Math.cos(phase * 25) * 8;
       bodyTilt = Math.sin(phase * 22) * 0.3;
    } else if (chaosType === 'out_of_sync') {
       // Delayed, jerky movements
       const delayed = Math.floor(phase * 2) / 2;
       offsetX = Math.sin(delayed) * 7;
       offsetY = Math.cos(delayed * 1.3) * 5;
       bodyTilt = Math.sin(delayed) * 0.2;
    } else if (chaosType === 'stage_fright') {
       // Trembling in place
       offsetX = (Math.random() - 0.5) * 4;
       offsetY = (Math.random() - 0.5) * 3;
       bodyTilt = (Math.random() - 0.5) * 0.1;
    } else {
       // Erratic bounce with wild tilting
       offsetX = Math.sin(phase * 5) * 6;
       offsetY = Math.cos(phase * 7) * 4;
       bodyTilt = Math.sin(phase * 6) * 0.15;
    }
  } else if (state === 'fixing') {
    // Calming sway, settling down
    offsetX = Math.sin(phase * 1.5) * 3;
    offsetY = Math.cos(phase) * 2;
    bodyTilt = Math.sin(phase * 1.5) * 0.06;
  }

  ctx.translate(x + offsetX, y + offsetY);
  ctx.rotate(bodyTilt);

  // Tuxedo Body
  ctx.fillStyle = '#111'; // Black suit
  ctx.beginPath();
  // A rounder shoulder shape trailing down
  ctx.moveTo(-15, 0);
  ctx.quadraticCurveTo(0, -15, 15, 0);
  ctx.lineTo(12, 20);
  ctx.lineTo(-12, 20);
  ctx.closePath();
  ctx.fill();

  // White shirt triangle
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(-5, -5);
  ctx.lineTo(5, -5);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fill();
  
  // Bowtie (colored by state)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-4, -4); ctx.lineTo(-4, 0); ctx.lineTo(4, -4); ctx.lineTo(4, 0); ctx.fill();

  // Instrument Based on Section
  ctx.save();
  if (sectionType === 'strings') {
    // Violin - held horizontally / angled up
    ctx.translate(5, -2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = '#8b4513'; // brown
    ctx.fillRect(-2, -10, 8, 20); // body
    ctx.fillRect(0, -18, 4, 8); // neck
    // Bow
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10, -5 + Math.sin(phase*4)*5); ctx.lineTo(15, -5 + Math.sin(phase*4)*5); ctx.stroke();
  } else if (sectionType === 'woodwinds') {
    // Clarinet/Flute - pointing down and away
    ctx.translate(0, -3);
    ctx.rotate(Math.PI / 8);
    ctx.fillStyle = '#222';
    ctx.fillRect(-2, -5, 4, 25);
    // Silver keys
    ctx.fillStyle = '#ccc';
    ctx.fillRect(-3, 0, 6, 2);
    ctx.fillRect(-3, 8, 6, 2);
  } else if (sectionType === 'brass') {
    // Trumpet - horizontal, golden
    ctx.translate(-5, -8);
    ctx.fillStyle = '#fbbf24'; // gold
    ctx.fillRect(-15, 0, 20, 6); // tube
    ctx.beginPath(); // bell
    ctx.moveTo(-15, 0); ctx.lineTo(-22, -4); ctx.lineTo(-22, 10); ctx.lineTo(-15, 6); ctx.fill();
  } else if (sectionType === 'percussion') {
    // Timpani drum in front
    ctx.translate(0, 12);
    ctx.fillStyle = '#d97706'; // copper kettle
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#fef3c7'; // drum head
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2); ctx.fill();
    
    // Drumsticks floating above based on state
    ctx.fillStyle = '#e5e7eb';
    const hitY = state === 'chaotic' ? Math.abs(Math.sin(phase*10))*10 : Math.abs(Math.sin(phase*2))*5;
    ctx.fillRect(-8, -10 - hitY, 2, 12);
    ctx.fillRect(6, -10 - hitY, 2, 12);
  }
  ctx.restore();

  // Head
  ctx.fillStyle = '#fcd34d'; // generic skin tone
  ctx.beginPath();
  ctx.arc(0, -18, 8, 0, Math.PI * 2);
  ctx.fill();

  // Face details
  ctx.fillStyle = '#111';
  if (index % 2 === 0) {
    // Cool sunglasses
    ctx.fillRect(-7, -22, 14, 4);
  } else {
    // Normal eyes
    ctx.beginPath();
    ctx.arc(-3, -20, 1.5, 0, Math.PI * 2);
    ctx.arc(3, -20, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  if (state === 'chaotic') {
    // Screaming/panic mouth
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(0, -14, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (sectionType === 'woodwinds' || sectionType === 'brass') {
    // Blowing mouth for wind instruments
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, -15, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === 'fixed') {
    // Smile
    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.arc(0, -15, 3, 0, Math.PI, false);
    ctx.stroke();
  }

  // Hair style generated by index
  ctx.fillStyle = ['#4b5563', '#9ca3af', '#78350f', '#000'][index % 4];
  ctx.beginPath();
  if (index % 3 === 0) {
    // Comb over
    ctx.arc(0, -18, 8.5, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (index % 3 === 1) {
    // Big afro
    ctx.arc(0, -20, 12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Bald top, hair on sides
    ctx.arc(-8, -18, 3, 0, Math.PI * 2);
    ctx.arc(8, -18, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Music note floating up when playing correctly
  if (state === 'normal' || state === 'fixed') {
    const noteY = -35 - ((time * 20 + index * 40) % 20);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px serif';
    ctx.fillText('♪', -3, noteY);
  }

  // Exclamation or Zzz when chaotic
  if (state === 'chaotic') {
    ctx.textAlign = 'center';
    if (chaosType === 'sleepy') {
       ctx.fillStyle = '#60a5fa'; // very sleepy Zzz
       ctx.font = 'bold 16px sans-serif';
       const zzzY = -35 - ((time * 10 + index * 40) % 20);
       ctx.fillText('Zzz', 0, zzzY);
    } else if (chaosType === 'hyperactive') {
       ctx.fillStyle = '#f59e0b';
       ctx.font = 'bold 20px sans-serif';
       ctx.fillText('⚡', 0, -35);
    } else if (chaosType === 'out_of_sync') {
       ctx.fillStyle = '#a78bfa';
       ctx.font = 'bold 18px sans-serif';
       ctx.fillText('🔀', 0, -35);
    } else if (chaosType === 'stage_fright') {
       ctx.fillStyle = '#fbbf24';
       ctx.font = 'bold 18px sans-serif';
       ctx.fillText('😰', 0, -35);
    } else {
       ctx.fillStyle = '#ef4444';
       ctx.font = 'bold 16px sans-serif';
       ctx.fillText('!', 0, -35);
       // Sweat drops
       const sweatY = -28 + ((time * 30 + index * 17) % 15);
       ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
       ctx.beginPath();
       ctx.arc(10, sweatY, 2, 0, Math.PI * 2);
       ctx.fill();
       ctx.beginPath();
       ctx.moveTo(10, sweatY + 2);
       ctx.lineTo(10, sweatY + 5);
       ctx.lineTo(9, sweatY + 3);
       ctx.fill();
    }
  }

  // Thumbs up flash when fixed + green aura
  if (state === 'fixed') {
    // Green aura glow behind musician
    ctx.save();
    const auraGrad = ctx.createRadialGradient(0, -5, 5, 0, -5, 30);
    auraGrad.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
    auraGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -5, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👍', 0, -38);
  }

  ctx.restore();
}

// Draw audience row
function drawAudience(
  ctx: CanvasRenderingContext2D,
  w: number,
  time: number,
  reaction: string
) {
  const y = 460;
  const count = 16;
  const spacing = w / (count + 1);

  for (let i = 0; i < count; i++) {
    const x = spacing * (i + 1);
    const phase = time * 1.5 + i * 0.4;

    ctx.save();
    ctx.translate(x, y);

    // Random hat/no hat
    const hasHat = i % 3 === 0;

    // Bounce based on reaction
    let bounce = 0;
    if (reaction === 'applause') {
      bounce = Math.abs(Math.sin(phase * 4)) * 5;
    } else if (reaction === 'laugh') {
      bounce = Math.sin(phase * 6) * 3;
    } else if (reaction === 'gasp') {
      bounce = -3;
    }

    ctx.translate(0, -bounce);

    // Body
    ctx.fillStyle = `hsl(${(i * 37) % 360}, 30%, 35%)`;
    ctx.beginPath();
    ctx.ellipse(0, 10, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Applauding hands
    if (reaction === 'applause') {
      ctx.fillStyle = `hsl(${(i * 37) % 360}, 20%, 65%)`; // skin tone matches head roughly
      const clapOffset = Math.sin(time * 15 + i) * 4; // fast clapping
      ctx.beginPath(); ctx.arc(-5 + clapOffset, 5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5 - clapOffset, 5, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Head
    ctx.fillStyle = `hsl(${(i * 37) % 360}, 20%, 65%)`;
    ctx.beginPath();
    ctx.arc(0, -10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    if (hasHat) {
      ctx.fillStyle = `hsl(${(i * 73) % 360}, 40%, 30%)`;
      ctx.fillRect(-9, -18, 18, 5); // rim
      ctx.fillRect(-6, -26, 12, 8); // top
    }

    // Reaction emoji/effects
    if (reaction === 'gasp') {
      ctx.font = '14px sans-serif';
      ctx.fillText('😱', -7, -25);
    } else if (reaction === 'applause') {
      ctx.font = '12px sans-serif';
      // floating stars or claps
      if (Math.sin(time * 5 + i) > 0) {
         ctx.fillText('✨', Math.sin(time * 3 + i) * 10 - 5, -25 - (time * 20 % 10));
      }
      // Phone flashlights swaying
      if (i % 4 === 0) {
        ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + Math.sin(time * 2 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(Math.sin(time + i) * 5, -30, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (reaction === 'laugh') {
      ctx.font = '14px sans-serif';
      ctx.fillText('😂', -7, -25);
    } else {
      // Idle: gentle wave effect
      const wavePhase = time * 1.2 - i * 0.3;
      const waveUp = Math.max(0, Math.sin(wavePhase)) * 3;
      if (waveUp > 1) {
        ctx.translate(0, -waveUp);
      }
    }

    ctx.restore();
  }
}

// Concert hall background with dynamic lighting
function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, sections: Record<OrchestraSection, { visual: string }>) {
  // Gradient wall
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
  wallGrad.addColorStop(0, '#1a0a2e');
  wallGrad.addColorStop(0.5, '#16213e');
  wallGrad.addColorStop(1, '#0f3460');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, w, h);

  // Stage floor wood planks
  const floorGrad = ctx.createLinearGradient(0, 420, 0, h);
  floorGrad.addColorStop(0, '#3e2723');
  floorGrad.addColorStop(1, '#1a0a00');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 420, w, h - 420);
  
  // Wood grain lines
  ctx.strokeStyle = '#2d1b11';
  ctx.lineWidth = 2;
  for (let i = 10; i < w; i += 30) {
    ctx.beginPath();
    ctx.moveTo(i, 420);
    ctx.lineTo(i + (i - w/2) * 0.2, h);
    ctx.stroke();
  }

  // Stage edge with golden trim
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.lineTo(w, 420);
  ctx.stroke();
  // Secondary trim line
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 423);
  ctx.lineTo(w, 423);
  ctx.stroke();

  // Curtains with velvet folds
  drawCurtain(ctx, 0, 0, 38, 450, '#8b0000');
  drawCurtain(ctx, w - 38, 0, 38, 450, '#8b0000');

  // Top valance with scallops
  ctx.fillStyle = '#8b0000';
  ctx.fillRect(0, 0, w, 20);
  // Gold trim along valance bottom
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 19);
  ctx.lineTo(w, 19);
  ctx.stroke();
  // Valance scallops
  for (let i = 0; i < w; i += 40) {
    ctx.beginPath();
    ctx.arc(i + 20, 20, 20, 0, Math.PI);
    ctx.fillStyle = '#700000';
    ctx.fill();
  }

  // Dynamic stage lights — color shifts based on chaos
  const chaoticCount = Object.values(sections).filter(s => s.visual === 'chaotic').length;
  for (let i = 0; i < 5; i++) {
    const lx = 80 + i * 170;
    const ly = 15;
    
    // Light housing
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(lx, ly - 2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    const lightGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 140);
    if (chaoticCount >= 3) {
      // Full red danger lights
      lightGrad.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
      lightGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else if (chaoticCount >= 1) {
      // Amber warning lights
      lightGrad.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
      lightGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else {
      // Normal warm lights
      lightGrad.addColorStop(0, 'rgba(255, 220, 100, 0.15)');
      lightGrad.addColorStop(1, 'rgba(255, 220, 100, 0)');
    }
    ctx.fillStyle = lightGrad;
    ctx.fillRect(lx - 130, ly, 260, 220);
  }

  // Music stands between sections
  drawMusicStand(ctx, 250, 360);
  drawMusicStand(ctx, 550, 360);
  drawMusicStand(ctx, 400, 245);
}

function drawCurtain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  // Base curtain fill
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);

  // Velvet folds (curved highlight/shadow stripes)
  for (let i = 0; i < 5; i++) {
    const fx = x + (w / 5) * i + w / 10;
    // Highlight
    const hlGrad = ctx.createLinearGradient(fx - 3, 0, fx + 3, 0);
    hlGrad.addColorStop(0, 'rgba(255,255,255,0)');
    hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlGrad;
    ctx.fillRect(fx - 4, y, 8, h);
    // Shadow
    const shGrad = ctx.createLinearGradient(fx + 2, 0, fx + 8, 0);
    shGrad.addColorStop(0, 'rgba(0,0,0,0)');
    shGrad.addColorStop(0.5, 'rgba(0,0,0,0.2)');
    shGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shGrad;
    ctx.fillRect(fx + 1, y, 8, h);
  }

  // Gold fringe at bottom
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  for (let i = 0; i < w; i += 6) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h - 5);
    ctx.lineTo(x + i, y + h + 3);
    ctx.stroke();
  }
}

function drawMusicStand(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Pole
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 45);
  ctx.stroke();
  // Base feet
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 45);
  ctx.lineTo(x + 8, y + 45);
  ctx.stroke();
  // Sheet holder (angled rectangle)
  ctx.fillStyle = '#333';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.15);
  ctx.fillRect(-12, -18, 24, 20);
  // Sheet of music
  ctx.fillStyle = '#f5f5dc';
  ctx.fillRect(-10, -16, 20, 16);
  // Music lines
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.5;
  for (let l = 0; l < 4; l++) {
    ctx.beginPath();
    ctx.moveTo(-8, -14 + l * 4);
    ctx.lineTo(8, -14 + l * 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMaestro(
  ctx: CanvasRenderingContext2D,
  batonX: number,
  batonY: number,
  time: number
) {
  const mx = 400; // Center screen horizontally
  const my = 540; // Just below the bottom edge of the canvas

  ctx.save();
  // Body (Tuxedo jacket with tails)
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(mx - 40, my);
  ctx.lineTo(mx - 30, my - 100);
  ctx.lineTo(mx + 30, my - 100);
  ctx.lineTo(mx + 40, my);
  ctx.fill();

  // Shirt collar (white V-shape)
  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(mx - 15, my - 100);
  ctx.lineTo(mx, my - 80);
  ctx.lineTo(mx + 15, my - 100);
  ctx.fill();

  // Head (Back of head, grey hair)
  ctx.fillStyle = '#d1d5db';
  ctx.beginPath();
  ctx.arc(mx, my - 120, 25, 0, Math.PI * 2);
  ctx.fill();
  // Ear
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.ellipse(mx + 24, my - 115, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders
  const leftShoulder = { x: mx - 30, y: my - 90 };
  const rightShoulder = { x: mx + 30, y: my - 90 };

  // Hand position math
  const dx = batonX - rightShoulder.x;
  const dy = batonY - rightShoulder.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const safeDist = Math.max(dist, 1); // prevent NaN

  // Right Arm (Holding Baton to the cursor)
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(rightShoulder.x, rightShoulder.y);

  // Hand endpoint (20px back from baton tip)
  const hx = batonX - (dx/safeDist)*20;
  const hy = batonY - (dy/safeDist)*20;

  // Elbow bends more when cursor is close
  if (dist < 200) {
    const rightElbow = {
      x: rightShoulder.x + dx/3 + 25,
      y: rightShoulder.y + dy/3 + 30
    };
    ctx.quadraticCurveTo(rightElbow.x, rightElbow.y, hx, hy);
  } else {
    ctx.lineTo(hx, hy);
  }
  ctx.stroke();

  // Right Hand
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(hx, hy, 8, 0, Math.PI * 2);
  ctx.fill();

  // ---- BATON STICK ----
  // The actual baton extends from hand to cursor tip
  ctx.strokeStyle = '#f5f5dc';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(batonX, batonY);
  ctx.stroke();
  // Baton handle (small grip)
  ctx.fillStyle = '#854d0e';
  ctx.beginPath();
  ctx.arc(hx + (batonX - hx) * 0.15, hy + (batonY - hy) * 0.15, 4, 0, Math.PI * 2);
  ctx.fill();

  // Left Arm (Dynamic gesturing)
  const leftPhase = time * 3;
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(leftShoulder.x, leftShoulder.y);
  const leftElbow = { x: leftShoulder.x - 30, y: leftShoulder.y + 40 + Math.sin(leftPhase)*10 };
  const leftHand = { x: leftElbow.x - 20 + Math.cos(leftPhase)*20, y: leftElbow.y - 40 + Math.sin(leftPhase)*20 };
  ctx.quadraticCurveTo(leftElbow.x, leftElbow.y, leftHand.x, leftHand.y);
  ctx.stroke();
  
  // Left Hand
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(leftHand.x, leftHand.y, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export const Stage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const animTimeRef = useRef(0);
  const lastPosRef = useRef({ x: 400, y: 300 });

  const phase = useGameStore((s) => s.phase);
  const concertTime = useGameStore((s) => s.concertTime);
  const harmonyMeter = useGameStore((s) => s.harmonyMeter);
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const hasUpgrade = useUpgradeStore((s) => s.hasUpgrade);
  const getTotalEffect = useUpgradeStore((s) => s.getTotalEffect);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = 800 / rect.width;
    const scaleY = 520 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const store = useGameStore.getState();

    // Calculate velocity based on movement distance
    const dx = x - lastPosRef.current.x;
    const dy = y - lastPosRef.current.y;
    const vel = Math.sqrt(dx * dx + dy * dy);

    store.setBatonPosition(x, y);
    // Smoothly accumulate velocity to handle high-frequency trackpad events
    store.setBatonVelocity((store.batonVelocity * 0.8) + vel);
    store.addBatonTrail(x, y);

    lastPosRef.current = { x, y };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const trailCanvas = trailCanvasRef.current;
    if (!canvas || !trailCanvas) return;

    const ctx = canvas.getContext('2d')!;
    const tctx = trailCanvas.getContext('2d')!;
    let frameId: number;

    const render = () => {
      animTimeRef.current += 0.016;
      const t = animTimeRef.current;
      const store = useGameStore.getState();

      // Screen shake offset
      const shakeX = store.screenShake > 0 ? (Math.random() - 0.5) * store.screenShake : 0;
      const shakeY = store.screenShake > 0 ? (Math.random() - 0.5) * store.screenShake : 0;

      ctx.save();
      ctx.translate(shakeX, shakeY);

      // Background
      drawBackground(ctx, 800, 520, store.sections);

      // Draw sections
      const sectionKeys: OrchestraSection[] = ['strings', 'woodwinds', 'brass', 'percussion'];
      for (const key of sectionKeys) {
        const bounds = SECTION_BOUNDS[key];
        const section = store.sections[key];
        const colors = SECTION_COLORS[key];

        ctx.save();

        // Section shake
        if (section.shakeAmount > 0) {
          ctx.translate(
            (Math.random() - 0.5) * section.shakeAmount,
            (Math.random() - 0.5) * section.shakeAmount
          );
        }

        // Section background glow
        if (section.visual === 'chaotic') {
          const pulse = Math.sin(t * 8) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(239, 68, 68, ${0.15 * pulse})`;
          ctx.beginPath();
          ctx.roundRect(bounds.x - 5, bounds.y - 5, bounds.w + 10, bounds.h + 10, 12);
          ctx.fill();

          // Danger spotlight from above
          const spotGrad = ctx.createRadialGradient(
            bounds.x + bounds.w / 2, bounds.y - 20, 0,
            bounds.x + bounds.w / 2, bounds.y + bounds.h / 2, bounds.h
          );
          spotGrad.addColorStop(0, `rgba(239, 68, 68, ${0.25 * pulse})`);
          spotGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = spotGrad;
          ctx.fillRect(bounds.x - 20, bounds.y - 30, bounds.w + 40, bounds.h + 60);
        } else if (section.visual === 'fixing') {
          const pulse = Math.sin(t * 3) * 0.2 + 0.5;
          ctx.fillStyle = `rgba(250, 204, 21, ${0.15 * pulse})`;
          ctx.beginPath();
          ctx.roundRect(bounds.x - 5, bounds.y - 5, bounds.w + 10, bounds.h + 10, 12);
          ctx.fill();

          // Fix progress bar background
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath();
          ctx.roundRect(bounds.x, bounds.y + bounds.h + 4, bounds.w, 8, 4);
          ctx.fill();
          // Fix progress bar fill with glow
          const barGrad = ctx.createLinearGradient(bounds.x, 0, bounds.x + bounds.w * section.fixProgress, 0);
          barGrad.addColorStop(0, '#facc15');
          barGrad.addColorStop(1, '#fde047');
          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(bounds.x, bounds.y + bounds.h + 4, bounds.w * section.fixProgress, 8, 4);
          ctx.fill();
          // Glow on leading edge
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 8;
          ctx.fillRect(bounds.x + bounds.w * section.fixProgress - 3, bounds.y + bounds.h + 3, 6, 10);
          ctx.shadowBlur = 0;

          // Fix sparkle particles
          for (let sp = 0; sp < 3; sp++) {
            const sparkleX = bounds.x + Math.random() * bounds.w;
            const sparkleY = bounds.y + Math.random() * bounds.h;
            const sparkleSize = Math.random() * 3 + 1;
            ctx.fillStyle = `rgba(250, 204, 21, ${Math.random() * 0.6 + 0.2})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (section.visual === 'fixed') {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
          ctx.beginPath();
          ctx.roundRect(bounds.x - 5, bounds.y - 5, bounds.w + 10, bounds.h + 10, 12);
          ctx.fill();
          // Green success shimmer
          const shimmer = Math.sin(t * 4) * 0.1 + 0.1;
          ctx.fillStyle = `rgba(34, 197, 94, ${shimmer})`;
          ctx.beginPath();
          ctx.roundRect(bounds.x - 5, bounds.y - 5, bounds.w + 10, bounds.h + 10, 12);
          ctx.fill();
        }

        // Section platform
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 8);
        ctx.fill();

        // Section border
        let borderColor = colors.normal;
        if (section.visual === 'chaotic') borderColor = '#ef4444';
        else if (section.visual === 'fixing') borderColor = '#facc15';
        else if (section.visual === 'fixed') borderColor = '#22c55e';

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.w, bounds.h, 8);
        ctx.stroke();

        // Draw chairs for musicians
        for (let i = 0; i < 3; i++) {
          const cx = bounds.x + bounds.w * ((i + 1) / 4);
          const cy = bounds.y + bounds.h / 2 + 15;
          ctx.fillStyle = '#3a2a1a';
          // Seat
          ctx.fillRect(cx - 8, cy, 16, 4);
          // Legs
          ctx.fillRect(cx - 7, cy + 4, 2, 8);
          ctx.fillRect(cx + 5, cy + 4, 2, 8);
          // Backrest
          ctx.fillRect(cx - 8, cy - 12, 2, 12);
          ctx.fillRect(cx + 6, cy - 12, 2, 12);
          ctx.fillRect(cx - 8, cy - 12, 16, 2);
        }

        // Draw musicians (3 per section)
        const musicianColor =
          section.visual === 'chaotic'
            ? '#ef4444'
            : section.visual === 'fixing'
              ? '#facc15'
              : section.visual === 'fixed'
                ? '#22c55e'
                : colors.normal;

        for (let i = 0; i < 3; i++) {
          const mx = bounds.x + bounds.w * ((i + 1) / 4);
          const my = bounds.y + bounds.h / 2;
          drawMusician(ctx, mx, my, musicianColor, section.visual, section.activeChaosType, key, t, i);
        }

        // Section label pill
        const labelText = chaosEngine.currentLevelDef?.bandNames[key] || SECTION_LABELS[key];
        ctx.font = '11px "Inter", system-ui, sans-serif';
        const labelWidth = ctx.measureText(labelText).width + 16;
        const labelX = bounds.x + bounds.w / 2 - labelWidth / 2;
        const labelY = bounds.y + bounds.h - 22;
        
        // Pill background
        ctx.fillStyle = section.visual === 'chaotic' ? 'rgba(239, 68, 68, 0.3)' 
          : section.visual === 'fixing' ? 'rgba(250, 204, 21, 0.3)'
          : section.visual === 'fixed' ? 'rgba(34, 197, 94, 0.3)'
          : 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, labelWidth, 16, 8);
        ctx.fill();
        // Text
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, bounds.x + bounds.w / 2, labelY + 12);

        ctx.restore();
      }

      // Detect fix transitions for celebrations & score popups
      for (const key of sectionKeys) {
        const visual = store.sections[key].visual;
        const prev = lastSectionVisuals[key];
        if (prev !== 'fixed' && visual === 'fixed') {
          const bounds = SECTION_BOUNDS[key];
          spawnCelebration(bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
          const scoreGained = 200 * store.combo;
          spawnScorePopup(bounds.x + bounds.w / 2, bounds.y - 10, `+${scoreGained}`, '#22c55e');
          if (store.combo > 1) {
            spawnScorePopup(bounds.x + bounds.w / 2, bounds.y - 30, `x${store.combo} COMBO!`, '#fbbf24');
          }
        }
        lastSectionVisuals[key] = visual;
      }

      // Audience
      drawAudience(ctx, 800, t, store.audienceReaction);

      // Whiplash-style quotes during intense moments
      if (store.combo >= 10 && Math.random() < 0.02) {
        const quotes = ["Don't stop!", "More!", "Faster!", "Harder!", "Again!", "Again!"];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        ctx.save();
        ctx.translate(400, 200);
        const scale = 1 + Math.sin(t * 5) * 0.2;
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.8;
        ctx.font = '900 48px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
        ctx.fillText(quote, 0, 0);
        ctx.restore();
      }

      // Chaos warnings (Perfect Pitch upgrade)
      for (const warning of store.chaosWarnings) {
        if (store.concertTime >= warning.time - 2 && store.concertTime < warning.time) {
          drawChaosWarning(ctx, warning.section, t);
        }
      }

      // Power-ups
      for (const powerUp of store.powerUps) {
        drawPowerUp(ctx, powerUp.x, powerUp.y, powerUp.type, t, powerUp.collected);
      }

      // Vignette edge darkening
      const vigGrad = ctx.createRadialGradient(400, 260, 200, 400, 260, 500);
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, 800, 520);

      // Render floating score popups
      for (let i = scorePopups.length - 1; i >= 0; i--) {
        const p = scorePopups[i];
        p.life -= 0.015;
        p.y -= 1;
        if (p.life <= 0) {
          scorePopups.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.font = 'bold 16px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      }

      // Render celebration particles
      for (let i = celebrationParticles.length - 1; i >= 0; i--) {
        const p = celebrationParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life -= 0.02;
        if (p.life <= 0) {
          celebrationParticles.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Combo milestone tracking & splash text
      if (store.combo < lastCombo && lastCombo >= 3) {
        // Combo broken!
        activeSplash = { text: 'COMBO LOST!', life: 1, color: '#ef4444' };
      } else if (store.combo > lastCombo && store.combo >= 5 && store.combo % 5 === 0) {
        // Combo milestone!
        const milestoneTexts: Record<number, string> = {
          5: '🔥 5 COMBO!',
          10: '⚡ 10 COMBO!',
          15: '💫 UNSTOPPABLE!',
          20: '🌟 LEGENDARY!',
        };
        activeSplash = {
          text: milestoneTexts[store.combo] || `🎯 ${store.combo} COMBO!`,
          life: 1,
          color: store.combo >= 15 ? '#f472b6' : store.combo >= 10 ? '#c084fc' : '#fbbf24',
        };
      }
      lastCombo = store.combo;

      // Render active splash text
      if (activeSplash) {
        activeSplash.life -= 0.012;
        if (activeSplash.life <= 0) {
          activeSplash = null;
        } else {
          ctx.save();
          ctx.translate(400, 250);
          const scale = 1 + activeSplash.life * 0.6;
          ctx.scale(scale, scale);
          ctx.globalAlpha = Math.min(1, activeSplash.life * 2);
          ctx.font = '900 40px "Inter", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = activeSplash.color;
          ctx.shadowColor = activeSplash.color;
          ctx.shadowBlur = 25;
          ctx.fillText(activeSplash.text, 0, 0);
          // Outline for readability
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 2;
          ctx.strokeText(activeSplash.text, 0, 0);
          ctx.restore();
        }
      }
      // Tutorial overlay (first 6 seconds)
      if (store.concertTime < 6) {
        const tutAlpha = store.concertTime < 4 ? 0.85 : Math.max(0, 0.85 - (store.concertTime - 4) * 0.425);
        ctx.save();
        ctx.globalAlpha = tutAlpha;
        
        // Semi-transparent backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(200, 180, 400, 160);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(200, 180, 400, 160, 16);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '900 22px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎼 Move your baton!', 400, 215);
        
        ctx.font = '500 14px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#c4b5fd';
        ctx.fillText('Wave over RED sections to fix the chaos', 400, 250);
        ctx.fillText('Move ON THE BEAT for 2x speed ⚡', 400, 275);
        ctx.fillText('Don\'t let chaos spread!', 400, 300);
        
        // Animated arrow pointing at a section
        const arrowBounce = Math.sin(t * 4) * 5;
        ctx.fillStyle = '#fbbf24';
        ctx.font = '24px sans-serif';
        ctx.fillText('👆', 400, 320 + arrowBounce);
        
        ctx.restore();
      }

      ctx.restore();

      // --- BATON TRAIL on separate canvas ---
      tctx.clearRect(0, 0, 800, 520);

      const trail = store.batonTrail;
      if (trail.length > 2) {
        // Velocity-based gradient ribbon trail
        for (let i = 1; i < trail.length; i++) {
          const alpha = (i / trail.length) * 0.7;
          const width = 1 + (i / trail.length) * 5;

          // Color shifts with velocity: white -> gold -> orange when fast
          const velocityHue = Math.min(1, store.batonVelocity / 20);
          const r = 255;
          const g = Math.round(255 - velocityHue * 60);
          const b = Math.round(255 - velocityHue * 200);

          tctx.beginPath();
          tctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          tctx.lineTo(trail[i].x, trail[i].y);
          tctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          tctx.lineWidth = width;
          tctx.lineCap = 'round';
          tctx.stroke();
        }
        
        // Add sparkles for fast movements
        if (store.batonVelocity > 15) {
          const lastTrail = trail[trail.length - 1];
          if (Math.random() < 0.3) {
            tctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8})`;
            tctx.beginPath();
            tctx.arc(lastTrail.x + (Math.random() - 0.5) * 10, lastTrail.y + (Math.random() - 0.5) * 10, Math.random() * 3, 0, Math.PI * 2);
            tctx.fill();
          }
        }
      }

      // Baton tip
      const bp = store.batonPosition;
      
      // Beat flash: pulse the baton precisely on the audio beat
      const beatPhase = audioMixer.getBeatPhase();
      const onBeatNow = beatPhase < 0.25;
      const beatStrength = onBeatNow ? 1 - beatPhase / 0.25 : 0; // 1 at beat start, fades to 0
      const batonRadius = 5 + beatStrength * 3;
      const batonGlow = 12 + beatStrength * 14;
      
      tctx.beginPath();
      tctx.arc(bp.x, bp.y, batonRadius, 0, Math.PI * 2);
      const tipR = Math.round(255);
      const tipG = Math.round(255 - beatStrength * 189); // white -> gold on beat
      const tipB = Math.round(255 - beatStrength * 219);
      tctx.fillStyle = `rgb(${tipR},${tipG},${tipB})`;
      tctx.shadowColor = beatStrength > 0 ? '#fbbf24' : '#ffffff';
      tctx.shadowBlur = batonGlow;
      tctx.fill();
      tctx.shadowBlur = 0;

      // Velocity ring
      if (store.batonVelocity > 5) {
        tctx.beginPath();
        tctx.arc(bp.x, bp.y, 8 + store.batonVelocity * 0.3, 0, Math.PI * 2);
        tctx.strokeStyle = `rgba(255,255,255,${Math.min(0.5, store.batonVelocity * 0.02)})`;
        tctx.lineWidth = 2;
        tctx.stroke();
      }

      // On-beat ring burst effect
      if (beatStrength > 0.5 && store.batonVelocity > 3) {
        const ringSize = 12 + (1 - beatStrength) * 25;
        tctx.beginPath();
        tctx.arc(bp.x, bp.y, ringSize, 0, Math.PI * 2);
        tctx.strokeStyle = `rgba(251, 191, 36, ${beatStrength * 0.5})`;
        tctx.lineWidth = 2;
        tctx.stroke();
      }

      // Draw the Maestro conductor character reaching for the baton
      drawMaestro(tctx, bp.x, bp.y, t);

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={520}
        onPointerMove={handlePointerMove}
        style={{
          width: '100%',
          cursor: 'none',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), 0 8px 32px rgba(0,0,0,0.5)',
          touchAction: 'none',
          display: 'block',
        }}
      />
      <canvas
        ref={trailCanvasRef}
        width={800}
        height={520}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          pointerEvents: 'none',
          borderRadius: '12px',
        }}
      />
      {/* HUD Overlay */}
      {phase === 'playing' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
            gap: 8,
          }}
        >
          {/* Harmony meter */}
          <div
            style={{
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 10,
              padding: '8px 14px',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 3, letterSpacing: 1, fontWeight: 700 }}>HARMONY</div>
            <div
              style={{
                width: 130,
                height: 8,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: harmonyMeter > 60 ? '0 0 8px rgba(34, 197, 94, 0.3)' : harmonyMeter > 30 ? '0 0 8px rgba(245, 158, 11, 0.3)' : '0 0 8px rgba(239, 68, 68, 0.3)',
              }}
            >
              <div
                style={{
                  width: `${harmonyMeter}%`,
                  height: '100%',
                  background:
                    harmonyMeter > 60
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : harmonyMeter > 30
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                  borderRadius: 4,
                  transition: 'width 0.5s ease-out',
                }}
              />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: harmonyMeter > 60 ? '#4ade80' : harmonyMeter > 30 ? '#fbbf24' : '#f87171', marginTop: 2 }}>
              {Math.round(harmonyMeter)}%
            </div>
          </div>

          {/* Score */}
          <div
            style={{
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 10,
              padding: '8px 14px',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 1, fontWeight: 700 }}>SCORE</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>
              {Math.round(score).toLocaleString()}
            </div>
          </div>

          {/* Beat Indicator */}
          <div
            style={{
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 10,
              padding: '8px 14px',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 1, fontWeight: 700 }}>BEAT</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 3, justifyContent: 'center' }}>
              {[0, 1, 2, 3].map((i) => {
                const beatNum = Math.floor(audioMixer.getBeatPhase() * 4); // visually approx 4 sub-beats
                const isActive = beatNum === i;
                return (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: isActive ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                      boxShadow: isActive ? '0 0 8px rgba(251, 191, 36, 0.6)' : 'none',
                      transition: 'all 0.08s',
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Combo */}
          {combo > 0 && (
            <div
              style={{
                background: combo >= 5 ? 'rgba(251, 146, 60, 0.7)' : 'rgba(139,92,246,0.6)',
                borderRadius: 10,
                padding: '8px 14px',
                backdropFilter: 'blur(12px)',
                textAlign: 'center',
                border: combo >= 5 ? '1px solid rgba(251, 146, 60, 0.6)' : '1px solid rgba(139,92,246,0.3)',
                animation: 'pulse 0.5s ease-out',
                boxShadow: combo >= 5 ? '0 0 15px rgba(251,146,60,0.4)' : '0 0 10px rgba(139,92,246,0.3)',
              }}
            >
              <div style={{ fontSize: 9, color: combo >= 5 ? '#fed7aa' : '#c4b5fd', letterSpacing: 1, fontWeight: 700 }}>
                {combo >= 5 ? '🔥 COMBO' : 'COMBO'}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>x{combo}</div>
            </div>
          )}

          {/* Timer */}
          <div
            style={{
              background: 'rgba(0,0,0,0.7)',
              borderRadius: 10,
              padding: '8px 14px',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 1, fontWeight: 700 }}>REMAINING</div>
            <div style={{
              fontSize: 16,
              fontWeight: 900,
              color: (30 - concertTime) < 15 ? '#f87171' : '#f8fafc',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.max(0, Math.floor(30 - concertTime))}s
            </div>
          </div>
        </div>
      )}

      {/* Active Upgrades Indicator */}
      {phase === 'playing' && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap',
            maxWidth: 200,
            pointerEvents: 'none',
          }}
        >
          {hasUpgrade('swift_baton') && (
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Swift Baton: Faster fix speed"
            >
              <span>⚡</span>
              <span style={{ fontSize: 9 }}>x{getTotalEffect().fixSpeedMultiplier?.toFixed(1)}</span>
            </div>
          )}
          {hasUpgrade('chaos_shield') && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Chaos Shield: Reduced spread chance"
            >
              <span>🛡️</span>
            </div>
          )}
          {hasUpgrade('divine_intervention') && (
            <div
              style={{
                background: 'rgba(236, 72, 153, 0.2)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: '#f472b6',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Divine Intervention: Auto-fix chance"
            >
              <span>✨</span>
            </div>
          )}
          {hasUpgrade('combo_keeper') && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Combo Keeper: Bonus combo score"
            >
              <span>🔥</span>
              <span style={{ fontSize: 9 }}>x{getTotalEffect().comboScoreMultiplier?.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {/* Active Power-Up Indicator */}
      {phase === 'playing' && useGameStore((s) => s.activePowerUp) && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(135deg, ${POWERUP_COLORS[useGameStore.getState().activePowerUp!.type]}40, ${POWERUP_COLORS[useGameStore.getState().activePowerUp!.type]}20)`,
            border: `2px solid ${POWERUP_COLORS[useGameStore.getState().activePowerUp!.type]}`,
            borderRadius: 12,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(12px)',
            boxShadow: `0 0 20px ${POWERUP_COLORS[useGameStore.getState().activePowerUp!.type]}60`,
            animation: 'pulse 1s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 24 }}>{POWERUP_ICONS[useGameStore.getState().activePowerUp!.type]}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
              {useGameStore.getState().activePowerUp!.type} Active
            </div>
            <div style={{ fontSize: 10, color: '#e5e7eb' }}>
              {Math.ceil(useGameStore.getState().activePowerUp!.duration)}s remaining
            </div>
          </div>
        </div>
      )}

      {/* Time Dilation Effect */}
      {phase === 'playing' && useGameStore((s) => s.timeDilation) < 1 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.1), rgba(96, 165, 250, 0.3))',
            pointerEvents: 'none',
            animation: 'pulse 0.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 48,
              fontWeight: 900,
              color: '#60a5fa',
              textShadow: '0 0 20px rgba(96, 165, 250, 0.8)',
            }}
          >
            ⏰ SLOW MOTION
          </div>
        </div>
      )}
    </div>
  );
};
