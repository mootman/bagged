import { useMemo } from 'react';
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import type { Peak } from '@/lib/types';

/**
 * Stylized map of the 14ers: every peak as a triangle, bagged ones lit in the accent color.
 * Projection is equirectangular with longitude scaled by cos(latitude), which is fine at this size.
 */
export function PassportMap({
  peaks,
  summited,
  colors,
  width: requestedWidth = 340,
  maxHeight,
  showFrame = true,
}: {
  peaks: Peak[];
  summited: Set<string>;
  colors: { accent: string; unclimbed: string; text: string; background: string; border: string };
  width?: number;
  /** Shrinks the map to fit this height, keeping its shape. */
  maxHeight?: number;
  showFrame?: boolean;
}) {
  const layout = useMemo(() => {
    const lats = peaks.map((p) => p.lat);
    const lons = peaks.map((p) => p.lon);
    const pad = 0.18;
    const minLat = Math.min(...lats) - pad;
    const maxLat = Math.max(...lats) + pad;
    const minLon = Math.min(...lons) - pad;
    const maxLon = Math.max(...lons) + pad;
    const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const spanX = (maxLon - minLon) * kx;
    const spanY = maxLat - minLat;
    let width = requestedWidth;
    let height = Math.round((width * spanY) / spanX);
    if (maxHeight && height > maxHeight) {
      width = Math.round((maxHeight * spanX) / spanY);
      height = Math.round(maxHeight);
    }
    const project = (p: Peak) => ({
      x: (((p.lon - minLon) * kx) / spanX) * width,
      y: ((maxLat - p.lat) / spanY) * height,
    });
    return { width, height, project };
  }, [peaks, requestedWidth, maxHeight]);
  const { width } = layout;

  const s = width / 340;
  const tri = (x: number, y: number, r: number) => `${x},${y - r} ${x - r * 0.95},${y + r * 0.7} ${x + r * 0.95},${y + r * 0.7}`;

  // Draw unclimbed first so lit peaks sit on top.
  const ordered = [...peaks].sort((a, b) => Number(summited.has(a.id)) - Number(summited.has(b.id)));

  return (
    <Svg width={width} height={layout.height} viewBox={`0 0 ${width} ${layout.height}`}>
      {showFrame && (
        <Rect x={0.5} y={0.5} width={width - 1} height={layout.height - 1} rx={12} fill="none" stroke={colors.border} />
      )}
      {/* faint graticule for a map feel */}
      <G opacity={0.35}>
        {[0.25, 0.5, 0.75].map((f) => (
          <Line key={`h${f}`} x1={0} x2={width} y1={layout.height * f} y2={layout.height * f} stroke={colors.border} strokeDasharray="2 6" />
        ))}
        {[0.25, 0.5, 0.75].map((f) => (
          <Line key={`v${f}`} y1={0} y2={layout.height} x1={width * f} x2={width * f} stroke={colors.border} strokeDasharray="2 6" />
        ))}
      </G>
      {ordered.map((p) => {
        const { x, y } = layout.project(p);
        const lit = summited.has(p.id);
        return (
          <G key={p.id}>
            {lit && <Circle cx={x} cy={y} r={9 * s} fill={colors.accent} opacity={0.18} />}
            <Polygon points={tri(x, y, (lit ? 6.5 : 5) * s)} fill={lit ? colors.accent : colors.unclimbed} />
          </G>
        );
      })}
      {showFrame && (
        <SvgText x={width - 10} y={layout.height - 10} fontSize={10 * s} fill={colors.text} opacity={0.5} textAnchor="end">
          COLORADO 14ERS
        </SvgText>
      )}
    </Svg>
  );
}
