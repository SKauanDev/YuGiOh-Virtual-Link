import { ygopro } from "@/api";
import { displayOptionModal } from "@/ui/Duel/Message";

export default async (mora: ygopro.StocGameMessage.MsgRockPaperScissors) => {
  const _player = mora.player;

  // TODO: I18n
  await displayOptionModal(
    "Escolha pedra, papel ou tesoura",
    [
      { info: "Pedra", response: 1 },
      { info: "Tesoura", response: 2 },
      { info: "Papel", response: 3 },
    ],
    1,
  );
};
