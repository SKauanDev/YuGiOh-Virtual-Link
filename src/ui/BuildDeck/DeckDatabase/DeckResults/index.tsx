import { App, Dropdown, message, Pagination } from "antd";
import { MessageInstance } from "antd/es/message/interface";
import Fuse from "fuse.js";
import React, { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type INTERNAL_Snapshot as Snapshot, proxy, useSnapshot } from "valtio";
import YGOProDeck from "ygopro-deck-encode";

import { deleteDeck, getPersonalList, mgetDeck, pullDecks } from "@/api";
import { MdproDeckLike } from "@/api/mdproDeck/schema";
import { useConfig } from "@/config";
import { accountStore } from "@/stores";
import { IconFont, Loading } from "@/ui/Shared";

import { setSelectedDeck } from "../..";
import { editDeckStore } from "../../store";
import { iDeckToEditingDeck } from "../../utils";
import styles from "./index.module.scss";
import { localizedDeckName } from "./localize";

const { assetsPath } = useConfig();

interface Props {
  query: string;
  page: number;
  decks: MdproDeckLike[];
  total: number;
  onlyMine: boolean;
  loaded: boolean;
}

// TODO: useConfig
const PAGE_SIZE = 30;
const SORT_LIKE = true;

const store = proxy<Props>({
  query: "",
  page: 1,
  decks: [],
  total: 0,
  onlyMine: false,
  loaded: false,
});

export const DeckResults: React.FC = memo(() => {
  const snap = useSnapshot(store);
  const { message } = App.useApp();
  const { t: i18n } = useTranslation("DeckResults");
  useEffect(() => {
    resetLoaded();
    if (snap.onlyMine) {
      // show only decks uploaded by myself

      updatePersonalList(message);
    } else {
      updateMdproDeck();
    }
  }, [snap.query, snap.page, snap.onlyMine]);

  const onChangePage = (page: number) => (store.page = page);

  return (
    <>
      {snap.loaded ? (
        snap.decks.length ? (
          <div className={styles.container}>
            <div className={styles["search-decks"]}>
              {snap.decks.map((deck) => (
                <MdproDeckBlock
                  key={deck.deckId}
                  deck={deck}
                  onlyMine={snap.onlyMine}
                />
              ))}
            </div>
            <div style={{ textAlign: "center", padding: "0.625rem 0 1.25rem" }}>
              <Pagination
                current={snap.page}
                onChange={onChangePage}
                total={snap.total}
                pageSize={PAGE_SIZE}
                showLessItems
                hideOnSinglePage
              />
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            <IconFont type="icon-empty" size={40} />
            <div>{i18n("NoDeckGroupFound")}</div>
          </div>
        )
      ) : (
        <div className={styles.empty}>
          <Loading />
        </div>
      )}
    </>
  );
});

const MdproDeckBlock: React.FC<{
  deck: Snapshot<MdproDeckLike>;
  onlyMine: boolean;
}> = ({ deck, onlyMine }) => {
  const { message } = App.useApp();
  const user = accountStore.user;

  const onDelete = async () => {
    if (user) {
      const resp = await deleteDeck(
        user.id,
        user.token,
        deck.deckId,
        user.username,
      );

      if (resp?.code === 0 && resp.data === true) {
        message.success(
          "Baralho excluído. Aguarde alguns instantes e atualize a página.",
        );

        // fresh when deletion succeed
        await updatePersonalList(message);
      } else if (resp !== undefined && resp.message !== "") {
        message.error(resp.message);
      } else {
        message.error(
          "Não foi possível excluir o baralho. Verifique a conexão.",
        );
      }
    } else {
      message.error("Entre no MyCard para excluir baralhos online.");
    }
  };

  const items = [];
  if (onlyMine) {
    items.push({ key: 0, label: "Excluir", danger: true, onClick: onDelete });
  }

  return (
    <Dropdown
      menu={{
        items,
      }}
      trigger={["contextMenu"]}
    >
      <div
        className={styles["mdpro-deck"]}
        onClick={async () => await copyMdproDeckToEditing(deck)}
      >
        <img
          src={`${assetsPath}/deck-cases/DeckCase${deck.deckCase
            .toString()
            .slice(-4)}_L.png`}
        />
        <div className={styles.text}>
          <div title={localizedDeckName(deck)}>{localizedDeckName(deck)}</div>
          <div title={`Autor: ${deck.deckContributor}`}>Por {deck.deckContributor}</div>
        </div>
      </div>
    </Dropdown>
  );
};

export const updateMdproDeck = async () => {
  const resp = await pullDecks({
    page: store.page,
    size: PAGE_SIZE,
    keyWord: store.query !== "" ? store.query : undefined,
    sortLike: SORT_LIKE,
  });

  if (resp?.data) {
    const { total, records: newDecks } = resp.data;
    store.total = total;
    store.decks = newDecks;
  } else {
    store.decks = [];
  }

  finishLoaded();
};

const updatePersonalList = async (message: MessageInstance) => {
  const user = accountStore.user;
  if (user) {
    const resp = await getPersonalList({
      userID: user.id,
      token: user.token,
    });

    if (resp) {
      if (resp.code !== 0 || resp.data === undefined) {
        message.error(resp.message);
      } else {
        let decks = resp.data;

        if (store.query !== "") {
          // use `fuse.js` to search
          const fuse = new Fuse(decks, {
            keys: ["deckName"],
            includeScore: true,
            threshold: 0.3,
          });
          const results = fuse.search(store.query);
          decks = results.map((result) => result.item);
        }

        const total = decks.length;
        store.total = total;
        if (total === 0) {
          store.page = 1;
          store.decks = [];
        } else {
          if (total <= (store.page - 1) * PAGE_SIZE)
            store.page = Math.floor((total - 1) / PAGE_SIZE) + 1;
          store.decks = decks.slice(
            (store.page - 1) * PAGE_SIZE,
            store.page * PAGE_SIZE,
          );
        }
      }
    } else {
      message.error(
        "Não foi possível carregar seus baralhos. Verifique a conexão.",
      );
    }
  } else {
    message.error("Entre no MyCard para consultar seus baralhos online.");
    // set to default
    store.page = 1;
    store.decks = [];
    store.total = 0;
  }

  finishLoaded();
};

const resetLoaded = () => (store.loaded = false);
const finishLoaded = () => (store.loaded = true);

const copyMdproDeckToEditing = async (mdproDeck: MdproDeckLike) => {
  // currently the content of the deck, which we named `Ydk`,
  // haven't been downloaded, so we need to fetch from server again by `mgetDeck`
  // API.

  const deckID = mdproDeck.deckId;
  const resp = await mgetDeck(deckID);

  if (resp?.code !== 0) {
    message.error(resp?.message);
  } else if (resp.data?.deckYdk !== undefined) {
    // 服务端返回的 YDK 可能包含转义的换行符（如 "\\r\\n"），需要转换为标准换行符
    const ydkString = resp.data.deckYdk.replace(/\\r\\n|\\r|\\n/g, "\n");
    const deck = YGOProDeck.fromYdkString(ydkString);

    if (!(deck.main.length + deck.extra.length + deck.side.length === 0)) {
      const deckName = localizedDeckName(mdproDeck);
      const ideck = { deckName, ...deck };
      const editingDeck = await iDeckToEditingDeck(ideck);

      setSelectedDeck(ideck);
      editDeckStore.set(editingDeck);
    } else {
      message.error("Não foi possível interpretar este baralho.");
    }
  } else {
    message.error("Não foi possível copiar este baralho.");
  }
};

export const freshMdrpoDecks = (query: string, onlyMine?: boolean) => {
  store.query = query;

  if (onlyMine !== undefined) store.onlyMine = onlyMine;
};
