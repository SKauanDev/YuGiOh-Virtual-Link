import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileAddOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, MenuProps, UploadProps } from "antd";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import YGOProDeck from "ygopro-deck-encode";

import { getCardImgUrl, uploadDeck } from "@/api";
import { accountStore, deckStore, IDeck } from "@/stores";

import { Uploader } from "../../Shared";
import { genYdkText } from "../utils";
import styles from "./index.module.scss";

const DEFAULT_DECK_CASE = 1082012;

export const DeckSelect: React.FC<{
  decks: IDeck[];
  selected: string;
  onSelect: (deckName: string) => any;
  onDelete: (deckName: string) => Promise<any>;
  onDownload: (deckName: string) => any;
  onCopy: (deckName: string) => Promise<any>;
}> = ({ decks, selected, onSelect, onDelete, onDownload, onCopy }) => {
  const newDeck = useRef<IDeck[]>([]);
  const { modal, message } = App.useApp();
  const { t: i18n } = useTranslation("DeckSelect");

  /** 创建卡组，直接给一个命名，用户可以手动修改，无需modal打断流程 */
  const createNewDeck = async () => {
    const deckName = new Date().toLocaleString();
    await deckStore.add({
      deckName,
      main: [],
      extra: [],
      side: [],
    });
    onSelect(deckName);
  };

  const showUploadModal = () =>
    modal.info({
      width: 600,
      centered: true,
      icon: null,
      content: (
        <DeckUploader
          onLoaded={(deck) => {
            newDeck.current.push(deck);
          }}
        />
      ),
      okText: "Enviar",
      maskClosable: true,
      onOk: async () => {
        const results = await Promise.all(
          newDeck.current.map((deck) => deckStore.add(deck)),
        );
        newDeck.current = [];
        if (results.length)
          results.every(Boolean)
            ? message.success("Enviado com sucesso")
            : message.error("Alguns arquivos não puderam ser enviados.");
      },
    });

  /** 从剪贴板导入。为什么错误处理这么丑陋... */
  const importFromClipboard = () => {
    // 检查浏览器是否支持 Clipboard API
    if (navigator.clipboard) {
      // 获取剪贴板内容
      navigator.clipboard
        .readText()
        .then((text) => {
          const deck = YGOProDeck.fromYdkString(text);
          if (
            !(deck.main.length + deck.extra.length + deck.side.length === 0)
          ) {
            // YDK解析成功
            const deckName = new Date().toLocaleString();
            deckStore
              .add({
                deckName,
                ...deck,
              })
              .then((result) => {
                if (result) {
                  message.success(`Baralho importado: ${deckName}`);
                  onSelect(deckName);
                } else {
                  message.error(
                    "Não foi possível importar. Verifique o formato.",
                  );
                }
              });
          } else {
            message.error("Não foi possível importar. Verifique o formato.");
          }
        })
        .catch((err) => {
          message.error("Não foi possível ler a área de transferência.");
        });
    } else {
      message.error("O navegador não permite acessar a área de transferência.");
    }
  };

  const items: MenuProps["items"] = [
    {
      label: `${i18n("CreateNewDeck")}`,
      icon: <PlusOutlined />,
      onClick: createNewDeck,
    },
    {
      label: `${i18n("ImportFromLocalFile")}`,
      icon: <FileAddOutlined />,
      onClick: showUploadModal,
    },
    {
      label: `${i18n("ImportFromClipboard")}`,
      icon: <CopyOutlined />,
      onClick: importFromClipboard,
    },
  ].map((_, key) => ({ ..._, key }));

  const onUploadMdDeck = async (deck: IDeck) => {
    const user = accountStore.user;
    if (user) {
      // TODO: Deck Case
      const resp = await uploadDeck({
        userId: user.id,
        token: user.token,
        deckContributor: user.username,
        deck: {
          deckName: deck.deckName,
          deckCase: DEFAULT_DECK_CASE,
          deckYdk: genYdkText(deck),
        },
      });
      if (resp) {
        if (resp.code) {
          message.error(resp.message);
        } else {
          message.success(`Baralho enviado: ${deck.deckName}`);
        }
      } else {
        message.error(
          "Não foi possível enviar o baralho. Verifique a conexão.",
        );
      }
    } else {
      message.error("Entre no MyCard para enviar baralhos online.");
    }
  };

  return (
    <>
      <div className={styles.heading}>
        <h2>Meus decks</h2>
        <Button size="small" onClick={createNewDeck}>
          + Novo deck
        </Button>
      </div>
      <div className={styles["deck-select"]}>
        {decks.map((deck) => (
          <div
            key={deck.deckName}
            className={styles.item}
            onClick={() => onSelect(deck.deckName)}
          >
            <div className={styles.hover} />
            {selected === deck.deckName && <div className={styles.selected} />}
            <img
              className={styles.thumbnail}
              src={getCardImgUrl(deck.main[0] || 0)}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/neos-assets/card_back.jpg";
              }}
            />
            <span className={styles.deckName}>
              <strong>{deck.deckName}</strong>
              <small>{deck.main.length} cartas</small>
            </span>
            <div className={styles.btns}>
              <Button
                icon={<CopyOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(async () => {
                  const result = await onCopy(deck.deckName);
                  result
                    ? message.success(`${i18n("CopySuccessful")}`)
                    : message.error(`${i18n("CopyFailed")}`);
                })}
              />
              <Button
                icon={<DeleteOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(async () => {
                  await onDelete(deck.deckName);
                  onSelect(deckStore.decks[0]?.deckName ?? "");
                })}
              />

              <Button
                icon={<DownloadOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(() => onDownload(deck.deckName))}
              />
              <Button
                icon={<UploadOutlined />}
                type="text"
                size="small"
                onClick={cancelBubble(async () => onUploadMdDeck(deck))}
              />
            </div>
          </div>
        ))}
      </div>
      <Dropdown menu={{ items }} placement="top" arrow trigger={["click"]}>
        <Button
          className={styles["btn-add"]}
          icon={<PlusOutlined />}
          type="text"
          size="large"
        >
          Importar baralho
        </Button>
      </Dropdown>
    </>
  );
};

const DeckUploader: React.FC<{ onLoaded: (deck: IDeck) => void }> = ({
  onLoaded,
}) => {
  const [uploadState, setUploadState] = useState("");
  const { message } = App.useApp();
  const { t: i18n } = useTranslation("DeckSelect");
  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    onChange(info) {
      if (uploadState !== "ERROR") {
        info.file.status = "done";
      }
    },
    accept: ".ydk",
    beforeUpload(file, _) {
      console.log({ file });
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const ydk = e.target?.result as string;
        const deck = YGOProDeck.fromYdkString(ydk);

        if (!(deck.main.length + deck.extra.length + deck.side.length === 0)) {
          // YDK解析成功
          onLoaded({ deckName: file.name.replace(/\.ydk/g, ""), ...deck });
        } else {
          message.error(
            `Não foi possível importar ${file.name}. Verifique o formato.`,
          );
          setUploadState("ERROR");
        }
      };
    },
  };

  return (
    <Uploader
      {...uploadProps}
      text={i18n("ClickOrDragFilesHereToUpload")}
      hint={i18n("SupportsYdkExtension")}
    />
  );
};

/** 阻止事件冒泡 */
const cancelBubble =
  <T,>(fn: (e: React.SyntheticEvent) => T) =>
  (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    return fn(e);
  };
