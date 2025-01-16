
export function registerBroadcastChannel(router: any) {
  // uses session storage to identify the tab so we can ignore incoming messages from the same tab
  if (!sessionStorage.getItem("tabId")) {
    sessionStorage.setItem(
      "tabId",
      Math.random().toString(36).substring(2) +
      new Date().getTime().toString(36)
    );
  }

  const tabId = sessionStorage.getItem("tabId");
  const channel = new BroadcastChannel("app_channel");
  const announcement = { type: "new_tab_opened", senderId: tabId };

  channel.onmessage = async (event) => {
    // console.log("Received message in tab " + tabId, event.data);
    if (event.data.senderId === tabId) {
      return; // Ignore the message if it comes from the same tab
    }
    if (event.data.type == "new_tab_opened") {
      channel.postMessage({ type: "already_running", senderId: tabId });
    } else if (event.data.type == "already_running") {
      router.push("/already-running");
    }
  };

  channel.postMessage(announcement);
}
