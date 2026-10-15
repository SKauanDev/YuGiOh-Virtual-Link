import {
  BookOutlined,
  IdcardOutlined,
  RobotOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Select } from "antd";
import { useState } from "react";
import {
  useNavigate,
  useSearchParams,
  type LoaderFunction,
} from "react-router-dom";
import { useSnapshot } from "valtio";
import { useConfig } from "@/config";
import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore, resetUniverse } from "@/stores";
import { YgoCard } from "@/ui/Shared";
import { MatchModal, matchStore } from "./MatchModal";
import { ReplayModal, replayOpen } from "./ReplayModal";
import styles from "./index.module.scss";
export const loader: LoaderFunction = () => {
  resetUniverse();
  changeScene(AudioActionType.BGM_MENU);
  return null;
};
export const Component = () => {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"ai" | "custom">("ai");
  const isReplay = params.has("replays");
  const active = isReplay ? "replay" : tab;
  const navigate = useNavigate();
  const { decks } = useSnapshot(deckStore);
  const [deckName, setDeckName] = useState(
    localStorage.getItem("guest-deck") || "",
  );
  const selectedDeck =
    decks.find((deck) => deck.deckName === deckName) || decks[0];
  const { servers } = useConfig();
  const openRoom = (mode: "ai" | "custom", serverId = 0) => {
    matchStore.mode = mode;
    matchStore.serverId = serverId;
    matchStore.open = true;
  };
  const choices = {
    ai: {
      title: "Duelo contra IA",
      description:
        "Aprimore sua estratégia e prepare-se para o próximo desafio.",
      button: "BUSCAR DUELO",
      icon: <RobotOutlined />,
    },
    custom: {
      title: "Sala com amigos",
      description:
        "Compartilhe uma senha de sala e desafie seus amigos, sem cadastro.",
      button: "ENTRAR NA SALA",
      icon: <TeamOutlined />,
    },
    replay: {
      title: "Arquivo de duelos",
      description:
        "Reviva cada jogada. Abra uma gravação .yrp3d do seu computador.",
      button: "ABRIR GRAVAÇÃO",
      icon: <BookOutlined />,
    },
  };
  const choice = choices[active];
  return (
    <section className={styles.page}>
      <div className={styles.tabs} role="tablist" aria-label="Modo de partida">
        {(
          [
            ["ai", "CONTRA IA"],
            ["custom", "SALA PRIVADA"],
            /*["replay", "REPLAYS"],*/
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={active === key}
            className={active === key ? styles.active : ""}
            onClick={() => {
              if (key === "replay") setParams({ replays: "1" });
              else {
                setParams({});
                setTab(key);
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.panels}>
        <section className={`arena-panel ${styles.challenge}`}>
          <div className={styles.emblem}>
            <img src="/neos-assets/egyptian-relic.svg" alt="" />
            <span>{choice.icon}</span>
          </div>
          <h2>{choice.title}</h2>
          <p>{choice.description}</p>
          <Button
            type="primary"
            size="large"
            data-testid={
              active === "ai"
                ? "match-mode-ai"
                : active === "custom"
                ? "match-mode-custom-room"
                : "match-mode-replay"
            }
            onClick={() =>
              active === "replay" ? replayOpen() : openRoom(active)
            }
          >
            {choice.button}
          </Button>
          <div className={styles.selectedDeck}>
            <label>
              <IdcardOutlined /> Deck selecionado
            </label>
            <div className={styles.deckPreview}>
              <YgoCard code={selectedDeck?.main[0] || 0} width="2.9rem" />
              <div>
                <strong>{selectedDeck?.deckName || "Nenhum baralho"}</strong>
                <small>
                  {selectedDeck
                    ? selectedDeck.main.length + " cartas no principal"
                    : "Monte seu primeiro deck"}
                </small>
              </div>
            </div>
            <Select
              aria-label="Deck selecionado"
              value={selectedDeck?.deckName}
              options={decks.map((deck) => ({
                value: deck.deckName,
                label: deck.deckName,
              }))}
              onChange={(value) => {
                setDeckName(value);
                localStorage.setItem("guest-deck", value);
              }}
              placeholder="Escolha seu deck"
              style={{ width: "100%" }}
            />
            <button
              className={styles.editDeck}
              onClick={() => navigate("/build")}
            >
              Montar ou editar baralho →
            </button>
          </div>
        </section>
        <section className={`arena-panel ${styles.servers}`}>
          <div className={styles.tableHeading}>
            <h2>Servidores disponíveis</h2>
            <span>ACESSO POR APELIDO</span>
          </div>
          <p className={styles.serverIntro}>
            Escolha o destino da sua sala. Seus amigos devem usar o mesmo
            servidor e senha.
          </p>
          <table>
            <thead>
              <tr>
                <th>Servidor</th>
                <th>Formato</th>
                <th>Acesso</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 0, name: "Koishi", format: "Clássico" },
                { id: 3, name: "Pré-lançamento", format: "Novas cartas" },
                { id: 4, name: "Ambiente 408", format: "Histórico" },
              ]
                .filter((server) => servers[server.id])
                .map((server) => (
                  <tr key={server.id}>
                    <td>
                      <span className={styles.serverDot} /> {server.name}
                    </td>
                    <td>{server.format}</td>
                    <td>Visitante</td>
                    <td>
                      <Button
                        size="small"
                        onClick={() => openRoom("custom", server.id)}
                      >
                        Entrar
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className={styles.roomNotice}>
            <TeamOutlined />
            <div>
              <strong>Uma arena para você e seus amigos</strong>
              <p>
                Abra a sala com uma senha combinada. A escolha do baralho e a
                confirmação do duelo acontecem na sala.
              </p>
            </div>
          </div>
          <footer>
            ◆ As partidas dependem da disponibilidade dos servidores.
          </footer>
        </section>
      </div>
      <MatchModal />
      <ReplayModal />
    </section>
  );
};
Component.displayName = "Match";
