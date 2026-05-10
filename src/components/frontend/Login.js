import React, { useState } from "react";
import "./styles/common.css";
import "./styles/login.css";

export default function Login() {
  const [language, setLanguage] = useState("fr");
  const [identifier, setIdentifier] = useState(""); // email ou pseudo
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const t = {
    fr: {
      title:         "(Re)Sources Relationnelles",
      home:          "Accueil",
      register:      "S'inscrire",
      subtitle:      "Connectez-vous à votre compte.",
      formTitle:     "Se connecter",
      identifier:    "Email ou pseudo",
      password:      "Mot de passe",
      submit:        "Se connecter",
      noAccount:     "Vous n'avez pas de compte ?",
      registerLink:  "S'inscrire",
      forgotPassword:"Mot de passe oublié ?",
      errorInvalid:  "Identifiant ou mot de passe incorrect.",
      errorServer:   "Erreur de connexion au serveur.",
      errorEmpty:    "Veuillez remplir tous les champs.",
    },
    en: {
      title:         "(Re)Sources Relationnelles",
      home:          "Home",
      register:      "Sign up",
      subtitle:      "Log in to your account.",
      formTitle:     "Log in",
      identifier:    "Email or username",
      password:      "Password",
      submit:        "Log in",
      noAccount:     "Don't have an account?",
      registerLink:  "Sign up",
      forgotPassword:"Forgot password?",
      errorInvalid:  "Invalid identifier or password.",
      errorServer:   "Server connection error.",
      errorEmpty:    "Please fill in all fields.",
    },
  }[language];

  // Détermine si l'identifiant est un email ou un pseudo
  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError(t.errorEmpty);
      return;
    }

    setLoading(true);
    try {
      let emailToUse = identifier.trim();

      // Si c'est un pseudo → résoudre l'email via /api/resolve-email
      if (!isEmail(emailToUse)) {
        const resolveRes = await fetch(
          `http://localhost:8000/api/resolve-email?nickname=${encodeURIComponent(emailToUse)}`
        );
        if (!resolveRes.ok) {
          setError(t.errorInvalid);
          setLoading(false);
          return;
        }
        const resolveData = await resolveRes.json();
        emailToUse = resolveData.email;
      }

      // Connexion avec l'email
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("token", data.token);
        // Rediriger vers la page précédente ou account
        const redirect = new URLSearchParams(window.location.search).get("redirect") || "/account";
        window.location.href = redirect;
      } else {
        setError(t.errorInvalid);
      }
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">{t.title}</div>
        <div className="nav-buttons">
          <a href="/">{t.home}</a>
          <a href="/register">{t.register}</a>
          <div
            className={`switch ${language === "en" ? "active" : ""}`}
            onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
          >
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="login-content">
        <div className="login-hero">
          <h2>{t.formTitle}</h2>
          <p>{t.subtitle}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="identifier">{t.identifier}</label>
            <input
              id="identifier"
              type="text"
              placeholder={t.identifier}
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              className={error ? "error" : ""}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              className={error ? "error" : ""}
              autoComplete="current-password"
            />
          </div>

          <div className="login-forgot">
            <a href="/forgot">{t.forgotPassword}</a>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "..." : t.submit}
          </button>
        </form>

        <div className="login-link">
          <p>{t.noAccount} <a href="/register">{t.registerLink}</a></p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <button>Contact</button>
            <button>Écrivez-nous</button>
          </div>
          <div className="footer-column">
            <button>À propos</button>
            <button>Plan du site</button>
          </div>
          <div className="footer-column">
            <button>Aide & Accessibilité</button>
            <button>Données personnelles</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
