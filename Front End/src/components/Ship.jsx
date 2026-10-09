export default function Ship({ compact = false, progress = 18 }) {
  return (
    <svg
      className={`ship-art ${compact ? "compact" : ""}`}
      viewBox="0 0 620 390"
      role="img"
      aria-label="رسم توضيحي لسفينة في طور البناء، عرض تجريبي"
    >
      <defs>
        <linearGradient id="sea" x2="0" y2="1">
          <stop stopColor="#dbe9df" />
          <stop offset="1" stopColor="#f1f2e7" />
        </linearGradient>
        <linearGradient id="sail" x2="1" y2="1">
          <stop stopColor="#fffdf1" />
          <stop offset="1" stopColor="#dcd5bc" />
        </linearGradient>
        <linearGradient id="wood" x2="0" y2="1">
          <stop stopColor="#b99066" />
          <stop offset="1" stopColor="#6d614c" />
        </linearGradient>
        <radialGradient id="glow">
          <stop stopColor="#fbf4d7" stopOpacity=".9" />
          <stop offset="1" stopColor="#fbf4d7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="315" cy="154" rx="260" ry="166" fill="url(#glow)" />
      <circle cx="167" cy="88" r="28" fill="#f5e7be" opacity=".65" />
      <path
        d="M10 244 Q90 211 171 237 T340 226 T620 240V390H0Z"
        fill="url(#sea)"
      />
      <path
        d="M0 267Q105 239 205 260T401 250T620 262"
        fill="none"
        stroke="#b5c9ba"
        opacity=".55"
      />
      <path
        d="M30 300Q163 276 280 302T600 295M71 338Q210 312 348 339T610 331"
        fill="none"
        stroke="#acbfb0"
        opacity=".4"
      />
      <ellipse cx="330" cy="293" rx="153" ry="15" fill="#526d5f" opacity=".1" />
      <g className="boat">
        <path
          d="M162 247Q302 270 478 225L443 277Q313 307 208 280Z"
          fill="url(#wood)"
        />
        <path
          d="M167 248Q320 271 477 226"
          fill="none"
          stroke="#655c46"
          strokeWidth="7"
        />
        <path
          d="M190 262Q321 284 458 246M203 274Q321 291 449 260"
          fill="none"
          stroke="#ddc19a"
          strokeWidth="2"
          opacity=".6"
        />
        <path
          d="M320 72V263"
          stroke="#6f674f"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M326 85Q394 157 432 217Q372 213 326 238Z"
          fill="url(#sail)"
          stroke="#c9c4ac"
        />
        <path
          d="M310 111Q248 165 198 237Q267 218 312 238Z"
          fill="#f7f3e3"
          stroke="#d6d0b8"
        />
        <path d="M320 70L356 79L322 89" fill="#658576" />
        <path
          d="M321 85L474 232M318 91L175 249"
          stroke="#918c70"
          strokeWidth="1"
        />
        <path d="M237 249L241 232L281 236L282 256" fill="#99937a" />
        <path d="M239 232L260 222L289 238" fill="#c5bba1" />
        <path
          d="M410 249V230M420 247V227M430 244V225"
          stroke="#7d765d"
          strokeWidth="3"
        />
        {progress >= 19 && <path d="M288 261L290 241H314V264" fill="#d3b890" />}
      </g>
      <g fill="none" stroke="#748c79" strokeWidth="1.5" opacity=".65">
        <path d="M83 123q9-9 18 0q9-9 18 0M473 93q7-7 14 0q7-7 14 0M452 109q5-5 10 0q5-5 10 0" />
      </g>
      <path
        d="M114 321q20-6 42 0M385 318q35-8 69-2M232 349q42-8 80 0"
        stroke="#8ca998"
        opacity=".4"
        fill="none"
      />
    </svg>
  );
}
