import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  RetweetOutlined,
  SwapOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { App, Button, Drawer, Input, message, Space, Tooltip } from "antd";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd-multi-backend";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate, useSearchParams } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";

import { type CardMeta } from "@/api";
import { isExtraDeckCard } from "@/common";
import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore, emptyDeck, type IDeck, initStore } from "@/stores";
import {
  DeckCardMouseUpEvent,
  DeckZone,
  Loading,
  ScrollableArea,
  Select,
  YgoCard,
} from "@/ui/Shared";
import { Type } from "@/ui/Shared/DeckZone";

import { CardDetail } from "./CardDetail";
import { DeckDatabase } from "./DeckDatabase";
import { DeckSelect } from "./DeckSelect";
import styles from "./index.module.scss";
import { editDeckStore } from "./store";
import {
  copyDeckToClipboard,
  downloadDeckAsYDK,
  editingDeckToIDeck,
  iDeckToEditingDeck,
} from "./utils";

const ENV_OCG = 0;
const ENV_408 = 1;

export const loader: LoaderFunction = async () => {
  // 必须先加载卡组，不然页面会崩溃
  if (!initStore.decks) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "decks", (done) => done && rs());
    });
  }

  // 同时，等待禁卡表的加载
  if (!initStore.forbidden) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "forbidden", (done) => done && rs());
    });
  }

  // 最后，等待I18N文案的加载
  if (!initStore.i18n) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "i18n", (done) => done && rs());
    });
  }

  // 更新场景
  changeScene(AudioActionType.BGM_DECK);

  return null;
};

export const selectedCard = proxy({
  id: 23995346,
  open: false,
});

const selectedDeck = proxy<{ deck: IDeck }>({
  deck: deckStore.decks.at(0) ?? emptyDeck,
});

export const setSelectedDeck = (deck: IDeck) => {
  selectedDeck.deck = deck;
};

export const Component: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const snapDecks = useSnapshot(deckStore);
  const { progress } = useSnapshot(initStore.sqlite);
  const { deck: snapSelectedDeck } = useSnapshot(selectedDeck);

  const { message } = App.useApp();
  const { t: i18n } = useTranslation("BuildDeck");
  const handleDeckEditorReset = async () => {
    editDeckStore.set(await iDeckToEditingDeck(selectedDeck.deck as IDeck));
    message.info(`${i18n("ResetSuccessful")}`);
  };

  const handleDeckEditorSave = async () => {
    const tmpIDeck = editingDeckToIDeck(editDeckStore);
    const result = await deckStore.update(selectedDeck.deck.deckName, tmpIDeck);
    if (result) {
      setSelectedDeck(tmpIDeck);
      message.info(`${i18n("SaveSuccessful")}`);
      editDeckStore.edited = false;
    } else {
      editDeckStore.set(await iDeckToEditingDeck(selectedDeck.deck as IDeck));
      message.error("Não foi possível salvar o baralho.");
      editDeckStore.edited = false;
    }
  };

  const handleDeckEditorShuffle = () => {
    editDeckStore.shuffle(editDeckStore);
  };

  const handleDeckEditorSort = () => {
    editDeckStore.sort(editDeckStore);
  };

  return (
    <DndProvider options={HTML5toTouch}>
      <div className={styles.layout}>
        <div className={styles.sider}>
          <ScrollableArea className={styles["deck-select-container"]}>
            <DeckSelect
              decks={snapDecks.decks as IDeck[]}
              selected={snapSelectedDeck.deckName}
              onSelect={(name) =>
                setSelectedDeck(deckStore.get(name) ?? emptyDeck)
              }
              onDelete={async (name) => await deckStore.delete(name)}
              onDownload={(name) => {
                const deck = deckStore.get(name);
                if (deck) downloadDeckAsYDK(deck);
              }}
              onCopy={async (name) => {
                const deck = deckStore.get(name);
                if (deck) return await copyDeckToClipboard(deck);
                else return false;
              }}
            />
          </ScrollableArea>
          <HigherCardDetail />
        </div>
        <div className={styles.content}>
          {progress === 1 ? (
            <>
              <div className={styles.deck}>
                <DeckEditor
                  deck={snapSelectedDeck as IDeck}
                  onClear={editDeckStore.clear}
                  onReset={handleDeckEditorReset}
                  onSave={handleDeckEditorSave}
                  onShuffle={handleDeckEditorShuffle}
                  onSort={handleDeckEditorSort}
                />
              </div>
            </>
          ) : (
            <div className={styles.container}>
              <Loading progress={progress * 100} />
            </div>
          )}
        </div>
      </div>
      <Drawer
        title="Coleção de cartas"
        open={searchParams.has("collection")}
        onClose={() => setSearchParams({})}
        width={560}
      >
        {progress === 1 ? (
          <DeckDatabase />
        ) : (
          <Loading progress={progress * 100} />
        )}
      </Drawer>
    </DndProvider>
  );
};
Component.displayName = "Build";

/** 正在编辑的卡组 */
export const DeckEditor: React.FC<{
  deck: IDeck;
  onShuffle: () => void;
  onSort: () => void;
  onClear: () => void;
  onReset: () => void;
  onSave: () => void;
}> = ({ deck, onClear, onReset, onSave, onShuffle, onSort }) => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const testHand = () => {
    const cards = [...editDeckStore.main];
    if (cards.length === 0) {
      message.info("Adicione cartas ao baralho para testar sua mão.");
      return;
    }
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    modal.info({
      title: "Sua mão inicial",
      width: 620,
      icon: null,
      okText: "Voltar ao baralho",
      content: (
        <div>
          <p style={{ marginBottom: 16 }}>
            Cinco cartas aleatórias do seu baralho principal.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {cards.slice(0, 5).map((card, index) => (
              <YgoCard key={index} code={card.id} width="18%" />
            ))}
          </div>
        </div>
      ),
    });
  };
  const snapEditDeck = useSnapshot(editDeckStore);
  const [deckName, setDeckName] = useState(editDeckStore.deckName);
  const [env, setEnv] = useState(ENV_OCG);

  const handleEnvChange = (value: any) => setEnv(value);

  useEffect(() => {
    iDeckToEditingDeck(deck).then(editDeckStore.set);
    setDeckName(deck.deckName);
  }, [deck]);
  useEffect(() => {
    editDeckStore.deckName = deckName;
  }, [deckName]);

  const handleSwitchCard = (type: Type, card: CardMeta) => {
    const cardType = card.data.type ?? 0;
    const isSide = type === "side";
    const targetType = isSide
      ? isExtraDeckCard(cardType)
        ? "extra"
        : "main"
      : "side";
    const { result, reason } = editDeckStore.canAdd(card, targetType, type);
    if (result) {
      editDeckStore.remove(type, card);
      editDeckStore.add(targetType, card);
    } else {
      message.error(reason);
    }
  };

  const showSelectedCard = (card: CardMeta) => {
    selectedCard.id = card.id;
    selectedCard.open = true;
  };

  const handleMouseUp = (
    type: "main" | "extra" | "side",
    payload: DeckCardMouseUpEvent,
  ) => {
    const { event, card } = payload;
    switch (event.button) {
      // 左键
      case 0:
        showSelectedCard(card);
        break;
      // 中键
      case 1:
        handleSwitchCard(type, card);
        break;
      // 右键
      case 2:
        editDeckStore.remove(type, card);
        break;
      default:
        break;
    }
    event.preventDefault();
  };
  const { t: i18n } = useTranslation("BuildDeck");
  return (
    <div className={styles.container}>
      <Space className={styles.title} wrap>
        <Input
          placeholder={i18n("EnterTheDeckName")}
          variant="borderless"
          prefix={<EditOutlined />}
          style={{ width: "13rem" }}
          onChange={(e) => setDeckName(e.target.value)}
          value={deckName}
        />
        <Space style={{ marginRight: "0.4rem" }} size={5} wrap>
          <Select
            title={i18n("Environment")}
            value={env}
            options={[
              {
                value: ENV_OCG,
                label: "OCG",
              },
              {
                value: ENV_408,
                label: "408",
              },
            ]}
            onChange={handleEnvChange}
          />
          <Button
            type="text"
            size="small"
            icon={<SwapOutlined />}
            onClick={onShuffle}
          >
            {i18n("Shuffle")}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<RetweetOutlined />}
            onClick={onSort}
          >
            {i18n("Sort")}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={onClear}
          >
            {i18n("Clear")}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<UndoOutlined />}
            onClick={() => onReset()}
          >
            {i18n("Reset")}
          </Button>
          <Tooltip title={i18n("QuestionCircleTooltip")}>
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      </Space>
      <ScrollableArea className={styles["deck-zone"]}>
        {(["main", "extra", "side"] as const).map((type) => (
          <DeckZone
            key={type}
            type={type}
            cards={[...snapEditDeck[type]]}
            canAdd={editDeckStore.canAdd}
            onChange={(card, source, destination) => {
              editDeckStore.add(destination, card);
              if (source !== "search") {
                editDeckStore.remove(source, card);
              }
            }}
            onElementMouseUp={(event) => handleMouseUp(type, event)}
            onDoubleClick={(card) => {
              if (editDeckStore.canAdd(card, type, "search").result) {
                editDeckStore.add(type, card);
              }
            }}
            is408={env === ENV_408}
          />
        ))}
      </ScrollableArea>
      <div className={styles.editorFooter}>
        <Button onClick={() => navigate("/build?collection=1")}>
          Adicionar cartas
        </Button>
        <span>
          {snapEditDeck.edited
            ? "Alterações não salvas"
            : "Baralho salvo neste navegador"}
        </span>
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => onSave()}
          >
            {i18n("Save")}
          </Button>
          <Button onClick={testHand}>Testar mão</Button>
        </Space>
      </div>
    </div>
  );
};

const HigherCardDetail: React.FC = () => {
  const { id, open } = useSnapshot(selectedCard);
  return (
    <CardDetail
      open={open}
      code={id}
      onClose={() => (selectedCard.open = false)}
    />
  );
};
