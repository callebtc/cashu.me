type RequestFundsPayload = {
  asset: string;
  amount: number;
};

type RequestFundsResponse = {
  proofs: string[],
};

class IframeOverlayManager {
  private iframe: HTMLIFrameElement;
  private backdrop: HTMLDivElement;
  private isVisible: boolean = false;
  private booting: boolean = true;
  private bootInterval: any;

  constructor(iframeSrc: string) {
    this.backdrop = document.createElement("div");
    this.backdrop.style.position = "fixed";
    this.backdrop.style.top = "0";
    this.backdrop.style.left = "0";
    this.backdrop.style.width = "100vw";
    this.backdrop.style.height = "100vh";
    this.backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.backdrop.style.zIndex = "9998";
    this.backdrop.style.display = "none";

    this.iframe = document.createElement("iframe");
    this.iframe.src = iframeSrc;
    this.iframe.style.position = "fixed";
    this.iframe.style.top = "0";
    this.iframe.style.left = "0";
    this.iframe.style.width = "400px";
    this.iframe.style.height = "300px";
    this.iframe.style.border = "none";
    this.iframe.style.zIndex = "9999";
    this.iframe.style.display = "none"; // Hidden by default
    this.iframe.style.background = "white"; // Optional: Set a background color

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.iframe);

    // Listen for messages from the iframe
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    const { action, ...payload } = event.data || {};

    if (action === "show") {
      this.showIframe();
    } else if (action === "hide") {
      this.hideIframe();
    } else if (action === "proofs") {
      this.handleRequestFundsResponse(payload);
    } else if (action === "ready") {
      this.booting = false;
      clearInterval(this.bootInterval);
    }
  }

  private showIframe() {
    if (!this.isVisible) {

      // Calculate viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate positions to center the iframe
      const left = (viewportWidth - parseInt(this.iframe.style.width)) / 2; // 200px width
      const top = (viewportHeight - parseInt(this.iframe.style.height)) / 2; // 200px height

      // Apply calculated positions
      this.iframe.style.left = `${left}px`;
      this.iframe.style.top = `${top}px`;

      this.iframe.style.display = "block";
      this.backdrop.style.display = "block";
      this.isVisible = true;
      console.log("IframeOverlayManager: Iframe is now visible.");
    }
  }

  private hideIframe() {
    if (this.isVisible) {
      this.iframe.style.display = "none";
      this.backdrop.style.display = "none";
      this.isVisible = false;
      console.log("IframeOverlayManager: Iframe is now hidden.");
    }
  }

  boot() {
    if (!this.iframe.contentWindow) {
      const that = this;
      setTimeout(() => {
        that.boot();
      })
      return;
    }

    if (this.bootInterval) {
      clearInterval(this.bootInterval);
    }

    this.bootInterval = setInterval(() => {
      this.iframe.contentWindow?.postMessage({ action: "ping" }, "*");
    }, 1);
  }

  /**
   * Requests funds from the iframe and handles the response.
   * @param payload - The payload containing asset and amount.
   * @param onResponse - A callback function to handle the response.
   */
  requestFunds(payload: RequestFundsPayload, onResponse: (response: RequestFundsResponse) => void) {
    if (this.booting) {
      const that = this;
      return setTimeout(() => {
        that.requestFunds(payload, onResponse);
      })

    }

    // Send the request-funds message to the iframe
    this.iframe.contentWindow?.postMessage(
      {
        action: "request-funds",
        payload,
      },
      "*"
    );

    // Store the callback to handle the response
    this.requestFundsCallback = onResponse;
  }

  private requestFundsCallback: ((response: RequestFundsResponse) => void) | null = null;

  private handleRequestFundsResponse(response: RequestFundsResponse) {
    if (this.requestFundsCallback) {
      this.requestFundsCallback(response);
      this.requestFundsCallback = null; // Clear the callback after handling
    }
  }
}

// Example usage
const iframeSrc = "https://localhost:8080/embedded";
window.cashu = new IframeOverlayManager(iframeSrc);
window.cashu.boot();
