import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./index.module.scss";

export const withPortalToBody =
  <P extends object>(WrappedComponent: React.ComponentType<P>) =>
  (props: P) =>
    createPortal(<WrappedComponent {...props} />, document.body);

export const Background: React.FC<{
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  innerOpacity?: number;
}> = withPortalToBody(({ style, innerStyle, innerOpacity = 1 }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setMotion(
        !query.matches && localStorage.getItem("arena-motion") !== "paused",
      );
    update();
    query.addEventListener("change", update);
    window.addEventListener("arena-motion-change", update);
    return () => {
      query.removeEventListener("change", update);
      window.removeEventListener("arena-motion-change", update);
    };
  }, []);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const sync = () => {
      if (motion && !document.hidden) element.play().catch(() => {});
      else element.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [motion]);
  return (
    <div className={styles.background} style={style} aria-hidden="true">
      <video
        ref={video}
        data-testid="arena-background-video"
        muted
        loop
        playsInline
        preload="metadata"
        poster="/neos-assets/egyptian-arena-poster.jpg"
        tabIndex={-1}
      >
        {motion && (
          <source src="/neos-assets/egyptian-arena.mp4" type="video/mp4" />
        )}
      </video>
      <div
        className={styles.inner}
        style={{ ...innerStyle, opacity: innerOpacity }}
      />
    </div>
  );
});
