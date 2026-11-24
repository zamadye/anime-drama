import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ALL_HAND_SHAPES, type EmotionId, type ViewAngle, type VisemeId } from '../contracts';
import { buildNeutralArgaPose } from '../acting';
import {
  ARGA_CANONICAL_DIMENSIONS,
  ARGA_PALETTE,
  ArgaActor,
  ArgaHand,
} from '../art/arga';

const FULL_VIEWS: { view: ViewAngle; label: string; x: number }[] = [
  { view: 'front', label: 'FRONT', x: 250 },
  { view: 'three-quarter-right', label: '3/4 RIGHT', x: 528 },
  { view: 'three-quarter-left', label: '3/4 LEFT', x: 806 },
  { view: 'profile-right', label: 'PROFILE RIGHT', x: 1084 },
  { view: 'profile-left', label: 'PROFILE LEFT', x: 1362 },
  { view: 'back', label: 'BACK', x: 1640 },
];

const CLOSEUP_PANELS: {
  id: string;
  label: string;
  view: ViewAngle;
  emotion: EmotionId;
  viseme: VisemeId;
}[] = [
  { id: 'cu-neutral', label: 'NEUTRAL · 3/4 RIGHT', view: 'three-quarter-right', emotion: 'neutral', viseme: 'rest' },
  { id: 'cu-melancholy', label: 'MELANCHOLY · FRONT', view: 'front', emotion: 'melancholy', viseme: 'rest' },
  { id: 'cu-determined', label: 'DETERMINED · 3/4 LEFT', view: 'three-quarter-left', emotion: 'determined', viseme: 'closed-m' },
  { id: 'cu-profile', label: 'PROFILE · SPEAKING (e)', view: 'profile-right', emotion: 'guarded', viseme: 'narrow-e' },
];

const MATERIAL_SWATCHES: {
  label: string;
  base: string;
  shadow: string;
  highlight: string;
  ink: string;
}[] = [
  { label: 'SKIN', base: ARGA_PALETTE.skin.base, shadow: ARGA_PALETTE.skin.shadow, highlight: ARGA_PALETTE.skin.highlight, ink: ARGA_PALETTE.skin.ink },
  { label: 'HAIR', base: ARGA_PALETTE.hair.base, shadow: ARGA_PALETTE.hair.shadow, highlight: ARGA_PALETTE.hair.highlight, ink: ARGA_PALETTE.hair.ink },
  { label: 'COAT', base: ARGA_PALETTE.coat.base, shadow: ARGA_PALETTE.coat.shadow, highlight: ARGA_PALETTE.coat.highlight, ink: ARGA_PALETTE.coat.ink },
  { label: 'SHIRT', base: ARGA_PALETTE.shirt.base, shadow: ARGA_PALETTE.shirt.shadow, highlight: ARGA_PALETTE.shirt.highlight, ink: ARGA_PALETTE.shirt.ink },
  { label: 'TROUSERS', base: ARGA_PALETTE.trousers.base, shadow: ARGA_PALETTE.trousers.shadow, highlight: ARGA_PALETTE.trousers.highlight, ink: ARGA_PALETTE.trousers.ink },
  { label: 'BOOTS', base: ARGA_PALETTE.boots.base, shadow: ARGA_PALETTE.boots.shadow, highlight: ARGA_PALETTE.boots.highlight, ink: ARGA_PALETTE.boots.ink },
];

export const MODEL_SHEET_FPS = 24;
export const MODEL_SHEET_FRAMES = 24;

export const ArgaModelSheet: React.FC = () => {
  const sheetScale = 0.63;
  const floorY = 588;
  const topCrownY = floorY - ARGA_CANONICAL_DIMENSIONS.totalHeight * sheetScale;
  const headUnitPx = (floorY - topCrownY) / ARGA_CANONICAL_DIMENSIONS.scaleHeads;

  return (
    <AbsoluteFill style={{ backgroundColor: '#EAEEF4' }}>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {CLOSEUP_PANELS.map((panel, idx) => (
            <clipPath key={panel.id} id={`v3-sheet-clip-${panel.id}`}>
              <rect x={54 + idx * 260} y={698} width={242} height={295} rx={6} />
            </clipPath>
          ))}
        </defs>

        {/* Neutral studio background */}
        <rect x={0} y={0} width={1920} height={1080} fill="#EAEEF4" />

        {/* Editorial header */}
        <rect x={0} y={0} width={1920} height={58} fill="#182032" />
        <text
          x={40}
          y={27}
          fill="#F4F6FA"
          fontSize={19}
          fontWeight={700}
          fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
          letterSpacing={0.8}
        >
          ANIME DRAMA V3 · ARGA MODEL SHEET (MODERN SERIES B)
        </text>
        <text
          x={40}
          y={46}
          fill="#9DA9BF"
          fontSize={12.5}
          fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
        >
          Target 7.5 Heads · 6 Independent Views · 3-Value Cel Palette · 100% Authored SVG Vector
        </text>
        <rect
          x={1476}
          y={13}
          width={404}
          height={32}
          rx={6}
          fill="#352B1D"
          stroke="#D79B46"
          strokeWidth={1.2}
        />
        <text
          x={1678}
          y={33.5}
          textAnchor="middle"
          fill="#F7D89C"
          fontSize={12.5}
          fontWeight={700}
          fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
          letterSpacing={0.5}
        >
          M1 REVIEW CANDIDATE · NOT YET USER-ACCEPTED
        </text>

        {/* Top full-body turnaround strip */}
        <rect
          x={40}
          y={72}
          width={1840}
          height={560}
          rx={10}
          fill="#F5F7FA"
          stroke="#CFD6E2"
          strokeWidth={1.4}
        />

        {/* Horizontal 7.5-head proportion guide ticks */}
        {Array.from({ length: 8 }).map((_, i) => {
          const y = floorY - i * headUnitPx;
          return (
            <g key={i}>
              <line
                x1={108}
                y1={y}
                x2={1825}
                y2={y}
                stroke={i === 0 ? '#78849B' : '#DCE2EC'}
                strokeWidth={i === 0 ? 1.4 : 1}
                strokeDasharray={i === 0 ? undefined : '5 6'}
              />
              <text
                x={96}
                y={y + 4}
                textAnchor="end"
                fill="#6C778E"
                fontSize={11}
                fontWeight={600}
                fontFamily="monospace"
              >
                {i === 0 ? '0 FLOOR' : `${i}H`}
              </text>
            </g>
          );
        })}
        <line
          x1={108}
          y1={topCrownY}
          x2={1825}
          y2={topCrownY}
          stroke="#C8D1DF"
          strokeWidth={1}
          strokeDasharray="3 5"
        />
        <text
          x={96}
          y={topCrownY + 4}
          textAnchor="end"
          fill="#4A5670"
          fontSize={11}
          fontWeight={700}
          fontFamily="monospace"
        >
          7.5H
        </text>

        {/* Vertical axis centerlines and all 6 production views */}
        {FULL_VIEWS.map((item) => {
          const pose = buildNeutralArgaPose(
            `sheet-${item.view}`,
            item.view,
            item.x,
            floorY,
            sheetScale,
            { emotion: 'guarded' },
          );
          return (
            <g key={item.view}>
              <line
                x1={item.x}
                y1={96}
                x2={item.x}
                y2={floorY + 6}
                stroke="#E1E6EF"
                strokeWidth={1}
              />
              <ArgaActor {...pose} />
              <text
                x={item.x}
                y={615}
                textAnchor="middle"
                fill="#1D2638"
                fontSize={13.5}
                fontWeight={700}
                fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
                letterSpacing={0.7}
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Bottom-left: 4 Face & Expression Close-Ups */}
        <rect
          x={40}
          y={648}
          width={1074}
          height={402}
          rx={10}
          fill="#F5F7FA"
          stroke="#CFD6E2"
          strokeWidth={1.4}
        />
        <text
          x={60}
          y={678}
          fill="#1D2638"
          fontSize={14}
          fontWeight={700}
          fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
          letterSpacing={0.6}
        >
          FACE & EXPRESSION CLOSE-UPS (CONSTRUCTED FEATURES · VIEW-SPECIFIC ANATOMY)
        </text>
        {CLOSEUP_PANELS.map((panel, idx) => {
          const px = 54 + idx * 260;
          const centerStageX = px + 121;
          const actorY = 852 + 672 * 2.08;
          const pose = buildNeutralArgaPose(
            `sheet-${panel.id}`,
            panel.view,
            centerStageX,
            actorY,
            2.08,
            { emotion: panel.emotion, viseme: panel.viseme },
          );
          return (
            <g key={panel.id}>
              <rect
                x={px}
                y={698}
                width={242}
                height={295}
                rx={6}
                fill="#E8EDF4"
                stroke="#C5CEDB"
                strokeWidth={1.2}
              />
              <g clipPath={`url(#v3-sheet-clip-${panel.id})`}>
                <ArgaActor {...pose} renderFloorShadow={false} />
              </g>
              <text
                x={centerStageX}
                y={1024}
                textAnchor="middle"
                fill="#2B364D"
                fontSize={12}
                fontWeight={700}
                fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
              >
                {panel.label}
              </text>
            </g>
          );
        })}

        {/* Bottom-right: Hand Shapes + 3-Value Material Palette */}
        <rect
          x={1134}
          y={648}
          width={746}
          height={402}
          rx={10}
          fill="#F5F7FA"
          stroke="#CFD6E2"
          strokeWidth={1.4}
        />
        <text
          x={1156}
          y={678}
          fill="#1D2638"
          fontSize={14}
          fontWeight={700}
          fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
          letterSpacing={0.6}
        >
          HAND SHAPE LIBRARY (5 AUTHORED SHAPES) & 3-VALUE CEL PALETTE
        </text>

        {ALL_HAND_SHAPES.map((shape, idx) => {
          const hx = 1154 + idx * 142;
          return (
            <g key={shape}>
              <rect
                x={hx}
                y={696}
                width={132}
                height={158}
                rx={6}
                fill="#E8EDF4"
                stroke="#C5CEDB"
                strokeWidth={1.1}
              />
              <g transform={`translate(${hx + 66}, 720) scale(1.82)`}>
                <ArgaHand shape={shape} side="right" view="front" />
              </g>
              <text
                x={hx + 66}
                y={842}
                textAnchor="middle"
                fill="#253046"
                fontSize={11.5}
                fontWeight={700}
                fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
              >
                {shape.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Material swatch strip (3 cel values + ink) */}
        <text
          x={1156}
          y={886}
          fill="#4A556B"
          fontSize={11.5}
          fontWeight={700}
          fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
          letterSpacing={0.5}
        >
          MATERIAL TOKENS (BASE · CEL SHADOW · HIGHLIGHT · LOCAL INK)
        </text>
        {MATERIAL_SWATCHES.map((mat, idx) => {
          const mx = 1154 + idx * 119;
          return (
            <g key={mat.label}>
              <rect
                x={mx}
                y={898}
                width={110}
                height={130}
                rx={6}
                fill="#FFFFFF"
                stroke="#CFD6E2"
                strokeWidth={1.1}
              />
              <rect x={mx + 8} y={908} width={94} height={38} rx={4} fill={mat.base} stroke={mat.ink} strokeWidth={1.6} />
              <rect x={mx + 8} y={951} width={45} height={24} rx={3} fill={mat.shadow} stroke={mat.ink} strokeWidth={1.1} />
              <rect x={mx + 57} y={951} width={45} height={24} rx={3} fill={mat.highlight} stroke={mat.ink} strokeWidth={1.1} />
              <circle cx={mx + 20} cy={992} r={7} fill={mat.ink} />
              <text
                x={mx + 33}
                y={996}
                fill="#253046"
                fontSize={11}
                fontWeight={700}
                fontFamily="'Noto Sans', 'Segoe UI', sans-serif"
              >
                {mat.label}
              </text>
              <text
                x={mx + 55}
                y={1016}
                textAnchor="middle"
                fill="#6C778E"
                fontSize={9.5}
                fontFamily="monospace"
              >
                {mat.base}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
