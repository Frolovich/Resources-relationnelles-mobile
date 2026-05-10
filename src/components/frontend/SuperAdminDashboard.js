import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/dashboard.css";

const API = "http://localhost:8000/api";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleModal, setRoleModal] = useState(null);
  const [selectedRole, setSelectedRole] = useState("ROLE_USER");
  const [createModal, setCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", surname: "", password: "", role: "ROLE_MODERATOR" });
  const [createError, setCreateError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" };

  const t = {
    fr: {
      title: "Super Administration",
      users: "Comptes & Rôles", logs: "Journal d'activité", config: "Configuration",
      email: "Email", name: "Nom", role: "Rôle", status: "Statut", actions: "Actions",
      changeRole: "Changer le rôle", confirm: "Confirmer", cancel: "Annuler",
      createAccount: "Créer un compte", password: "Mot de passe",
      citizen: "Citoyen", moderator: "Modérateur", admin: "Administrateur", superAdmin: "Super Admin",
      active: "Actif", inactive: "Inactif",
      action: "Action", moderatorCol: "Modérateur", target: "Cible", date: "Date", reason: "Motif",
      noLogs: "Aucune activité enregistrée.",
      noUsers: "Aucun utilisateur.",
      created: "Compte créé avec succès.",
      required: "Tous les champs sont obligatoires.",
      jwtTtl: "Durée du token JWT", maxUpload: "Taille max upload", platformName: "Nom de la plateforme",
      saveConfig: "Sauvegarder (non implémenté)",
    },
    en: {
      title: "Super Administration",
      users: "Accounts & Roles", logs: "Activity Log", config: "Configuration",
      email: "Email", name: "Name", role: "Role", status: "Status", actions: "Actions",
      changeRole: "Change role", confirm: "Confirm", cancel: "Cancel",
      createAccount: "Create account", password: "Password",
      citizen: "Citizen", moderator: "Moderator", admin: "Administrator", superAdmin: "Super Admin",
      active: "Active", inactive: "Inactive",
      action: "Action", moderatorCol: "Moderator", target: "Target", date: "Date", reason: "Reason",
      noLogs: "No activity recorded.",
      noUsers: "No users.",
      created: "Account created successfully.",
      required: "All fields are required.",
      jwtTtl: "JWT token duration", maxUpload: "Max upload size", platformName: "Platform name",
      saveConfig: "Save (not implemented)",
    },
  }[language];

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        fetch(`${API}/super-admin/users`, { headers }),
        fetch(`${API}/super-admin/logs`, { headers }),
      ]);
      setUsers(await usersRes.json());
      setLogs(await logsRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const changeRole = async () => {
    if (!roleModal) return;
    await fetch(`${API}/super-admin/users/${roleModal.id}/role`, {
      method: "PATCH", headers,
      body: JSON.stringify({ role: selectedRole }),
    });
    setUsers(users.map((u) => u.id === roleModal.id ? { ...u, roles: [selectedRole, "ROLE_USER"] } : u));
    setRoleModal(null);
  };

  const createAccount = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name || !newUser.surname || !newUser.password) {
      setCreateError(t.required); return;
    }
    setCreateError("");
    const res = await fetch(`${API}/super-admin/create-account`, {
      method: "POST", headers,
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (res.ok) {
      setCreateModal(false);
      setNewUser({ email: "", name: "", surname: "", password: "", role: "ROLE_MODERATOR" });
      loadAll();
    } else {
      setCreateError(data.error || "Error");
    }
  };

  const getRoleLabel = (roles) => {
    if (roles?.includes("ROLE_SUPER_ADMIN")) return { label: t.superAdmin, cls: "role-super" };
    if (roles?.includes("ROLE_ADMIN"))       return { label: t.admin, cls: "role-admin" };
    if (roles?.includes("ROLE_MODERATOR"))   return { label: t.moderator, cls: "role-moderator" };
    return { label: t.citizen, cls: "role-user" };
  };

  return (
    <div className="page">
      <header className="navbar">
        <div className="logo">(Re)Sources Relationnelles</div>
        <div className="nav-buttons">
          <a href="/admin">{language === "fr" ? "Admin" : "Admin"}</a>
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
          {["users", "logs", "config"].map((id) => (
            <button key={id} role="tab" aria-selected={tab === id}
              className={`tab-btn ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}>
              {t[id]}
            </button>
          ))}
        </div>

        {loading ? <div className="dashboard-loading"><div className="spinner"></div></div> : (
          <>
            {/* COMPTES & RÔLES */}
            {tab === "users" && (
              <section>
                <button className="btn-approve" style={{ marginBottom: 16 }}
                  onClick={() => setCreateModal(true)}>
                  + {t.createAccount}
                </button>

                {users.length === 0 ? <p className="empty-state">{t.noUsers}</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="users-table">
                      <thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.role}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
                      <tbody>
                        {users.map((u) => {
                          const r = getRoleLabel(u.roles);
                          return (
                            <tr key={u.id}>
                              <td>{u.name} {u.surname}</td>
                              <td>{u.email}</td>
                              <td><span className={`role-badge ${r.cls}`}>{r.label}</span></td>
                              <td><span className={u.status ? "status-active" : "status-inactive"}>{u.status ? t.active : t.inactive}</span></td>
                              <td>
                                <button className="tab-btn" style={{ fontSize: 12, padding: "4px 10px", minHeight: 36 }}
                                  onClick={() => { setRoleModal(u); setSelectedRole(u.roles?.[0] || "ROLE_USER"); }}>
                                  {t.changeRole}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* JOURNAL D'ACTIVITÉ */}
            {tab === "logs" && (
              <section>
                {logs.length === 0 ? <p className="empty-state">{t.noLogs}</p> : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="users-table">
                      <thead><tr><th>{t.action}</th><th>{t.moderatorCol}</th><th>{t.target}</th><th>{t.reason}</th><th>{t.date}</th></tr></thead>
                      <tbody>
                        {logs.map((l) => (
                          <tr key={l.id}>
                            <td><span className="role-badge role-moderator">{l.action}</span></td>
                            <td>{l.moderator}</td>
                            <td>{l.targetUser || (l.resource ? `Resource #${l.resource}` : l.comment ? `Comment #${l.comment}` : "—")}</td>
                            <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{l.reason || "—"}</td>
                            <td>{l.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* CONFIGURATION */}
            {tab === "config" && (
              <section>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">{t.platformName}</span>
                    <span className="stat-value" style={{ fontSize: 16 }}>(Re)Sources Relationnelles</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">{t.jwtTtl}</span>
                    <span className="stat-value" style={{ fontSize: 16 }}>8h</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">{t.maxUpload}</span>
                    <span className="stat-value" style={{ fontSize: 16 }}>250 Mo</span>
                  </div>
                </div>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 16 }}>
                  {language === "fr"
                    ? "La configuration est gérée via les fichiers .env et php.ini du serveur."
                    : "Configuration is managed via server .env and php.ini files."}
                </p>
              </section>
            )}
          </>
        )}
      </main>

      {/* MODAL CHANGER RÔLE */}
      {roleModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ color: "#f1f5f9", margin: 0 }}>{t.changeRole}</h2>
            <p style={{ color: "#94a3b8", fontSize: 14 }}>{roleModal.email}</p>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white", fontSize: 14, width: "100%" }}>
              <option value="ROLE_USER">{t.citizen}</option>
              <option value="ROLE_MODERATOR">{t.moderator}</option>
              <option value="ROLE_ADMIN">{t.admin}</option>
              <option value="ROLE_SUPER_ADMIN">{t.superAdmin}</option>
            </select>
            <div className="modal-actions">
              <button className="btn-approve" onClick={changeRole}>{t.confirm}</button>
              <button className="btn-secondary" onClick={() => setRoleModal(null)}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRÉER COMPTE */}
      {createModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2 style={{ color: "#f1f5f9", margin: 0 }}>{t.createAccount}</h2>
            {createError && <div className="login-error">{createError}</div>}
            <form onSubmit={createAccount} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="email" placeholder={t.email} value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white" }} />
              <input type="text" placeholder={t.name} value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white" }} />
              <input type="text" placeholder="Surname" value={newUser.surname}
                onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white" }} />
              <input type="password" placeholder={t.password} value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white" }} />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "white" }}>
                <option value="ROLE_MODERATOR">{t.moderator}</option>
                <option value="ROLE_ADMIN">{t.admin}</option>
              </select>
              <div className="modal-actions">
                <button type="submit" className="btn-approve">{t.confirm}</button>
                <button type="button" className="btn-secondary" onClick={() => setCreateModal(false)}>{t.cancel}</button>
              </div>
            </form>
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
