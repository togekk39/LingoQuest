import React from 'react';
import Svg, { Circle, Path, Rect, G, Ellipse, Line, Text as SText } from 'react-native-svg';
export function JourneyArt({ width = 310 }: { width?: number }) {
  return (
    <Svg
      width={width}
      height={240}
      viewBox="0 0 330 250"
      accessibilityLabel="Un camino entre colinas, un pasaporte y una brújula"
    >
      <Circle cx="190" cy="120" r="103" fill="#C9E9D9" />
      <Circle cx="242" cy="62" r="24" fill="#F2B875" />
      <Path d="M66 166Q119 82 183 144Q248 85 308 166V207H66Z" fill="#A1CCB3" />
      <Path d="M49 189Q104 116 168 177Q239 113 314 185V216H49Z" fill="#75AD91" />
      <Path
        d="M163 130C126 158 250 165 198 190S131 208 153 237"
        stroke="#F5F0D6"
        strokeWidth="22"
        fill="none"
      />
      <Path
        d="M163 130C126 158 250 165 198 190S131 208 153 237"
        stroke="#DADEBB"
        strokeDasharray="4 6"
        strokeWidth="1.5"
        fill="none"
      />
      <G rotation="-14" origin="98,137">
        <Rect x="45" y="82" width="100" height="137" rx="11" fill="#163E40" />
        <Rect x="51" y="78" width="94" height="134" rx="10" fill="#28786D" />
        <Rect
          x="56"
          y="84"
          width="82"
          height="122"
          rx="7"
          stroke="#7DB8A1"
          strokeWidth="1"
          fill="none"
        />
        <Circle cx="97" cy="133" r="25" stroke="#D4E5BB" strokeWidth="1.5" fill="none" />
        <Ellipse cx="97" cy="133" rx="12" ry="25" stroke="#D4E5BB" strokeWidth="1.5" fill="none" />
        <Path d="M73 133H121M77 120H116M77 146H116" stroke="#D4E5BB" strokeWidth="1.5" />
        <SText
          x="97"
          y="178"
          textAnchor="middle"
          fontSize="11"
          letterSpacing="2"
          fill="#DDEBCB"
          fontWeight="600"
        >
          LET’S GO
        </SText>
        <Path d="M85 191H109" stroke="#D4E5BB" strokeWidth="2" />
      </G>
      <G rotation="16" origin="258,163">
        <Rect x="224" y="123" width="71" height="80" rx="14" fill="#F4F3DE" />
        <Circle cx="259" cy="160" r="25" stroke="#90AA8F" strokeWidth="1.5" fill="#F9F8EB" />
        <Path d="M259 139L268 167L259 161L250 167Z" fill="#E89B60" />
        <Path d="M259 182L250 154L259 161L268 154Z" fill="#27786D" />
        <Circle cx="259" cy="161" r="3" fill="#164843" />
      </G>
      <Path d="M158 54L210 35L190 71L184 56Z" fill="#FCFBEC" />
      <Path d="M184 56L210 35L179 51" fill="none" stroke="#A4C8AE" strokeWidth="1" />
      <Path
        d="M176 75C164 96 183 107 165 119"
        stroke="#5C997E"
        strokeWidth="1.5"
        strokeDasharray="3 5"
        fill="none"
      />
      <G stroke="#437E65" strokeWidth="2" strokeLinecap="round">
        <Path d="M40 175V196M34 180L40 185L47 177M291 96V114M285 101L291 105L297 100" />
      </G>
      <Circle cx="41" cy="61" r="3" fill="#7FB097" />
      <Path d="M122 36V46M117 41H127M302 55V65M297 60H307" stroke="#8FBDA1" strokeWidth="2" />
      <Line x1="22" y1="224" x2="304" y2="224" stroke="#6E9E81" strokeWidth="1" opacity=".3" />
    </Svg>
  );
}
