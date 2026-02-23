import { useState } from "react";
import { api } from "../api";
import { Spinner } from "../components/ui";

export default function CreateLinkModal({ onCreated, onClose, folders = [], tags: existingTags = [] }) {
  const [mode, setMode] = useState("single");
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
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(100,80,160,.18)",
        backdropFilter: "blur(7px)",
        zIndex: 998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
    >
      {/* Modal shell — flex column so header+footer are sticky */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 420,
          /* Never taller than viewport */
          maxHeight: "calc(100dvh - 24px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(124,58,237,0.18)",
          animation: "fadeInScale .2s ease",
        }}
      >
        {/* ── FIXED HEADER ── */}
        <div style={{
          padding: "12px 18px 10px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, margin: 0 }}>
            🔗 Create Short Link
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 17, cursor: "pointer", color: "var(--text3)", lineHeight: 1, padding: "2px 4px" }}
          >✕</button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 9,
          /* Custom slim scrollbar */
        }}>

          {/* Mode toggle */}
          <div style={{ display: "flex", background: "var(--bg2)", borderRadius: 50, padding: 3 }}>
            {["single", "bulk"].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setBulkResults(null); setError(""); setShowAdvanced(false); }}
                style={{
                  flex: 1, padding: "6px", border: "none", borderRadius: 50, cursor: "pointer",
                  fontFamily: "inherit", fontWeight: 700, fontSize: 12,
                  background: mode === m ? "var(--surface)" : "transparent",
                  color: mode === m ? "var(--accent)" : "var(--text2)",
                  boxShadow: mode === m ? "0 2px 8px rgba(167,139,250,.2)" : "none",
                  transition: "all .2s",
                }}
              >
                {m === "single" ? "✨ Single URL" : "📋 Bulk (up to 50)"}
              </button>
            ))}
          </div>

          {/* ── BULK RESULTS ── */}
          {bulkResults && (
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {bulkResults.map((r, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "5px 10px",
                  background: r.success ? "#f0fdf4" : "var(--error-bg)",
                  borderRadius: 8, marginBottom: 4, fontSize: 11,
                }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220, color: "var(--text2)" }}>
                    {r.originalUrl}
                  </span>
                  <span style={{ fontWeight: 700, color: r.success ? "#166534" : "var(--error-text)", marginLeft: 6 }}>
                    {r.success ? "✓ " + r.link.code : "✗ " + r.error}
                  </span>
                </div>
              ))}
              <button className="btn-soft" onClick={onClose} style={{ width: "100%", marginTop: 8, fontSize: 12 }}>Done</button>
            </div>
          )}

          {/* ── MAIN FORM ── */}
          {!bulkResults && (
            <>
              {mode === "single" ? (
                <>
                  {/* Destination URL */}
                  <div>
                    <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Destination URL</div>
                    <input
                      className="input"
                      placeholder="https://your-long-url.com"
                      value={form.url}
                      onChange={set("url")}
                      style={{ padding: "9px 13px", fontSize: 13 }}
                    />
                  </div>

                  {/* Alias */}
                  <div>
                    <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Custom Alias (optional)</div>
                    <input
                      className="input"
                      placeholder="e.g. my-product"
                      value={form.alias}
                      onChange={e => setForm(f => ({ ...f, alias: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") }))}
                      style={{ padding: "9px 13px", fontSize: 13 }}
                    />
                  </div>

                  {/* Folder + Tag on one row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Folder</div>
                      <input
                        className="input"
                        placeholder="default"
                        value={form.folder}
                        onChange={set("folder")}
                        list="folders-list"
                        style={{ padding: "9px 10px", fontSize: 13 }}
                      />
                      <datalist id="folders-list">{folders.map(f => <option key={f} value={f} />)}</datalist>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Tags</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          className="input"
                          placeholder="tag…"
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                          style={{ padding: "9px 8px", fontSize: 13 }}
                        />
                        <button className="btn-soft" onClick={addTag} style={{ whiteSpace: "nowrap", padding: "0 10px", fontSize: 12, flexShrink: 0 }}>+</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* BULK fields */
                <>
                  <div>
                    <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>URLs (one per line)</div>
                    <textarea
                      className="input"
                      placeholder={"https://example.com\nhttps://another-url.com\nhttps://..."}
                      value={bulkUrls}
                      onChange={e => setBulkUrls(e.target.value)}
                      style={{ minHeight: 100, resize: "vertical", lineHeight: 1.5, padding: "9px 13px", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Folder</div>
                      <input
                        className="input"
                        placeholder="default"
                        value={form.folder}
                        onChange={set("folder")}
                        list="folders-list-b"
                        style={{ padding: "9px 10px", fontSize: 13 }}
                      />
                      <datalist id="folders-list-b">{folders.map(f => <option key={f} value={f} />)}</datalist>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Tags</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          className="input"
                          placeholder="tag…"
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                          style={{ padding: "9px 8px", fontSize: 13 }}
                        />
                        <button className="btn-soft" onClick={addTag} style={{ whiteSpace: "nowrap", padding: "0 10px", fontSize: 12, flexShrink: 0 }}>+</button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tag chips */}
              {form.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {form.tags.map(t => (
                    <span
                      key={t}
                      onClick={() => removeTag(t)}
                      style={{
                        background: "var(--accent-bg)", border: "1px solid var(--accent-border)",
                        color: "var(--accent)", borderRadius: 50, padding: "2px 9px",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}
                    >{t} ✕</span>
                  ))}
                </div>
              )}

              {/* Advanced toggle */}
              <button
                onClick={() => setShowAdvanced(a => !a)}
                style={{
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", padding: 0, display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 15, height: 15, borderRadius: "50%",
                  background: "linear-gradient(135deg,#a78bfa,#c084fc)",
                  color: "#fff", fontSize: 8, fontWeight: 900, flexShrink: 0,
                }}>
                  {showAdvanced ? "▲" : "▼"}
                </span>
                <span style={{
                  color: "var(--accent)", fontSize: 12, fontWeight: 700,
                  textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3,
                }}>
                  {showAdvanced ? "Hide advanced options" : "Show advanced options"}
                </span>
              </button>

              {/* Advanced panel */}
              {showAdvanced && (
                <div style={{
                  display: "flex", flexDirection: "column", gap: 9,
                  background: "var(--bg2)", borderRadius: 12, padding: 11,
                  border: "1px solid var(--border)",
                }}>
                  <div>
                    <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Expiry Date (optional)</div>
                    <input
                      className="input"
                      type="datetime-local"
                      value={form.expiresAt}
                      onChange={set("expiresAt")}
                      min={new Date().toISOString().slice(0, 16)}
                      style={{ padding: "8px 12px", fontSize: 13 }}
                    />
                  </div>

                  {mode === "single" && (
                    <>
                      <div>
                        <div className="label" style={{ marginBottom: 3, fontSize: 10 }}>Password Protection (optional)</div>
                        <input
                          className="input"
                          type="password"
                          placeholder="Leave blank for no password"
                          value={form.password}
                          onChange={set("password")}
                          style={{ padding: "8px 12px", fontSize: 13 }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12 }}>Show Preview Page</div>
                          <div style={{ color: "var(--text2)", fontSize: 11 }}>Show destination before redirecting</div>
                        </div>
                        <button
                          onClick={() => setForm(f => ({ ...f, requirePreview: !f.requirePreview }))}
                          style={{
                            width: 36, height: 20, borderRadius: 50, border: "none", cursor: "pointer",
                            background: form.requirePreview ? "linear-gradient(135deg,#a78bfa,#c084fc)" : "var(--border2)",
                            position: "relative", transition: "background .2s", flexShrink: 0,
                          }}
                        >
                          <div style={{
                            position: "absolute", top: 2,
                            left: form.requirePreview ? 18 : 2,
                            width: 16, height: 16, borderRadius: "50%",
                            background: "#fff", transition: "left .2s",
                          }} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  background: "var(--error-bg)", border: "1px solid var(--error-border)",
                  borderRadius: 10, padding: "7px 12px",
                  color: "var(--error-text)", fontSize: 12, fontWeight: 600,
                }}>
                  🌷 {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── FIXED FOOTER: button always pinned to bottom ── */}
        {!bulkResults && (
          <div style={{
            padding: "9px 18px 13px",
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
          }}>
            <button
              onClick={submit}
              disabled={loading}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: loading
                  ? "var(--border2)"
                  : "linear-gradient(135deg, #6d28d9, #7c3aed, #a78bfa)",
                color: "#fff",
                border: "none",
                borderRadius: 50,
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 5px 18px rgba(109,40,217,0.45)",
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              {loading
                ? <Spinner />
                : mode === "bulk"
                  ? <><span>🔗</span><span>Create All Links →</span></>
                  : <><span>✨</span><span>Snip it →</span></>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}