import React, { memo, useRef, useState } from "react";
import { useDrag } from "react-dnd";

import { CardMeta, forbidden, forbidden_408, getCardImgUrl } from "@/api";
import { useConfig } from "@/config";

import { Type } from "../DeckZone";
import { YgoCard } from "../YgoCard";
import styles from "./index.module.scss";

const { assetsPath } = useConfig();

export interface DeckCardMouseUpEvent {
  event: React.MouseEvent;
  card: CardMeta;
}

/** 组卡页和Side页使用的单张卡片，增加了文字和禁限数量 */
export const DeckCard: React.FC<{
  value: CardMeta;
  source: Type | "search";
  onMouseUp?: (event: DeckCardMouseUpEvent) => void;
  onMouseEnter?: () => void;
  onDoubleClick?: (card: CardMeta) => void;
  is408?: boolean;
}> = memo(
  ({ value, source, onMouseUp, onMouseEnter, onDoubleClick, is408 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag({
      type: "Card",
      item: { value, source },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    drag(ref);
    const [showText, setShowText] = useState(true);
    const limitCnt = is408 ? forbidden_408.get(value) : forbidden.get(value);
    const portuguese = ["br", "pt"].includes(
      localStorage.getItem("language") || "br",
    );

    return (
      <div
        className={styles.card}
        title={`${value.text.name || "Carta"}\n${value.text.desc || ""}`}
        aria-label={value.text.name || `Carta ${value.id}`}
        ref={ref}
        style={{ opacity: isDragging && source !== "search" ? 0 : 1 }}
        onMouseUp={(event) =>
          onMouseUp?.({
            event,
            card: value,
          })
        }
        onMouseEnter={onMouseEnter}
        onDoubleClick={() => onDoubleClick?.(value)}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {portuguese ? (
          <div className={styles.nativeCard}>
            <strong>{value.text.name || `Carta ${value.id}`}</strong>
            <div
              className={styles.art}
              style={{ backgroundImage: `url(${getCardImgUrl(value.id)})` }}
            />
            <small>
              {(value.data.type || 0) & 1
                ? `ATK ${value.data.atk ?? "?"} / DEF ${value.data.def ?? "?"}`
                : (value.data.type || 0) & 2
                ? "CARTA DE MAGIA"
                : "CARTA DE ARMADILHA"}
            </small>
          </div>
        ) : (
          <>
            {showText && (
              <div className={styles.cardname}>{value.text.name}</div>
            )}
            <YgoCard
              className={styles.cardcover}
              code={value.id}
              onLoad={() => setShowText(false)}
            />
          </>
        )}
        {limitCnt !== undefined && (
          <img
            className={styles.cardlimit}
            src={`${assetsPath}/Limit0${limitCnt}.png`}
          />
        )}
      </div>
    );
  },
);
