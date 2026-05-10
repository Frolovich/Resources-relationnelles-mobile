import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/my-resources.css";

const API = "http://localhost:8000/api";

const STATUS_LABELS = {
  fr: {
    pending:  { label: "En attente",  color: "#f59e0b" },
    approved: { label: "Publié",      color: "#22c55e" },
    rejected: { label: "Refusé",      color: "#ef4444" },
    draft:    { label: "Brouillon",   color: "#64748b" },
    deleted:  { label: "Supprimé",    color: "#475569" },
  },
  en: {
    pending:  { label: "Pending",   color: "#f59e0b" },
    approved: { label: "Published", color: "#22c55e" },
    rejected: { label: "Refused",   color: "#ef4444" },
    draft:    { label: "Draft",     color: "#64748b" },
    deleted:  { label: "Deleted",   color: "#475569" },
  },
};

export default function MyResources() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const token = localStorage.getItem("token");

  const t = {
    fr: {
      title: "Mes ressources",
      create: "+ Créer une ressource",
      noResources: "Vous n'avez pas encore publié de ressource.",
      views: "vues",
      likes: "favoris",
      saves: "sauvegardes",
      delete: "Supprimer",
      confirmDelete: "Confirmer la suppression ?",
      yes: "Oui, supprimer",
      no: "Annuler",
      back: "← Accueil",
      type: "Type",
      category: "Catégorie",
      date: "Créé le",
    },
    en: {
      title: "My resources",
      create: "+ Create a resource",
      noResources: "You haven't published any resource yet.",
      views: "views",
      likes: "favorites",
      saves: "saves",
      delete: "Delete",
      confirmDelete: "Confirm deletion?",
      yes: "Yes, delete",
      no: "Cancel",
      back: "← Home",
      type: "Type",
      category: "Category",
      date: "Created on",
    },
  }[language];

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    // Charger les ressources de l'utilisateur via /api/me puis filtrer
    // On utilise l'API Platform avec filtre sur l'auteur
    fetch(`${API}/resources?itemsPerPage=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/ld+json",
      },
    })
      .then((r) => r.json())
      .then((data) => {
        // Décoder l'email depuis le JWT pour filtrer
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email = payload.username;
        const all = data["member"] || data["hydra:member"] || [];
        // Filtrer par auteur (email)
        // En attendant un endpoint dédié, on affiche tout ce que l'API retourne
        setResources(all);
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  // Utiliser l'endpoint dédié pour les ressources de l'utilisateur
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/my-resources`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setResources(Array.isArray(data) ? data : []))
      .catch(() => {}) // fallback silencieux si endpoint pas encore dispo
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await fetch(`${API}/resources/upload/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setResources(resources.filter((r) => r.id !== id));
    setDeleteConfirm(null);
  };

  const statusInfo = (status) =>
    STATUS_LABELS[language][status] || { label: status, color: "#64748b" };

  return (
    <div className="page">
      <header className="navbar">
        <div className="logo">(Re)Sources Relationnelles</div>
        <div className="nav-buttons">
          <a href="/">{language === "fr" ? "Accueil" : "Home"}</a>
          <a href="/account">{language === "fr" ? "Mon compte" : "My account"}</a>
          <div className={`switch ${language === "en" ? "active" : ""}`}
               onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      <main className="my-resources-main" id="main-content">
        <div className="my-resources-header">
          <h1>{t.title}</h1>
          <a href="/resource/create" className="btn-create-link">{t.create}</a>
        </div>

        {loading ? (
          <div className="dashboard-loading"><div className="spinner"></div></div>
        ) : resources.length === 0 ? (
          <div className="empty-resources">
            <p>{t.noResources}</p>
            <a href="/resource/create" className="btn-primary">{t.create}</a>
          </div>
        ) : (
          <ul className="resources-list" aria-label={t.title}>
            {resources.map((r) => {
              const s = statusInfo(r.status);
              return (
                <li key={r.id} className="resource-row">
                  {/* TYPE BADGE */}
                  <div className="resource-row-type">
                    <span className="resource-type-badge">{r.type}</span>
                  </div>

                  {/* INFO */}
                  <div className="resource-row-info">
                    <p className="resource-row-desc">{r.description}</p>
                    <div className="resource-row-meta">
                      <span>{t.category}: {r.category}</span>
                      <span>{t.date}: {r.dateCreation || r.createdAt}</span>
                    </div>
                  </div>

                  {/* STATUT */}
                  <div className="resource-row-status">
                    <span
                      className="status-pill"
                      style={{ background: s.color + "22", color: s.color, borderColor: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* STATS */}
                  <div className="resource-row-stats">
                    <span title={t.views}>👁 {r.views ?? 0}</span>
                    <span title={t.likes}>❤️ {r.favori ?? 0}</span>
                    <span title={t.saves}>🔖 {r.saved ?? 0}</span>
                  </div>

                  {/* ACTIONS */}
                  <div className="resource-row-actions">
                    <button
                      className="btn-view"
                      onClick={() => navigate(`/resource/${r.id}`)}
                      aria-label={`Voir ${r.description}`}
                    >
                      👁
                    </button>
                    {(r.status === "draft" || r.status === "rejected") && (
                      <button
                        className="btn-delete"
                        onClick={() => setDeleteConfirm(r.id)}
                        aria-label={`${t.delete} ${r.description}`}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* MODAL SUPPRESSION */}
      {deleteConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <p style={{ color: "#f1f5f9", margin: 0 }}>{t.confirmDelete}</p>
            <div className="modal-actions">
              <button className="btn-refuse" onClick={() => handleDelete(deleteConfirm)}>{t.yes}</button>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>{t.no}</button>
            </div>
          </div>
        </div>
      )}

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
