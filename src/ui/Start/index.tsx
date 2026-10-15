import { IdcardOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate, type LoaderFunction } from "react-router-dom";
import { AudioActionType, changeScene } from "@/infra/audio";
import styles from "./index.module.scss";
export const loader: LoaderFunction = () => {
  changeScene(AudioActionType.BGM_MENU);
  return null;
};
export const Component = () => {
  const navigate = useNavigate();
  return (
    <section className={styles.home}>
      <div className={styles.logo}>
        <div className={styles.crown} aria-hidden="true">
          ✦
        </div>
        <h1>Yu-Gi-Oh!</h1>
        <p>VIRTUAL ARENA</p>
      </div>
      <blockquote className={styles.quote}>
        “Acredite
        <br />
        no coração
        <br />
        das cartas.”
      </blockquote>
      <div className={styles.actions}>
        <button
          className="arena-panel"
          onClick={() => navigate("/match")}
          aria-label="Iniciar jogo"
        >
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path
              d="M8 4 30 26l-5 5L3 9V3Zm32 0L18 26l5 5L45 9V3ZM18 27 7 40m0-6 7 7m16-14 11 13m0-6-7 7"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <strong>JOGAR</strong>
          <small>ENCONTRE UM DUELO</small>
        </button>
        <button className="arena-panel" onClick={() => navigate("/build")}>
          <IdcardOutlined />
          <strong>MONTAR BARALHO</strong>
          <small>GERENCIE SEUS DECKS</small>
        </button>
        <button className="arena-panel" onClick={() => navigate("/match")}>
          <TeamOutlined />
          <strong>PARTIDAS</strong>
          <small>ENTRE EM SALAS</small>
        </button>
      </div>
      <div className={styles.motto}>
        <span />
        “QUE COMECE O DUELO!”
        <span />
      </div>
      <footer>
        Criado por <a href="https://portf-lio-oficial-five.vercel.app/" target="_blank">KSTech</a> &copy; 2026
      </footer>
    </section>
  );
};
Component.displayName = "Start";
