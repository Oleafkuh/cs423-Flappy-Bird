/**
 * Renders the Leaderboard screen.
 *
 * This is a placeholder screen that can later load leaderboard entries.
 * It includes a Back button to return to the main menu.
 *
 * @param {HTMLElement} rootElement - The parent screen container.
 * @param {Function} onBack - Callback to render the main menu.
 */
export function renderLeaderboardView(rootElement, onBack) {
  rootElement.innerHTML = `
    <div class="menuScreen">
      <h1 class="menuTitle">Leaderboard</h1>
      <button id="backFromLeaderboard" class="menuButton secondary">Back</button>
    </div>
  `;

  const backButton = document.getElementById("backFromLeaderboard");
  backButton?.addEventListener("click", () => {
    onBack();
  });
}
