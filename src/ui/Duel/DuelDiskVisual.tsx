import { useEffect, useState } from "react";

import "./duel-disk.scss";

const KEY = "virtual-link-duel-visual";
const QUALITY_KEY = "virtual-link-duel-quality";
type Quality = "high" | "medium" | "low";

const readPreference = (key: string, fallback: string) => {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const DuelDiskVisual: React.FC = () => {
  const [enabled, setEnabled] = useState(() => readPreference(KEY, "disk") !== "classic");
  const [quality, setQuality] = useState<Quality>(() => {
    const value = readPreference(QUALITY_KEY, "high");
    return value === "low" || value === "medium" ? value : "high";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("vl-duel-disk", enabled);
    root.dataset.duelQuality = quality;
    return () => {
      root.classList.remove("vl-duel-disk");
      delete root.dataset.duelQuality;
    };
  }, [enabled, quality]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try { window.localStorage.setItem(KEY, next ? "disk" : "classic"); } catch { /* optional */ }
  };
  const setGraphics = (next: Quality) => {
    setQuality(next);
    try { window.localStorage.setItem(QUALITY_KEY, next); } catch { /* optional */ }
  };

  return (
    <div className="vl-visual-controls" role="group" aria-label="Configurações visuais do duelo">
      <button className="vl-visual-toggle" type="button" aria-pressed={enabled} onClick={toggle}>
        <span aria-hidden="true">◈</span> {enabled ? "DUEL DISK / ON" : "ARENA / CLASSIC"}
      </button>
      {enabled && (
        <label className="vl-graphics-label">
          FX
          <select aria-label="Qualidade dos efeitos" value={quality} onChange={(event) => setGraphics(event.target.value as Quality)}>
            <option value="high">ALTO</option>
            <option value="medium">MÉDIO</option>
            <option value="low">BAIXO</option>
          </select>
        </label>
      )}
    </div>
  );
};
