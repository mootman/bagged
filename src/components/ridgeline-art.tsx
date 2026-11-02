import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { ridgelines } from '@/lib/ridgelines';

const c = Colors.dark;
const AnimatedG = Animated.createAnimatedComponent(G);
const LIT_STOPS: [string, string][] = [['0', '#0B1020'], ['0.32', '#2A1630'], ['0.5', '#14111C'], ['1', c.background]];
const DIM_STOPS: [string, string][] = [['0', '#0E151B'], ['1', c.background]];

function lerpColor(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The peak's real terrain as a ridgeline plot. Lit in alpenglow when you've climbed it,
 * quiet bone lines when you haven't. `reveal` draws the lines in from back to front.
 */
export const RidgelineArt = memo(function RidgelineArt({
  peakId,
  lit,
  width = 200,
  height = 300,
  count = 30,
  top,
  bottom,
  amplitude,
  reveal = false,
  sun = true,
}: {
  peakId: string;
  lit: boolean;
  width?: number;
  height?: number;
  count?: number;
  top?: number;
  bottom?: number;
  amplitude?: number;
  reveal?: boolean;
  sun?: boolean;
}) {
  const art = useMemo(
    () => ridgelines(peakId, { width, height, count, top, bottom, amplitude }),
    [peakId, width, height, count, top, bottom, amplitude],
  );
  const [progress] = useState(() => new Animated.Value(reveal ? 0 : 1));

  useEffect(() => {
    if (!reveal) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [reveal, peakId, progress]);

  if (!art) return null;
  const bgId = `bg-${peakId}-${lit ? 1 : 0}-${width}`;
  const sunId = `sun-${peakId}-${width}`;
  const sunY = art.summit.y - height * 0.05;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={bgId} x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
          {(lit ? LIT_STOPS : DIM_STOPS).map(([o, col]) => (
            <Stop key={o} offset={o} stopColor={col} />
          ))}
        </LinearGradient>
        <RadialGradient id={sunId} cx={art.summit.x} cy={sunY} r={width * 0.55} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={c.accent} stopOpacity={0.55} />
          <Stop offset="0.35" stopColor={c.glow} stopOpacity={0.18} />
          <Stop offset="1" stopColor={c.glow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill={`url(#${bgId})`} />
      {lit && sun && <Rect width={width} height={height} fill={`url(#${sunId})`} />}
      {art.lines.map((l, i) => {
        const stroke = lit ? lerpColor(c.glow, c.accent, l.t) : c.line;
        const opacity = lit ? 0.55 + 0.45 * l.t : 0.18 + 0.32 * l.t;
        const start = (i / art.lines.length) * 0.75;
        const o = reveal
          ? progress.interpolate({ inputRange: [start, Math.min(1, start + 0.25)], outputRange: [0, 1], extrapolate: 'clamp' })
          : 1;
        return (
          <AnimatedG key={i} opacity={o}>
            <Path d={l.fill} fill={`url(#${bgId})`} />
            <Path d={l.line} fill="none" stroke={stroke} strokeOpacity={opacity} strokeWidth={width > 300 ? 1.4 : 1} strokeLinejoin="round" />
          </AnimatedG>
        );
      })}
      {lit && (
        <G>
          <Circle cx={art.summit.x} cy={art.summit.y - 3} r={width > 300 ? 9 : 5} fill={c.accent} opacity={0.25} />
          <Circle cx={art.summit.x} cy={art.summit.y - 3} r={width > 300 ? 3.2 : 2} fill="#FFE3D3" />
        </G>
      )}
    </Svg>
  );
});
