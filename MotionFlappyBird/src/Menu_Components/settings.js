/**
 * Renders the Settings screen.
 *
 * This is a placeholder screen that can later load setting controls.
 * It includes a Back button to return to the main menu.
 *
 * @param {HTMLElement} rootElement - The parent screen container.
 * @param {Function} onBack - Callback to render the main menu.
 */
export function renderSettingsView(rootElement, onBack) {
  rootElement.innerHTML = `
    <div class="menuScreen">
      <h1 class="menuTitle">Settings</h1>
      <button id="backFromSettings" class="menuButton secondary">Back</button>
    </div>
  `;

  const backButton = document.getElementById("backFromSettings");
  backButton?.addEventListener("click", () => {
    onBack();
  });
}
