import type { Database } from "sql.js";

export interface PortugueseCards {
  cards: Record<string, { name: string; desc: string }>;
}

let translations: Promise<PortugueseCards> | undefined;
export const loadPortugueseCards = () =>
  (translations ??= fetch(
    `${import.meta.env.BASE_URL}neos-assets/cards-pt.json`,
  ).then((response) => {
    if (!response.ok)
      throw new Error("Não foi possível carregar a tradução das cartas.");
    return response.json();
  }));

export function applyPortugueseCards(
  db: Database,
  translations: PortugueseCards,
) {
  const statement = db.prepare(
    "UPDATE texts SET name = ?, desc = ? WHERE id = ?",
  );
  db.run("BEGIN TRANSACTION");
  try {
    for (const [id, card] of Object.entries(translations.cards)) {
      statement.run([card.name, card.desc, Number(id)]);
    }
    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  } finally {
    statement.free();
  }
}
