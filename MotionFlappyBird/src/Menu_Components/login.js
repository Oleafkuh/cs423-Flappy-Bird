/**
 * Renders the Login/Register screen.
 *
 * @param {HTMLElement} rootElement - The parent screen container.
 * @param {Function} onLoginSuccess - Callback when login/register succeeds.
 * @param {Function} onBack - Callback to render the main menu.
 */
export function renderLoginView(rootElement, onLoginSuccess, onBack) {
  rootElement.innerHTML = `
    <div class="menuScreen">
      <h1 class="menuTitle">Login / Register</h1>
      
      <div class="loginForm">
        <input type="text" id="username" placeholder="Username" class="loginInput" />
        <input type="password" id="password" placeholder="Password" class="loginInput" />
        
        <div class="loginButtons">
          <button id="loginButton" class="menuButton primary">Login</button>
          <button id="registerButton" class="menuButton secondary">Register</button>
          <button id="backFromLogin" class="menuButton secondary">Back</button>
        </div>
        
        <div id="loginMessage" class="loginMessage"></div>
      </div>
    </div>
  `;

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const registerButton = document.getElementById("registerButton");
  const backButton = document.getElementById("backFromLogin");
  const messageDiv = document.getElementById("loginMessage");

  function showMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.style.color = isError ? "#ff4444" : "#44ff44";
    messageDiv.style.display = "block";
  }

  function validateInputs() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      showMessage("Please enter username and password", true);
      return false;
    }
    if (username.length < 3) {
      showMessage("Username must be at least 3 characters", true);
      return false;
    }
    if (password.length < 4) {
      showMessage("Password must be at least 4 characters", true);
      return false;
    }
    return true;
  }

  loginButton.addEventListener("click", () => {
    if (!validateInputs()) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    const users = JSON.parse(localStorage.getItem("flappyUsers") || "{}");
    
    if (!users[username]) {
      showMessage("User not found", true);
      return;
    }
    
    if (users[username].password !== password) {
      showMessage("Incorrect password", true);
      return;
    }
    
    localStorage.setItem("currentUser", username);
    showMessage("Login successful!");
    setTimeout(() => onLoginSuccess(username), 1000);
  });

  registerButton.addEventListener("click", () => {
    if (!validateInputs()) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    const users = JSON.parse(localStorage.getItem("flappyUsers") || "{}");
    
    if (users[username]) {
      showMessage("Username already exists", true);
      return;
    }
    
    users[username] = {
      password: password,
      scores: [],
      bestScore: 0,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem("flappyUsers", JSON.stringify(users));
    localStorage.setItem("currentUser", username);
    showMessage("Registration successful!");
    setTimeout(() => onLoginSuccess(username), 1000);
  });

  backButton.addEventListener("click", () => {
    onBack();
  });
}

/**
 * Gets the current logged-in user.
 * @returns {string|null} Username or null if not logged in.
 */
export function getCurrentUser() {
  return localStorage.getItem("currentUser");
}

/**
 * Logs out the current user.
 */
export function logout() {
  localStorage.removeItem("currentUser");
}

/**
 * Saves a score for the current user.
 * @param {number} score - The score to save.
 */
export function saveScore(score) {
  const username = getCurrentUser();
  if (!username) return;
  
  const users = JSON.parse(localStorage.getItem("flappyUsers") || "{}");
  if (!users[username]) return;
  
  const user = users[username];
  const scoreEntry = {
    score: score,
    date: new Date().toISOString()
  };
  
  user.scores.push(scoreEntry);
  user.scores.sort((a, b) => b.score - a.score);
  user.scores = user.scores.slice(0, 20); // Keep top 20 scores
  
  if (score > user.bestScore) {
    user.bestScore = score;
  }
  
  users[username] = user;
  localStorage.setItem("flappyUsers", JSON.stringify(users));
}

/**
 * Gets the global leaderboard (top scores from all users).
 * @returns {Array} Array of score entries with username and score.
 */
export function getGlobalLeaderboard() {
  const users = JSON.parse(localStorage.getItem("flappyUsers") || "{}");
  const leaderboard = [];
  
  for (const [username, userData] of Object.entries(users)) {
    if (userData.scores && userData.scores.length > 0) {
      const bestScore = Math.max(...userData.scores.map(s => s.score));
      leaderboard.push({
        username: username,
        score: bestScore,
        date: userData.scores[0].date
      });
    }
  }
  
  leaderboard.sort((a, b) => b.score - a.score);
  return leaderboard.slice(0, 10); // Top 10 global scores
}
