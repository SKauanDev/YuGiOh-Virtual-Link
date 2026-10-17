import React from "react";

/**
 * Procedural articulated Duel Disk housing. Decorative only: the actual zones
 * and card interactions remain in the original duel mat above this layer.
 */
export const DuelDiskModel: React.FC = () => (
  <div className="vl-disk-model" aria-hidden="true">
    <svg className="vl-disk-wings" viewBox="0 0 1200 460" role="presentation">
      <defs>
        <linearGradient id="vl-metal" x2="0.2" y2="1">
          <stop stopColor="#f1f6fa"/><stop offset=".25" stopColor="#aab8c8"/>
          <stop offset=".65" stopColor="#e8edf1"/><stop offset="1" stopColor="#546b80"/>
        </linearGradient>
        <linearGradient id="vl-blue" x2=".3" y2="1">
          <stop stopColor="#65c7ff"/><stop offset=".65" stopColor="#257fd4"/>
          <stop offset="1" stopColor="#123c83"/>
        </linearGradient>
        <filter id="vl-shadow"><feDropShadow dx="0" dy="14" stdDeviation="10" floodOpacity=".7"/></filter>
      </defs>
      <g filter="url(#vl-shadow)" strokeLinejoin="round">
        <path d="M22 155 Q28 115 85 99 L680 48 L735 78 L805 47 L1172 170 L1130 340 L796 263 L710 278 L650 310 L55 335 Q15 322 22 290Z" fill="url(#vl-metal)" stroke="#53687b" strokeWidth="7"/>
        <path d="M80 152 L683 95 L701 256 L80 286Z" fill="#172f50" stroke="#e8f4ff" strokeWidth="5"/>
        <path d="M790 93 L1119 192 L1093 295 L789 232Z" fill="#172f50" stroke="#e8f4ff" strokeWidth="5"/>
        {Array.from({length:3},(_,i)=><g key={i}>
          <path d={`M${108+i*190} ${151-i*17} l169 -15 0 112 -169 10Z`} fill="url(#vl-blue)" stroke="#c3eaff" strokeWidth="4"/>
          <path d={`M${184+i*190} ${198-i*16} l18 -12 18 12 -18 0Z`} fill="#f34955"/>
        </g>)}
        {Array.from({length:2},(_,i)=><g key={i}>
          <path d={`M${805+i*153} ${117+i*47} l137 42 -18 104 -119 -30Z`} fill="url(#vl-blue)" stroke="#c3eaff" strokeWidth="4"/>
          <path d={`M${858+i*145} ${191+i*35} l22 -9 12 20 -19 -4Z`} fill="#f34955"/>
        </g>)}
        <path d="M714 65 L789 83 L772 268 L700 262Z" fill="#8494a7" stroke="#eff8ff" strokeWidth="5"/>
      </g>
    </svg>
    <div className="vl-disk-hub">
      <div className="vl-disk-ring"/>
      <div className="vl-disk-red"><span className="vl-disk-gem"/></div>
      <div className="vl-disk-strap"><span>VIRTUAL LINK</span><i/></div>
    </div>
  </div>
);
