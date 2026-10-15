import { useEffect, useState } from "react";

import "./duel-disk.scss";

const KEY = "virtual-link-duel-visual";

export const DuelDiskVisual: React.FC = () => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return window.localStorage.getItem(KEY) !== "classic";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("vl-duel-disk", enabled);
    return () => document.documentElement.classList.remove("vl-duel-disk");
  }, [enabled]);

  return (
    <button
      className="vl-visual-toggle"
      type="button"
      aria-label={enabled ? "Ativar arena clássica" : "Ativar visual Duel Disk"}
      aria-pressed={enabled}
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        try {
          window.localStorage.setItem(KEY, next ? "disk" : "classic");
        } catch {
          // The visual preference is optional in restricted browsing contexts.
        }
      }}
    >
      <span aria-hidden="true">◈</span> {enabled ? "DUEL DISK / ON" : "ARENA / CLASSIC"}
    </button>
  );
};
