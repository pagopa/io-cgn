import { MessageContent } from "@pagopa/io-functions-commons/dist/generated/definitions/MessageContent";
import { format } from "date-fns";
import { Card } from "../generated/definitions/Card";
import { CardRevoked } from "../generated/definitions/CardRevoked";
import { EycaCard } from "../generated/definitions/EycaCard";

export enum MessageTypeEnum {
  "CARD_ACTIVATED" = "CARD_ACTIVATED",
  "CARD_REVOKED" = "CARD_REVOKED",
  "CARD_EXPIRED" = "CARD_EXPIRED",
  "CARD_ERROR" = "CARD_ERROR",
  "EYCA_CARD_EXPIRED" = "EYCA_CARD_EXPIRED"
}

export const MESSAGES = {
  CardRevoked: (card: CardRevoked): MessageContent => {
    const formattedRevocationDate = format(card.revocation_date, "dd-MM-yyyy");
    return {
      subject: "La tua carta è stata revocata",
      markdown: `Ti avvisiamo che la tua Carta Giovani Nazionale è stata revocata il giorno ${formattedRevocationDate} per ${card.revocation_reason}.\n\nNon sarà più possibile utilizzare la carta né nei punti fisici né online.`
    } as MessageContent;
  },
  CardActivated: (): MessageContent =>
    ({
      subject: "La tua Carta Giovani è attiva!",
      markdown: `---\nit:\n    cta_1: \n        text: "Usa la Carta"\n        action: "ioit://CGN_DETAILS"\nen:\n    cta_1: \n        text: "Use Card"\n        action: "ioit://CGN_DETAILS"\n---\nBuone notizie! La tua Carta Giovani Nazionale è attiva. Vai alla sezione Portafoglio per visualizzarla e iniziare a usarla.\n\nRicorda che solo tu puoi accedere alle opportunità messe a disposizione dai partner.\n\nLa Carta Giovani Nazionale sarà valida da oggi fino al compimento dei 36 anni.\n\nInizia subito a usarla!
`
    } as MessageContent),
  CardExpired: (): MessageContent =>
    ({
      subject: "La tua Carta Giovani Nazionale è scaduta",
      markdown: `Ti avvisiamo che da oggi non è più possibile utilizzare la tua Carta Giovani Nazionale.\n\nGrazie per aver partecipato all'iniziativa!`
    } as MessageContent),
  EycaExpired: (): MessageContent =>
    ({
      subject: "La tua Carta EYCA è scaduta",
      markdown: `Ti avvisiamo che da oggi non è più possibile utilizzare la tua Carta Giovani Nazionale per acquisti sul circuito EYCA.\n\nLa Carta rimane valida per gli acquisti in Italia!`
    } as MessageContent),
  CardError: (): MessageContent =>
    ({
      subject: "Abbiamo riscontrato dei problemi",
      markdown: `---\nit:\n    cta_1: \n        text: "Riprova"\n        action: "ioit://CTA_START_CGN"\nen:\n        cta_1: \n        text: "Retry"\n        action: "ioit://CTA_START_CGN"\n---\nCi dispiace, ma per un errore nella lavorazione della tua richiesta, non è stato possibile attivare Carta Giovani Nazionale.\n\nProva ad inserire una nuova richiesta.
      `
    } as MessageContent)
};

export const getMessage = (
  messageType: MessageTypeEnum,
  card: Card | EycaCard
): MessageContent => {
  switch (messageType) {
    case MessageTypeEnum.CARD_ACTIVATED:
      return MESSAGES.CardActivated();
    case MessageTypeEnum.CARD_REVOKED:
      if (!CardRevoked.is(card)) throw new Error("Card is not revoked");
      return MESSAGES.CardRevoked(card);
    case MessageTypeEnum.CARD_EXPIRED:
      return MESSAGES.CardExpired();
    case MessageTypeEnum.EYCA_CARD_EXPIRED:
      return MESSAGES.EycaExpired();
    case MessageTypeEnum.CARD_ERROR:
      return MESSAGES.CardError();
    default:
      throw new Error("Unexpected Card status");
  }
};
