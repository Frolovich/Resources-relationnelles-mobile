import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/resource.css";
import { videoUrl, imageUrl } from "../../services/media.js";

const API = "http://localhost:8000/api";

export default function ResourcePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [commentSent, setCommentSent] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exploited, setExploited] = useState(false);

  const token = localStorage.getItem("token");

  const t = {
    fr: {
      back: "← Retour",
      by: "Par",
      published: "Publié le",
      category: "Catégorie",
      restricted: "Contenu restreint — connectez-vous pour y accéder.",
      loginBtn: "Se connecter",
      addFavorite: "♡ Favoris",
      removeFavorite: "♥ Favoris",
      save: "🔖 Sauvegarder",
      saved: "🔖 Sauvegardé",
      exploited: "✓ Exploitée",
      markExploited: "Marquer comme exploitée",
      progress: "Ma progression",
      comments: "Commentaires",
      noComments: "Aucun commentaire approuvé.",
      addComment: "Ajouter un commentaire",
      commentPlaceholder: "Votre commentaire...",
      send: "Envoyer",
      commentSent: "Commentaire envoyé, en attente de modération.",
      loginToComment: "Connectez-vous pour commenter.",
      share: "Partager",
      copied: "Lien copié !",
      views: "vues",
    },
    en: {
      back: "← Back",
      by: "By",
      published: "Published on",
      category: "Category",
      restricted: "Restricted content — please log in to access.",
      loginBtn: "Log in",
      addFavorite: "♡ Favorite",
      removeFavorite: "♥ Favorite",
      save: "🔖 Save",
      saved: "🔖 Saved",
      exploited: "✓ Exploited",
      markExploited: "Mark as exploited",
      progress: "My progress",
      comments: "Comments",
      noComments: "No approved comments yet.",
      addComment: "Add a comment",
      commentPlaceholder: "Your comment...",
      send: "Send",
      commentSent: "Comment sent, pending moderation.",
      loginToComment: "Log in to comment.",
      share: "Share",
      copied: "Link copied!",
      views: "views",
    },
  }[language];

  useEffect(() => {
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${API}/public/resources/${id}`, { headers })
      .then((res) => {
        if (res.status === 401) {
          setError("restricted");
          setLoading(false);
          return null;
        }
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (data) setResource(data);
      })
      .catch(() => setError("notfound"))
      .finally(() => setLoading(false));

    // Charger favori et progression si connecté
    if (token) {
      fetch(`${API}/favorites`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((favs) => setIsFavorite(favs.some((f) => f.resourceId === parseInt(id))));

      fetch(`${API}/user-resources/${id}/progress`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((p) => {
          setProgress(p.progress ?? 0);
          setExploited(p.exploited ?? false);
          setIsSaved((p.progress ?? 0) > 0); // Considéré comme sauvegardé si progression > 0
        });

      // Marquer automatiquement comme "vu" (progress minimal)
      fetch(`${API}/user-resources/${id}/progress`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ progress: 1 }), // Au moins 1% = vu
      }).catch(() => {});
    }
  }, [id]);

  const toggleFavorite = async () => {
    if (!token) return navigate("/login");
    const method = isFavorite ? "DELETE" : "POST";
    await fetch(`${API}/favorites/${id}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    setIsFavorite(!isFavorite);
  };

  const handleProgress = async (val) => {
    setProgress(val);
    await fetch(`${API}/user-resources/${id}/progress`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ progress: val }),
    });
  };

  const handleExploited = async () => {
    if (!token) return navigate("/login");
    const newVal = !exploited;
    setExploited(newVal);
    await fetch(`${API}/user-resources/${id}/progress`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ exploited: newVal }),
    });
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!token || !comment.trim()) return;
    await fetch(`${API}/comment/create`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment, resource: `/api/resources/${id}` }),
    });
    setComment("");
    setCommentSent(true);
  };

  const toggleSave = async () => {
    if (!token) return navigate("/login");
    const newVal = !isSaved;
    setIsSaved(newVal);
    await fetch(`${API}/user-resources/${id}/progress`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ progress: newVal ? 50 : 0 }),
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(t.copied);
  };

  if (loading) return <div className="page"><div className="resource-loading"><div className="spinner"></div></div></div>;

  if (error === "restricted") return (
    <div className="page">
      <header className="navbar"><div className="logo">(Re)Sources Relationnelles</div></header>
      <div className="resource-restricted">
        <p>{t.restricted}</p>
        <button onClick={() => navigate("/login")} className="btn-primary">{t.loginBtn}</button>
      </div>
    </div>
  );

  if (error === "notfound" || !resource) return (
    <div className="page">
      <header className="navbar"><div className="logo">(Re)Sources Relationnelles</div></header>
      <div className="resource-restricted"><p>Ressource introuvable.</p></div>
    </div>
  );

  return (
    <div className="page">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">(Re)Sources Relationnelles</div>
        <div className="nav-buttons">
          <a href="/">{language === "fr" ? "Accueil" : "Home"}</a>
          {token ? <a href="/account">{language === "fr" ? "Mon compte" : "My account"}</a>
                 : <a href="/login">{language === "fr" ? "Se connecter" : "Log in"}</a>}
          <div className={`switch ${language === "en" ? "active" : ""}`}
               onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      <main className="resource-main" id="main-content">
        <button className="resource-back" onClick={() => navigate(-1)}>{t.back}</button>

        {/* HEADER RESSOURCE */}
        <div className="resource-header">
          <div className="resource-meta">
            <span className="resource-type-badge">{resource.type}</span>
            <span className="resource-category">{resource.category}</span>
            {resource.restreint && <span className="resource-restricted-badge">🔒</span>}
          </div>
          <h1 className="resource-title">{resource.description}</h1>
          <div className="resource-info">
            <span>{t.by} <strong>{resource.author}</strong></span>
            {resource.datePublication && <span>{t.published} {resource.datePublication}</span>}
            <span>{resource.views} {t.views}</span>
          </div>

          {/* ACTIONS */}
          <div className="resource-actions">
            <button
              className={`btn-action ${isFavorite ? "active" : ""}`}
              onClick={toggleFavorite}
              aria-label={isFavorite ? t.removeFavorite : t.addFavorite}
            >
              {isFavorite ? t.removeFavorite : t.addFavorite}
            </button>
            <button
              className={`btn-action ${exploited ? "active" : ""}`}
              onClick={handleExploited}
              aria-label={t.markExploited}
            >
              {exploited ? t.exploited : t.markExploited}
            </button>
            <button className="btn-action" onClick={handleShare} aria-label={t.share}>
              🔗 {t.share}
            </button>
          </div>
        </div>

        {/* CONTENU MÉDIA */}
        <div className="resource-content">
          {resource.type === "video" ? (
            <video
              src={videoUrl(resource.content)}
              controls
              className="resource-video"
              aria-label={resource.description}
            />
          ) : (
            <img
              src={imageUrl(resource.content)}
              alt={resource.description}
              className="resource-image"
            />
          )}
        </div>

        {/* PROGRESSION */}
        {token && (
          <div className="resource-progress-section" aria-label={t.progress}>
            <label htmlFor="progress-range" className="progress-label">
              {t.progress} : <strong>{progress}%</strong>
            </label>
            <input
              id="progress-range"
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => handleProgress(parseInt(e.target.value))}
              className="progress-range"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}

        {/* COMMENTAIRES */}
        <section className="resource-comments" aria-labelledby="comments-title">
          <h2 id="comments-title">{t.comments}</h2>

          {resource.comments?.length === 0 && (
            <p className="no-comments">{t.noComments}</p>
          )}

          <ul className="comments-list">
            {resource.comments?.map((c) => (
              <li key={c.id} className="comment-item">
                <div className="comment-author">{c.author}</div>
                <div className="comment-content">{c.content}</div>
                <div className="comment-date">{c.date}</div>
              </li>
            ))}
          </ul>

          {token ? (
            <form className="comment-form" onSubmit={handleComment} aria-label={t.addComment}>
              <label htmlFor="comment-input" className="sr-only">{t.addComment}</label>
              <textarea
                id="comment-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                className="comment-textarea"
                rows={3}
                aria-required="true"
              />
              {commentSent && <p className="comment-success" role="status">{t.commentSent}</p>}
              <button type="submit" className="btn-primary" disabled={!comment.trim()}>
                {t.send}
              </button>
            </form>
          ) : (
            <p className="login-to-comment">
              <a href="/login">{t.loginToComment}</a>
            </p>
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column"><button>Contact</button><button>Aide</button></div>
          <div className="footer-column"><button>À propos</button><button>Plan du site</button></div>
          <div className="footer-column"><button>Accessibilité</button><button>Données personnelles</button></div>
        </div>
      </footer>
    </div>
  );
}
