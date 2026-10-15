import { expect, test } from "@playwright/test";
import path from "node:path";
import initSqlJs from "sql.js";

import {
  advanceReplayTo,
  pauseReplay,
  ReplayAdvanceFlag,
  uploadReplay,
} from "./helpers/replay";

test("Portuguese collection, guest modes, video background and sand navigation", async ({
  page,
}) => {
  test.setTimeout(120000);
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER PRIMARY KEY, ot INTEGER, alias INTEGER, setcode INTEGER, type INTEGER, atk INTEGER, def INTEGER, level INTEGER, race INTEGER, attribute INTEGER, category INTEGER)",
  );
  db.run(
    `CREATE TABLE texts (id INTEGER PRIMARY KEY, name TEXT, desc TEXT, ${Array.from(
      { length: 16 },
      (_, i) => `str${i + 1} TEXT`,
    ).join(", ")})`,
  );
  db.run("INSERT INTO datas VALUES (46986414,3,0,0,17,2500,2100,7,2,32,0)");
  db.run(
    "INSERT INTO texts (id,name,desc) VALUES (46986414,'Dark Magician','The ultimate wizard.')",
  );
  const database = Buffer.from(db.export());
  db.close();
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("test-seeded")) {
      localStorage.setItem("language", "ja");
      sessionStorage.setItem("test-seeded", "true");
    }
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (["localhost", "127.0.0.1"].includes(url.hostname))
      return route.continue();
    if (url.pathname.endsWith(".cdb"))
      return route.fulfill({
        body: database,
        contentType: "application/octet-stream",
      });
    if (url.pathname.endsWith(".conf"))
      return route.fulfill({ body: "", contentType: "text/plain" });
    if (url.pathname.endsWith("test-release-v2.json"))
      return route.fulfill({ json: [] });
    if (url.pathname.endsWith("/deck/list"))
      return route.fulfill({
        json: { code: 0, data: { total: 2, records: [
          { deckId: "101", deckName: "闪刀姬", deckContributor: "Giotto", deckCase: 1 },
          { deckId: "102", deckName: "未知标题", deckContributor: "Autor", deckCase: 1, deckCoverCard1: 46986414 },
        ] } },
      });
    return route.fulfill({ body: "", contentType: "text/plain" });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const packets: Buffer[] = [];
  await page.routeWebSocket(/wss:\/\/koishi\.momobako\.com:7211/, (ws) => {
    ws.onMessage((data) => packets.push(Buffer.from(data)));
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Iniciar jogo", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("language"))).toBe(
    "br",
  );
  const video = page.getByTestId("arena-background-video");
  await expect(video).toHaveCount(1);
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.videoWidth),
    )
    .toBe(1920);
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0);
  await page.evaluate(() => {
    localStorage.setItem("arena-motion", "paused");
    window.dispatchEvent(new Event("arena-motion-change"));
  });
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true);
  await page.screenshot({
    path: "screenshots/egyptian-home.png",
    animations: "disabled",
  });
  await page.getByRole("link", { name: /Decks$/ }).click();
  await expect(page.getByTestId("sand-transition")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Salvar$/ })).toBeVisible();
  await page.getByPlaceholder("Nome do deck").fill("Baralho de teste");
  await page.getByRole("button", { name: /Salvar$/ }).click();
  await expect(
    page.getByText("Salvo com sucesso", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "screenshots/egyptian-editor.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: /Coleção$/ }).click();
  const collection = page.getByRole("dialog").filter({ hasText: "Coleção de cartas" });
  await expect(collection).toBeVisible();
  await collection
    .getByPlaceholder("Palavras-chave (separadas por espaços)")
    .fill("Mago Negro");
  await collection
    .getByPlaceholder("Palavras-chave (separadas por espaços)")
    .press("Enter");
  await expect(
    collection.getByLabel("Mago Negro", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    collection.getByLabel("Mago Negro", { exact: true }).first(),
  ).toHaveAttribute("title", /O mago definitivo/);
  await page.screenshot({
    path: "screenshots/egyptian-collection.png",
    animations: "disabled",
  });
  await collection.getByRole("button", { name: "Close", exact: true }).click();
  // Hovering the search card opens the native preview; its zoom stays centered.
  await page.getByRole("button", { name: /Coleção$/ }).click();
  await collection.getByLabel("Mago Negro", { exact: true }).first().hover();
  await collection.getByRole("button", { name: "Close", exact: true }).click();
  const preview = page.getByRole("button", { name: "Ampliar carta em português" });
  await expect(preview).toBeVisible();
  await preview.hover();
  await expect.poll(async () => preview.evaluate(el => {
    const box = el.getBoundingClientRect();
    const parent = el.parentElement!.getBoundingClientRect();
    return box.left >= parent.left && box.right <= parent.right &&
      Math.abs((box.left + box.right) - (parent.left + parent.right)) < 2;
  })).toBe(true);
  await preview.click();
  const detail = page.getByRole("dialog").filter({ hasText: "O mago definitivo" });
  await expect(detail).toBeVisible();
  await expect(page.locator('a[href*="ygocdb.com"]')).toHaveCount(0);
  await detail.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: /Coleção$/ }).click();
  await collection.getByRole("button", { name: /Deck Online MDPro/ }).click();
  await expect(collection.getByText("Força Celeste", { exact: true })).toBeVisible();
  await expect(collection.getByText("Baralho de Mago Negro", { exact: true })).toBeVisible();
  await expect(collection.getByText("Por Giotto", { exact: true })).toBeVisible();
  await collection.getByRole("button", { name: "Close", exact: true }).click();
  for (let index = 0; index < 2; index++) {
    await page.getByRole("link", { name: /Partidas$/ }).click();
    await expect(
      page.getByRole("heading", { name: "Duelo contra IA", exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Decks$/ }).click();
    await page.getByRole("button", { name: /Limpar$/ }).click();
    await page.getByRole("button", { name: /undo Redefinir/ }).click();
  }
  await page.getByRole("link", { name: /Partidas$/ }).click();
  await expect(page.getByTestId("match-mode-ai")).toBeVisible();
  await page.mouse.move(500, 50);
  await page.screenshot({
    path: "screenshots/egyptian-modes.png",
    animations: "disabled",
  });
  for (const [tab, id] of [
    ["CONTRA IA", "match-mode-ai"],
    ["SALA PRIVADA", "match-mode-custom-room"],
    /*["REPLAYS", "match-mode-replay"],*/
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await page.getByTestId(id).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toContainText(/login|Mengka|MyCard/i);
    if (id === "match-mode-ai")
      await page.screenshot({
        path: "screenshots/egyptian-room.png",
        animations: "disabled",
      });
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  await page.getByRole("tab", { name: "CONTRA IA", exact: true }).click();
  await page.getByTestId("match-mode-ai").click();
  await page.getByTestId("match-modal-player").fill("Teste Visitante");
  await page.getByTestId("match-modal-join").click();
  await expect.poll(() => packets.length).toBeGreaterThanOrEqual(2);
  expect(
    packets.some((packet) =>
      packet.includes(Buffer.from("Teste Visitante", "utf16le")),
    ),
  ).toBe(true);
  expect(
    packets.some((packet) => packet.includes(Buffer.from("AI", "utf16le"))),
  ).toBe(true);
  await expect(video).toHaveCount(1);

  await uploadReplay(
    page,
    path.resolve("tests/e2e/fixtures/replays/1/replay.yrp3d"),
  );
  await pauseReplay(page);
  await expect(page.getByTestId("duel-zone")).toHaveCount(32);
  await expect(page.getByLabel("Zona de Monstro 1", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Zona de Monstro Extra 1", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Deck Principal", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Cemitério", { exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-testid="duel-card"][data-card-zone="DECK"]',
          ),
        );
        const errors = cards.flatMap((card) => {
          const zone = document.querySelector<HTMLElement>(
            `[data-testid="duel-zone"][data-zone="DECK"][data-controller="${card.dataset.cardController}"]`,
          );
          if (!zone) return [];
          const cardRect = card.getBoundingClientRect();
          const zoneRect = zone.getBoundingClientRect();
          return [
            Math.hypot(
              cardRect.left + cardRect.width / 2 -
                (zoneRect.left + zoneRect.width / 2),
              cardRect.top + cardRect.height / 2 -
                (zoneRect.top + zoneRect.height / 2),
            ),
          ];
        });
        return errors.length ? Math.max(...errors) : Number.MAX_VALUE;
      }),
    )
    .toBeLessThan(2.5);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (await page.locator('[data-testid="duel-card"][data-card-zone="MZONE"]').count())
      break;
    const toggle = page.getByTestId("replay-toggle");
    const previousIndex = Number(await toggle.getAttribute("data-replay-index"));
    await advanceReplayTo(page, ReplayAdvanceFlag.MOVE);
    await expect
      .poll(async () => ({
        advanced:
          Number(await toggle.getAttribute("data-replay-index")) > previousIndex,
        waiting: (await toggle.getAttribute("data-replay-waiting")) === "true",
      }))
      .toEqual({ advanced: true, waiting: true });
  }
  await expect(
    page.locator('[data-testid="duel-card"][data-card-zone="MZONE"]'),
  ).not.toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-testid="duel-card"][data-card-zone="MZONE"]',
          ),
        );
        const errors = cards.flatMap((card) => {
          const zone = document.querySelector<HTMLElement>(
            `[data-testid="duel-zone"][data-zone="MZONE"][data-controller="${card.dataset.cardController}"][data-sequence="${card.dataset.cardSequence}"]`,
          );
          if (!zone) return [];
          const cardRect = card.getBoundingClientRect();
          const zoneRect = zone.getBoundingClientRect();
          return [
            Math.hypot(
              cardRect.left + cardRect.width / 2 -
                (zoneRect.left + zoneRect.width / 2),
              cardRect.top + cardRect.height / 2 -
                (zoneRect.top + zoneRect.height / 2),
            ),
          ];
        });
        return errors.length ? Math.max(...errors) : Number.MAX_VALUE;
      }),
    )
    .toBeLessThan(2.5);
  await page.screenshot({
    path: "screenshots/egyptian-duel-alignment.png",
    animations: "disabled",
  });
  await page.screenshot({
    path: "screenshots/egyptian-life-odometer.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 927, height: 738 });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const card = document.querySelector<HTMLElement>(
          '[data-testid="duel-card"][data-card-zone="MZONE"]',
        );
        if (!card) return Number.MAX_VALUE;
        const zone = document.querySelector<HTMLElement>(
          `[data-testid="duel-zone"][data-zone="MZONE"][data-controller="${card.dataset.cardController}"][data-sequence="${card.dataset.cardSequence}"]`,
        );
        if (!zone) return Number.MAX_VALUE;
        const cardRect = card.getBoundingClientRect();
        const zoneRect = zone.getBoundingClientRect();
        return Math.hypot(
          cardRect.left + cardRect.width / 2 -
            (zoneRect.left + zoneRect.width / 2),
          cardRect.top + cardRect.height / 2 -
            (zoneRect.top + zoneRect.height / 2),
        );
      }),
    )
    .toBeLessThan(2.5);
  await page.screenshot({
    path: "screenshots/egyptian-duel-alignment-compact.png",
    animations: "disabled",
  });
  const duelText = await page.locator("body").innerText();
  expect(duelText).not.toMatch(/[一-龯ぁ-ヿ]/);
  await page.screenshot({
    path: "screenshots/egyptian-duel-arena.png",
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});
