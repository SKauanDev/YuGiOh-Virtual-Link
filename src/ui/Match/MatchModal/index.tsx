import { App, Button, Input, Modal } from "antd";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";

import { sendChat } from "@/api";
import { useConfig } from "@/config";
import { WebSocketStream } from "@/infra";
import { accountStore, roomStore } from "@/stores";
import { Select } from "@/ui/Shared";

import { connectSrvpro } from "../util";
import styles from "./index.module.scss";

const NeosConfig = useConfig();
const serverConfig = NeosConfig.servers;

const KOISHI_INDEX = 0;
const PRERELEASE_INDEX = 3;
const ENV_408 = 4;

const {
  defaults: { defaultPlayer, defaultPassword },
  automation: { isAiMode },
} = useConfig();

interface Props {
  open?: boolean;
  mode: "ai" | "custom";
  serverId: number;
}

const defaultProps: Props = {
  open: false,
  mode: "custom",
  serverId: 0,
};

export const matchStore = proxy<Props>(defaultProps);

export const MatchModal: React.FC = ({}) => {
  const { message } = App.useApp();
  const { open, mode } = useSnapshot(matchStore);
  const { user } = useSnapshot(accountStore);
  const { joined, errorMsg } = useSnapshot(roomStore);
  const [player, setPlayer] = useState(
    user?.name ||
      defaultPlayer ||
      localStorage.getItem("guest-player") ||
      "Duelista",
  );
  const [passwd, setPasswd] = useState(defaultPassword);
  const [serverId, setServerId] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("MatchModal");
  useEffect(() => {
    if (open) {
      setServerId(matchStore.serverId);
      setPlayer(
        localStorage.getItem("guest-player") || defaultPlayer || "Duelista",
      );
    }
  }, [open]);

  const handlePlayerChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPlayer(event.target.value);
  };
  const handleServerChange = (value: any) => {
    setServerId(value);
  };
  const handlePasswdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswd(event.target.value);
  };
  const send408Hint = (conn: WebSocketStream) => {
    setTimeout(
      () =>
        sendChat(
          conn,
          "No formato 408, algumas cartas podem usar efeitos antigos e a disponibilidade pode variar conforme a versão do servidor.",
        ),
      1000,
    );
  };

  const handleSubmit = async () => {
    if (!player.trim()) {
      message.error("Escolha um apelido para entrar na sala.");
      return;
    }
    localStorage.setItem("guest-player", player.trim());
    setConfirmLoading(true);
    try {
      await connectSrvpro({
        player: player.trim(),
        ip: genServerAddress(mode === "ai" ? KOISHI_INDEX : serverId),
        passWd: mode === "ai" ? "AI" : passwd,
        customOnConnected:
          mode !== "ai" && serverId === ENV_408 ? send408Hint : undefined,
      });
    } catch {
      message.error(
        "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      );
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    // 如果开启了AI模式，直接进入房间
    if (isAiMode) {
      handleSubmit();
    }
  }, []);

  useEffect(() => {
    // 如果一切顺利的话，后端传来已加入房间的信号，这时候跳转到房间页面
    if (joined) {
      matchStore.open = false;
      setConfirmLoading(false);
      navigate(`/waitroom`);
    }
  }, [joined]);

  useEffect(() => {
    // 出现错误
    if (errorMsg !== undefined && errorMsg !== "") {
      message.error(errorMsg);
      setConfirmLoading(false);
      roomStore.errorMsg = undefined;
    }
  }, [errorMsg]);

  return (
    <Modal
      open={open}
      title={mode === "ai" ? "Duelo contra IA" : "Sala com amigos"}
      onCancel={() => (matchStore.open = false)}
      footer={
        <Button
          data-testid="match-modal-join"
          onClick={handleSubmit}
          loading={confirmLoading}
        >
          {mode === "ai" ? "Iniciar duelo" : i18n("JoinRoom")}
        </Button>
      }
      confirmLoading={confirmLoading}
      centered
    >
      <div className={styles["inputs-container"]}>
        <p className={styles.hint}>
          {mode === "ai"
            ? "Seu adversário será a IA do servidor Koishi. Entre com seu apelido e escolha o baralho na sala."
            : "Combine o servidor e a senha com seus amigos para entrarem na mesma sala."}
        </p>
        {mode !== "ai" && (
          <Select
            className={styles.select}
            title={i18n("Server")}
            value={serverId}
            options={[
              {
                value: KOISHI_INDEX,
                label: i18n("KoishiServer"),
              },
              {
                value: PRERELEASE_INDEX,
                label: i18n("UltraPreemptiveServer"),
              },
              {
                value: ENV_408,
                label: i18n("408"),
              },
            ]}
            onChange={handleServerChange}
          />
        )}
        <label htmlFor="guest-player">Seu apelido</label>
        <Input
          id="guest-player"
          maxLength={20}
          className={styles.input}
          data-testid="match-modal-player"
          type="text"
          placeholder={i18n("PlayerNickname")}
          value={player}
          onChange={handlePlayerChange}
          required
        />
        {mode !== "ai" && (
          <>
            <label htmlFor="guest-room">Senha ou nome da sala</label>
            <Input
              id="guest-room"
              maxLength={20}
              className={styles.input}
              data-testid="match-modal-password"
              type="text"
              autoCorrect="off"
              placeholder={i18n("RoomPasswordOptional")}
              value={passwd}
              onChange={handlePasswdChange}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

const genServerAddress = (id: number) => {
  return `${serverConfig[id].ip}:${serverConfig[id].port}`;
};
