<template>
  <div style="max-width: 800px; margin: 0 auto">
    <!-- ////////////////////// SETTINGS ////////////////// -->
    <div class="q-px-xs text-left" on-left>
      <q-list padding>
        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold"
              >Backup seed phrase</q-item-label
            >
            <q-item-label caption
              >Your seed phrase can restore your wallet. Keep it safe and
              private.
            </q-item-label>
            <div class="row q-pt-md">
              <div class="col-12">
                <q-input
                  outlined
                  readonly
                  v-model="hiddenMnemonic"
                  label="Seed phrase"
                  class="seed-phrase"
                  autogrow
                >
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      icon="visibility"
                      color="primary"
                      class="cursor-pointer q-mt-md"
                      @click="toggleMnemonicVisibility"
                    ></q-btn>
                    <q-btn
                      flat
                      dense
                      icon="content_copy"
                      color="primary"
                      class="cursor-pointer q-mt-md"
                      @click="copyText(mnemonic)"
                    ></q-btn>
                  </template>
                </q-input>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- restore -->
    <div class="q-py-sm q-px-xs text-left" on-left>
      <q-list padding>
        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold"
              >Restore ecash</q-item-label
            >
            <q-item-label caption
              >The restore wizard lets you recover lost ecash from a mnemonic
              seed phrase. The seed phrase of your current wallet will remain
              unaffected, the wizard will only allow you to <i>restore</i> ecash
              from another seed phrase.</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-item>
          <q-btn
            class="q-ml-sm q-px-md"
            color="primary"
            size="sm"
            rounded
            outline
            to="/restore"
            >Restore</q-btn
          >
        </q-item>
      </q-list>
    </div>
    <!-- nostr -->
    <div class="q-py-sm q-px-sm text-left" on-left>
      <q-list padding>
        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold"
              >Lightning address</q-item-label
            >
            <q-item-label caption
              >Receive payments to your Lightning address.</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-item class="q-px-md">
          <q-item-section class="q-mx-none q-pl-none">
            <!-- toggle to turn Lightning address on and off in new row -->
            <div class="row q-pt-md">
              <q-toggle v-model="npcEnabled" color="primary" />
              <q-item-section>
                <q-item-label title>Enable</q-item-label>
                <q-item-label caption>
                  Lightning address with npub.cash
                </q-item-label>
              </q-item-section>
            </div>
          </q-item-section>
        </q-item>
        <div v-if="npcEnabled" class="q-px-xs">
          <q-item v-if="npcEnabled">
            <div class="row">
              <div class="col-12">
                <q-input outlined v-model="npcAddress" dense rounded readonly>
                  <template v-slot:append>
                    <q-spinner-hourglass size="sm" v-if="npcLoading" />
                    <q-icon
                      name="content_copy"
                      @click="copyText(npcAddress)"
                      size="0.8em"
                      color="grey"
                      class="q-mr-sm cursor-pointer"
                    >
                      <q-tooltip>Copy Lightning address</q-tooltip>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="row q-pt-md">
                <q-toggle v-model="automaticClaim" color="primary" />
                <q-item-section>
                  <q-item-label title>Claim automatically</q-item-label>
                  <q-item-label caption
                    >Receive incoming payments automatically.
                  </q-item-label>
                </q-item-section>
              </div>
            </div>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>Your nostr keys</q-item-label>
              <q-item-label caption
                >Set the nostr keys for your Lightning address.</q-item-label
              >
            </q-item-section>
          </q-item>
          <!-- initWalletSeedPrivateKeySigner -->
          <q-item
            :active="signerType === 'SEED'"
            active-class="text-weight-bold text-primary"
            clickable
          >
            <q-item-section avatar>
              <q-icon
                :color="signerType === 'SEED' ? 'primary' : 'grey'"
                :name="
                  signerType === 'SEED'
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                "
                @click="handleSeedClick"
                class="cursor-pointer"
              />
            </q-item-section>
            <q-item-section
              lines="1"
              class="cursor-pointer"
              style="word-break: break-word"
            >
              <q-item-label title>Wallet seed phrase</q-item-label>
              <q-item-label caption
                >Generate nostr key pair from wallet seed
              </q-item-label>
              <q-item-label
                caption
                v-if="signerType === 'SEED' && seedSignerPrivateKeyNsec"
              >
                <q-badge
                  class="cursor-pointer q-mt-xs"
                  @click="copyText(seedSignerPrivateKeyNsec)"
                  outline
                  color="grey"
                >
                  <q-icon
                    name="content_copy"
                    size="0.8em"
                    color="grey"
                    class="q-mr-xs"
                  ></q-icon
                  >Copy nsec
                </q-badge>
              </q-item-label>
            </q-item-section>
          </q-item>
          <!-- Nip46Signer -->
          <q-item
            :active="signerType === 'NIP46'"
            active-class="text-weight-bold text-primary"
            clickable
            v-if="false"
          >
            <q-item-section avatar>
              <q-icon
                :color="signerType === 'NIP46' ? 'primary' : 'grey'"
                :name="
                  signerType === 'NIP46'
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                "
                @click="handleBunkerClick"
                class="cursor-pointer"
              />
            </q-item-section>
            <q-item-section
              lines="1"
              class="cursor-pointer"
              style="word-break: break-word"
            >
              <q-item-label title>Nsec Bunker</q-item-label>
              <q-item-label caption>Use a NIP-46 bunker </q-item-label>
            </q-item-section>
            <q-item-section side v-if="signerType === 'NIP46'">
              <q-icon
                name="delete_outline"
                @click="handleResetNip46Signer"
                class="cursor-pointer"
                ><q-tooltip>Delete connection</q-tooltip>
              </q-icon>
            </q-item-section>
          </q-item>
          <q-item
            :active="signerType === 'PRIVATEKEY'"
            active-class="text-weight-bold text-primary"
            clickable
          >
            <q-item-section avatar>
              <q-icon
                :color="signerType === 'PRIVATEKEY' ? 'primary' : 'grey'"
                :name="
                  signerType === 'PRIVATEKEY'
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                "
                @click="handleNsecClick"
                class="cursor-pointer"
              />
            </q-item-section>
            <q-item-section
              lines="1"
              class="cursor-pointer"
              style="word-break: break-word"
            >
              <q-item-label title>Use your nsec</q-item-label>
              <q-item-label caption
                >This method is dangerous and not recommended
              </q-item-label>
            </q-item-section>
            <q-item-section side v-if="signerType === 'PRIVATEKEY'">
              <q-icon
                name="delete_outline"
                @click="handleResetPrivateKeySigner"
                class="cursor-pointer"
                ><q-tooltip>Delete nsec</q-tooltip></q-icon
              >
            </q-item-section>
          </q-item>
          <!-- Nip07Signer -->
          <q-item
            :active="signerType === 'NIP07'"
            active-class="text-weight-bold text-primary"
            clickable
            v-if="nip07SignerAvailable"
          >
            <q-item-section avatar>
              <q-icon
                :color="signerType === 'NIP07' ? 'primary' : 'grey'"
                :name="
                  signerType === 'NIP07'
                    ? 'check_circle'
                    : 'radio_button_unchecked'
                "
                @click="handleExtensionClick"
                class="cursor-pointer"
              />
            </q-item-section>
            <q-item-section
              lines="1"
              class="cursor-pointer"
              style="word-break: break-word"
            >
              <q-item-label title>Signing extension</q-item-label>
              <q-item-label caption v-if="nip07SignerAvailable"
                >Use a NIP-07 signing extension
              </q-item-label>
              <q-item-label caption v-else
                >No NIP-07 signing extension found
              </q-item-label>
            </q-item-section>
          </q-item>
        </div>
      </q-list>
    </div>

    <!-- payment requests -->
    <div class="q-py-sm q-px-xs text-left" on-left>
      <q-item class="q-pt-lg">
        <q-item-section>
          <q-item-label overline class="text-weight-bold"
            >Payment requests</q-item-label
          >
          <q-item-label caption
            >Payment requests allow you to receive payments via nostr. If you
            enable this, your wallet will subscribe to your nostr
            relays.</q-item-label
          >
        </q-item-section>
      </q-item>
      <q-item>
        <q-toggle
          v-model="enablePaymentRequest"
          label="Enable Payment Requests"
          color="primary"
        />
      </q-item>
    </div>
    <div v-if="enablePaymentRequest" class="q-pb-sm q-px-xs text-left" on-left>
      <q-item>
        <q-toggle
          v-model="receivePaymentRequestsAutomatically"
          color="primary"
        />
        <q-item-section>
          <q-item-label title>Claim automatically</q-item-label>
          <q-item-label caption
            >Receive incoming payments automatically.
          </q-item-label>
        </q-item-section>
      </q-item>
    </div>

    <!-- ln address -->
    <div class="q-py-sm q-px-xs text-left" on-left>
      <q-list padding>
        <!-- NWC -->

        <q-item class="q-pt-lg">
          <q-item-section>
            <q-item-label overline class="text-weight-bold"
              >Nostr Wallet Connect (NWC)</q-item-label
            >
            <q-item-label caption
              >Use NWC to control your wallet from any other
              application.</q-item-label
            >
          </q-item-section>
        </q-item>
        <!-- use a q-toggle to turn nwc on and off -->
        <q-item>
          <q-toggle v-model="enableNwc" label="Enable NWC" color="primary" />
        </q-item>
        <!-- <q-item>
          <q-btn
            v-if="false"
            class="q-ml-sm q-px-md"
            color="primary"
            rounded
            outline
            @click="listenToNWCCommands()"
            >Link wallet</q-btn
          >
        </q-item> -->
        <q-item v-if="enableNwc">
          <q-item-section>
            <!-- <q-item-label overline>Connections</q-item-label> -->
            <q-item-label caption
              >You can only use NWC for payments from your Bitcoin balance.
              Payments will be made from your active mint.
            </q-item-label>
          </q-item-section>
        </q-item>
        <div v-if="enableNwc">
          <q-item
            v-for="connection in connections"
            :key="getConnectionString(connection)"
          >
            <q-item-section
              class="q-mx-none q-pl-none"
              style="max-width: 1.5em"
            >
              <q-icon
                name="content_copy"
                @click="copyText(getConnectionString(connection))"
                size="1.3em"
                color="grey"
                class="q-mr-sm cursor-pointer"
                ><q-tooltip>Copy connection string</q-tooltip></q-icon
              >
            </q-item-section>
            <q-item-section
              class="q-mx-none q-pl-none"
              style="max-width: 1.5em"
            >
              <q-icon
                name="qr_code"
                @click="showNWCEntry(connection)"
                size="1.3em"
                color="grey"
                class="q-mr-sm cursor-pointer"
              >
                <q-tooltip>Show QR code</q-tooltip>
              </q-icon>
            </q-item-section>
            <q-item-section style="max-width: 10rem">
              <!-- <q-item-label
                caption
                clickable
                style="word-break: break-word"
                @click="showNWCEntry(connection.connectionString)"
                >********************</q-item-label
              > -->
              <!-- input for allowanceleft -->
              <q-input
                type="number"
                outlined
                rounded
                dense
                v-model="connection.allowanceLeft"
                label="Allowance left (sat)"
              >
              </q-input>
            </q-item-section>
          </q-item>

          <q-expansion-item
            dense
            dense-toggle
            class="text-left"
            label="Click to edit relays"
          >
            <q-item>
              <q-item-section>
                <q-item-label overline>Add relay</q-item-label>
                <q-item-label caption
                  >Nostr Wallet Connect uses nostr relays to connect your wallet
                  to other applications.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-input
                  outlined
                  rounded
                  dense
                  v-model="newRelay"
                  label="Relay"
                  append
                >
                  <template v-slot:append>
                    <q-btn
                      flat
                      dense
                      icon="add"
                      color="primary"
                      @click="addRelay"
                    ></q-btn>
                  </template>
                </q-input>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label overline>Relays</q-item-label>
                <q-item-label caption
                  >Your wallet will connect to these relays.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-for="relay in relays" :key="relay" clickable>
              <q-item-section
                class="q-mx-none q-pl-none"
                style="max-width: 1.2em"
              >
                <q-icon
                  name="content_copy"
                  @click="copyText(relay)"
                  size="1.1em"
                  color="grey"
                  class="q-mr-sm cursor-pointer"
                  ><q-tooltip>Copy relay</q-tooltip></q-icon
                >
              </q-item-section>
              <q-item-section
                class="q-mx-none q-pl-none"
                style="max-width: 1.5em"
              >
                <q-icon
                  name="delete_outline"
                  @click="removeRelay(relay)"
                  size="1.3em"
                  color="grey"
                  class="q-mr-sm cursor-pointer"
                  ><q-tooltip>Remove relay</q-tooltip></q-icon
                >
              </q-item-section>
              <q-item-section style="max-width: 10rem" class="cursor-pointer">
                <q-item-label caption>{{ relay }} </q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>
        </div>
      </q-list>
    </div>
    <div class="q-py-sm q-px-xs text-left" on-left>
      <q-list padding>
        <!-- Web NFC -->
        <div v-if="ndefSupported" class="q-px-xs text-left" on-left>
          <q-list padding>
            <q-item>
              <q-item-section>
                <q-item-label overline class="text-weight-bold"
                  >WebNFC</q-item-label
                >
                <q-item-label caption>
                  Choose the encoding for writing to NFC cards
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable @click="nfcEncoding = 'text'">
              <q-item-section avatar>
                <q-icon
                  :color="nfcEncoding === 'text' ? 'primary' : 'grey'"
                  :name="
                    nfcEncoding === 'text'
                      ? 'check_circle'
                      : 'radio_button_unchecked'
                  "
                  class="cursor-pointer"
                />
              </q-item-section>
              <q-item-section
                lines="1"
                class="cursor-pointer"
                style="word-break: break-word"
              >
                <q-item-label title>Text</q-item-label>
                <q-item-label caption> Store token in plain text </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable @click="nfcEncoding = 'weburl'">
              <q-item-section avatar>
                <q-icon
                  :color="nfcEncoding === 'weburl' ? 'primary' : 'grey'"
                  :name="
                    nfcEncoding === 'weburl'
                      ? 'check_circle'
                      : 'radio_button_unchecked'
                  "
                  class="cursor-pointer"
                />
              </q-item-section>
              <q-item-section
                lines="1"
                class="cursor-pointer"
                style="word-break: break-word"
              >
                <q-item-label title>URL</q-item-label>
                <q-item-label caption>
                  Store URL to this wallet with token
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable @click="nfcEncoding = 'binary'">
              <q-item-section avatar>
                <q-icon
                  :color="nfcEncoding === 'binary' ? 'primary' : 'grey'"
                  :name="
                    nfcEncoding === 'binary'
                      ? 'check_circle'
                      : 'radio_button_unchecked'
                  "
                  class="cursor-pointer"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label title>Binary</q-item-label>
                <q-item-label caption>
                  Store tokens as binary data
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-toggle
                v-model="showNfcButtonInDrawer"
                label="Quick access to NFC"
                color="primary"
              /> </q-item
            ><q-item class="q-pt-none">
              <q-item-label caption
                >Quickly scan NFC cards in the Receive Ecash menu. This option
                adds an NFC button the Receive Ecash menu.
              </q-item-label>
            </q-item>
          </q-list>
        </div>

        <!-- P2PK -->
        <div class="q-py-sm q-px-xs text-left" on-left>
          <q-list padding>
            <q-item>
              <q-item-section>
                <q-item-label overline class="text-weight-bold"
                  >P2PK</q-item-label
                >
                <q-item-label caption
                  >Generate a key pair to receive P2PK-locked ecash. Warning:
                  This feature is experimental. Only use with small amounts. If
                  you lose your private keys, nobody will be able to unlock the
                  ecash locked to it anymore.</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-btn
                class="q-ml-sm q-px-md"
                color="primary"
                size="sm"
                rounded
                outline
                @click="generateKeypair"
                >Generate key</q-btn
              >
            </q-item>
            <q-item>
              <q-toggle
                v-model="showP2PkButtonInDrawer"
                label="Quick access to lock"
                color="primary"
              /> </q-item
            ><q-item class="q-pt-none">
              <q-item-label caption
                >Use this to quickly show your P2PK locking key in the receive
                ecash menu.
              </q-item-label>
            </q-item>
          </q-list>
          <q-item v-if="p2pkKeys.length">
            <q-expansion-item
              dense
              dense-toggle
              v-if="p2pkKeys.length"
              class="text-left"
              :label="`Click to browse ${p2pkKeys.length} keys`"
            >
              <q-item v-for="key in p2pkKeys" :key="key.privakey">
                <q-item-section
                  class="q-mx-none q-pl-none"
                  style="max-width: 1.05em"
                >
                  <q-icon
                    name="content_copy"
                    @click="copyText(key.publicKey)"
                    size="1.2em"
                    color="grey"
                    class="q-mr-xs cursor-pointer"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    caption
                    clickable
                    style="word-break: break-word; font-size: 0.65rem"
                    class="q-mx-sm"
                    @click="showP2PKKeyEntry(key.publicKey)"
                    >{{ key.publicKey }}</q-item-label
                  >
                </q-item-section>
                <q-item-section side>
                  <q-badge
                    v-if="key.used"
                    label="used"
                    color="primary"
                    class="q-mr-sm"
                  />
                </q-item-section>
                <q-item-section
                  class="q-mx-none q-pl-none"
                  style="max-width: 1.05em"
                >
                  <q-icon
                    name="qr_code"
                    @click="showP2PKKeyEntry(key.publicKey)"
                    size="1em"
                    color="grey"
                    class="q-mr-xs cursor-pointer"
                  />
                </q-item-section>
              </q-item>
            </q-expansion-item>
          </q-item>
        </div>

        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold q-pt-sm"
              >Privacy</q-item-label
            >
            <q-item-label caption>
              These settings affect your privacy.
            </q-item-label>
          </q-item-section>
        </q-item>
        <div>
          <!-- periodically check incoming invoices -->
          <q-item>
            <q-toggle
              v-model="checkIncomingInvoices"
              label="Check incoming invoice"
              color="primary"
            >
            </q-toggle>
          </q-item>
          <q-item class="q-pt-none">
            <q-item-label caption
              >If enabled, the wallet will check the latest invoice in the
              background. This increases the wallet's responsiveness which makes
              fingerprinting easier. You can manually check unpaid invoices in
              the Invoices tab.
            </q-item-label>
          </q-item>
          <!-- check pending invoices on startup -->
          <q-item>
            <q-toggle
              v-model="checkInvoicesOnStartup"
              label="Check pending invoices on startup"
              color="primary"
            >
            </q-toggle>
          </q-item>
          <q-item class="q-pt-none">
            <q-item-label caption
              >If enabled, the wallet will check pending invoices from the last
              24 hours on startup.
            </q-item-label>
          </q-item>
          <!-- periodically check incoming invoices -->
          <q-item>
            <q-toggle
              v-model="periodicallyCheckIncomingInvoices"
              label="Check all invoices"
              color="primary"
            >
              <q-badge color="primary" label="Beta" class="q-mx-sm"></q-badge>
            </q-toggle>
          </q-item>
          <q-item class="q-pt-none">
            <q-item-label caption
              >If enabled, the wallet will periodically check unpaid invoices in
              the background for up to two weeks. This increases the wallet's
              online activity which makes fingerprinting easier. You can
              manually check unpaid invoices in the Invoices tab.
            </q-item-label>
          </q-item>

          <!-- check outgoing token state setting -->
          <q-item>
            <q-toggle
              v-model="checkSentTokens"
              label="Check sent ecash"
              color="primary"
            /> </q-item
          ><q-item class="q-pt-none">
            <q-item-label caption
              >If enabled, the wallet will use periodic background checks to
              determine if sent tokens have been redeemed. This increases the
              wallet's online activity which makes fingerprinting easier.
            </q-item-label>
          </q-item>
          <!-- websockets -->
          <q-item v-if="checkIncomingInvoices || checkSentTokens">
            <q-toggle
              v-if="checkIncomingInvoices || checkSentTokens"
              v-model="useWebsockets"
              label="Use WebSockets"
              color="primary"
              ><q-badge color="primary" label="Beta" class="q-mx-sm"></q-badge>
            </q-toggle> </q-item
          ><q-item
            class="q-pt-none"
            v-if="checkIncomingInvoices || checkSentTokens"
          >
            <q-item-label caption
              >If enabled, the wallet will use long-lived WebSocket connections
              to receive updates on paid invoices and spent tokens from mints.
              This increases the wallet's responsiveness but also makes
              fingerprinting easier.
            </q-item-label>
          </q-item>
          <!-- price check setting -->
          <q-item>
            <q-toggle
              v-model="getBitcoinPrice"
              label="Get exchange rate from Coinbase"
              color="primary"
            /> </q-item
          ><q-item class="q-pt-none">
            <q-item-label caption
              >If enabled, the current Bitcoin exchange rate will be fetched
              from coinbase.com and your converted balance will be displayed.
            </q-item-label>
          </q-item>
        </div>

        <!-- enable receive swaps -->
        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold q-pt-xl"
              >Experimental</q-item-label
            >
            <q-item-label caption>
              These features are experimental.
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-toggle
            v-model="enableReceiveSwaps"
            label="Receive swaps"
            color="primary"
          >
            <q-badge color="primary" label="Beta" class="q-mx-sm"></q-badge>
          </q-toggle>
        </q-item>
        <q-item class="q-pt-none">
          <q-item-label caption
            >Option to swap received Ecash to your active mint in the Receive
            Ecash dialog.
          </q-item-label>
        </q-item>
        <q-item>
          <q-toggle
            v-model="autoPasteEcashReceive"
            label="Paste Ecash automatically"
            color="primary"
          /> </q-item
        ><q-item class="q-pt-none">
          <q-item-label caption
            >Automatically paste ecash in your clipboard when you press Receive,
            then Ecash, then Paste. Automatic pasting can cause UI glitches in
            iOS, turn it off if you experience issues.
          </q-item-label>
        </q-item>

        <!-- use numeric keyboard -->
        <div class="q-py-sm q-px-xs text-left" on-left>
          <q-list padding>
            <q-item>
              <q-item-section>
                <q-item-label overline class="text-weight-bold q-pt-lg"
                  >On-screen keyboard</q-item-label
                >
                <q-item-label caption
                  >Use the numeric keyboard for entering amounts.</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-toggle
                v-model="useNumericKeyboard"
                label="Use numeric keyboard"
                color="primary"
              /> </q-item
            ><q-item class="q-pt-none">
              <q-item-label caption
                >If enabled, the numeric keyboard will be used for entering
                amounts.
              </q-item-label>
            </q-item>
          </q-list>
        </div>

        <!-- theme -->
        <div class="q-py-mb q-px-xs text-left" on-left>
          <q-list padding>
            <q-item>
              <q-item-section>
                <q-item-label overline class="text-weight-bold"
                  >Appearance</q-item-label
                >
                <q-item-label caption
                  >Change how your wallet looks.
                </q-item-label>
                <!-- <div class="row q-py-md">
              <q-btn dense flat rounded @click="toggleDarkMode" size="md"
                >Toggle dark mode<q-icon
                  class="q-ml-sm"
                  :name="$q.dark.isActive ? 'brightness_3' : 'wb_sunny'"
                />
              </q-btn>
            </div> -->
                <div class="row q-pt-md">
                  <q-btn
                    v-if="themes.includes('monochrome')"
                    dense
                    flat
                    @click="changeColor('monochrome')"
                    icon="format_color_fill"
                    color="grey"
                    size="md"
                    ><q-tooltip>mono</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="themes.includes('cyber')"
                    dense
                    flat
                    @click="changeColor('cyber')"
                    icon="format_color_fill"
                    color="green"
                    size="md"
                    ><q-tooltip>cyber</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="themes.includes('freedom')"
                    dense
                    flat
                    @click="changeColor('freedom')"
                    icon="format_color_fill"
                    color="pink-13"
                    size="md"
                    ><q-tooltip>freedom</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="themes.includes('classic')"
                    dense
                    flat
                    @click="changeColor('classic')"
                    icon="format_color_fill"
                    color="deep-purple"
                    size="md"
                    ><q-tooltip>nostr</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="themes.includes('bitcoin')"
                    dense
                    flat
                    @click="changeColor('bitcoin')"
                    icon="format_color_fill"
                    color="orange"
                    size="md"
                    ><q-tooltip>bitcoin</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="themes.includes('mint')"
                    dense
                    flat
                    @click="changeColor('mint')"
                    icon="format_color_fill"
                    color="light-green-9"
                    size="md"
                    ><q-tooltip>mint</q-tooltip> </q-btn
                  ><q-btn
                    v-if="themes.includes('autumn')"
                    dense
                    flat
                    @click="changeColor('autumn')"
                    icon="format_color_fill"
                    color="brown"
                    size="md"
                    ><q-tooltip>nut</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="themes.includes('salvador')"
                    dense
                    flat
                    @click="changeColor('salvador')"
                    icon="format_color_fill"
                    color="blue-10"
                    size="md"
                    ><q-tooltip>blu</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="themes.includes('flamingo')"
                    dense
                    flat
                    @click="changeColor('flamingo')"
                    icon="format_color_fill"
                    color="pink-3"
                    size="md"
                    ><q-tooltip>flamingo</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-expansion-item
          class="q-pt-lg"
          dense
          dense-toggle
          icon="code"
          label="Advanced"
        >
          <div>
            <q-item class="q-pt-lg">
              <q-item-section>
                <q-item-label overline>Developer settings</q-item-label>
                <q-item-label caption
                  >The following settings are for development and
                  debugging.</q-item-label
                >
              </q-item-section>
            </q-item>
            <div>
              <!-- check proofs spendable setting -->
              <q-item>
                <q-item-section>
                  <div class="row q-pt-md">
                    <div class="col-12" v-if="!confirmMnemonic">
                      <q-btn
                        flat
                        dense
                        @click="confirmMnemonic = !confirmMnemonic"
                        >Generate new seed phrase</q-btn
                      >
                      <row>
                        <q-item-label class="q-px-sm" caption
                          >This will generate a new seed phrase. You must send
                          your entire balance to yourself in order to be able to
                          restore it with a new seed.
                        </q-item-label>
                      </row>
                    </div>
                    <div class="col-12" v-if="confirmMnemonic">
                      <span
                        >Are you sure you want to generate a new seed phrase?
                      </span>
                      <q-btn
                        flat
                        dense
                        class="q-ml-sm"
                        color="warning"
                        @click="confirmMnemonic = false"
                        >Cancel</q-btn
                      >
                      <q-btn
                        flat
                        dense
                        class="q-ml-sm"
                        color="secondary"
                        @click="
                          confirmMnemonic = false;
                          generateNewMnemonic();
                        "
                        >Confirm</q-btn
                      >
                    </div>
                  </div>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn
                      dense
                      flat
                      outline
                      click
                      @click="checkActiveProofsSpendable"
                      >Remove spent proofs</q-btn
                    ></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Check if the ecash tokens from your active mints are
                      spent and remove the spent ones from your wallet. Only use
                      this if your wallet is stuck.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn dense flat outline click @click="toggleTerminal">
                      Toggle Debug Console
                    </q-btn> </row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Open the Javascript debug terminal. Never paste anything
                      into this terminal that you don't understand. A thief
                      might try to trick you into pasting malicious code here.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn dense flat outline click @click="exportActiveProofs">
                      Export active proofs
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Copy your entire balance from the active mint as a Cashu
                      token into your clipboard. This will only export the
                      tokens from the selected mint and unit. For a full export,
                      select a different mint and unit and export again.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <!-- add a caption, not a button here -->
                    <q-item-label class="q-pb-sm"
                      >Increment keyset counters</q-item-label
                    ></row
                  >
                  <row>
                    <q-item-label class="q-px-sm" caption
                      >Click the keyset ID to increment the derivation path
                      counters for the keysets in your wallet. This is useful if
                      you see the "outputs have already been signed" error.
                    </q-item-label>
                  </row>
                  <row class="q-pa-sm">
                    <row
                      class="q-px-sm"
                      v-for="(mintCounter, mintUrl) in keysetCountersByMint"
                      :key="mintUrl"
                    >
                      <q-item-label class="q-px-xs" caption>
                        {{ shortUrl(mintUrl) }}
                      </q-item-label>
                      <q-btn
                        dense
                        v-for="(counter, id) in mintCounter"
                        :key="id"
                        flat
                        click
                        @click="increaseKeysetCounter(counter.id, 1)"
                        >{{ counter.id }} - counter: {{ counter.counter }}
                      </q-btn>
                    </row>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn
                      dense
                      flat
                      outline
                      click
                      @click="unsetAllReservedProofs"
                    >
                      Unset all reserved tokens
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >To avoid double-spending attempts, this wallet marks
                      ecash as reserved so you don't reuse it. This button will
                      unset all reserved tokens so they can be used again. If
                      you do this, your wallet might include spent proofs. Press
                      the "Remove spent proofs" button to get rid of them.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn dense flat outline click @click="showOnboarding">
                      Show onboarding
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Show the onboarding screen again.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn
                      v-if="!confirmNuke"
                      dense
                      flat
                      outline
                      click
                      @click="confirmNuke = !confirmNuke"
                    >
                      Reset wallet data
                    </q-btn></row
                  ><row v-if="!confirmNuke">
                    <q-item-label class="q-px-sm" caption
                      >Reset your wallet data. Warning: This will delete
                      everything! Make sure you create a backup first.
                    </q-item-label>
                  </row>
                  <row v-if="confirmNuke">
                    <span
                      >Are you sure you want to delete your wallet data?</span
                    >
                    <q-btn
                      flat
                      dense
                      class="q-ml-sm"
                      color="primary"
                      @click="confirmNuke = false"
                      >Cancel</q-btn
                    >
                    <q-btn
                      flat
                      dense
                      class="q-ml-sm"
                      color="warning"
                      @click="
                        confirmNuke = false;
                        nukeWallet();
                      "
                      >Delete wallet</q-btn
                    >
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn
                      dense
                      flat
                      outline
                      click
                      @click="getLocalstorageToFile"
                    >
                      Export wallet data
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Download a dump of your wallet. You can restore your
                      wallet from this file in the welcome screen of a new
                      wallet. This file will be out of sync if you keep using
                      your wallet after exporting it.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
            </div>
          </div>
        </q-expansion-item>
      </q-list>
    </div>
  </div>

  <!-- P2PK DIALOG -->
  <P2PKDialog v-model="showP2PKDialog" />

  <!-- NWC DIALOG -->
  <NWCDialog v-model="showNWCDialog" />
</template>
<script>
import { defineComponent } from "vue";
import P2PKDialog from "./P2PKDialog.vue";
import NWCDialog from "./NWCDialog.vue";

import { getShortUrl } from "src/js/wallet-helpers";
import { mapActions, mapState, mapWritableState } from "pinia";
import { useMintsStore, MintClass } from "src/stores/mints";
import { useWalletStore } from "src/stores/wallet";
import { map } from "underscore";
import { currentDateStr } from "src/js/utils";
import { useSettingsStore } from "src/stores/settings";
import { useNostrStore } from "src/stores/nostr";
import { useNPCStore } from "src/stores/npubcash";
import { useP2PKStore } from "src/stores/p2pk";
import { useNWCStore } from "src/stores/nwc";
import { useUiStore } from "../stores/ui";
import { useWorkersStore } from "src/stores/workers";
import { useProofsStore } from "src/stores/proofs";
import { usePRStore } from "../stores/payment-request";
import { useRestoreStore } from "src/stores/restore";
import { useReceiveTokensStore } from "../stores/receiveTokensStore";
import { useWelcomeStore } from "src/stores/welcome";

export default defineComponent({
  name: "SettingsView",
  mixins: [windowMixin],
  components: {
    P2PKDialog,
    NWCDialog,
  },
  props: {},
  data: function () {
    return {
      themes: [
        "monochrome",
        "classic",
        "bitcoin",
        "mint",
        "autumn",
        "salvador",
        "freedom",
        "cyber",
        "flamingo",
      ],
      discoveringMints: false,
      hideMnemonic: true,
      confirmMnemonic: false,
      confirmNuke: false,
      nip46Token: "",
      nip07SignerAvailable: false,
      newRelay: "",
    };
  },
  computed: {
    ...mapWritableState(useSettingsStore, [
      "getBitcoinPrice",
      "checkSentTokens",
      "useWebsockets",
      "nfcEncoding",
      "useNumericKeyboard",
      "periodicallyCheckIncomingInvoices",
      "checkIncomingInvoices",
      "checkInvoicesOnStartup",
      "enableReceiveSwaps",
      "showNfcButtonInDrawer",
      "autoPasteEcashReceive",
    ]),
    ...mapState(useP2PKStore, ["p2pkKeys"]),
    ...mapWritableState(useP2PKStore, [
      "showP2PKDialog",
      "showP2PkButtonInDrawer",
    ]),
    ...mapWritableState(useNWCStore, ["showNWCDialog", "showNWCData"]),
    ...mapState(useMintsStore, [
      "activeMintUrl",
      "mints",
      "activeProofs",
      "proofs",
    ]),
    ...mapState(useNPCStore, ["npcLoading"]),
    ...mapState(useNostrStore, [
      "pubkey",
      "mintRecommendations",
      "signerType",
      "seedSignerPrivateKeyNsec",
    ]),
    ...mapState(useWalletStore, ["mnemonic"]),
    ...mapState(useUiStore, ["ndefSupported"]),
    ...mapWritableState(useNPCStore, ["npcAddress"]),
    ...mapWritableState(useNPCStore, ["npcEnabled", "automaticClaim"]),
    ...mapWritableState(useWalletStore, ["keysetCounters"]),
    ...mapWritableState(useMintsStore, [
      "addMintData",
      "showAddMintDialog",
      "showRemoveMintDialog",
    ]),
    ...mapWritableState(useNWCStore, ["nwcEnabled", "connections", "relays"]),
    ...mapWritableState(usePRStore, [
      "enablePaymentRequest",
      "receivePaymentRequestsAutomatically",
    ]),

    keysetCountersByMint() {
      const mints = this.mints;
      const keysetCountersByMint = {}; // {mintUrl: [keysetCounter: {id: string, count: number}, ...]}
      for (let mint of mints) {
        const mintIds = mint.keysets.map((keyset) => keyset.id);
        const keysetCounterThisMint = this.keysetCounters.filter((entry) =>
          mintIds.includes(entry.id)
        );
        keysetCountersByMint[mint.url] = keysetCounterThisMint;
      }
      return keysetCountersByMint;
    },
    hiddenMnemonic() {
      if (this.hideMnemonic) {
        return this.mnemonic
          .split(" ")
          .map((w) => "*".repeat(w.length))
          .join(" ");
      } else {
        return this.mnemonic;
      }
    },
    enableNwc: {
      get() {
        return this.nwcEnabled;
      },
      set(value) {
        this.nwcEnabled = value;
      },
    },
  },
  watch: {
    enableNwc: function () {
      if (this.enableNwc) {
        this.listenToNWCCommands();
      } else {
        this.unsubscribeNWC();
      }
    },
    npcEnabled: async function () {
      if (this.npcEnabled) {
        await this.initSigner();
        await this.generateNPCConnection();
      } else {
        this.npcAddress = "";
      }
    },
  },
  methods: {
    ...mapActions(useNostrStore, [
      "init",
      "initNip07Signer",
      "initNip46Signer",
      "initPrivateKeySigner",
      "initWalletSeedPrivateKeySigner",
      "checkNip07Signer",
      "resetPrivateKeySigner",
      "resetNip46Signer",
      "initSigner",
    ]),
    ...mapActions(useNWCStore, [
      "generateNWCConnection",
      "listenToNWCCommands",
      "unsubscribeNWC",
      "getConnectionString",
    ]),
    ...mapActions(useP2PKStore, ["generateKeypair", "showKeyDetails"]),
    ...mapActions(useMintsStore, [
      "addMint",
      "removeMint",
      "activateMintUrl",
      "updateMint",
      "restoreFromBackup",
    ]),
    ...mapActions(useWalletStore, [
      "newMnemonic",
      "decodeRequest",
      "checkProofsSpendable",
      "increaseKeysetCounter",
    ]),
    ...mapActions(useProofsStore, ["serializeProofs"]),
    ...mapActions(useNPCStore, ["generateNPCConnection"]),
    ...mapActions(useRestoreStore, ["restoreMint"]),
    generateNewMnemonic: async function () {
      this.newMnemonic();
      await this.initSigner();
      await this.generateNPCConnection();
    },
    shortUrl: function (url) {
      return getShortUrl(url);
    },
    toggleMnemonicVisibility: function () {
      this.hideMnemonic = !this.hideMnemonic;
    },
    toggleTerminal: function () {
      useUiStore().toggleDebugConsole();
    },
    getLocalstorageToFile: async function () {
      // https://stackoverflow.com/questions/24263682/save-restore-local-storage-to-a-local-file
      const fileName = `cashu_backup_${currentDateStr()}.json`;
      var a = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = localStorage.getItem(k);
        a[k] = v;
      }
      var textToSave = JSON.stringify(a);
      var textToSaveAsBlob = new Blob([textToSave], {
        type: "text/plain",
      });
      var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);

      var downloadLink = document.createElement("a");
      downloadLink.download = fileName;
      downloadLink.innerHTML = "Download File";
      downloadLink.href = textToSaveAsURL;
      downloadLink.onclick = function () {
        document.body.removeChild(event.target);
      };
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
    },
    unsetAllReservedProofs: async function () {
      // mark all this.proofs as reserved=false
      for (let proof of this.proofs) {
        proof.reserved = false;
        proof.quote = undefined;
      }
      this.notifySuccess("No reserved proofs left");
    },
    checkActiveProofsSpendable: async function () {
      // iterate over this.activeProofs in batches of 50 and check if they are spendable
      let wallet = useWalletStore().mintWallet(
        this.activeMintUrl,
        this.activeUnit
      );
      let proofs = this.activeProofs.flat();
      console.log("Checking proofs", proofs);
      let allSpentProofs = [];
      let batch_size = 50;
      for (let i = 0; i < proofs.length; i += batch_size) {
        console.log("Checking proofs", i, i + batch_size);
        let batch = proofs.slice(i, i + batch_size);
        let spent = await this.checkProofsSpendable(batch, wallet, true);
        allSpentProofs.push(spent);
      }
      let spentProofs = allSpentProofs.flat();
      if (spentProofs.length > 0) {
        console.log("Spent proofs", spentProofs);
        this.notifySuccess("Removed " + spentProofs.length + " spent proofs");
      } else {
        this.notifySuccess("No spent proofs found");
      }
    },
    showP2PKKeyEntry: async function (pubKey) {
      this.showKeyDetails(pubKey);
      this.showP2PKDialog = true;
    },
    showNWCEntry: async function (connection) {
      this.showNWCData = {
        connection,
        connectionString: this.getConnectionString(connection),
      };
      this.showNWCDialog = true;
    },
    exportActiveProofs: async function () {
      // export active proofs
      const token = await this.serializeProofs(this.activeProofs);
      this.copyText(token);
    },
    handleSeedClick: async function () {
      await this.initWalletSeedPrivateKeySigner();
      await this.generateNPCConnection();
    },
    handleExtensionClick: async function () {
      await this.initNip07Signer();
      await this.generateNPCConnection();
    },
    handleBunkerClick: async function () {
      await this.initNip46Signer();
      await this.generateNPCConnection();
    },
    handleNsecClick: async function () {
      await this.initPrivateKeySigner();
      await this.generateNPCConnection();
    },
    handleResetPrivateKeySigner: async function () {
      await this.resetPrivateKeySigner();
      await this.generateNPCConnection();
    },
    handleResetNip46Signer: async function () {
      await this.resetNip46Signer();
      await this.generateNPCConnection();
    },
    showOnboarding: function () {
      const welcomeStore = useWelcomeStore();
      welcomeStore.resetWelcome();
      this.$router.push("/welcome");
    },
    nukeWallet: async function () {
      // create a backup just in case
      await this.getLocalstorageToFile();
      localStorage.clear();
      window.location.href = "/";
    },
    addRelay: function () {
      if (this.newRelay) {
        this.newRelay = this.newRelay.trim();
        // if relay is already in relays, don't add it, send notification
        if (this.relays.includes(this.newRelay)) {
          this.notifyWarning("Relay already added");
        } else {
          this.relays.push(this.newRelay);
          this.newRelay = "";
        }
      }
    },
    removeRelay: function (relay) {
      this.relays = this.relays.filter((r) => r !== relay);
    },
  },
  created: async function () {
    this.nip07SignerAvailable = await this.checkNip07Signer();
    console.log("Nip07 signer available", this.nip07SignerAvailable);
  },
});
</script>
<style scoped>
.seed-phrase :deep(.q-field__control) {
  padding: 12px 12px !important;
}
.seed-phrase {
  font-size: 0.9rem;
  font-family: monospace;
  padding: 12px 12px !important;
}
</style>
