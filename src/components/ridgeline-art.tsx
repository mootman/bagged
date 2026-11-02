import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { ridgelines } from '@/lib/ridgelines';

const c = Colors.dark;
const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The peak's real terrain as a ridgeline plot, drawn like ink on a topo sheet.
 * Climbed: ballpoint blue. Not yet: pencil. The summit gets the map's triangle.
 * `reveal` draws the lines in from back to front.
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
  paper = c.background,
  marker = true,
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
  /** Ground color behind the lines; each line is filled with it to hide the ones behind. */
  paper?: string;
  marker?: boolean;
  /** Kept for call-site compatibility; there is no glow any more. */
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
  const ink = lit ? c.accent : c.line;
  const thick = width > 300 ? 1.3 : width > 120 ? 1.05 : 0.9;
  const tri = width > 300 ? 7 : width > 120 ? 4.5 : 3;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect width={width} height={height} fill={paper} />
      {art.lines.map((l, i) => {
        const opacity = lit ? 0.45 + 0.55 * l.t : 0.35 + 0.4 * l.t;
        const start = (i / art.lines.length) * 0.75;
        const o = reveal ? progress.interpolate({ inputRange: [start, Math.min(1, start + 0.25)], outputRange: [0, 1], extrapolate: 'clamp' }) : 1;
        return (
          <AnimatedG key={i} opacity={o}>
            <Path d={l.fill} fill={paper} />
            <Path d={l.line} fill="none" stroke={ink} strokeOpacity={opacity} strokeWidth={thick} strokeLinejoin="round" />
          </AnimatedG>
        );
      })}
      {marker && (
        <Path
          d={`M${art.summit.x} ${art.summit.y - tri * 1.9} l${tri} ${tri * 1.6} h${-tri * 2} Z`}
          fill={lit ? c.accent : c.text}
          opacity={lit ? 1 : 0.55}
        />
      )}
    </Svg>
  );
});
