import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/login.css";

const API = "http://localhost:8000/api";

export default function Password() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [step, setStep] = useState("request"); // request | reset | success
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devToken, setDevToken] = useState(""); // token visible en dev

  const t = {
    fr: {
      title: "(Re)Sources Relationnelles",
      requestTitle: "Mot de passe oublié",
      requestSubtitle: "Entrez votre email pour recevoir un lien de réinitialisation.",
      resetTitle: "Nouveau mot de passe",
      resetSubtitle: "Entrez votre nouveau mot de passe.",
      successTitle: "Mot de passe mis à jour !",
      successSubtitle: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
      email: "Email",
      token: "Code de réinitialisation",
      tokenHint: "Copiez le code reçu par email (ou affiché ci-dessous en mode développement).",
      password: "Nouveau mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      sendLink: "Envoyer le lien",
      resetPassword: "Réinitialiser le mot de passe",
      backToLogin: "Retour à la connexion",
      devMode: "Mode développement — token de réinitialisation :",
      useToken: "Utiliser ce token",
      passwordShort: "Minimum 8 caractères.",
      passwordMismatch: "Les mots de passe ne correspondent pas.",
      required: "Champ obligatoire.",
      errorServer: "Erreur serveur. Veuillez réessayer.",
    },
    en: {
      title: "(Re)Sources Relationnelles",
      requestTitle: "Forgot password",
      requestSubtitle: "Enter your email to receive a reset link.",
      resetTitle: "New password",
      resetSubtitle: "Enter your new password.",
      successTitle: "Password updated!",
      successSubtitle: "You can now log in with your new password.",
      email: "Email",
      token: "Reset code",
      tokenHint: "Copy the code received by email (or shown below in development mode).",
      password: "New password",
      confirmPassword: "Confirm password",
      sendLink: "Send link",
      resetPassword: "Reset password",
      backToLogin: "Back to login",
      devMode: "Development mode — reset token:",
      useToken: "Use this token",
      passwordShort: "Minimum 8 characters.",
      passwordMismatch: "Passwords do not match.",
      required: "Required field.",
      errorServer: "Server error. Please try again.",
    },
  }[language];

  // Lire le token depuis l'URL si présent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      setStep("reset");
    }
  }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(t.required); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.sent === true) {
          // Email trouvé — aller à l'étape de réinitialisation
          setStep("reset");
        } else {
          // Email non trouvé — afficher erreur
          setError(language === "fr"
            ? "Aucun compte associé à cet email."
            : "No account found with this email.");
        }
      } else {
        setError(data.error || t.errorServer);
      }
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!token.trim()) { setError(t.required); return; }
    if (!password) { setError(t.required); return; }
    if (password.length < 8) { setError(t.passwordShort); return; }
    if (password !== confirmPassword) { setError(t.passwordMismatch); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("success");
      } else {
        setError(data.error || t.errorServer);
      }
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="navbar">
        <div className="logo">{t.title}</div>
        <div className="nav-buttons">
          <a href="/login">{language === "fr" ? "Se connecter" : "Log in"}</a>
          <div className={`switch ${language === "en" ? "active" : ""}`}
               onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      <div className="login-content">

        {/* ÉTAPE 1 — Demande de réinitialisation */}
        {step === "request" && (
          <>
            <div className="login-hero">
              <h1>{t.requestTitle}</h1>
              <p>{t.requestSubtitle}</p>
            </div>
            <form className="login-form" onSubmit={handleRequest} noValidate>
              {error && <div className="login-error" role="alert">{error}</div>}
              <div className="form-group">
                <label htmlFor="email">{t.email}</label>
                <input id="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder={t.email} autoFocus />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? "..." : t.sendLink}
              </button>
              <a href="/login" style={{ textAlign: "center", color: "#60a5fa", fontSize: "13px" }}>
                {t.backToLogin}
              </a>
            </form>
          </>
        )}

        {/* ÉTAPE 2 — Nouveau mot de passe */}
        {step === "reset" && (
          <>
            <div className="login-hero">
              <h1>{t.resetTitle}</h1>
              <p>{t.resetSubtitle}</p>
            </div>

            {/* Token visible en mode dev */}
            {devToken && (
              <div className="dev-token-box">
                <p className="dev-token-label">{t.devMode}</p>
                <code className="dev-token-value">{devToken}</code>
                <button className="dev-token-btn" onClick={() => setToken(devToken)}>
                  {t.useToken}
                </button>
              </div>
            )}

            <form className="login-form" onSubmit={handleReset} noValidate>
              {error && <div className="login-error" role="alert">{error}</div>}

              <div className="form-group">
                <label htmlFor="token">{t.token}</label>
                <input id="token" type="text" value={token}
                  onChange={(e) => { setToken(e.target.value); setError(""); }}
                  placeholder={t.token} />
                <small>{t.tokenHint}</small>
              </div>

              <div className="form-group">
                <label htmlFor="password">{t.password}</label>
                <input id="password" type="password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder={t.password} />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t.confirmPassword}</label>
                <input id="confirmPassword" type="password" value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder={t.confirmPassword} />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "..." : t.resetPassword}
              </button>
            </form>
          </>
        )}

        {/* ÉTAPE 3 — Succès */}
        {step === "success" && (
          <div className="login-hero" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
            <h1 style={{ color: "#4ade80" }}>{t.successTitle}</h1>
            <p>{t.successSubtitle}</p>
            <button className="btn-primary" style={{ marginTop: "24px", width: "100%", maxWidth: "380px" }}
              onClick={() => navigate("/login")}>
              {t.backToLogin}
            </button>
          </div>
        )}

      </div>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column"><button>Contact</button></div>
          <div className="footer-column"><button>À propos</button></div>
          <div className="footer-column"><button>Accessibilité</button></div>
        </div>
      </footer>
    </div>
  );
}
