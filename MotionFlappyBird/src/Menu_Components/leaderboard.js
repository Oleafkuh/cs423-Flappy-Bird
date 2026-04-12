import { getGuestLeaderboard, saveGuestScore } from "./login.js";

const ADJECTIVES = [
  "Funny", "Slippery", "Swift", "Wild", "Dizzy", "Sneaky", "Wobbly", "Chunky",
  "Fluffy", "Grumpy", "Spicy", "Soggy", "Jazzy", "Frosty", "Rusty", "Bouncy",
  "Cranky", "Slimy", "Zesty", "Sassy", "Lazy", "Jumpy", "Goofy", "Sketchy",
  "Greasy", "Dusty", "Crispy", "Shaky", "Fancy", "Stinky", "Plump", "Rowdy",
  "Salty", "Boggy", "Clunky", "Drippy", "Murky", "Nutty", "Peppy", "Quirky",
  "Ratty", "Soggy", "Tangy", "Uppity", "Vexed", "Wacky", "Yappy", "Zippy",
  "Blunt", "Crusty"
];

const NOUNS = [
  "Beaver", "Frog", "Bird", "Car", "Snake", "Hamster", "Lizard", "Pigeon",
  "Raccoon", "Possum", "Lobster", "Penguin", "Walrus", "Narwhal", "Platypus",
  "Gecko", "Ferret", "Armadillo", "Capybara", "Axolotl", "Wombat", "Badger",
  "Otter", "Marmot", "Iguana", "Blobfish", "Manatee", "Tapir", "Quokka",
  "Dingo", "Echidna", "Sloth", "Porcupine", "Moose", "Skunk", "Mole",
  "Toucan", "Flamingo", "Pelican", "Vulture", "Goose", "Crab", "Shrimp",
  "Beetle", "Snail", "Slug", "Toad", "Newt", "Moth", "Wasp"
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shows the name generator modal overlay after the player dies.
 *
 * @param {number} score - The player's final score.
 * @param {Function} onDone - Callback fired after submit or skip.
 */
export function showNameGeneratorModal(score, onDone) {
  let adjective = randomFrom(ADJECTIVES);
  let noun = randomFrom(NOUNS);

  const overlay = document.createElement("div");
  overlay.id = "nameGenOverlay";

  function renderOverlay() {
    overlay.innerHTML = `
      <div id="nameGenPanel">
        <h2>You Died!</h2>
        <div class="nameGenScore">Score: ${score}</div>
        <div style="font-family:'Courier New',monospace; font-size:clamp(14px,2vw,18px); color:#000; text-align:center;">
          Enter your name to join the leaderboard
        </div>

        <div class="nameGenRow">
         <button class="nameGenReroll" data-reroll="adj">&#x21BB; Reroll</button>
          <div class="nameGenWord" id="nameGenAdj">${adjective}</div>
          <button class="nameGenReroll" data-reroll="adj">&#x21BB; Reroll</button>
        </div>

        <div class="nameGenRow">
        <button class="nameGenReroll" data-reroll="noun">&#x21BB; Reroll</button>
          <div class="nameGenWord" id="nameGenNoun">${noun}</div>
          <button class="nameGenReroll" data-reroll="noun">&#x21BB; Reroll</button>
        </div>

        <div id="nameGenPreview">${adjective} ${noun}</div>

        <div class="nameGenActions">
          <button class="nameGenSubmit" id="nameGenSubmitBtn">Submit</button>
          <button id="nameGenSkipBtn">Skip</button>
        </div>
      </div>
    `;

    const rerollAdjButtons = overlay.querySelectorAll('[data-reroll="adj"]');
    rerollAdjButtons.forEach((button) => {
      button.addEventListener("click", () => {
        adjective = randomFrom(ADJECTIVES);
        overlay.querySelector("#nameGenAdj").textContent = adjective;
        overlay.querySelector("#nameGenPreview").textContent = `${adjective} ${noun}`;
      });
    });

    const rerollNounButtons = overlay.querySelectorAll('[data-reroll="noun"]');
    rerollNounButtons.forEach((button) => {
      button.addEventListener("click", () => {
        noun = randomFrom(NOUNS);
        overlay.querySelector("#nameGenNoun").textContent = noun;
        overlay.querySelector("#nameGenPreview").textContent = `${adjective} ${noun}`;
      });
    });

    overlay.querySelector("#nameGenSubmitBtn").addEventListener("click", () => {
      const fullName = `${adjective} ${noun}`;
      saveGuestScore(fullName, score);
      overlay.remove();
      onDone();
    });

    overlay.querySelector("#nameGenSkipBtn").addEventListener("click", () => {
      overlay.remove();
      onDone();
    });
  }
 
  renderOverlay();
  document.body.appendChild(overlay);
}

/**
 * Renders the Leaderboard screen.
 *
 * Shows top scores from all players (no login required).
 *
 * @param {HTMLElement} rootElement - The parent screen container.
 * @param {Function} onBack - Callback to render the main menu.
 */
export function renderLeaderboardView(rootElement, onBack) {
  const leaderboard = getGuestLeaderboard();

  let leaderboardHTML = "";

  if (leaderboard.length === 0) {
    leaderboardHTML = `
      <div class="leaderboardEmpty">
        No scores yet! Play the game to get on the leaderboard.
      </div>
    `;
  } else {
    leaderboardHTML = `
      <div class="leaderboardTable">
        <div class="leaderboardHeader">
          <div class="leaderboardRank">Rank</div>
          <div class="leaderboardUser">Player</div>
          <div class="leaderboardScore">Score</div>
        </div>
        ${leaderboard.map((entry, index) => `
          <div class="leaderboardRow">
            <div class="leaderboardRank">${index + 1}</div>
            <div class="leaderboardUser">${entry.username}</div>
            <div class="leaderboardScore">${entry.score}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  rootElement.innerHTML = `
    <div class="menuScreen leaderboardScreen">
      <div class="leaderboardPanel">
        <h1 class="menuTitle leaderboardTitle">Leaderboard</h1>

        ${leaderboardHTML}

        <div class="leaderboardActions">
          <button id="refreshLeaderboard" class="menuButton secondary">Refresh</button>
          <button id="backFromLeaderboard" class="menuButton secondary">Back</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("refreshLeaderboard")?.addEventListener("click", () => {
    renderLeaderboardView(rootElement, onBack);
  });

  document.getElementById("backFromLeaderboard")?.addEventListener("click", () => {
    onBack();
  });
}
