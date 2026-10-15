import type { CSSProperties } from "react";
import styles from "./SandTransition.module.scss";
export const SandTransition = () => (
  <div className={styles.sand} data-testid="sand-transition" aria-hidden="true">
    <div className={styles.veil} />
    {Array.from({ length: 44 }, (_, index) => (
      <i
        key={index}
        style={
          {
            "--x": `${(index * 37) % 100}%`,
            "--y": `${(index * 23) % 100}%`,
            "--drift": `${40 + ((index * 19) % 120)}px`,
            "--delay": `${(index % 7) * 18}ms`,
            "--size": `${1 + (index % 3)}px`,
          } as CSSProperties
        }
      />
    ))}
  </div>
);
