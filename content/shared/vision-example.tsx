export const BIRD_SCENE_VIEW_BOX = '0 0 240 180';

/** Shared neutral scene for generic vision examples such as crops and patches. */
export function BirdScene() {
  return (
    <g className="vision-example-bird" aria-hidden="true">
      <rect width="240" height="180" className="vision-example-bird__sky" />
      <path
        d="M 0 154 Q 35 96 74 145 T 158 131 T 240 119 V 180 H 0 Z"
        className="vision-example-bird__foliage"
      />
      <path
        d="M -8 151 L 250 131 M 187 136 L 223 99 M 30 149 L 14 126"
        className="vision-example-bird__branch"
      />
      <path
        d="M 209 114 Q 191 83 215 80 Q 232 94 209 114 M 222 105 Q 225 76 239 88 Q 246 101 222 105"
        className="vision-example-bird__leaf"
      />
      <path d="M 94 101 L 36 134 L 50 106 L 88 81 Z" className="vision-example-bird__wing" />
      <ellipse
        cx="116"
        cy="89"
        rx="42"
        ry="32"
        transform="rotate(-23 116 89)"
        className="vision-example-bird__body"
      />
      <circle cx="144" cy="49" r="25" className="vision-example-bird__body" />
      <path
        d="M 127 58 Q 153 58 155 82 Q 144 110 120 116 Q 146 86 127 58"
        className="vision-example-bird__accent"
      />
      <path d="M 91 78 Q 131 62 127 88 Q 116 108 84 105 Z" className="vision-example-bird__wing" />
      <path d="M 167 44 L 189 52 L 166 59 Z" className="vision-example-bird__accent" />
      <circle cx="153" cy="43" r="4" className="vision-example-bird__eye" />
      <circle cx="154" cy="42" r="1.1" className="vision-example-bird__glint" />
      <path
        d="M 113 116 L 114 141 L 104 146 M 114 141 L 124 144 M 133 110 L 137 139 L 129 144 M 137 139 L 147 143"
        className="vision-example-bird__feet"
      />
    </g>
  );
}
