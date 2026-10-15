import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (
  container: Container,
  flipSummoning: ygopro.StocGameMessage.MsgFlipSummoning,
) => {
  // playEffect(AudioActionType.SOUND_FILP);

  const context = container.context;
  fetchEsHintMeta({
    context: context,
    originMsg: "Quando a Invocação-Virar de [?] é declarada",
    cardID: flipSummoning.code,
  });

  context.historyStore.putFlipSummon(
    context,
    flipSummoning.code,
    flipSummoning.location,
  );
};
