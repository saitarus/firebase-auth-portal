// Import Firebase SDK Modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Import Custom Firebase configuration
import { firebaseConfig } from "./firebase-config.js";

// DOM Elements
const loadingOverlay = document.getElementById("loadingOverlay");
const toastContainer = document.getElementById("toastContainer");
const authCard = document.getElementById("authCard");
const dashboardContainer = document.getElementById("dashboardContainer");

// Auth Form Elements
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const displayNameGroup = document.getElementById("displayNameGroup");
const displayNameInput = document.getElementById("displayNameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleAuthMode = document.getElementById("toggleAuthMode");
const toggleMessage = document.getElementById("toggleMessage");
const googleAuthBtn = document.getElementById("googleAuthBtn");

// Terms Modal Elements
const termsModal = document.getElementById("termsModal");
const openTermsLink = document.getElementById("openTermsLink");
const closeTermsBtn = document.getElementById("closeTermsBtn");
const closeTermsBtnSecondary = document.getElementById("closeTermsBtnSecondary");

// Dashboard Elements
const userGreeting = document.getElementById("userGreeting");
const userEmail = document.getElementById("userEmail");
const avatarIcon = document.getElementById("avatarIcon");
const logoutBtn = document.getElementById("logoutBtn");
const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileNameInput");
const historyList = document.getElementById("historyList");

// Portfolio Form Elements
const portfolioForm = document.getElementById("portfolioForm");
const lancersRatingInput = document.getElementById("lancersRatingInput");
const lancersCountInput = document.getElementById("lancersCountInput");
const lancersCertifiedInput = document.getElementById("lancersCertifiedInput");
const cwRatingInput = document.getElementById("cwRatingInput");
const cwCountInput = document.getElementById("cwCountInput");
const cwProInput = document.getElementById("cwProInput");

// Portfolio Display Elements
const lancersRatingVal = document.getElementById("lancersRatingVal");
const lancersCountVal = document.getElementById("lancersCountVal");
const lancersStars = document.getElementById("lancersStars");
const lancersBadge = document.getElementById("lancersBadge");
const cwRatingVal = document.getElementById("cwRatingVal");
const cwCountVal = document.getElementById("cwCountVal");
const cwStars = document.getElementById("cwStars");
const cwBadge = document.getElementById("cwBadge");

// Account Details Elements
const metaUid = document.getElementById("metaUid");
const metaCreatedAt = document.getElementById("metaCreatedAt");
const metaLastLogin = document.getElementById("metaLastLogin");

// State Variables
let isLoginMode = false; // Initial mode is Sign Up
let firebaseApp, auth, db;
let hasRecordedSession = false; // セッションごとの多重記録防止フラグ

// Helper: Show Toast Notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <span style="cursor:pointer; font-weight:bold; margin-left: 10px;" onclick="this.parentElement.remove()">×</span>
  `;
  toastContainer.appendChild(toast);

  // Automatically remove toast after 5 seconds (matching CSS animation)
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// Helper: Toggle Loading Overlay
function setLoading(isLoading) {
  if (isLoading) {
    loadingOverlay.classList.add("active");
  } else {
    loadingOverlay.classList.remove("active");
  }
}

// Check configuration parameters
function isConfigValid(config) {
  return config && 
         config.apiKey && 
         !config.apiKey.startsWith("YOUR_") && 
         config.projectId && 
         !config.projectId.startsWith("YOUR_");
}

// Initialize Firebase
if (!isConfigValid(firebaseConfig)) {
  showToast("Firebase設定（APIキー等）が初期設定のままです。firebase-config.js をご自身のFirebaseプロジェクトの設定値に書き換えてください。", "error");
  setLoading(false);
  authTitle.textContent = "設定エラー";
  authSubtitle.innerHTML = `<span style="color:var(--danger-hover)">firebase-config.js を編集してください。</span>`;
  authSubmitBtn.disabled = true;
  authSubmitBtn.style.opacity = "0.5";
  googleAuthBtn.disabled = true;
  googleAuthBtn.style.opacity = "0.5";
} else {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
    initApp();
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
    showToast("Firebaseの初期化に失敗しました: " + error.message, "error");
  }
}

// App Logic initialization
function initApp() {
  // Listen for Authentication State
  onAuthStateChanged(auth, async (user) => {
    setLoading(true);
    try {
      if (user) {
        // User is logged in - Setup basic dashboard info immediately to unlock UI
        setupDashboardBasics(user);
        setLoading(false);

        // この起動セッションで未記録の場合のみ、ログイン履歴を自動記録する
        if (!hasRecordedSession) {
          hasRecordedSession = true;
          await recordLoginHistory(user.uid);
        }

        // Fetch Firestore profile and history in background
        loadFirestoreData(user);
      } else {
        // User is logged out
        hasRecordedSession = false; // ログアウト時はフラグをリセット
        showAuthScreen();
        setLoading(false);
      }
    } catch (error) {
      console.error("Auth state setup error:", error);
      showToast("認証セッションの処理中にエラーが発生しました: " + error.message, "error");
      setLoading(false);
    }
  });

  // Setup Event Listeners
  toggleAuthMode.addEventListener("click", (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    updateAuthUI();
  });

  authForm.addEventListener("submit", handleAuthSubmit);
  profileForm.addEventListener("submit", handleProfileUpdate);
  portfolioForm.addEventListener("submit", handlePortfolioUpdate);
  logoutBtn.addEventListener("click", handleLogout);
  googleAuthBtn.addEventListener("click", handleGoogleLogin);

  // Terms Modal Events
  openTermsLink.addEventListener("click", (e) => {
    e.preventDefault();
    termsModal.classList.remove("hidden");
  });

  const closeTerms = () => {
    termsModal.classList.add("hidden");
  };

  closeTermsBtn.addEventListener("click", closeTerms);
  closeTermsBtnSecondary.addEventListener("click", closeTerms);
  termsModal.addEventListener("click", (e) => {
    if (e.target === termsModal) {
      closeTerms();
    }
  });
}

// Update UI based on Auth Mode (SignUp / Login)
function updateAuthUI() {
  authForm.reset();
  if (isLoginMode) {
    authTitle.textContent = "ログイン";
    authSubtitle.textContent = "登録済みのメールアドレスとパスワードを入力してください";
    displayNameGroup.classList.add("hidden");
    displayNameInput.removeAttribute("required");
    authSubmitBtn.textContent = "ログイン";
    toggleMessage.textContent = "アカウントをお持ちでないですか？";
    toggleAuthMode.textContent = "アカウント作成はこちら";
  } else {
    authTitle.textContent = "アカウント作成";
    authSubtitle.textContent = "メールアドレスとパスワードを入力してください";
    displayNameGroup.classList.remove("hidden");
    displayNameInput.setAttribute("required", "");
    authSubmitBtn.textContent = "アカウント登録";
    toggleMessage.textContent = "すでにアカウントをお持ちですか？";
    toggleAuthMode.textContent = "ログインはこちら";
  }
}

// Show Authentication Screen
function showAuthScreen() {
  dashboardContainer.classList.add("hidden");
  authCard.classList.remove("hidden");
  updateAuthUI();
}

// Handle Login or Registration Submit
async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const displayName = displayNameInput.value.trim();

  setLoading(true);

  try {
    if (isLoginMode) {
      // 1. Log In User
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      showToast(`${user.displayName || '会員'} 様、ログインしました。`, "success");
    } else {
      // 2. Sign Up User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Auth Profile (Display Name)
      await updateProfile(user, { displayName: displayName });

      // Save user base information to Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        displayName: displayName,
        email: email,
        createdAt: serverTimestamp()
      });

      showToast("会員登録が完了し、ログインしました！", "success");
    }
  } catch (error) {
    console.error("Auth Action Error:", error);
    let errorMsg = "エラーが発生しました: " + error.message;
    if (error.code === "auth/email-already-in-use") {
      errorMsg = "このメールアドレスは既に登録されています。";
    } else if (error.code === "auth/weak-password") {
      errorMsg = "パスワードは6文字以上で設定してください。";
    } else if (error.code === "auth/invalid-credential") {
      errorMsg = "メールアドレスまたはパスワードが正しくありません。";
    }
    showToast(errorMsg, "error");
  } finally {
    setLoading(false);
  }
}

// Record Login Session details to Firestore
async function recordLoginHistory(uid) {
  try {
    const historyCollectionRef = collection(db, "users", uid, "login_history");
    await addDoc(historyCollectionRef, {
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error("Failed to record login history:", error);
    // ログイン自体は成功しているので、エラーを表示しつつ継続
  }
}

// Setup Dashboard basic info (synchronously) to unlock UI quickly
function setupDashboardBasics(user) {
  // Toggle UI
  authCard.classList.add("hidden");
  dashboardContainer.classList.remove("hidden");

  // Bind values based on current Authentication profile
  const displayName = user.displayName || "メンバー";
  userGreeting.textContent = `ようこそ、${displayName} 様`;
  userEmail.textContent = user.email;
  avatarIcon.textContent = displayName.charAt(0).toUpperCase();
  profileNameInput.value = displayName;

  // Bind raw metadata first
  metaUid.textContent = user.uid;
  metaCreatedAt.textContent = formatRawDate(user.metadata.creationTime);
  metaLastLogin.textContent = formatRawDate(user.metadata.lastSignInTime);
}

// Fetch Firestore data (Profile & Login logs) asynchronously in background
async function loadFirestoreData(user) {
  const userDocRef = doc(db, "users", user.uid);
  let profileData = null;
  
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      profileData = docSnap.data();

      // Update UI with actual Firestore profile name if it differs or is updated
      const displayName = profileData.displayName || user.displayName || "メンバー";
      userGreeting.textContent = `ようこそ、${displayName} 様`;
      avatarIcon.textContent = displayName.charAt(0).toUpperCase();
      profileNameInput.value = displayName;

      if (profileData.createdAt) {
        metaCreatedAt.textContent = formatTimestamp(profileData.createdAt);
      }

      // Load Portfolio Data (Lancers / CrowdWorks)
      const portfolio = profileData.portfolio || {
        lancers: { rating: 4.9, count: 24, isCertified: true },
        cw: { rating: 4.8, count: 32, isPro: true }
      };
      updatePortfolioUI(portfolio);
      updatePortfolioForm(portfolio);

      // If portfolio didn't exist in Firestore, save the default mock values
      if (!profileData.portfolio) {
        setDoc(userDocRef, { portfolio: portfolio }, { merge: true }).catch(err => {
          console.error("Failed to save default portfolio:", err);
        });
      }
    } else {
      // If Firestore profile doesn't exist, create it with default portfolio
      const defaultPortfolio = {
        lancers: { rating: 4.9, count: 24, isCertified: true },
        cw: { rating: 4.8, count: 32, isPro: true }
      };
      profileData = {
        displayName: user.displayName || "ゲスト",
        email: user.email,
        createdAt: serverTimestamp(),
        portfolio: defaultPortfolio
      };
      setDoc(userDocRef, profileData).catch(err => {
        console.error("Failed to create user doc:", err);
      });
      updatePortfolioUI(defaultPortfolio);
      updatePortfolioForm(defaultPortfolio);
    }
  } catch (error) {
    console.error("Firestore Profile Sync Error:", error);
    // 権限エラーやオフライン等でも画面全体はブロックしないよう、トーストで警告するのみに留める
    showToast("プロファイルの同期に失敗しました（オフラインまたは権限不足の可能性があります）", "error");

    // Fallback UI rendering
    const fallbackPortfolio = {
      lancers: { rating: 4.9, count: 24, isCertified: true },
      cw: { rating: 4.8, count: 32, isPro: true }
    };
    updatePortfolioUI(fallbackPortfolio);
    updatePortfolioForm(fallbackPortfolio);
  }

  // Load login history list
  await fetchLoginHistory(user.uid);
}

// Fetch Login logs from Firestore
async function fetchLoginHistory(uid) {
  historyList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary);">読み込み中...</div>';
  
  try {
    const historyCollectionRef = collection(db, "users", uid, "login_history");
    const q = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(10));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      historyList.innerHTML = '<div class="no-history">ログイン履歴がありません。</div>';
      return;
    }

    historyList.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const historyItem = document.createElement("div");
      historyItem.className = "history-item";
      
      const timeStr = formatTimestamp(data.timestamp) || "記録中...";
      const uaStr = data.userAgent || "不明なブラウザ";

      historyItem.innerHTML = `
        <div class="history-time">${timeStr}</div>
        <div class="history-ua">${uaStr}</div>
      `;
      historyList.appendChild(historyItem);
    });
  } catch (error) {
    console.error("Fetch Login History Error:", error);
    historyList.innerHTML = `<div class="no-history" style="color:var(--danger-hover)">履歴の取得に失敗しました。<br>${error.message}</div>`;
  }
}

// Profile Information Update handler
async function handleProfileUpdate(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const newDisplayName = profileNameInput.value.trim();
  if (!newDisplayName) return;

  setLoading(true);
  try {
    // 1. Update Authentication User Profile
    await updateProfile(user, { displayName: newDisplayName });

    // 2. Update Firestore document (asynchronously to prevent freezing UI)
    const userDocRef = doc(db, "users", user.uid);
    setDoc(userDocRef, {
      displayName: newDisplayName
    }, { merge: true }).catch(error => {
      console.error("Firestore Profile Sync Error:", error);
      showToast("プロファイルのバックグラウンド同期に失敗しました: " + error.message, "error");
    });

    // 3. Update local UI elements
    userGreeting.textContent = `ようこそ、${newDisplayName} 様`;
    avatarIcon.textContent = newDisplayName.charAt(0).toUpperCase();
    
    showToast("プロフィールを更新しました！", "success");
  } catch (error) {
    console.error("Profile Update Error:", error);
    showToast("プロフィールの更新に失敗しました: " + error.message, "error");
  } finally {
    setLoading(false);
  }
}

// Portfolio Update Handler
async function handlePortfolioUpdate(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const lancersData = {
    rating: parseFloat(lancersRatingInput.value) || 0,
    count: parseInt(lancersCountInput.value, 10) || 0,
    isCertified: lancersCertifiedInput.checked
  };

  const cwData = {
    rating: parseFloat(cwRatingInput.value) || 0,
    count: parseInt(cwCountInput.value, 10) || 0,
    isPro: cwProInput.checked
  };

  setLoading(true);
  try {
    const userDocRef = doc(db, "users", user.uid);
    const updatedPortfolio = {
      lancers: lancersData,
      cw: cwData
    };

    // Save to Firestore with merge options (asynchronously to prevent freezing UI)
    setDoc(userDocRef, {
      portfolio: updatedPortfolio
    }, { merge: true }).catch(error => {
      console.error("Portfolio Sync Error:", error);
      showToast("実績データのバックグラウンド同期に失敗しました: " + error.message, "error");
    });

    // Update UI summary dynamically
    updatePortfolioUI(updatedPortfolio);

    showToast("実績ポートフォリオデータを更新しました！", "success");
  } catch (error) {
    console.error("Portfolio Update Error:", error);
    showToast("実績の更新に失敗しました: " + error.message, "error");
  } finally {
    setLoading(false);
  }
}

// UI updates helper for Portfolio
function updatePortfolioUI(portfolio) {
  const lancers = portfolio.lancers || { rating: 0, count: 0, isCertified: false };
  const cw = portfolio.cw || { rating: 0, count: 0, isPro: false };

  lancersRatingVal.textContent = Number(lancers.rating).toFixed(1);
  lancersCountVal.textContent = lancers.count;
  lancersStars.textContent = generateStarString(lancers.rating);
  if (lancers.isCertified) {
    lancersBadge.classList.remove("hidden");
  } else {
    lancersBadge.classList.add("hidden");
  }

  cwRatingVal.textContent = Number(cw.rating).toFixed(1);
  cwCountVal.textContent = cw.count;
  cwStars.textContent = generateStarString(cw.rating);
  if (cw.isPro) {
    cwBadge.classList.remove("hidden");
  } else {
    cwBadge.classList.add("hidden");
  }
}

// Form fields updates helper for Portfolio
function updatePortfolioForm(portfolio) {
  const lancers = portfolio.lancers || { rating: 4.9, count: 24, isCertified: true };
  const cw = portfolio.cw || { rating: 4.8, count: 32, isPro: true };

  lancersRatingInput.value = lancers.rating;
  lancersCountInput.value = lancers.count;
  lancersCertifiedInput.checked = lancers.isCertified;

  cwRatingInput.value = cw.rating;
  cwCountInput.value = cw.count;
  cwProInput.checked = cw.isPro;
}

// Helper to render star strings
function generateStarString(rating) {
  const fullStars = Math.round(rating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

// User Log-out Handler
async function handleLogout() {
  setLoading(true);
  try {
    await signOut(auth);
    showToast("ログアウトしました。", "success");
  } catch (error) {
    console.error("Logout Error:", error);
    showToast("ログアウトに失敗しました: " + error.message, "error");
  } finally {
    setLoading(false);
  }
}

// Handle Google Sign-in Popup
async function handleGoogleLogin() {
  setLoading(true);
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if Firestore user document exists, create it if not
    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      await setDoc(userDocRef, {
        displayName: user.displayName || "Googleユーザー",
        email: user.email,
        createdAt: serverTimestamp()
      });
    }

    showToast(`${user.displayName || 'Googleユーザー'} 様、ログインしました。`, "success");
  } catch (error) {
    console.error("Google Auth Error:", error);
    let errorMsg = "Googleログインに失敗しました: " + error.message;
    if (error.code === "auth/popup-blocked") {
      errorMsg = "ポップアップがブラウザによってブロックされました。ポップアップを許可して再試行してください。";
    } else if (error.code === "auth/popup-closed-by-user") {
      errorMsg = "ログインポップアップが閉じられました。";
    } else if (error.code === "auth/operation-not-allowed") {
      errorMsg = "Firebase ConsoleでGoogleログインが有効になっていません。設定を確認してください。";
    }
    showToast(errorMsg, "error");
  } finally {
    setLoading(false);
  }
}

// Formatter Helpers
function formatTimestamp(firestoreTimestamp) {
  if (!firestoreTimestamp) return null;
  const date = firestoreTimestamp.toDate();
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatRawDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
