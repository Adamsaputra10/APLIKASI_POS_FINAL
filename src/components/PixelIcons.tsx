import React from 'react';

interface PixelIconProps {
  className?: string;
  size?: number;
  color?: string;
}

// Authentic 90s Retro Pixel Art Icons using crisp SVG rect grids (16x16)

// 1. POS Cash Register Pixel Icon
export const PixelIconPOS: React.FC<PixelIconProps> = ({
  className = '',
  size = 20,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* CRT Monitor Frame */}
    <rect x="2" y="1" width="12" height="8" />
    {/* Screen Inner cutout */}
    <rect x="4" y="2" width="8" height="5" fill="#121324" />
    {/* Monitor Stand */}
    <rect x="6" y="9" width="4" height="1" />
    {/* Keypad Base */}
    <rect x="1" y="10" width="14" height="5" />
    {/* Cash Drawer Line */}
    <rect x="3" y="13" width="10" height="1" fill="#121324" />
    {/* Key dots */}
    <rect x="3" y="11" width="2" height="1" fill="#121324" />
    <rect x="7" y="11" width="2" height="1" fill="#121324" />
    <rect x="11" y="11" width="2" height="1" fill="#121324" />
  </svg>
);

// 2. Stock / Inventory Pixel Crate Icon
export const PixelIconStock: React.FC<PixelIconProps> = ({
  className = '',
  size = 20,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Outer Box */}
    <rect x="1" y="2" width="14" height="12" />
    {/* Box Inner Cutouts */}
    <rect x="2" y="3" width="12" height="10" fill="#121324" />
    {/* Cross / Tape Planks */}
    <rect x="7" y="3" width="2" height="10" />
    <rect x="2" y="7" width="12" height="2" />
    {/* Corner Reinforcements */}
    <rect x="1" y="2" width="3" height="3" />
    <rect x="12" y="2" width="3" height="3" />
    <rect x="1" y="11" width="3" height="3" />
    <rect x="12" y="11" width="3" height="3" />
  </svg>
);

// 3. Reports / Sales Bar Chart Pixel Icon
export const PixelIconReports: React.FC<PixelIconProps> = ({
  className = '',
  size = 20,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Axis lines */}
    <rect x="1" y="1" width="2" height="14" />
    <rect x="1" y="13" width="14" height="2" />
    {/* Bar 1 (Short) */}
    <rect x="4" y="9" width="3" height="4" />
    {/* Bar 2 (Medium) */}
    <rect x="8" y="6" width="3" height="7" />
    {/* Bar 3 (Tall) */}
    <rect x="12" y="2" width="3" height="11" />
  </svg>
);

// 4. Light / Dark Sun-Moon Pixel Icon
export const PixelIconTheme: React.FC<{ isLight: boolean } & PixelIconProps> = ({
  isLight,
  className = '',
  size = 18,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {isLight ? (
      // Sun Pixel Art
      <>
        <rect x="6" y="6" width="4" height="4" />
        <rect x="7" y="1" width="2" height="3" />
        <rect x="7" y="12" width="2" height="3" />
        <rect x="1" y="7" width="3" height="2" />
        <rect x="12" y="7" width="3" height="2" />
        <rect x="3" y="3" width="2" height="2" />
        <rect x="11" y="3" width="2" height="2" />
        <rect x="3" y="11" width="2" height="2" />
        <rect x="11" y="11" width="2" height="2" />
      </>
    ) : (
      // Moon Pixel Art
      <>
        <rect x="5" y="2" width="6" height="2" />
        <rect x="3" y="4" width="8" height="2" />
        <rect x="2" y="6" width="8" height="4" />
        <rect x="3" y="10" width="8" height="2" />
        <rect x="5" y="12" width="6" height="2" />
        {/* Crescent Cutout */}
        <rect x="7" y="4" width="4" height="8" fill="#121324" />
      </>
    )}
  </svg>
);

// 5. Globe / Web E-Commerce Pixel Icon
export const PixelIconWebOrders: React.FC<PixelIconProps> = ({
  className = '',
  size = 20,
  color = 'currentColor',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={color}
    className={className}
    style={{ shapeRendering: 'crispEdges' }}
  >
    {/* Globe circle outer */}
    <rect x="5" y="1" width="6" height="1" />
    <rect x="3" y="2" width="10" height="2" />
    <rect x="2" y="4" width="12" height="8" />
    <rect x="3" y="12" width="10" height="2" />
    <rect x="5" y="14" width="6" height="1" />
    {/* Globe Lines cutout */}
    <rect x="7" y="2" width="2" height="12" fill="#121324" />
    <rect x="3" y="7" width="10" height="2" fill="#121324" />
  </svg>
);

