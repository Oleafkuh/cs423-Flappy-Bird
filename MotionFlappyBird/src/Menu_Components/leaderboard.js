import { getGlobalLeaderboard, getCurrentUser } from "./login.js";

/**
 * Renders the Leaderboard screen.
 *
 * Shows top scores from all users and current user's best score.
 *
 * @param {HTMLElement} rootElement - The parent screen container.
 * @param {Function} onBack - Callback to render the main menu.
 */
export function renderLeaderboardView(rootElement, onBack) {
  const leaderboard = getGlobalLeaderboard();
  const currentUser = getCurrentUser();
  
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
          <div class="leaderboardRow ${entry.username === currentUser ? 'currentUser' : ''}">
            <div class="leaderboardRank">${index + 1}</div>
            <div class="leaderboardUser">${entry.username}</div>
            <div class="leaderboardScore">${entry.score}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  rootElement.innerHTML = `
    <div class="menuScreen">
      <h1 class="menuTitle">Leaderboard</h1>
      
      ${leaderboardHTML}
      
      <div class="leaderboardActions">
        <button id="refreshLeaderboard" class="menuButton secondary">Refresh</button>
        <button id="backFromLeaderboard" class="menuButton secondary">Back</button>
      </div>
    </div>
  `;

  const refreshButton = document.getElementById("refreshLeaderboard");
  const backButton = document.getElementById("backFromLeaderboard");
  
  refreshButton?.addEventListener("click", () => {
    renderLeaderboardView(rootElement, onBack);
  });
  
  backButton?.addEventListener("click", () => {
    onBack();
  });
}
