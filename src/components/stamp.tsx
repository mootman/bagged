import Svg, { Circle, Defs, Path, Text as SvgText, TextPath } from 'react-native-svg';

import { Colors, Type } from '@/constants/theme';

const c = Colors.dark;

/** A summit-register stamp: peak name around the rim, date in the middle. */
export function Stamp({ name, elevationFt, date, size = 220, color = c.accent }: { name: string; elevationFt: number; date: string; size?: number; color?: string }) {
  const r = size / 2;
  const ring = r - size * 0.12;
  const id = `rim-${name.replace(/\W/g, '')}-${size}`;
  const rim = `${name}   ${elevationFt.toLocaleString()} ft   Colorado   `;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <Path id={id} d={`M ${r},${r} m -${ring},0 a ${ring},${ring} 0 1,1 ${ring * 2},0 a ${ring},${ring} 0 1,1 -${ring * 2},0`} />
      </Defs>
      <Circle cx={r} cy={r} r={r - 3} stroke={color} strokeWidth={3} fill={c.background} fillOpacity={0.9} strokeDasharray="38 2 60 3 24 2" />
      <Circle cx={r} cy={r} r={r - size * 0.2} stroke={color} strokeWidth={1.5} fill="none" />
      <SvgText fill={color} fontSize={size * 0.068} fontFamily={Type.bodyBold}>
        <TextPath href={`#${id}`} startOffset="0">
          {rim}
        </TextPath>
      </SvgText>
      <SvgText x={r} y={r - size * 0.07} fill={color} fontSize={size * 0.06} fontFamily={Type.bodyBold} textAnchor="middle">
        Signed
      </SvgText>
      <SvgText x={r} y={r + size * 0.06} fill={color} fontSize={size * 0.13} fontFamily={Type.display} textAnchor="middle">
        {date}
      </SvgText>
      {/* little summit glyph */}
      <Path
        d={`M ${r - size * 0.09} ${r + size * 0.17} L ${r - size * 0.02} ${r + size * 0.1} L ${r + size * 0.02} ${r + size * 0.14} L ${r + size * 0.05} ${r + size * 0.11} L ${r + size * 0.09} ${r + size * 0.17} Z`}
        fill={color}
      />
    </Svg>
  );
}
