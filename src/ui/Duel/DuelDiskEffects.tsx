import { useEffect, useRef, useState } from "react";

import { ygopro } from "@/api";
import { cardStore } from "@/stores";
import { useSnapshot } from "valtio";

type Pulse = { id: number; kind: "summon" | "attack" | "destroy"; label: string };
const MZONE = ygopro.CardZone.MZONE;

/**
 * Presentation-only observer. Never dispatches a game command: the authoritative
 * duel engine and the existing Card/Zone components retain all interactions.
 */
export const DuelDiskEffects: React.FC = () => {
  const { inner } = useSnapshot(cardStore);
  const previous = useRef(new Map<string, { zone: number; controller: number }>());
  const initialized = useRef(false);
  const sequence = useRef(0);
  const [pulse, setPulse] = useState<Pulse | null>(null);

  useEffect(() => {
    const next = new Map<string, { zone: number; controller: number }>();
    inner.forEach((card) => next.set(card.uuid, { zone: card.location.zone, controller: card.location.controller }));
    if (initialized.current) {
      for (const [uuid, location] of next) {
        const old = previous.current.get(uuid);
        if (location.zone === MZONE && old && old.zone !== MZONE) {
          setPulse({ id: ++sequence.current, kind: "summon", label: "MONSTER SUMMONED" });
          break;
        }
        if (old?.zone === MZONE && location.zone !== MZONE) {
          setPulse({ id: ++sequence.current, kind: "destroy", label: "CARD DEPARTED" });
          break;
        }
      }
    }
    initialized.current = true;
    previous.current = next;
  }, [inner]);

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse((current) => current?.id === pulse.id ? null : current), 1400);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  return (
    <div className="vl-effect-layer" aria-live="polite" aria-atomic="true" aria-label="Efeitos visuais do duelo">
      {pulse && <div key={pulse.id} className={`vl-hologram vl-hologram--${pulse.kind}`}>
        <span className="vl-hologram-ring" aria-hidden="true" />
        <span className="vl-hologram-symbol" aria-hidden="true">◇</span>
        <span className="vl-hologram-caption">{pulse.label}</span>
      </div>}
    </div>
  );
};
