import React, { useState } from "react";

/**
 * Official Sketchfab 3D viewer. The 3D asset stays hosted by its creator;
 * original game zones are rendered separately by Mat and retain all input.
 * A local licensed GLB can replace this viewer in a later WebGL integration.
 */
const MODEL_ID = "88dc1d9075504d04a8ce506030189304";
const MODEL_URL = `https://sketchfab.com/models/${MODEL_ID}/embed?autostart=1&autospin=0.08&ui_controls=0&ui_infos=0&ui_watermark=1`;

export const DuelDiskModel: React.FC = () => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="vl-disk-model vl-disk-sketchfab" aria-label="Modelo tridimensional Yu-Gi-Oh Duel Disk">
      {!failed ? (
        <iframe
          title="Yu-Gi-Oh Duel Disk 3D por ELATTAR Ayoub no Sketchfab"
          src={MODEL_URL}
          loading="lazy"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          onError={() => setFailed(true)}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="vl-model-unavailable">Modelo 3D indisponível. A arena permanece jogável.</div>
      )}
      <a className="vl-model-credit" href="https://sketchfab.com/3d-models/yu-gi-oh-duel-disk-88dc1d9075504d04a8ce506030189304" target="_blank" rel="noopener noreferrer">
        Duel Disk 3D © ELATTAR Ayoub · CC BY · Sketchfab
      </a>
    </div>
  );
};
