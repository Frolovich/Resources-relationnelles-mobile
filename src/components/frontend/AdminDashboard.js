import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/dashboard.css";

const API = "http://localhost:8000/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [changeCatModal, setChangeCatModal] = useState(null);
  const [selectedCatId, setSelectedCatId] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" };

  const t = {
    fr: {
      title: "Administration",
      stats: "Statistiques", users: "Utilisateurs", resources: "Ressources", categories: "Catégories",
      totalUsers: "Utilisateurs", totalResources: "Ressources", totalViews: "Vues", totalFavorites: "Favoris",
      exportCSV: "Exporter CSV",
      email: "Email", name: "Nom", status: "Statut", actions: "Actions",
      active: "Actif", inactive: "Inactif", activate: "Activer", deactivate: "Désactiver",
      addCategory: "Ajouter", categoryName: "Nom de la catégorie",
      delete: "Supprimer", deleteUser: "Supprimer le compte",
      type: "Type", category: "Catégorie", author: "Auteur", views: "Vues", favori: "Favoris",
      changeCategory: "Changer catégorie", confirm: "Confirmer", cancel: "Annuler",
      noUsers: "Aucun utilisateur.", noResources: "Aucune ressource.", noCategories: "Aucune catégorie.",
      required: "Champ obligatoire.",
      confirmDeleteUser: "Voulez-vous vraiment désactiver ce compte ?",
      confirmDeleteResource: "Voulez-vous vraiment supprimer cette ressource ?",
    },
    en: {
      title: "Administration",
      stats: "Statistics", users: "Users", resources: "Resources", categories: "Categories",
      totalUsers: "Users", totalResources: "Resources", totalViews: "Views", totalFavorites: "Favorites",
      exportCSV: "Export CSV",
      email: "Email", name: "Name", status: "Status", actions: "Actions",
      active: "Active", inactive: "Inactive", activate: "Activate", deactivate: "Deactivate",
      addCategory: "Add", categoryName: "Category name",
      delete: "Delete", deleteUser: "Delete account",
      type: "Type", category: "Category", author: "Author", views: "Views", favori: "Favorites",
      changeCategory: "Change category", confirm: "Confirm", cancel: "Cancel",
      noUsers: "No users.", noResources: "No resources.", noCategories: "No categories.",
      required: "Required field.",
      confirmDeleteUser: "Are you sure you want to deactivate this account?",
      confirmDeleteResource: "Are you sure you want to delete this resource?",
    },
  }[language];

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, resRes, catsRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/users`, { headers }),
        fetch(`${API}/admin/resources`, { headers }),
        fetch(`${API}/categories`, { headers: { ...headers, Accept: "application/ld+json" } }),
      ]);
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setResources(await resRes.json());
      const catsData = await catsRes.json();
      setCategories(catsData["member"] || catsData["hydra:member"] || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    await fetch(`${API}/admin/users/${userId}/toggle-status`, { method: "PATCH", headers });
    setUsers(users.map((u) => u.id === userId ? { ...u, status: !currentStatus } : u));
  };

  const deleteUser = async (userId) => {
    if (!window.confirm(t.confirmDeleteUser)) return;
    await fetch(`${API}/admin/users/${userId}`, { method: "DELETE", headers });
    setUsers(users.filter((u) => u.id !== userId));
  };

  const deleteResource = async (resId) => {
    if (!window.confirm(t.confirmDeleteResource)) return;
    await fetch(`${API}/admin/resources/${resId}`, { method: "DELETE", headers });
    setResources(resources.filter((r) => r.id !== resId));
  };

  const changeCategory = async () => {
    if (!changeCatModal || !selectedCatId) return;
    await fetch(`${API}/admin/resources/${changeCatModal.id}/category`, {
      method: "PATCH", headers,
      body: JSON.stringify({ categoryId: parseInt(selectedCatId) }),
    });
    const cat = categories.find((c) => c.id === parseInt(selectedCatId));
    setResources(resources.map((r) => r.id === changeCatModal.id ? { ...r, category: cat?.name, categoryId: parseInt(selectedCatId) } : r));
    setChangeCatModal(null);
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) { setCategoryError(t.required); return; }
    const res = await fetch(`${API}/categories`, {
      method: "POST",
      headers: { ...headers, Accept: "application/ld+json" },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) { setNewCategory(""); setCategoryError(""); loadAll(); }
  };

  const deleteCategory = async (id) => {
    await fetch(`${API}/categories/${id}`, { method: "DELETE", headers });
    setCategories(categories.filter((c) => c.id !== id));
  };

  const exportCSV = async () => {
    const res = await fetch(`${API}/admin/stats/export`, { headers });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats_export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <header className="navbar">
        <div className="logo">(Re)Sources Relationnelles</div>
        <div className="nav-buttons">
          <a href="/account">{language === "fr" ? "Mon compte" : "My account"}</a>
          <div className={`switch ${language === "en" ? "active" : ""}`}
               onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
            <div className="circle"></div>
            <span>{language === "fr" ? "FR" : "EN"}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main" id="main-content">
        <h1 className="dashboard-title">{t.title}</h1>

        <div className="dashboard-tabs" role="tablist">
          {["stats", "users", "resources", "categories"].map((id) => (
            <button key={id} role="tab" aria-selected={tab === id}
              className={`tab-btn ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}>
              {t[id]}
            </button>
          ))}
        </div>

        {loading ? <div className="dashboard-loading"><div className="spinner"></div></div> : (
          <>
            {/* STATS */}
            {tab === "stats" && stats && (
              <section>
                <div className="stats-grid">
                  {[
                    { val: stats.totalUsers, label: t.totalUsers },
                    { val: stats.totalResources, label: t.totalResources },
                    { val: stats.totalViews, label: t.totalViews },
                    { val: stats.totalFavorites, label: t.totalFavorites },
                  ].map((s, i) => (
                    <div className="stat-card" key={i}>
                      <span className="stat-value">{s.val}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
                <button className="tab-btn" onClick={exportCSV} style={{ marginTop: 16 }}>⬇ {t.exportCSV}</button>
              </section>
            )}

            {/* USERS — seulement activer/désactiver/supprimer */}
            {tab === "users" && (
              <section>
                {users.length === 0 ? <p className="empty-state">{t.noUsers}</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="users-table">
                      <thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.name} {u.surname}</td>
                            <td>{u.email}</td>
                            <td><span className={u.status ? "status-active" : "status-inactive"}>{u.status ? t.active : t.inactive}</span></td>
                            <td>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button className={u.status ? "btn-refuse" : "btn-approve"}
                                  style={{ fontSize: 12, padding: "4px 10px", minHeight: 36 }}
                                  onClick={() => toggleUserStatus(u.id, u.status)}>
                                  {u.status ? t.deactivate : t.activate}
                                </button>
                                <button className="btn-refuse"
                                  style={{ fontSize: 12, padding: "4px 10px", minHeight: 36 }}
                                  onClick={() => deleteUser(u.id)}>
                                  {t.deleteUser}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* RESOURCES — stats par ressource + supprimer + changer catégorie */}
            {tab === "resources" && (
              <section>
                {resources.length === 0 ? <p className="empty-state">{t.noResources}</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="users-table">
                      <thead><tr><th>{t.type}</th><th>Description</th><th>{t.category}</th><th>{t.author}</th><th>{t.views}</th><th>{t.favori}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
                      <tbody>
                        {resources.map((r) => (
                          <tr key={r.id}>
                            <td><span className="role-badge role-user">{r.type}</span></td>
                            <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</td>
                            <td>{r.category}</td>
                            <td>{r.author}</td>
                            <td>{r.views}</td>
                            <td>{r.favori}</td>
                            <td>{r.status}</td>
                            <td>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button className="tab-btn" style={{ fontSize: 11, padding: "3px 8px", minHeight: 32 }}
                                  onClick={() => { setChangeCatModal(r); setSelectedCatId(String(r.categoryId)); }}>
                                  {t.changeCategory}
                                </button>
                                <button className="btn-refuse" style={{ fontSize: 11, padding: "3px 8px", minHeight: 32 }}
                                  onClick={() => deleteResource(r.id)}>
                                  {t.delete}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* CATEGORIES */}
            {tab === "categories" && (
              <section>
                <form onSubmit={addCategory} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  <input type="text" value={newCategory}
                    onChange={(e) => { setNewCategory(e.target.value); setCategoryError(""); }}
                    placeholder={t.categoryName} className={categoryError ? "error" : ""}
                    style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "white", fontSize: 14, outline: "none" }} />
                  <button type="submit" className="btn-approve" style={{ minHeight: 44, padding: "8px 20px" }}>+ {t.addCategory}</button>
                </form>
                {categoryError && <span className="error-text">{categoryError}</span>}
                {categories.length === 0 ? <p className="empty-state">{t.noCategories}</p> : (
                  <ul className="moderation-list">
                    {categories.map((c) => (
                      <li key={c.id} className="moderation-item">
                        <div className="moderation-info"><p className="moderation-description">{c.name}</p></div>
                        <button className="btn-refuse" style={{ fontSize: 12, padding: "6px 14px" }}
                          onClick={() => deleteCategory(c.id)}>{t.delete}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* MODAL CHANGER CATÉGORIE */}
      {changeCatModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ color: "#f1f5f9", margin: 0 }}>{t.changeCategory}</h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>{changeCatModal.description}</p>
            <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white", fontSize: 14, width: "100%" }}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="modal-actions">
              <button className="btn-approve" onClick={changeCategory}>{t.confirm}</button>
              <button className="btn-secondary" onClick={() => setChangeCatModal(null)}>{t.cancel}</button>
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
