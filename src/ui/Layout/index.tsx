import {
  AppstoreOutlined,
  BookOutlined,
  HomeFilled,
  IdcardOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { App, Button, Input } from "antd";
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  type LoaderFunction,
} from "react-router-dom";
import { useAdaptiveViewportScale } from "@/hook";
import { Background } from "@/ui/Shared";
import { setCssProperties } from "../Duel/PlayMat/css";
import { Setting } from "../Setting";
import {
  initDeck,
  initForbidden,
  initI18N,
  initSqlite,
  initSuper,
} from "./utils";
import styles from "./index.module.scss";
import { SandTransition } from "./SandTransition";

export const loader: LoaderFunction = () => {
  for (const initialize of [
    initDeck,
    initSqlite,
    initForbidden,
    initI18N,
    initSuper,
  ])
    initialize().catch((error) =>
      console.error("Falha ao carregar recursos do jogo", error),
    );
  setCssProperties();
  return null;
};
export const Component = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const playing = ["/waitroom", "/duel", "/side"].includes(pathname);
  useAdaptiveViewportScale(
    pathname === "/duel"
      ? { designWidth: 1000, designHeight: 920 }
      : { designWidth: 1100, designHeight: 650 },
  );
  const { modal } = App.useApp();
  const [name, setName] = useState(
    localStorage.getItem("guest-player") || "Duelista",
  );
  const [paused, setPaused] = useState(
    localStorage.getItem("arena-motion") === "paused",
  );
  const openProfile = () => {
    let next = name;
    modal.confirm({
      title: "Seu perfil de duelista",
      icon: <UserOutlined />,
      content: (
        <div>
          <p className={styles.profileHelp}>
            Escolha como você aparece nas salas. Seu perfil fica salvo neste
            navegador.
          </p>
          <Input
            aria-label="Apelido do duelista"
            defaultValue={name}
            maxLength={20}
            onChange={(e) => (next = e.target.value)}
          />
        </div>
      ),
      okText: "Salvar apelido",
      cancelText: "Cancelar",
      onOk: () => {
        if (!next.trim()) return Promise.reject();
        localStorage.setItem("guest-player", next.trim());
        setName(next.trim());
      },
    });
  };
  const openSettings = () =>
    modal.info({
      title: "Configurações",
      content: <Setting />,
      centered: true,
      maskClosable: true,
      icon: null,
      footer: null,
    });
  const isCollection = pathname === "/build" && search.includes("collection");
  const isReplay = pathname === "/match" && search.includes("replays");
  const pageTitle =
    pathname === "/build"
      ? isCollection
        ? "Coleção de cartas"
        : "Montar baralho"
      : "Partidas";
  return (
    <>
      {pathname !== "/duel" && <Background />}
      {!playing && (
        <>
          <aside className={styles.sidebar}>
            <button className={styles.profile} onClick={openProfile}>
              <span className={styles.avatar}>
                <img src="/neos-assets/egyptian-relic.svg" alt="" />
              </span>
              <span>
                <strong>{name}</strong>
                <small>Perfil de visitante</small>
              </span>
            </button>
            <div className={styles.divider}>◆</div>
            <nav aria-label="Navegação principal">
              <NavLink to="/" end className={styles.link}>
                <HomeFilled />
                Início
              </NavLink>
              <NavLink
                to="/match"
                className={({ isActive }) =>
                  `${styles.link} ${isActive && !isReplay ? "active" : ""}`
                }
              >
                <TeamOutlined />
                Partidas
              </NavLink>
              <NavLink
                to="/build"
                className={({ isActive }) =>
                  `${styles.link} ${isActive && !isCollection ? "active" : ""}`
                }
              >
                <IdcardOutlined />
                Decks
              </NavLink>
              <button
                className={`${styles.link} ${isCollection ? "active" : ""}`}
                onClick={() => navigate("/build?collection=1")}
              >
                <AppstoreOutlined />
                Coleção
              </button>
              <button
                className={`${styles.link} ${isReplay ? "active" : ""}`}
                onClick={() => navigate("/match?replays=1")}
              >
                <BookOutlined />
                Replays
              </button>
              <button className={styles.link} onClick={openProfile}>
                <UserOutlined />
                Perfil
              </button>
              <button className={styles.link} onClick={openSettings}>
                <SettingOutlined />
                Configurações
              </button>
            </nav>
            <div className={styles.sidebarBottom}>
              <img src="/neos-assets/egyptian-relic.svg" alt="" />
              <span>VIRTUAL ARENA</span>
            </div>
          </aside>
          <header className={styles.header}>
            {pathname !== "/" && (
              <div className={styles.pageTitle}>
                <span>
                  {pathname === "/build" ? (
                    <IdcardOutlined />
                  ) : (
                    <TeamOutlined />
                  )}
                </span>
                <div>
                  <h1>{pageTitle}</h1>
                  <p>
                    {pathname === "/build"
                      ? "GERENCIE SEUS DECKS"
                      : "ENCONTRE O SEU DUELO"}
                  </p>
                </div>
              </div>
            )}
          </header>
        </>
      )}
      <main
        className={`${styles.main} ${playing ? styles.full : ""} ${
          pathname === "/duel" ? styles.duel : ""
        }`}
      >
        {!playing && <SandTransition key={`${pathname}${search}`} />}
        <Outlet />
      </main>
    </>
  );
};
