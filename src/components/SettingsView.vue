<template>
  <div style="max-width: 800px; margin: 0 auto">
    <!-- ////////////////////// SETTINGS ////////////////// -->
    <div class="q-px-xs text-left" on-left>
      <q-list padding>
        <q-item>
          <q-item-section>
            <q-item-label overline class="text-weight-bold"
              >Conserva la tua seed phrase</q-item-label
            >
            <q-item-label caption
              >La vostra seed phrase può ripristinare il vostro portafoglio.
              Tenetela al sicuro e privata.
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
              >Ripristina ecash</q-item-label
            >
            <q-item-label caption
              >La procedura guidata di ripristino consente di recuperare gli ecash persi da una seed phrase mnemonica.
              La seed phrase del vostro portafoglio attuale rimarrà inalterata,
              la procedura guidata vi permetterà solo di <i>ripristinare</i>
              ecash da un'altra seed phrase.</q-item-label
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
            >Ripristina</q-btn
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
              >Indirizzo Lightning</q-item-label
            >
            <q-item-label caption
              >Ricevi pagamenti al tuo indirizzo Lightning.</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-item class="q-px-md">
          <q-item-section class="q-mx-none q-pl-none">
            <!-- toggle to turn Lightning address on and off in new row -->
            <div class="row q-pt-md">
              <q-toggle v-model="npcEnabled" color="primary" />
              <q-item-section>
                <q-item-label title>Abilita</q-item-label>
                <q-item-label caption>
                  Indirizzo Lightning con npub.cash
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
                      <q-tooltip>Copia indirizzo Lightning</q-tooltip>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="row q-pt-md">
                <q-toggle v-model="automaticClaim" color="primary" />
                <q-item-section>
                  <q-item-label title>Rivendica automaticamente</q-item-label>
                  <q-item-label caption
                    >Ricevi automaticamente i pagamenti in entrata.
                  </q-item-label>
                </q-item-section>
              </div>
            </div>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label overline>Le tue chiavi nostr</q-item-label>
              <q-item-label caption
                >Imposta le chiavi nostr per il tuo indirizzo Lightning.</q-item-label
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
              <q-item-label title>Seed phrase del portafoglio</q-item-label>
              <q-item-label caption
                >Genera una coppia di chiavi nostr dal seme del portafoglio
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
                  >Copia nsec
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
              <q-item-label caption>Usa un bunker NIP-46</q-item-label>
            </q-item-section>
            <q-item-section side v-if="signerType === 'NIP46'">
              <q-icon
                name="delete_outline"
                @click="handleResetNip46Signer"
                class="cursor-pointer"
                ><q-tooltip>Elimina connessione</q-tooltip>
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
              <q-item-label title>Usa la tua nsec</q-item-label>
              <q-item-label caption
                >Questo metodo è pericoloso e non raccomandato
              </q-item-label>
            </q-item-section>
            <q-item-section side v-if="signerType === 'PRIVATEKEY'">
              <q-icon
                name="delete_outline"
                @click="handleResetPrivateKeySigner"
                class="cursor-pointer"
                ><q-tooltip>Cancella nsec</q-tooltip></q-icon
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
              <q-item-label title>Firma con l'estensione</q-item-label>
              <q-item-label caption v-if="nip07SignerAvailable"
                >Usa l'estensione NIP-07 per firmare
              </q-item-label>
              <q-item-label caption v-else
                >Nessuna estensione NIP-07 per firmare trovata
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
            >Richieste di pagamento</q-item-label
          >
          <q-item-label caption
            >Le richieste di pagamento consentono di ricevere pagamenti tramite nostr.
            Se si attiva questa funzione, il portafoglio si iscriverà
            ai relay nostr.</q-item-label
          >
        </q-item-section>
      </q-item>
      <q-item>
        <q-toggle
          v-model="enablePaymentRequest"
          label="Abilita Richieste di pagamento"
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
          <q-item-label title>Rivendica automaticamente</q-item-label>
          <q-item-label caption
            >Ricevi automaticamente i pagamenti in entrata.
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
              >Usa NWC per controllare il tuo portafoglio da un'altra
              applicazione.</q-item-label
            >
          </q-item-section>
        </q-item>
        <!-- use a q-toggle to turn nwc on and off -->
        <q-item>
          <q-toggle v-model="enableNwc" label="Abilita NWC" color="primary" />
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
              >È possibile utilizzare NWC solo per i pagamenti dal proprio saldo Bitcoin.
              I pagamenti saranno effettuati dalla vostra mint attiva.
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
                ><q-tooltip>Copia stringa di connessioneg</q-tooltip></q-icon
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
                <q-tooltip>Mostra QR code</q-tooltip>
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
            label="Clicca per modificare i relay"
          >
            <q-item>
              <q-item-section>
                <q-item-label overline>Add relay</q-item-label>
                <q-item-label caption
                  >Nostr Wallet Connect usa i relay nostr per connettere il tuo portafoglio
                  ad altre applicazioni.
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
                  >Il tuo portafoglio vuole connettersi a questi relay.
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
                  ><q-tooltip>Copia relay</q-tooltip></q-icon
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
                <q-item-label title>Testo</q-item-label>
                <q-item-label caption> Memorizza il token in testo semplice </q-item-label>
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
                  Memorizza l'URL del portafoglio con il token
                </q-item-label>
              </q-item-section>
            </q-item>
            <!--
              disable binary for now
              TODO: re-enable once we can decode
            -->
            <!--
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
                <q-item-label title>Raw Binary</q-item-label>
                <q-item-label caption>
                  Raw bytes instead of Base64. Makes ~33% shorter tokens.
                </q-item-label>
              </q-item-section>
            </q-item>
            -->
            <q-item>
              <q-toggle
                v-model="showNfcButtonInDrawer"
                label="Accesso rapido a NFC"
                color="primary"
              /> </q-item
            ><q-item class="q-pt-none">
              <q-item-label caption
                >Scansione rapida delle carte NFC nel menu Ricevi Ecash. Questa opzione
                aggiunge un pulsante NFC al menu Ricevi Ecash.
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
                  >Genera una coppia di chiavi per ricevere ecash bloccati da P2PK.
                  Attenzione: Questa funzione è sperimentale. Da usare solo con piccole quantità.
                  Se si perdono le chiavi private, nessuno sarà più in grado di sbloccare
                  gli ecash bloccati.</q-item-label
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
                label="Accesso rapido al blocco"
                color="primary"
              /> </q-item
            ><q-item class="q-pt-none">
              <q-item-label caption
                >Utilizzare questa funzione per mostrare brevemente la chiave di bloccaggio P2PK nel menu di
                ricezione di ecash.
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
              Queste impostazioni influiscono sulla privacy dell'utente.
            </q-item-label>
          </q-item-section>
        </q-item>
        <div>
          <!-- periodically check incoming invoices -->
          <q-item>
            <q-toggle
              v-model="checkIncomingInvoices"
              label="Controllo della fattura in entrata"
              color="primary"
            >
            </q-toggle>
          </q-item>
          <q-item class="q-pt-none">
            <q-item-label caption
              >Se abilitato, il portafoglio controlla l'ultima fattura in background.
              Questo aumenta la reattività del portafoglio e facilita il rilevamento delle impronte digitali.
              È possibile controllare manualmente le fatture non pagate
              nella scheda Fatture.
            </q-item-label>
          </q-item>
          <!-- check pending invoices on startup -->
          <q-item>
            <q-toggle
              v-model="checkInvoicesOnStartup"
              label="Controllo delle fatture in sospeso all'avvio"
              color="primary"
            >
            </q-toggle>
          </q-item>
          <q-item class="q-pt-none">
            <q-item-label caption
              >Se abilitato, all'avvio il portafoglio controlla le fatture in sospeso
              delle ultime 24 ore.
            </q-item-label>
          </q-item>
          <!-- periodically check incoming invoices -->
          <q-item>
            <q-toggle
              v-model="periodicallyCheckIncomingInvoices"
              label="Controlla tutte le fatture"
              color="primary"
            >
              <q-badge color="primary" label="Beta" class="q-mx-sm"></q-badge>
            </q-toggle>
          </q-item>
          <q-item class="q-pt-none">
            <q-item-label caption
              >Se abilitato, il portafoglio controlla periodicamente le fatture non pagate in background per un massimo di due settimane.
              Questo aumenta l'attività online del portafoglio e facilita il rilevamento delle impronte digitali.
              È possibile controllare manualmente le fatture non pagate
              nella scheda Fatture.
            </q-item-label>
          </q-item>

          <!-- check outgoing token state setting -->
          <q-item>
            <q-toggle
              v-model="checkSentTokens"
              label="Controlla ecach inviati"
              color="primary"
            /> </q-item
          ><q-item class="q-pt-none">
            <q-item-label caption
              >Se abilitato, il portafoglio utilizzerà controlli periodici per determinare
              se i tokens inviati sono stati riscattati.
              Questo aumenta l'attività online del portafoglio e
              facilita il rilevamento delle impronte digitali.
            </q-item-label>
          </q-item>
          <!-- websockets -->
          <q-item v-if="checkIncomingInvoices || checkSentTokens">
            <q-toggle
              v-if="checkIncomingInvoices || checkSentTokens"
              v-model="useWebsockets"
              label="Usa WebSockets"
              color="primary"
              ><q-badge color="primary" label="Beta" class="q-mx-sm"></q-badge>
            </q-toggle> </q-item
          ><q-item
            class="q-pt-none"
            v-if="checkIncomingInvoices || checkSentTokens"
          >
            <q-item-label caption
              >Se abilitato, il portafoglio utilizzerà connessioni WebSocket a lunga durata
              per ricevere aggiornamenti sulle fatture pagate e sui token spesi dalle zecche.
              Questo aumenta la reattività del portafoglio,
              ma rende anche più facile il rilevamento delle impronte digitali.
            </q-item-label>
          </q-item>
          <!-- price check setting -->
          <q-item>
            <q-toggle
              v-model="getBitcoinPrice"
              label="Ottieni il tasso di cambio da Coinbase"
              color="primary"
            /> </q-item
          ><q-item class="q-pt-none">
            <q-item-label caption
              >Se abilitato, il tasso di cambio corrente di Bitcoin verrà recuperato da coinbase.com
              e verrà visualizzato il saldo convertito.
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
            label="Ricevi scambi"
            color="primary"
          >
            <q-badge color="primary" label="Beta" class="q-mx-sm"></q-badge>
          </q-toggle>
        </q-item>
        <q-item class="q-pt-none">
          <q-item-label caption
            >Opzione per scambiare l'Ecash ricevuto con la propria mint attiva
            nella finestra di dialogo Ricevi Ecash.
          </q-item-label>
        </q-item>
        <q-item>
          <q-toggle
            v-model="autoPasteEcashReceive"
            label="Incolla Ecash automaticamente"
            color="primary"
          /> </q-item
        ><q-item class="q-pt-none">
          <q-item-label caption
            >Incollare automaticamente ecash negli appunti quando si preme Ricevi, poi Ecash, poi Incolla.
            L'incollaggio automatico può causare problemi all'interfaccia utente in iOS;
            disattivatelo se riscontrate problemi.
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
                  >Usa la tastiera numerica per inserire gli importi.</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-toggle
                v-model="useNumericKeyboard"
                label="Usa tastiera numerica"
                color="primary"
              /> </q-item
            ><q-item class="q-pt-none">
              <q-item-label caption
                >Se abilitata, la tastiera numerica verrà utilizzata per inserire
                gli importi.
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
                  >Cambia l'aspetto del tuo portafoglio.
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
                <q-item-label overline>Impostazioni sviluppatore</q-item-label>
                <q-item-label caption
                  >Le seguenti impostazioni servono per lo sviluppo
                  e il debug.</q-item-label
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
                        >Genera nuova seed phrase</q-btn
                      >
                      <row>
                        <q-item-label class="q-px-sm" caption
                          >Questo genererà una nuova seed phrase. Dovete inviare l'intero equilibrio a sé stessi per poterlo 
                          di ripristinarlo con un nuovo seed phrase.Questo genererà una nuova frase seme. Dovete inviare
                          l'intero equilibrio a sé stessi per poterlo
                          di ripristinarlo con un nuovo seme.
                        </q-item-label>
                      </row>
                    </div>
                    <div class="col-12" v-if="confirmMnemonic">
                      <span
                        >Si è sicuri di voler generare una nuova seed phrase?
                      </span>
                      <q-btn
                        flat
                        dense
                        class="q-ml-sm"
                        color="warning"
                        @click="confirmMnemonic = false"
                        >Cancella</q-btn
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
                        >Conferma</q-btn
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
                      >Controlla se i gettoni ecash delle tue mint attive sono stati spesi e
                      rimuovi quelli spesi dal tuo portafoglio.
                      Utilizzare solo se il portafoglio è bloccato.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn dense flat outline click @click="toggleTerminal">
                      Attiva la console di debug
                    </q-btn> </row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Aprire il terminale di debug Javascript.
                      Non incollate mai in questo terminale qualcosa che non capite.
                      Un ladro potrebbe tentare di ingannare l'utente incollando qui del codice dannoso.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn dense flat outline click @click="exportActiveProofs">
                      Esportazione delle prove attive
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Copiare l'intero saldo della mint attiva come token Cashu negli appunti.
                      In questo modo verranno esportati solo i gettoni della mint e dell'unità selezionate.
                      Per un'esportazione completa, selezionare una mint e un'unità diverse
                      ed esportare nuovamente.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <!-- add a caption, not a button here -->
                    <q-item-label class="q-pb-sm"
                      >Incremento dei contatori del keyset</q-item-label
                    ></row
                  >
                  <row>
                    <q-item-label class="q-px-sm" caption
                      >Fare clic sull'ID del keyset per incrementare i contatori del percorso
                      di derivazione per i keyset nel portafoglio.
                      Questa operazione è utile se si verifica l'errore “le uscite sono già state firmate”.
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
                      Disabilita tutti i token riservati
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Questo portafoglio contrassegna gli ecash in uscita in attesa come
                      riservati (e li sottrae dal proprio saldo) per evitare tentativi di doppio
                      utilizzo. Questo pulsante disattiva tutti i token riservati in modo che
                      possano essere utilizzati di nuovo. Se si esegue questa operazione, è
                      possibile che il portafoglio includa delle prove esaurite. Premere il
                      pulsante “Rimuovi le prove spese” per eliminarle.
                    </q-item-label>
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn dense flat outline click @click="showOnboarding">
                      Mostra procedura d'ingresso
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Mostra di nuovo la schermata della procedura d'ingresso.
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
                      Resetta i dati del portafoglio
                    </q-btn></row
                  ><row v-if="!confirmNuke">
                    <q-item-label class="q-px-sm" caption
                      >Resettare i dati del portafoglio. Attenzione: Questa operazione
                      cancellerà tutto! Assicuratevi di aver creato prima un backup.
                    </q-item-label>
                  </row>
                  <row v-if="confirmNuke">
                    <span
                      >Siete sicuri di voler cancellare i dati del vostro portafoglio?</span
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
                      >Elimina portafoglio</q-btn
                    >
                  </row>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <row>
                    <q-btn dense flat outline click @click="exportWalletState">
                      Esporta i dati del portafoglio
                    </q-btn></row
                  ><row>
                    <q-item-label class="q-px-sm" caption
                      >Scaricate un archivio del vostro portafoglio. È possibile ripristinare
                      il portafoglio da questo file nella schermata di benvenuto di un nuovo portafoglio.
                      Questo file non sarà più sincronizzato se si continua a utilizzare
                      il portafoglio dopo averlo esportato.
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
import { useDexieStore } from "../stores/dexie";
import { useReceiveTokensStore } from "../stores/receiveTokensStore";
import { useWelcomeStore } from "src/stores/welcome";
import { useStorageStore } from "src/stores/storage";

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
    ...mapState(useMintsStore, ["activeMintUrl", "mints", "activeProofs"]),
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
    ...mapActions(useDexieStore, ["deleteAllTables"]),
    ...mapActions(useStorageStore, ["restoreFromBackup", "exportWalletState"]),
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
    unsetAllReservedProofs: async function () {
      // mark all this.proofs as reserved=false
      const proofsStore = useProofsStore();
      await proofsStore.setReserved(await proofsStore.getProofs(), false);
      this.notifySuccess("All reserved proofs unset");
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
      await this.exportWalletState();
      // clear dexie tables
      this.deleteAllTables();
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
