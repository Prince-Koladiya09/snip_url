import { useState } from "react";
import { api } from "../api";
import { Modal, Spinner } from "../components/ui";

export default function CreateLinkModal({ onCreated, onClose, folders = [], tags: existingTags = [] }) {
  const [mode, setMode] = useState("single"); // single | bulk
  const [form, setForm] = useState({
    url: "", alias: "", folder: "default",
    password: "", requirePreview: false,
    expiresAt: "", tags: [],
  });
  const [bulkUrls, setBulkUrls] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bulkResults, setBulkResults] = useState(null);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: typeof v === "object" && v.target ? v.target.value : v }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "bulk") {
        const urls = bulkUrls.split("\n").map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) throw new Error("Please enter at least one URL.");
        const data = await api.bulkCreate({ urls, folder: form.folder, tags: form.tags });
        setBulkResults(data.results);
        const created = data.results.filter(r => r.success).map(r => r.link);
        onCreated(created);
      } else {
        if (!form.url.trim()) throw new Error("Please enter a URL.");
        const data = await api.createLink({
          originalUrl: form.url,
          customCode: form.alias || undefined,
          expiresAt: form.expiresAt || undefined,
          password: form.password || undefined,
          requirePreview: form.requirePreview,
          tags: form.tags,
          folder: form.folder,
        });
        onCreated([data.link]);
        onClose();
      }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'Nunito', sans-serif" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🔗 Create Short Link</h2>

        {/* Single / Bulk toggle */}
        <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 50, padding: 4, marginBottom: 20 }}>
          {["single", "bulk"].map(m => (
            <button key={m} onClick={() => { setMode(m); setBulkResults(null); setError(""); }} style={{
              flex: 1, padding: "9px", border: "none", borderRadius: 50, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 700, fontSize: 13,
              background: mode === m ? "var(--surface)" : "transparent",
              color: mode === m ? "var(--accent)" : "var(--text2)",
              boxShadow: mode === m ? "0 2px 8px rgba(167,139,250,.2)" : "none",
              transition: "all .2s",
            }}>
              {m === "single" ? "✨ Single URL" : "📋 Bulk (up to 50)"}
            </button>
          ))}
        </div>

        {/* Bulk results */}
        {bulkResults && (
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
            {bulkResults.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: r.success ? "#f0fdf4" : "var(--error-bg)", borderRadius: 10, marginBottom: 6, fontSize: 12 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 250, color: "var(--text2)" }}>{r.originalUrl}</span>
                <span style={{ fontWeight: 700, color: r.success ? "#166534" : "var(--error-text)", marginLeft: 8 }}>{r.success ? "✓ " + r.link.code : "✗ " + r.error}</span>
              </div>
            ))}
            <button className="btn-soft" onClick={onClose} style={{ width: "100%", marginTop: 10 }}>Done</button>
          </div>
        )}

        {!bulkResults && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "single" ? (
              <>
                <div>
                  <div className="label">Destination URL</div>
                  <input className="input" placeholder="https://your-long-url.com" value={form.url} onChange={set("url")} />
                </div>
                <div>
                  <div className="label">Custom Alias (optional)</div>
                  <input className="input" placeholder="e.g. my-product" value={form.alias} onChange={e => setForm(f => ({ ...f, alias: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") }))} />
                </div>
              </>
            ) : (
              <div>
                <div className="label">URLs (one per line)</div>
                <textarea className="input" placeholder={"https://example.com\nhttps://another-url.com\nhttps://..."} value={bulkUrls} onChange={e => setBulkUrls(e.target.value)}
                  style={{ minHeight: 120, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            )}

            {/* Folder */}
            <div>
              <div className="label">Folder</div>
              <input className="input" placeholder="default" value={form.folder} onChange={set("folder")} list="folders-list" />
              <datalist id="folders-list">{folders.map(f => <option key={f} value={f} />)}</datalist>
            </div>

            {/* Tags */}
            <div>
              <div className="label">Tags</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="Add a tag..." value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }} />
                <button className="btn-soft" onClick={addTag} style={{ whiteSpace: "nowrap" }}>+ Add</button>
              </div>
              {form.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--accent)", borderRadius: 50, padding: "3px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      onClick={() => removeTag(t)}>{t} ✕</span>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced options toggle */}
            <button onClick={() => setShowAdvanced(a => !a)} style={{ background: "none", border: "none", color: "var(--accent2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              {showAdvanced ? "▲ Hide" : "▼ Show"} advanced options
            </button>

            {showAdvanced && mode === "single" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--bg2)", borderRadius: 16, padding: 16 }}>
                {/* Expiry */}
                <div>
                  <div className="label">Expiry Date (optional)</div>
                  <input className="input" type="datetime-local" value={form.expiresAt} onChange={set("expiresAt")} min={new Date().toISOString().slice(0, 16)} />
                </div>

                {/* Password */}
                <div>
                  <div className="label">Password Protection (optional)</div>
                  <input className="input" type="password" placeholder="Leave blank for no password" value={form.password} onChange={set("password")} />
                </div>

                {/* Preview page */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Show Preview Page</div>
                    <div style={{ color: "var(--text2)", fontSize: 12 }}>Show destination before redirecting</div>
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, requirePreview: !f.requirePreview }))} style={{
                    width: 40, height: 22, borderRadius: 50, border: "none", cursor: "pointer",
                    background: form.requirePreview ? "linear-gradient(135deg,#a78bfa,#c084fc)" : "var(--border2)",
                    position: "relative", transition: "background .2s", flexShrink: 0,
                  }}>
                    <div style={{ position: "absolute", top: 3, left: form.requirePreview ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                  </button>
                </div>
              </div>
            )}

            {error && <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: 12, padding: "10px 14px", color: "var(--error-text)", fontSize: 13, fontWeight: 600 }}>🌷 {error}</div>}

            <button className="btn-primary" onClick={submit} disabled={loading} style={{ width: "100%", marginTop: 4 }}>
              {loading ? <Spinner /> : mode === "bulk" ? "Create All Links →" : "Snip it →"}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
