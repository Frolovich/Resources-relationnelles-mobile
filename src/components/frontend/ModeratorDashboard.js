import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/dashboard.css";

const API = "http://localhost:8000/api";

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [tab, setTab] = useState("resources");
  const [resources, setResources] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refuseModal, setRefuseModal] = useState(null);
  const [refuseReason, setRefuseReason] = useState("");
  const [pendingTotal, setPendingTotal] = useState(0);

  const token = localStorage.getItem("token");

  const t = {
    fr: {
      title: "Tableau de bord — Modérateur",
      resources: "Ressources en attente",
      comments: "Commentaires en attente",
      approve: "Approuver",
      refuse: "Refuser",
      noResources: "Aucune ressource en attente.",
      noComments: "Aucun commentaire en attente.",
      by: "Par",
      reason: "Motif de refus",
      confirm: "Confirmer",
      cancel: "Annuler",
      category: "Catégorie",
      type: "Type",
      date: "Date",
      resource: "Ressource",
    },
    en: {
      title: "Dashboard — Moderator",
      resources: "Pending resources",
      comments: "Pending comments",
      approve: "Approve",
      refuse: "Refuse",
      noResources: "No pending resources.",
      noComments: "No pending comments.",
      by: "By",
      reason: "Reason for refusal",
      confirm: "Confirm",
      cancel: "Cancel",
      category: "Category",
      type: "Type",
      date: "Date",
      resource: "Resource",
    },
  }[language];

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [resRes, comRes] = await Promise.all([
      fetch(`${API}/moderation/resources`, { headers }),
      fetch(`${API}/moderation/comments`, { headers }),
    ]);
    const resData = await resRes.json();
    const comData = await comRes.json();
    setResources(resData);
    setComments(comData);
    setPendingTotal((resData.length || 0) + (comData.length || 0));
    setLoading(false);
  };

  const approveResource = async (id) => {
    await fetch(`${API}/moderation/resources/${id}/approve`, { method: "PATCH", headers });
    setResources(resources.filter((r) => r.id !== id));
  };

  const approveComment = async (id) => {
    await fetch(`${API}/moderation/comments/${id}/approve`, { method: "PATCH", headers });
    setComments(comments.filter((c) => c.id !== id));
  };

  const openRefuse = (type, id) => { setRefuseModal({ type, id }); setRefuseReason(""); };

  const confirmRefuse = async () => {
    if (!refuseModal) return;
    const url = refuseModal.type === "resource"
      ? `${API}/moderation/resources/${refuseModal.id}/refuse`
      : `${API}/moderation/comments/${refuseModal.id}/refuse`;

    await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ reason: refuseReason }),
    });

    if (refuseModal.type === "resource") setResources(resources.filter((r) => r.id !== refuseModal.id));
    else setComments(comments.filter((c) => c.id !== refuseModal.id));
    setRefuseModal(null);
  };

  return (
    <div className="page">
      <header className="navbar">
        <div className="logo">(Re)Sources Relationnelles</div>
        <div className="nav-buttons">
          <a href="/account">{language === "fr" ? "Mon compte" : "My account"}</a>
          {pendingTotal > 0 && (
            <span className="moderation-badge" aria-label={`${pendingTotal} éléments en attente`}>
              {pendingTotal}
            </span>
          )}
          <div className={`switch ${language === "en" ? "active" : ""}`}
               onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main" id="main-content">
        <h1 className="dashboard-title">{t.title}</h1>

        {/* TABS */}
        <div className="dashboard-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "resources"}
            className={`tab-btn ${tab === "resources" ? "active" : ""}`}
            onClick={() => setTab("resources")}>
            {t.resources} {resources.length > 0 && <span className="badge">{resources.length}</span>}
          </button>
          <button role="tab" aria-selected={tab === "comments"}
            className={`tab-btn ${tab === "comments" ? "active" : ""}`}
            onClick={() => setTab("comments")}>
            {t.comments} {comments.length > 0 && <span className="badge">{comments.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading"><div className="spinner"></div></div>
        ) : (
          <>
            {/* RESSOURCES */}
            {tab === "resources" && (
              <section aria-label={t.resources}>
                {resources.length === 0 ? (
                  <p className="empty-state">{t.noResources}</p>
                ) : (
                  <ul className="moderation-list">
                    {resources.map((r) => (
                      <li key={r.id} className="moderation-item">
                        <div className="moderation-info">
                          <span className="moderation-type">{r.type}</span>
                          <span className="moderation-category">{r.category}</span>
                          <p className="moderation-description">{r.description}</p>
                          <p className="moderation-meta">{t.by} <strong>{r.author}</strong> — {r.createdAt}</p>
                        </div>
                        <div className="moderation-actions">
                          <button className="btn-approve" onClick={() => approveResource(r.id)}
                            aria-label={`${t.approve} "${r.description}"`}>
                            ✓ {t.approve}
                          </button>
                          <button className="btn-refuse" onClick={() => openRefuse("resource", r.id)}
                            aria-label={`${t.refuse} "${r.description}"`}>
                            ✗ {t.refuse}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* COMMENTAIRES */}
            {tab === "comments" && (
              <section aria-label={t.comments}>
                {comments.length === 0 ? (
                  <p className="empty-state">{t.noComments}</p>
                ) : (
                  <ul className="moderation-list">
                    {comments.map((c) => (
                      <li key={c.id} className="moderation-item">
                        <div className="moderation-info">
                          <p className="moderation-description">"{c.content}"</p>
                          <p className="moderation-meta">
                            {t.by} <strong>{c.author}</strong> — {t.resource} #{c.resourceId} — {c.date}
                          </p>
                        </div>
                        <div className="moderation-actions">
                          <button className="btn-approve" onClick={() => approveComment(c.id)}>
                            ✓ {t.approve}
                          </button>
                          <button className="btn-refuse" onClick={() => openRefuse("comment", c.id)}>
                            ✗ {t.refuse}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* MODAL REFUS */}
      {refuseModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal">
            <h2 id="modal-title">{t.refuse}</h2>
            <label htmlFor="refuse-reason">{t.reason}</label>
            <textarea
              id="refuse-reason"
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              rows={3}
              className="modal-textarea"
            />
            <div className="modal-actions">
              <button className="btn-refuse" onClick={confirmRefuse}>{t.confirm}</button>
              <button className="btn-secondary" onClick={() => setRefuseModal(null)}>{t.cancel}</button>
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
