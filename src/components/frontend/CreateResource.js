import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/common.css";
import "./styles/create-resource.css";

const API = "http://localhost:8000/api";

export default function CreateResource() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("fr");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [formData, setFormData] = useState({ description: "", categoryId: "", restreint: false });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const token = localStorage.getItem("token");

  const t = {
    fr: {
      title: "Créer une ressource", back: "← Retour",
      description: "Description", descriptionHint: "Décrivez votre ressource en quelques mots.",
      category: "Catégorie", selectCategory: "Sélectionner une catégorie",
      file: "Fichier (image ou vidéo)", fileHint: "Formats : jpg, png, webp, gif, mp4, webm. Max 200 Mo.",
      restreint: "Contenu restreint (membres connectés uniquement)",
      submit: "Publier pour validation", uploading: "Envoi en cours...",
      required: "Champ obligatoire", fileRequired: "Veuillez sélectionner un fichier.",
      loginRequired: "Vous devez être connecté.",
      successTitle: "Ressource soumise avec succès !",
      successPending: "Votre ressource est en attente de modération.",
      successType: "Type", successCategory: "Catégorie", successFilename: "Fichier",
      goToResources: "Voir mes ressources", createAnother: "Créer une autre ressource",
      errorFormat: "Format non accepté. Utilisez : jpg, png, webp, gif, mp4, webm.",
      errorSize: "Fichier trop volumineux. Maximum : 200 Mo.",
      errorEmpty: "Le fichier est vide.",
      errorCategory: "Catégorie invalide.",
      errorAuth: "Session expirée. Veuillez vous reconnecter.",
      errorServer: "Erreur serveur. Veuillez réessayer.",
      errorNetwork: "Impossible de contacter le serveur.",
    },
    en: {
      title: "Create a resource", back: "← Back",
      description: "Description", descriptionHint: "Describe your resource in a few words.",
      category: "Category", selectCategory: "Select a category",
      file: "File (image or video)", fileHint: "Formats: jpg, png, webp, gif, mp4, webm. Max 200 MB.",
      restreint: "Restricted content (members only)",
      submit: "Submit for review", uploading: "Uploading...",
      required: "Required field", fileRequired: "Please select a file.",
      loginRequired: "You must be logged in.",
      successTitle: "Resource submitted successfully!",
      successPending: "Your resource is pending moderation.",
      successType: "Type", successCategory: "Category", successFilename: "File",
      goToResources: "View my resources", createAnother: "Create another resource",
      errorFormat: "Format not accepted. Use: jpg, png, webp, gif, mp4, webm.",
      errorSize: "File too large. Maximum: 200 MB.",
      errorEmpty: "The file is empty.",
      errorCategory: "Invalid category.",
      errorAuth: "Session expired. Please log in again.",
      errorServer: "Server error. Please try again.",
      errorNetwork: "Cannot reach the server.",
    },
  }[language];

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/categories`, { headers: { Accept: "application/ld+json" } })
      .then((r) => r.json())
      .then((data) => setCategories(data["member"] || data["hydra:member"] || []))
      .catch(() => setCategories([]));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    if (errors.file) setErrors({ ...errors, file: null });
  };

  const validateFile = (f) => {
    if (!f) return t.fileRequired;
    if (f.size === 0) return t.errorEmpty;
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm"];
    if (!allowed.includes(f.type)) return t.errorFormat;
    if (f.size > 200 * 1024 * 1024) return t.errorSize;
    return null;
  };

  const validate = () => {
    const e = {};
    if (!formData.description.trim()) e.description = t.required;
    if (!formData.categoryId) e.categoryId = t.required;
    const fe = validateFile(file);
    if (fe) e.file = fe;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    setSubmitSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("description", formData.description);
      fd.append("category_id", formData.categoryId);
      fd.append("restreint", formData.restreint ? "1" : "0");

      const res = await fetch(`${API}/resources/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) { setSubmitError(t.errorServer); return; }

      const data = await res.json();
      if (res.ok) {
        setSubmitSuccess(data.resource);
        setFormData({ description: "", categoryId: "", restreint: false });
        setFile(null);
        setPreview(null);
      } else if (res.status === 401) {
        setSubmitError(t.errorAuth);
      } else {
        const msg = data.error || "";
        if (msg.includes("type") || msg.includes("MIME") || msg.includes("format")) setSubmitError(t.errorFormat);
        else if (msg.includes("large") || msg.includes("size")) setSubmitError(t.errorSize);
        else if (msg.includes("category")) setSubmitError(t.errorCategory);
        else setSubmitError(msg || t.errorServer);
      }
    } catch (err) {
      setSubmitError(err.message?.includes("fetch") ? t.errorNetwork : t.errorServer);
    } finally {
      setLoading(false);
    }
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

      <main className="create-main" id="main-content">
        <button className="resource-back" onClick={() => navigate(-1)}>{t.back}</button>
        <h1 className="create-title">{t.title}</h1>

        {/* ÉCRAN SUCCÈS */}
        {submitSuccess && (
          <div className="upload-success" role="status" aria-live="polite">
            <div className="upload-success-icon">✓</div>
            <h2 className="upload-success-title">{t.successTitle}</h2>
            <p className="upload-success-pending">{t.successPending}</p>
            <div className="upload-success-details">
              <div className="upload-detail-row">
                <span className="upload-detail-key">{t.successType}</span>
                <span className="upload-detail-val">{submitSuccess.type}</span>
              </div>
              <div className="upload-detail-row">
                <span className="upload-detail-key">{t.successCategory}</span>
                <span className="upload-detail-val">{submitSuccess.category}</span>
              </div>
              <div className="upload-detail-row">
                <span className="upload-detail-key">{t.successFilename}</span>
                <span className="upload-detail-val">{submitSuccess.filename}</span>
              </div>
            </div>
            <div className="upload-success-actions">
              <button className="btn-primary" onClick={() => navigate("/my-resources")}>
                {t.goToResources}
              </button>
              <button className="btn-secondary-link" onClick={() => setSubmitSuccess(null)}>
                {t.createAnother}
              </button>
            </div>
          </div>
        )}

        {/* FORMULAIRE */}
        {!submitSuccess && (
          <form className="create-form" onSubmit={handleSubmit} noValidate aria-label={t.title}>

            {submitError && (
              <div className="alert-error" role="alert">{submitError}</div>
            )}

            {/* DESCRIPTION */}
            <div className="form-group">
              <label htmlFor="description">{t.description} *</label>
              <textarea
                id="description" name="description"
                value={formData.description} onChange={handleChange}
                className={errors.description ? "error" : ""}
                rows={3} aria-describedby="desc-hint" aria-required="true"
              />
              <small id="desc-hint">{t.descriptionHint}</small>
              {errors.description && <span className="error-text" role="alert">{errors.description}</span>}
            </div>

            {/* CATÉGORIE */}
            <div className="form-group">
              <label htmlFor="categoryId">{t.category} *</label>
              <select
                id="categoryId" name="categoryId"
                value={formData.categoryId} onChange={handleChange}
                className={errors.categoryId ? "error" : ""} aria-required="true"
              >
                <option value="">{t.selectCategory}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <span className="error-text" role="alert">{errors.categoryId}</span>}
            </div>

            {/* FICHIER */}
            <div className="form-group">
              <label htmlFor="file">{t.file} *</label>
              <input
                id="file" type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                onChange={handleFile}
                className={`file-input ${errors.file ? "error" : ""}`}
                aria-describedby="file-hint" aria-required="true"
              />
              <small id="file-hint">{t.fileHint}</small>
              {errors.file && <span className="error-text" role="alert">{errors.file}</span>}
              {preview && <img src={preview} alt="Aperçu" className="file-preview" />}
              {file && !preview && <p className="file-name">📎 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} Mo)</p>}
            </div>

            {/* RESTREINT */}
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="restreint"
                  checked={formData.restreint} onChange={handleChange} />
                <span>{t.restreint}</span>
              </label>
            </div>

            {/* SUBMIT */}
            <div className="create-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t.uploading : t.submit}
              </button>
            </div>

          </form>
        )}
      </main>

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
