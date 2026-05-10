import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/home.css";
import { imageUrl, videoUrl } from "../../services/media.js";

const API = "http://localhost:8000/api";

// Composant filtre réutilisable
function FilterDropdown({ language, filters, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const labels = {
    fr: { newest: "Plus récent", views: "Plus vus", restricted: "Contenu restreint", filters: "Filtres" },
    en: { newest: "Newest first", views: "Most viewed", restricted: "Restricted content", filters: "Filters" },
  }[language];

  return (
    <div className="filter-wrapper" ref={ref}>
      <button className={`filter-btn ${open ? "active" : ""}`} onClick={() => setOpen(!open)} type="button">
        ⚙️ {labels.filters}
        <span className="filter-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="dropdown">
          <label><input type="checkbox" checked={filters.newest} onChange={() => onChange("newest")} />{labels.newest}</label>
          <label><input type="checkbox" checked={filters.views} onChange={() => onChange("views")} />{labels.views}</label>
          <label><input type="checkbox" checked={filters.restricted} onChange={() => onChange("restricted")} />{labels.restricted}</label>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ newest: true, views: false, restricted: false });
  const [selectedCategory, setSelectedCategory] = useState("");

  const token = localStorage.getItem("token");

  // Décoder le rôle depuis le JWT
  const getUserRole = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const roles = payload.roles || [];
      if (roles.includes("ROLE_SUPER_ADMIN")) return "super_admin";
      if (roles.includes("ROLE_ADMIN")) return "admin";
      if (roles.includes("ROLE_MODERATOR")) return "moderator";
      if (roles.includes("ROLE_USER")) return "user";
    } catch { return null; }
    return null;
  };

  const role = getUserRole();

  const t = {
    fr: {
      title: "(Re)Sources Relationnelles",
      register: "S'inscrire",
      login: "Se connecter",
      account: "Mon compte",
      create: "+ Créer",
      moderator: "Modération",
      admin: "Administration",
      superAdmin: "Super Admin",
      search: "Rechercher des ressources...",
      hero: "Une communauté qui unit les personnes dans le respect et la bienveillance.",
      videos: "VIDÉOS",
      photos: "PHOTOS",
      noResults: "Aucune ressource trouvée.",
      loading: "Chargement...",
      by: "par",
      views: "vues",
      allCategories: "Toutes les catégories",
    },
    en: {
      title: "(Re)Sources Relationnelles",
      register: "Sign up",
      login: "Log in",
      account: "My account",
      create: "+ Create",
      moderator: "Moderation",
      admin: "Admin",
      superAdmin: "Super Admin",
      search: "Search resources...",
      hero: "A community that brings people together with respect and kindness.",
      videos: "VIDEOS",
      photos: "PHOTOS",
      noResults: "No resources found.",
      loading: "Loading...",
      by: "by",
      views: "views",
      allCategories: "All categories",
    },
  }[language];

  // Charger catégories
  useEffect(() => {
    fetch(`${API}/categories`, { headers: { Accept: "application/ld+json" } })
      .then((r) => r.json())
      .then((data) => setCategories(data["member"] || data["hydra:member"] || []))
      .catch(() => setCategories([]));
  }, []);

  // Charger ressources
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (filters.views) params.set("sort", "views");
    else params.set("sort", "newest");

    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${API}/public/resources?${params}`, { headers })
      .then((r) => r.json())
      .then((data) => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [search, selectedCategory, filters.views]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleFilterChange = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const videos = resources.filter((r) => r.type === "video");
  const photos = resources.filter((r) => r.type === "photo");

  return (
    <div>
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo">{t.title}</div>
        <div className="nav-buttons">
          {!token ? (
            <>
              <a href="/register">{t.register}</a>
              <a href="/login">{t.login}</a>
            </>
          ) : (
            <>
              <a href="/account">{t.account}</a>
              <a href="/my-resources" className="nav-link">{language === "fr" ? "Mes ressources" : "My resources"}</a>
              <a href="/resource/create" className="btn-create">{t.create}</a>
              {(role === "moderator" || role === "admin" || role === "super_admin") && (
                <a href="/moderator">{t.moderator}</a>
              )}
              {(role === "admin" || role === "super_admin") && (
                <a href="/admin">{t.admin}</a>
              )}
              {role === "super_admin" && (
                <a href="/super-admin">{t.superAdmin}</a>
              )}
            </>
          )}
          <div
            className={`switch ${language === "en" ? "active" : ""}`}
            onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
          >
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      {/* SEARCH */}
      <form className="search-bar" onSubmit={handleSearch} role="search">
        <input
          type="search"
          placeholder={t.search}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label={t.search}
        />
      </form>

      {/* HERO */}
      <div className="hero"><p>{t.hero}</p></div>

      {/* FILTRES CATÉGORIE */}
      <div className="category-bar">
        <button
          className={`category-btn ${selectedCategory === "" ? "active" : ""}`}
          onClick={() => setSelectedCategory("")}
        >
          {t.allCategories}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`category-btn ${selectedCategory === String(c.id) ? "active" : ""}`}
            onClick={() => setSelectedCategory(String(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* SECTIONS */}
      <div className="section">
        {loading ? (
          <p className="loading-text">{t.loading}</p>
        ) : (
          <>
            {/* VIDEOS */}
            <div className="section-block">
              <div className="section-block-header">
                <div className="section-title">{t.videos}</div>
                <FilterDropdown language={language} filters={filters} onChange={handleFilterChange} />
              </div>
              {videos.length === 0 ? (
                <p className="no-results">{t.noResults}</p>
              ) : (
                <div className="videos-section">
                  {videos.map((r) => (
                    <div
                      className="video-card"
                      key={r.id}
                      onClick={() => navigate(`/resource/${r.id}`)}
                      style={{ cursor: "pointer" }}
                      role="article"
                      aria-label={r.description}
                    >
                      <video
                        src={videoUrl(r.content)}
                        className="video"
                        aria-label={r.description}
                        onClick={(e) => e.stopPropagation()}
                        controls
                      />
                      <div className="video-info">
                        <span>{r.author ? `@${r.author}` : ""}</span>
                        <span>❤️ {r.favori}</span>
                      </div>
                      <div className="card-description">{r.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PHOTOS */}
            <div className="section-block">
              <div className="section-block-header">
                <div className="section-title">{t.photos}</div>
                <FilterDropdown language={language} filters={filters} onChange={handleFilterChange} />
              </div>
              {photos.length === 0 ? (
                <p className="no-results">{t.noResults}</p>
              ) : (
                <div className="photos-section">
                  {photos.map((r) => (
                    <div
                      className="photo-card"
                      key={r.id}
                      onClick={() => navigate(`/resource/${r.id}`)}
                      style={{ cursor: "pointer" }}
                      role="article"
                      aria-label={r.description}
                    >
                      <img
                        src={imageUrl(r.content)}
                        className="photo"
                        alt={r.description}
                      />
                      <div className="photo-info">
                        <span>{r.author ? `@${r.author}` : ""}</span>
                        <span>❤️ {r.favori}</span>
                      </div>
                      <div className="card-description">{r.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
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
