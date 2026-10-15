import { Progress } from "antd";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import { useEnv } from "@/hook";
import { matStore, roomStore } from "@/stores";

import styles from "./index.module.scss";

const FOREIGN_SCRIPT_PATTERN = /[\u3040-\u30ff\u3400-\u9fff]/;

const getDuelistDisplayName = (name: string, isMe: boolean) => {
  const value = name.trim();
  if (!value || value === "?" || FOREIGN_SCRIPT_PATTERN.test(value)) {
    return isMe ? "Duelista" : "Oponente";
  }
  return value;
};

export const LifeBar: React.FC = () => {
  const snapInitInfo = useSnapshot(matStore.initInfo);
  const snapPlayer = useSnapshot(roomStore);
  const { currentPlayer } = useSnapshot(matStore);

  const [meLife, setMeLife] = React.useState(0);
  const [opLife, setOpLife] = React.useState(0);

  useEffect(() => {
    setMeLife(snapInitInfo.me.life);
  }, [snapInitInfo.me.life]);

  useEffect(() => {
    setOpLife(snapInitInfo.op.life);
  }, [snapInitInfo.op.life]);

  const snapTimeLimit = useSnapshot(matStore.timeLimits);
  const [myTimeLimit, setMyTimeLimit] = useState(snapTimeLimit.me);
  const [opTimeLimit, setOpTimeLimit] = useState(snapTimeLimit.op);
  useEffect(() => {
    setMyTimeLimit(snapTimeLimit.me);
  }, [snapTimeLimit.me]);
  useEffect(() => {
    setOpTimeLimit(snapTimeLimit.op);
  }, [snapTimeLimit.op]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMyTimeLimit((time) => time - 1);
      setOpTimeLimit((time) => time - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (useEnv().VITE_IS_AI_MODE) {
      // 如果是AI模式
      // FIXME: 探索一个优雅的、判断当前是不是AI模式的方法，用户手动输入AI也是AI模式
      setMyTimeLimit(240);
      setOpTimeLimit(240);
    }
  }, [currentPlayer]);

  return (
    <div className={styles.container}>
      <LifeBarItem
        active={!matStore.isMe(currentPlayer)}
        name={snapPlayer.getOpPlayer()?.name ?? "?"}
        life={opLife}
        timeLimit={opTimeLimit}
        isMe={false}
      />
      <LifeBarItem
        active={matStore.isMe(currentPlayer)}
        name={snapPlayer.getMePlayer()?.name ?? "?"}
        life={meLife}
        timeLimit={myTimeLimit}
        isMe={true}
      />
    </div>
  );
};

const LifeBarItem: React.FC<{
  active: boolean;
  name: string;
  life: number;
  timeLimit: number;
  isMe: boolean;
}> = ({ active, name, life, timeLimit, isMe }) => {
  const mm = Math.floor(timeLimit / 60);
  const ss = timeLimit % 60;
  const timeText =
    timeLimit < 0
      ? "00:00"
      : `${mm < 10 ? "0" + mm : mm}:${ss < 10 ? "0" + ss : ss}`;
  return (
    <div
      data-testid="duel-player-life"
      data-player={isMe ? "me" : "op"}
      data-life={life}
      style={{
        flexDirection: isMe ? "column-reverse" : "column",
        overflow: "hidden",
        display: "flex",
        gap: "0.5rem",
        position: "relative",
      }}
    >
      <div
        className={classNames(styles["life-bar"], {
          "life-bar-activated": active,
        })}
      >
        <div className={styles.name}>{getDuelistDisplayName(name, isMe)}</div>
        <div
          className={styles.life}
          data-testid="duel-player-life-value"
          data-player={isMe ? "me" : "op"}
          data-target-life={life}
        >
          <LifeOdometer value={life} />
        </div>
      </div>
      {active && (
        <div className={styles["timer-container"]}>
          <Progress
            type="circle"
            percent={Math.floor((timeLimit / 240) * 100)}
            strokeWidth={20}
            size={14}
          />
          <div className={styles["timer-text"]}>{timeText}</div>
        </div>
      )}
    </div>
  );
};

interface LifeTransition {
  from: number;
  to: number;
  revision: number;
}

const normalizeLife = (life: number) => Math.max(0, Math.round(life));

const LifeOdometer: React.FC<{ value: number }> = ({ value }) => {
  const normalizedValue = normalizeLife(value);
  const [transition, setTransition] = useState<LifeTransition>(() => ({
    from: normalizedValue,
    to: normalizedValue,
    revision: 0,
  }));

  useEffect(() => {
    setTransition((current) => {
      if (current.to === normalizedValue) return current;
      return {
        from: current.to,
        to: normalizedValue,
        revision: current.revision + 1,
      };
    });
  }, [normalizedValue]);

  const length = Math.max(
    String(transition.from).length,
    String(transition.to).length,
  );
  const fromDigits = String(transition.from).padStart(length, "0");
  const toDigits = String(transition.to).padStart(length, "0");
  const direction = transition.to < transition.from ? "decrease" : "increase";

  return (
    <div
      className={styles.odometer}
      aria-label={`${transition.to} pontos de vida`}
      data-direction={direction}
    >
      <span className={styles["odometer-value"]}>{transition.to}</span>
      <div className={styles.reels} aria-hidden="true">
        {toDigits.split("").map((digit, index) => (
          <span className={styles.gear} key={`${transition.revision}-${index}`}>
            <span
              className={classNames(
                styles.reel,
                transition.revision > 0 && styles[direction],
              )}
              data-testid="life-digit-reel"
              data-digit-index={index}
              data-from={fromDigits[index]}
              data-to={digit}
              style={{ animationDelay: `${(length - index - 1) * 55}ms` }}
            />
          </span>
        ))}
      </div>
    </div>
  );
};
