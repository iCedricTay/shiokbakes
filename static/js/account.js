/* Account page logic (client-side only) */

(function(){
  const $  = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const USERS_KEY = "sb_users";

  function readUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; } }
  function writeUsers(arr){ localStorage.setItem(USERS_KEY, JSON.stringify(arr)); }
  function userByUsername(username){
    return readUsers().find(u => (u.username || "").toLowerCase() === (username || "").toLowerCase());
  }

  // Tabs
  const signinTab = $("#signinTab");
  const registerTab = $("#registerTab");
  const signinPanel = $("#signinPanel");
  const registerPanel = $("#registerPanel");
  const signedInPanel = $("#signedInPanel");

  function activateTab(which){
    if (which === "register"){
      signinTab.classList.remove("active");
      registerTab.classList.add("active");
      signinTab.setAttribute("aria-selected","false");
      registerTab.setAttribute("aria-selected","true");
      signinPanel.classList.add("hidden");
      registerPanel.classList.remove("hidden");
    } else {
      registerTab.classList.remove("active");
      signinTab.classList.add("active");
      registerTab.setAttribute("aria-selected","false");
      signinTab.setAttribute("aria-selected","true");
      registerPanel.classList.add("hidden");
      signinPanel.classList.remove("hidden");
    }
  }
  signinTab?.addEventListener("click", () => activateTab("signin"));
  registerTab?.addEventListener("click", () => activateTab("register"));
  $("#goRegister")?.addEventListener("click", (e) => { e.preventDefault(); activateTab("register"); });
  $("#goSignin")?.addEventListener("click", (e) => { e.preventDefault(); activateTab("signin"); });

  // Eye toggles
  $$(".pw-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".pw-wrap")?.querySelector("input");
      if (!input) return;
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      btn.setAttribute("aria-label", isPw ? "Hide password" : "Show password");
    });
  });

  // Sign in
  $("#loginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#loginError"); err.hidden = true; err.textContent = "";

    const username = $("#loginUsername")?.value.trim();
    const password = $("#loginPassword")?.value;

    if (!username || !password){
      err.textContent = "Please enter both username and password.";
      err.hidden = false; return;
    }

    const u = userByUsername(username);
    if (!u || u.password !== password){
      err.textContent = "Invalid username or password.";
      err.hidden = false; return;
    }

    window.SB?.Auth?.login(u.username);
    location.href = "index.html";
  });

  // Register
  $("#registerForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("#registerError"); err.hidden = true; err.textContent = "";

    const username = $("#regUsername")?.value.trim();
    const email    = $("#regEmail")?.value.trim();
    const address  = $("#regAddress")?.value.trim();
    const password = $("#regPassword")?.value;

    if (!username || !email || !address || !password){
      err.textContent = "Please fill in all fields.";
      err.hidden = false; return;
    }
    if (password.length < 6){
      err.textContent = "Password must be at least 6 characters long.";
      err.hidden = false; return;
    }
    if (userByUsername(username)){
      err.textContent = "This username is already taken. Please choose another.";
      err.hidden = false; return;
    }

    const users = readUsers();
    users.push({ username, email, address, password });
    writeUsers(users);

    window.SB?.Auth?.login(username);
    alert("Account created! You are now signed in.");
    location.href = "index.html";
  });

  // If signed in already, show summary
  function renderSignedInPanel(){
    const user = window.SB?.Auth?.user;
    if (user){
      $("#acctName").textContent = user.username;
      signinPanel.classList.add("hidden");
      registerPanel.classList.add("hidden");
      signedInPanel.classList.remove("hidden");
    }
  }
  $("#signoutHere")?.addEventListener("click", () => {
    if (confirm("Sign out now?")){
      window.SB?.Auth?.logout();
      signedInPanel.classList.add("hidden");
      activateTab("signin");
    }
  });

  document.addEventListener("DOMContentLoaded", renderSignedInPanel);
})();
