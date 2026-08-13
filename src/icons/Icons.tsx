import React, { useId } from 'react';
import Svg, { Path, Circle, Rect, Defs, ClipPath, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeState';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** The mark's two colours. Fixed rather than themed: the identity should not shift
 * hue with the chosen paper, only invert for dark ground. */
const INK = '#1A1815';
const PAPER = '#FCFBF8';

/**
 * A closed notebook seen face-on, its elastic band still fastened: a solid rounded
 * tile with an off-centre band bleeding top to bottom.
 *
 * The band sits at x=67, overlapping the top-right corner curve (which starts at
 * x=72), so it *must* be clipped by the tile — unclipped, it pokes out past the
 * radius. The 70% position is deliberate: centred reads as a stripe, further right
 * gets eaten by the corner.
 *
 * Two filled rectangles and no strokes, so it survives down to 16px without the
 * hairline-disappearing problem the old bracket mark had.
 */
export function LogoMark({ size = 40, color }: IconProps) {
  const { paper } = useTheme();
  // React's useId contains colons, which are not valid in an SVG id / url(#…)
  // reference. A unique id per instance is load-bearing here: duplicate ids in one
  // document collapse to the first definition, and the clip silently stops working
  // on re-render, letting the band overrun the corner.
  const clipId = `ivMark${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  // The app's own ink/paper, not the identity sheet's slate — the geometry carries
  // the identity, and a fifth colour is not worth introducing. Night inverts.
  const tile = color ?? (paper === 'night' ? PAPER : INK);
  const band = paper === 'night' ? INK : PAPER;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={8} y={8} width={84} height={84} rx={20} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Rect x={8} y={8} width={84} height={84} fill={tile} />
        <Rect x={67} y={8} width={7} height={84} fill={band} />
      </G>
    </Svg>
  );
}

export function ChevronLeft({ size = 13, color, strokeWidth = 1.6 }: IconProps) {
  const { colors } = useTheme();
  color = color ?? colors.faint;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14.5 5.5 8 12l6.5 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRight({ size = 13, color, strokeWidth = 1.6 }: IconProps) {
  const { colors } = useTheme();
  color = color ?? colors.chevron;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9.5 5.5 16 12l-6.5 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 13, color, strokeWidth = 1.6 }: IconProps) {
  const { colors } = useTheme();
  color = color ?? colors.faint;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10.5} width={14} height={9.5} rx={2} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M8.6 10.5V8a3.4 3.4 0 0 1 6.8 0v2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function BiometricIcon({ size = 14, color, strokeWidth = 1.5 }: IconProps) {
  const { colors } = useTheme();
  color = color ?? colors.ink4;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 8.5V6a1.5 1.5 0 0 1 1.5-1.5h2.5M15.5 4.5H18A1.5 1.5 0 0 1 19.5 6v2.5M19.5 15.5V18a1.5 1.5 0 0 1-1.5 1.5h-2.5M8.5 19.5H6A1.5 1.5 0 0 1 4.5 18v-2.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path d="M9.2 10v1.6M14.8 10v1.6M12 10.4v3.2h-1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9.6 15.6a3.4 3.4 0 0 0 4.8 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function MagnifierIcon({ size = 14, color, strokeWidth = 1.5 }: IconProps) {
  const { colors } = useTheme();
  color = color ?? colors.muted;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={10.8} cy={10.8} r={6.4} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M15.6 15.6 20 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function TabWriteIcon({ size = 21, color = '#C0BAB0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.6 19.4 8.2 18.4 19 7.6 16.4 5 5.6 15.8Z" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.6 6.8 17.2 9.4" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TabEntriesIcon({ size = 21, color = '#C0BAB0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5.6 4.4V19.6" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M9.2 7.6H19" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M9.2 12H19" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M9.2 16.4H15.2" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function TabEchoesIcon({ size = 21, color = '#C0BAB0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={7} cy={12} r={1.7} fill={color} />
      <Path d="M12 8.2a6 6 0 0 1 0 7.6" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Path d="M15.6 5.6a10 10 0 0 1 0 12.8" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

export function TabYouIcon({ size = 21, color = '#C0BAB0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={7.4} stroke={color} strokeWidth={1.3} />
      <Circle cx={12} cy={12} r={1.7} fill={color} />
    </Svg>
  );
}

export function TabPeopleIcon({ size = 21, color = '#C0BAB0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={1.7} fill={color} />
      <Circle cx={12} cy={12} r={7.4} stroke={color} strokeWidth={1.3} strokeDasharray="1.5 3.6" />
      <Circle cx={18.4} cy={7.2} r={1.5} fill={color} />
      <Circle cx={6.4} cy={15.6} r={1.5} fill={color} />
    </Svg>
  );
}

/** The official unmodified Google "G" mark — do not recolour or restyle per Google's branding guidelines. */
export function GoogleMark({ size = 17 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.8746 2.6836-6.615z" />
      <Path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8591-3.0477.8591-2.3436 0-4.3282-1.5831-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
      <Path fill="#FBBC05" d="M3.9641 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2822-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z" />
      <Path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1627 6.6564 3.5795 9 3.5795z" />
    </Svg>
  );
}

export function PlusIcon({ size = 14, color = '#8F8981', strokeWidth = 1.5 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
