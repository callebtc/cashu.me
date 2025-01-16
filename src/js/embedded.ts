/**
 * The event that is sent when the user requests funds from the parent window to the embedded wallet
 */
type RequestFundsEvent = {
  action: "request-funds";
  asset: string;
  amount: number;
};

type ResponseFundsEvent = {
  action: 'proofs',
  proofs: string[],
}

/**
 * The wallet response event that is sent when the wallet has processed the request funds event
 * and that the parent window should make the embeded wallet visible to proceed with the transaction,
 * after getting user approval
 */
type ResponseShowEvent = {
  action: "show",
}

/**
 * Hide iframe
 */
type ResponseHideEvent = {
  action: "hide",
}

type ResponseReadyEvent = {
  action: "ready"
};

type MessageHandlers = {
  [key: string]: (payload: any) => void;
};

export class EmbeddedHandler {
  public readonly isEmbedded: boolean;
  private messageHandlers: MessageHandlers = {};
  private parentOrigin: string | null = null;

  constructor() {
    this.isEmbedded = window.self !== window.top;
    if (!this.isEmbedded) {
      console.error("EmbeddedHandler instantiated but disabled since not running in an iframe")
      return;
    }
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  boot(router: any) {

  }

  /**
   * Sends a message to the parent window.
   * @param message - The message to send.
   */
  sendMessage<T>(message: T) {
    if (!this.parentOrigin) {
      throw new Error('EmbeddedHandler: Parent origin not set.');
    }
    window.parent.postMessage(message, this.parentOrigin);
  }

  sendProofs(proofs: string[]) {
    this.sendMessage<ResponseFundsEvent>({ "action": "proofs", proofs })
  }

  makeVisible() {
    this.sendMessage<ResponseShowEvent>({ "action": "show" })
  }

  makeHidden() {
    this.sendMessage<ResponseHideEvent>({ "action": "hide" })
  }

  ready() {
    this.sendMessage<ResponseReadyEvent>({ "action": "ready" })
  }

  private handleMessage(event: MessageEvent) {
    const { action, payload } = event.data || {};
    if (!action || !this.messageHandlers[action]) {
      console.warn(`EmbeddedHandler: No handler found for message type "${action}".`);
      return;
    }

    if (!this.parentOrigin) {
      this.parentOrigin = event.origin;
    }

    try {
      this.messageHandlers[action](payload);
    } catch (error) {
      console.error(`EmbeddedHandler: Error handling message type "${action}"`, error);
    }
  }

  /**
   * Registers a handler for a specific message type.
   * @param type - The type of the message to handle.
   * @param handler - The function to handle the message.
   */
  registerHandler<T>(type: string, handler: (payload: T) => void) {
    if (this.messageHandlers[type]) {
      console.warn(`EmbeddedHandler: Overwriting existing handler for type "${type}".`);
    }
    this.messageHandlers[type] = handler;
  }
}

export default new EmbeddedHandler
