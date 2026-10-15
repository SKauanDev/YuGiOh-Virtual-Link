import { fetchCard } from "@/api";
import type { MdproDeckLike } from "@/api/mdproDeck/schema";

const easternText = /[\u3040-\u30ff\u3400-\u9fff]/;
// Community titles are free text, separate from translated card records.
const archetypes: [RegExp, string][] = [
  [/珠泪|珠淚|ティアラメンツ/, "Lagrimentiara"],
  [/龙女仆|龍女僕|龙女|ドラゴンメイド/, "Dragãozela"],
  [/码丽丝|碼麗絲|マリス/, "Maliss"],
  [/白森林|白き森/, "Floresta Branca"],
  [/灵摆|靈擺|ペンデュラム/, "Pêndulo"],
  [/灵龙|靈龍/, "Dragão Espírito"],
  [/烙印/, "Marcado"],
  [/闪刀|閃刀|閃刀姫/, "Força Celeste"],
  [/废二|廢二/, "Sucata e Doppel"],
  [/杀手旋律|殺手旋律/, "Melodia Assassina"],
  [/青眼|ブルーアイズ/, "Olhos Azuis"],
  [/黑魔导|黑魔導|ブラック・マジシャン/, "Mago Negro"],
  [/红眼|真红眼|真紅眼/, "Olhos Vermelhos"],
  [/相剑|相劍/, "Espadalma"],
  [/蛇眼|スネークアイ/, "Olhos de Cobra"],
  [/天杯|天盃/, "Dragão Tenpai"],
  [/尤贝尔|ユベル/, "Yubel"],
  [/英雄|ヒーロー/, "HERÓI"],
];

export function localizedDeckName(deck: Readonly<MdproDeckLike>): string {
  if (!easternText.test(deck.deckName)) return deck.deckName;
  const themes = archetypes.filter(([pattern]) => pattern.test(deck.deckName));
  if (themes.length) return themes.map(([, name]) => name).join(" / ");
  const cover = deck.deckCoverCard1 && fetchCard(deck.deckCoverCard1)?.text.name;
  if (cover && !easternText.test(cover)) return `Baralho de ${cover}`;
  // An honest descriptive label when an author's custom title has no translation.
  return `Baralho da comunidade #${deck.deckId}`;
}
