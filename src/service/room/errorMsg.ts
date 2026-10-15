import { fetchCard, fetchStrings, Region, ygopro } from "@/api";
import ErrorType = ygopro.StocErrorMsg.ErrorType;
import { Container } from "@/container";
import { AudioActionType, playEffect } from "@/infra/audio";

// TODO: 是时候需要一个统一管理国际化文案的模块了

const DECKERROR_LFLIST = 0x1;
const DECKERROR_OCGONLY = 0x2;
const DECKERROR_TCGONLY = 0x3;
const DECKERROR_UNKNOWNCARD = 0x4;
const DECKERROR_CARDCOUNT = 0x5;
const DECKERROR_MAINCOUNT = 0x6;
const DECKERROR_EXTRACOUNT = 0x7;
const DECKERROR_SIDECOUNT = 0x8;
const DECKERROR_NOTAVAIL = 0x9;

// Define the possible language codes (I18N)
type Language = "en" | "br" | "pt" | "fr" | "ja" | "ko" | "es" | "cn";

// Define the structure for the messages (I18N)
const messages: Record<
  Language,
  { mainDeckWarning: string; extraDeckWarning: string }
> = {
  en: {
    mainDeckWarning: "The number of Main Deck should be 40-60 cards",
    extraDeckWarning: "The number of Extra Deck should be 0-15",
  },
  br: {
    mainDeckWarning:
      "O número de cartas no Deck Principal deve ser entre 40-60",
    extraDeckWarning: "O número de cartas no Deck Extra deve ser entre 0-15",
  },
  pt: {
    mainDeckWarning:
      "O número de cartas no Deck Principal deve ser entre 40-60",
    extraDeckWarning: "O número de cartas no Deck Extra deve ser entre 0-15",
  },
  fr: {
    mainDeckWarning:
      "Le nombre de cartes dans le Deck Principal doit être entre 40 et 60",
    extraDeckWarning:
      "Le nombre de cartes dans le Deck Extra doit être entre 0 et 15",
  },
  ja: {
    mainDeckWarning: "メインデッキの枚数は40～60枚でなければなりません",
    extraDeckWarning: "エクストラデッキの枚数は0～15枚でなければなりません",
  },
  ko: {
    mainDeckWarning: "메인 덱의 카드 수는 40-60장이어야 합니다",
    extraDeckWarning: "엑스트라 덱의 카드 수는 0-15장이어야 합니다",
  },
  es: {
    mainDeckWarning:
      "El número de cartas en el Mazo Principal debe ser entre 40-60",
    extraDeckWarning:
      "El número de cartas en el Mazo Extra debe ser entre 0-15",
  },
  cn: {
    mainDeckWarning: "主卡组数量应为40-60张",
    extraDeckWarning: "额外卡组数量应为0-15张",
  },
};
/* End of definition (I18N) */

export default async function handleErrorMsg(
  container: Container,
  errorMsg: ygopro.StocErrorMsg,
) {
  const { error_type, error_code } = errorMsg;
  playEffect(AudioActionType.SOUND_INFO);

  const roomStore = container.context.roomStore;

  // Get the language from localStorage or default to 'cn' (I18N)
  const language = (localStorage.getItem("language") || "cn") as Language;
  const mainDeckWarning = messages[language].mainDeckWarning;
  //const extraDeckWarning = messages[language].extraDeckWarning;

  switch (error_type) {
    case ErrorType.JOINERROR: {
      roomStore.errorMsg = fetchStrings(Region.System, 1403 + error_code);
      break;
    }
    case ErrorType.DECKERROR: {
      const flag = error_code >> 28;
      const code = error_code & 0xfffffff;
      const card = fetchCard(code);
      const baseMsg = `Baralho inválido. Verifique: ${card.text.name}`;
      switch (flag) {
        case DECKERROR_LFLIST: {
          roomStore.errorMsg = baseMsg + " (quantidade fora da lista de restrições)";
          break;
        }
        case DECKERROR_OCGONLY: {
          roomStore.errorMsg = baseMsg + " (carta exclusiva do OCG)";
          break;
        }
        case DECKERROR_TCGONLY: {
          roomStore.errorMsg = baseMsg + " (carta exclusiva do TCG)";
          break;
        }
        case DECKERROR_UNKNOWNCARD: {
          if (code < 100000000) {
            roomStore.errorMsg =
              baseMsg + " (o servidor ainda não reconhece esta carta)";
          } else {
            roomStore.errorMsg =
              baseMsg +
              " (o servidor não reconhece esta carta de pré-lançamento)";
          }
          break;
        }
        case DECKERROR_CARDCOUNT: {
          roomStore.errorMsg = baseMsg + " (quantidade excedida)";
          break;
        }
        case DECKERROR_MAINCOUNT: {
          roomStore.errorMsg = mainDeckWarning;
          break;
        }
        case DECKERROR_EXTRACOUNT: {
          roomStore.errorMsg = "O Deck Adicional deve conter entre 0 e 15 cartas.";
          break;
        }
        case DECKERROR_SIDECOUNT: {
          roomStore.errorMsg = "O Deck Auxiliar deve conter entre 0 e 15 cartas.";
          break;
        }
        case DECKERROR_NOTAVAIL: {
          roomStore.errorMsg = `${card.text.name} não é permitida nas regras atuais.`;
          break;
        }
        default: {
          roomStore.errorMsg = fetchStrings(Region.System, 1406);
          break;
        }
      }
      break;
    }
    case ErrorType.SIDEERROR: {
      roomStore.errorMsg = "Falha ao trocar o Deck Auxiliar. Confira as quantidades.";
      break;
    }
    case ErrorType.VERSIONERROR: {
      roomStore.errorMsg = "Versão incompatível com o servidor.";
      break;
    }
    default:
      break;
  }
}
