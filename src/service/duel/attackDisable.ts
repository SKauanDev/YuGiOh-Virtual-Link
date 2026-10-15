import { ygopro } from "@/api";
import { Container } from "@/container";

import { fetchEsHintMeta } from "./util";

export default (
  container: Container,
  _: ygopro.StocGameMessage.MsgAttackDisabled,
) => {
  fetchEsHintMeta({ context: container.context, originMsg: "Quando um ataque é negado" });
};
