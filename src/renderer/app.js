import { PetSprite } from "./components/pet.js";
import { StatusBubble } from "./components/status-bubble.js";
import { BalanceCard } from "./components/balance-card.js";

const bubble = new StatusBubble(document.querySelector("#status-bubble"));
const card = new BalanceCard(document.querySelector("#balance-card"));
const pet = new PetSprite(
  document.querySelector("#pet-stage"),
  document.querySelector("#pet-sprite"),
  document.querySelector("#thinking-dots"),
);

let state = { status: "IDLE", balances: [], updatedAt: null, error: null };
let config = { hasApiKey: false };

function render() {
  bubble.render(state, config);
  card.render(state);
  pet.setState(state.status);
}

document.querySelector("#refresh-btn").addEventListener("click", () => window.petAPI.getBalance());
document.querySelector("#settings-btn").addEventListener("click", () => window.petAPI.openSettings());
document.querySelector("#hide-btn").addEventListener("click", () => window.petAPI.hidePet());

document.querySelector("#pet-stage").addEventListener("contextmenu", (event) => {
  event.preventDefault();
  window.petAPI.showContextMenu();
});

document.querySelector("#status-bubble").addEventListener("click", () => {
  if (state.status === "NO_API_KEY" || (state.status === "ERROR" && state.error === "auth")) {
    window.petAPI.openSettings();
  }
});

window.petAPI.onBalanceUpdated((next) => {
  state = next;
  render();
});

window.petAPI.onConfigChanged((next) => {
  config = next;
  render();
});

async function init() {
  config = await window.petAPI.getConfig();
  render();
}

init();
