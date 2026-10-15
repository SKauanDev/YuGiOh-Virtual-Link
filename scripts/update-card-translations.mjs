import { readFile, writeFile } from "node:fs/promises";

const source = "https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt";
const input = process.argv[2];
const payload = input
  ? JSON.parse(await readFile(input, "utf8"))
  : await fetch(source).then(response => {
      if (!response.ok) throw new Error(`Translation download failed: ${response.status}`);
      return response.json();
    });
if (!Array.isArray(payload.data) || !payload.data.length) throw new Error("Empty card database");
const cards = {};
for (const card of payload.data) {
  if (!card.id || !card.name || !card.desc) continue;
  const text = { name: card.name, desc: card.desc };
  cards[card.id] = text;
  for (const image of card.card_images ?? []) cards[image.id] = text;
}
await writeFile(new URL("../neos-assets/cards-pt.json", import.meta.url), JSON.stringify({ source, language: "pt", updated: new Date().toISOString(), cards }));
console.log(`Stored Portuguese text for ${Object.keys(cards).length} card IDs.`);
