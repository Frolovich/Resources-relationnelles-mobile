import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/account.css";
import { imageUrl, videoUrl } from "../../services/media.js";

const API = "http://localhost:8000/api";

const ROLE_INFO = {
  fr: {
    ROLE_SUPER_ADMIN: { label: "Super Admin",    color: "#ef4444" },
    ROLE_ADMIN:       { label: "Administrateur", color: "#a855f7" },
    ROLE_MODERATOR:   { label: "Modérateur",     color: "#f59e0b" },
    ROLE_USER:        { label: "Citoyen",        color: "#22c55e" },
  },
  en: {
    ROLE_SUPER_ADMIN: { label: "Super Admin",    color: "#ef4444" },
    ROLE_ADMIN:       { label: "Administrator",  color: "#a855f7" },
    ROLE_MODERATOR:   { label: "Moderator",      color: "#f59e0b" },
    ROLE_USER:        { label: "Citizen",        color: "#22c55e" },
  },
};

// Composant filtre réutilisable (même que Home)
function FilterDropdown({ language, filters, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const labels = {
    fr: { newest: "Plus récent", views: "Plus vus", filters: "Filtres" },
    en: { newest: "Newest first", views: "Most viewed", filters: "Filters" },
  }[language];

  return (
    <div className="filter-wrapper" ref={ref}>
      <button className={`filter-btn ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)} type="button">
        ⚙️ {labels.filters}
        <span className="filter-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="dropdown">
          <label>
            <input type="checkbox" checked={filters.newest} onChange={() => onChange("newest")} />
            {labels.newest}
          </label>
          <label>
            <input type="checkbox" checked={filters.views} onChange={() => onChange("views")} />
            {labels.views}
          </label>
        </div>
      )}
    </div>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [publicResources, setPublicResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [activeIcon, setActiveIcon] = useState(null); // null | "favorites" | "saves" | "comments"
  const [videoFilters, setVideoFilters] = useState({ newest: true, views: false });
  const [photoFilters, setPhotoFilters] = useState({ newest: true, views: false });
  const profileRef = useRef(null);
  const panelRef = useRef(null);

  const token = localStorage.getItem("token");

  const getHighestRole = (roles) => {
    if (roles?.includes("ROLE_SUPER_ADMIN")) return "ROLE_SUPER_ADMIN";
    if (roles?.includes("ROLE_ADMIN"))       return "ROLE_ADMIN";
    if (roles?.includes("ROLE_MODERATOR"))   return "ROLE_MODERATOR";
    return "ROLE_USER";
  };

  const t = {
    fr: {
      title: "(Re)Sources Relationnelles",
      logout: "Se déconnecter",
      profile: "Mon profil",
      myResources: "Mes ressources",
      createResource: "+ Créer",
      moderation: "Modération",
      admin: "Admin",
      videos: "VIDÉOS",
      photos: "PHOTOS",
      noVideos: "Aucune vidéo.",
      noPhotos: "Aucune photo.",
      noFavorites: "Aucun favori.",
      noSaves: "Aucune ressource sauvegardée.",
      noComments: "Aucun commentaire.",
      email: "Email", name: "Prénom", surname: "Nom",
      nickname: "Pseudo", city: "Ville", registeredAt: "Membre depuis",
      noNickname: "Non défini", noCity: "Non définie",
      errorLoad: "Impossible de charger le profil.",
      errorAuth: "Vous n'êtes pas connecté.",
      close: "Fermer",
      favoritesTitle: "Mes favoris",
      savesTitle: "Mes sauvegardes",
      commentsTitle: "Commentaires & réponses",
      pendingComments: "commentaire(s) en attente sur vos ressources",
    },
    en: {
      title: "(Re)Sources Relationnelles",
      logout: "Log out",
      profile: "My profile",
      myResources: "My resources",
      createResource: "+ Create",
      moderation: "Moderation",
      admin: "Admin",
      videos: "VIDEOS",
      photos: "PHOTOS",
      noVideos: "No videos yet.",
      noPhotos: "No photos yet.",
      noFavorites: "No favorites yet.",
      noSaves: "No saved resources.",
      noComments: "No comments.",
      email: "Email", name: "First name", surname: "Last name",
      nickname: "Nickname", city: "City", registeredAt: "Member since",
      noNickname: "Not set", noCity: "Not set",
      errorLoad: "Unable to load profile.",
      errorAuth: "You are not logged in.",
      close: "Close",
      favoritesTitle: "My favorites",
      savesTitle: "My saves",
      commentsTitle: "Comments & replies",
      pendingComments: "pending comment(s) on your resources",
    },
  }[language];

  // Fermer profil/panel en cliquant dehors
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          !e.target.closest(".icon-btn")) setActiveIcon(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!token) {
      setError(t.errorAuth);
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

    Promise.all([
      fetch(`${API}/me`, { headers }).then((r) => r.json()),
      fetch(`${API}/my-resources`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API}/favorites`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API}/public/resources`, { headers }).then((r) => r.json()).catch(() => []),
    ])
      .then(([userData, resData, favsData, publicData]) => {
        if (userData.email) setUser(userData);
        else setError(t.errorLoad);
        setResources(Array.isArray(resData) ? resData : []);
        setFavorites(Array.isArray(favsData) ? favsData : []);
        setPublicResources(Array.isArray(publicData) ? publicData : []);
      })
      .catch(() => setError(t.errorLoad))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(
      language === "fr" ? "fr-FR" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  const applyFilters = (list, filters) => {
    if (filters.views) return [...list].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    return [...list].sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
  };

  const videos = applyFilters(resources.filter((r) => r.type === "video"), videoFilters);
  const photos = applyFilters(resources.filter((r) => r.type === "photo"), photoFilters);
  const saves  = resources.filter((r) => (r.saved ?? 0) > 0);

  const highestRole = user ? getHighestRole(user.roles) : "ROLE_USER";
  const roleInfo = ROLE_INFO[language][highestRole];

  const toggleIcon = (icon) => setActiveIcon(activeIcon === icon ? null : icon);

  const ResourceCard = ({ r }) => {
    const id = r.id || r.resourceId;
    const isVideo = r.type === "video";
    const statusColor = {
      approved: "#22c55e", pending: "#f59e0b",
      rejected: "#ef4444", draft: "#64748b",
    }[r.status] || null;

    return (
      <div className="account-resource-card" onClick={() => navigate(`/resource/${id}`)}
        role="article" aria-label={r.description}>
        <div className="account-resource-media">
          {isVideo
            ? <video src={videoUrl(r.content)} className="account-resource-video" aria-label={r.description} />
            : <img src={imageUrl(r.content)} alt={r.description} className="account-resource-img" />
          }
          {statusColor && (
            <span className="resource-status-overlay" style={{ background: statusColor + "dd" }}>
              {r.status}
            </span>
          )}
        </div>
        <div className="account-resource-info">
          <p className="account-resource-desc">{r.description}</p>
          <div className="account-resource-stats">
            <span>❤️ {r.favori ?? 0}</span>
            <span>👁 {r.views ?? 0}</span>
            <span>🔖 {r.saved ?? 0}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">{t.title}</div>
        <div className="nav-buttons">

          {/* Icônes d'action */}
          {user && (
            <div className="account-icon-bar">
              {/* Favoris — cœur */}
              <button className={`icon-btn ${activeIcon === "favorites" ? "active" : ""}`}
                onClick={() => toggleIcon("favorites")}
                aria-label={t.favoritesTitle} title={t.favoritesTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={activeIcon === "favorites" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {favorites.length > 0 && <span className="icon-badge">{favorites.length}</span>}
              </button>

              {/* Sauvegardes — bookmark */}
              <button className={`icon-btn ${activeIcon === "saves" ? "active" : ""}`}
                onClick={() => toggleIcon("saves")}
                aria-label={t.savesTitle} title={t.savesTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={activeIcon === "saves" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {saves.length > 0 && <span className="icon-badge">{saves.length}</span>}
              </button>

              {/* Commentaires — message */}
              <button className={`icon-btn ${activeIcon === "comments" ? "active" : ""} ${user.pendingComments > 0 ? "notif" : ""}`}
                onClick={() => toggleIcon("comments")}
                aria-label={t.commentsTitle} title={t.commentsTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {user.pendingComments > 0 && (
                  <span className="icon-badge notif-badge">{user.pendingComments}</span>
                )}
              </button>
            </div>
          )}

          {/* Bouton profil avec rôle */}
          {user && (
            <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}
              aria-expanded={showProfile} aria-haspopup="dialog">
              <span className="profile-avatar-sm">
                {user.name?.charAt(0)}{user.surname?.charAt(0)}
              </span>
              <span className="profile-role-badge" style={{ color: roleInfo.color }}>
                {roleInfo.label}
              </span>
            </button>
          )}

          {/* Liens rôle */}
          {user && (highestRole === "ROLE_MODERATOR" || highestRole === "ROLE_ADMIN" || highestRole === "ROLE_SUPER_ADMIN") && (
            <a href="/moderator" className="nav-role-link">{t.moderation}</a>
          )}
          {user && (highestRole === "ROLE_ADMIN" || highestRole === "ROLE_SUPER_ADMIN") && (
            <a href="/admin" className="nav-role-link">{t.admin}</a>
          )}
          {user && highestRole === "ROLE_SUPER_ADMIN" && (
            <a href="/super-admin" className="nav-role-link">Super Admin</a>
          )}

          <button className="btn-logout" onClick={handleLogout}>{t.logout}</button>
          <div className={`switch ${language === "en" ? "active" : ""}`}
               onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      {/* PANEL LATÉRAL (favoris / saves / commentaires) */}
      {activeIcon && (
        <div className="side-panel" ref={panelRef} role="complementary">
          <div className="side-panel-header">
            <h2 className="side-panel-title">
              {activeIcon === "favorites" && t.favoritesTitle}
              {activeIcon === "saves"     && t.savesTitle}
              {activeIcon === "comments"  && t.commentsTitle}
            </h2>
            <button className="side-panel-close" onClick={() => setActiveIcon(null)}
              aria-label={t.close}>✕</button>
          </div>

          {/* FAVORIS */}
          {activeIcon === "favorites" && (
            favorites.length === 0
              ? <p className="side-panel-empty">{t.noFavorites}</p>
              : <ul className="side-panel-list">
                  {favorites.map((f) => (
                    <li key={f.id} className="side-panel-item"
                      onClick={() => { navigate(`/resource/${f.resourceId}`); setActiveIcon(null); }}>
                      <span className="side-panel-type">{f.type}</span>
                      <span className="side-panel-desc">{f.title || `Ressource #${f.resourceId}`}</span>
                      <span className="side-panel-arrow">›</span>
                    </li>
                  ))}
                </ul>
          )}

          {/* SAUVEGARDES */}
          {activeIcon === "saves" && (
            saves.length === 0
              ? <p className="side-panel-empty">{t.noSaves}</p>
              : <ul className="side-panel-list">
                  {saves.map((r) => (
                    <li key={r.id} className="side-panel-item"
                      onClick={() => { navigate(`/resource/${r.id}`); setActiveIcon(null); }}>
                      <span className="side-panel-type">{r.type}</span>
                      <span className="side-panel-desc">{r.description}</span>
                      <span className="side-panel-arrow">›</span>
                    </li>
                  ))}
                </ul>
          )}

          {/* COMMENTAIRES */}
          {activeIcon === "comments" && (
            user?.pendingComments > 0
              ? <div className="side-panel-notif">
                  <p>🔔 {user.pendingComments} {t.pendingComments}</p>
                  <button className="btn-primary" onClick={() => { navigate("/my-resources"); setActiveIcon(null); }}>
                    {t.myResources}
                  </button>
                </div>
              : <p className="side-panel-empty">{t.noComments}</p>
          )}
        </div>
      )}

      {/* MODAL PROFIL */}
      {showProfile && user && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" ref={profileRef}>
            <div className="profile-modal-header">
              <div className="profile-modal-avatar">
                {user.name?.charAt(0).toUpperCase()}{user.surname?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="profile-modal-name">{user.name} {user.surname}</div>
                <div className="profile-modal-role" style={{ color: roleInfo.color }}>
                  {roleInfo.label}
                </div>
              </div>
              <button className="profile-modal-close" onClick={() => setShowProfile(false)}
                aria-label={t.close}>✕</button>
            </div>
            <div className="profile-modal-fields">
              {[
                { key: t.email,        value: user.email },
                { key: t.nickname,     value: user.nickname || t.noNickname, muted: !user.nickname },
                { key: t.city,         value: user.city || t.noCity, muted: !user.city },
                { key: t.registeredAt, value: formatDate(user.registeredAt) },
              ].map(({ key, value, muted }) => (
                <div className="profile-modal-field" key={key}>
                  <span className="profile-field-key">{key}</span>
                  <span className={`profile-field-value ${muted ? "muted" : ""}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className="account-content">
        {loading && <div className="account-loading"><div className="spinner"></div></div>}
        {error && !loading && <div className="account-error"><span>⚠️ {error}</span></div>}

        {user && !loading && (
          <>
            {/* BARRE D'ACTIONS */}
            <div className="account-action-bar">
              <a href="/resource/create" className="btn-create-link">{t.createResource}</a>
              <a href="/my-resources" className="btn-secondary-link">{t.myResources}</a>
            </div>

            {/* SECTION VIDÉOS */}
            <div className="account-section">
              <div className="account-section-header">
                <span className="account-section-title">{t.videos}</span>
                <FilterDropdown language={language} filters={videoFilters}
                  onChange={(k) => setVideoFilters((p) => ({ ...p, [k]: !p[k] }))} />
              </div>
              {videos.length === 0
                ? <p className="account-empty">{t.noVideos}</p>
                : <div className="account-resources-grid">
                    {videos.map((r) => <ResourceCard key={r.id} r={r} />)}
                  </div>
              }
            </div>

            {/* SECTION PHOTOS */}
            <div className="account-section">
              <div className="account-section-header">
                <span className="account-section-title">{t.photos}</span>
                <FilterDropdown language={language} filters={photoFilters}
                  onChange={(k) => setPhotoFilters((p) => ({ ...p, [k]: !p[k] }))} />
              </div>
              {photos.length === 0
                ? <p className="account-empty">{t.noPhotos}</p>
                : <div className="account-resources-grid">
                    {photos.map((r) => <ResourceCard key={r.id} r={r} />)}
                  </div>
              }
            </div>

            {/* FIL D'ACTUALITÉ — ressources publiques */}
            {publicResources.length > 0 && (
              <div className="account-section">
                <div className="account-section-header">
                  <span className="account-section-title">
                    {language === "fr" ? "FIL D'ACTUALITÉ" : "FEED"}
                  </span>
                </div>
                <div className="account-resources-grid">
                  {publicResources.map((r) => <ResourceCard key={`pub-${r.id}`} r={r} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column"><button>Contact</button><button>Écrivez-nous</button></div>
          <div className="footer-column"><button>À propos</button><button>Plan du site</button></div>
          <div className="footer-column"><button>Aide & Accessibilité</button><button>Données personnelles</button></div>
        </div>
      </footer>
    </div>
  );
}
