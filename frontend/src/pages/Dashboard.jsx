import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api";
import { Toast, MiniBar, timeAgo, Spinner } from "../components/ui";
import CreateLinkModal from "../components/CreateLinkModal";
import QRModal from "../components/QRModal";
import Settings from "../components/Settings";
import Onboarding from "../components/Onboarding";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 });
  const [folders, setFolders] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterFolder, setFilterFolder] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [fetching, setFetching] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [qrLink, setQrLink] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!user?.onboardingCompleted);
  const [latest, setLatest] = useState(null);

  const toast$ = (msg, type = "success") => setToast({ msg, type });

  const loadLinks = useCallback(async () => {
    setFetching(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterFolder) params.folder = filterFolder;
      if (filterTag) params.tag = filterTag;
      const data = await api.getLinks(params);
      setLinks(data.links || []);
      setStats({ totalLinks: data.totalLinks, totalClicks: data.totalClicks });
      setFolders(data.folders || []);
      setAllTags(data.tags || []);
    } catch (e) { toast$(e.message, "error"); } finally { setFetching(false); }
  }, [search, filterFolder, filterTag]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const onCreated = (newLinks) => {
    setLinks(prev => [...newLinks, ...prev]);
    setStats(s => ({ totalLinks: s.totalLinks + newLinks.length, totalClicks: s.totalClicks }));
    setLatest(newLinks[0]);
    toast$(`${newLinks.length > 1 ? newLinks.length + " links" : "Link"} created! 🎀`);
    if (tab !== "home") setTab("home");
  };

  const deleteLink = async (id) => {
    try {
      await api.deleteLink(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      setStats(s => ({ ...s, totalLinks: s.totalLinks - 1 }));
      setDeleteId(null);
      toast$("Link removed 🍃");
    } catch (e) { toast$(e.message, "error"); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast$("Copied! 🌷"); };

  const toggleActive = async (link) => {
    try {
      const data = await api.updateLink(link.id, { isActive: !link.isActive });
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, ...data.link } : l));
      toast$(data.link.isActive ? "Link activated ✅" : "Link paused ⏸️");
    } catch (e) { toast$(e.message, "error"); }
  };

  const navItems = [
    { id: "home", icon: "✨", label: "Home" },
    { id: "links", icon: "🔗", label: "Links" },
    { id: "folders", icon: "📁", label: "Folders" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* Background blobs */}
      <div style={{ position: "fixed", width: 400, height: 400, background: "#e9d5ff", borderRadius: "50%", filter: "blur(80px)", opacity: dark ? .08 : .22, top: -100, right: -100, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", width: 300, height: 300, background: "#fbcfe8", borderRadius: "50%", filter: "blur(80px)", opacity: dark ? .06 : .2, bottom: 100, left: -80, pointerEvents: "none", zIndex: 0 }} />

      {/* Onboarding */}
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <nav style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setTab("home")}>
              <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#a78bfa,#f472b6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔗</div>
              <span style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>Snip</span>
            </div>
            <div style={{ display: "flex", gap: 2 }}>
              {navItems.map(n => (
                <button key={n.id} className={`tab ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)} style={{ fontSize: 13 }}>
                  {n.icon} {n.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Dark mode toggle */}
            <button onClick={toggle} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 50, padding: "7px 12px", cursor: "pointer", fontSize: 16, transition: "all .2s" }} title="Toggle dark mode">
              {dark ? "☀️" : "🌙"}
            </button>

            {/* Email verify banner */}
            {!user?.isEmailVerified && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 50, padding: "6px 14px", fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                ⚠️ Verify email
              </div>
            )}

            {/* User menu */}
            <button onClick={() => setShowSettings(true)} style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 50, padding: "6px 14px", cursor: "pointer", transition: "all .15s" }}>
              {user?.avatar
                ? <img src={user.avatar} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
                : <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#a78bfa,#f472b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>{user?.name?.[0]}</div>
              }
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user?.name?.split(" ")[0]}</span>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>⚙️</span>
            </button>
            <button className="btn-ghost" onClick={logout} style={{ fontSize: 12, padding: "7px 14px" }}>Sign out</button>
          </div>
        </nav>

        {/* HOME */}
        {tab === "home" && (
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 44, animation: "fadeIn .4s ease" }}>
              <div style={{ fontSize: 48, display: "inline-block", animation: "float 3s ease-in-out infinite" }}>🌸</div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "clamp(28px,5vw,48px)", fontWeight: 700, lineHeight: 1.1, color: "var(--text)", marginTop: 12 }}>
                Hello, {user?.name?.split(" ")[0]} 👋<br />
                <span style={{ background: "linear-gradient(135deg,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Let's snip something
                </span>
              </h1>
              <p style={{ color: "var(--text2)", marginTop: 12, fontSize: 15, lineHeight: 1.7 }}>
                Create short links, track clicks, organize with folders & tags.
              </p>
            </div>

            {/* Quick create */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, marginBottom: 20, animation: "fadeIn .5s .1s ease both" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input className="input" placeholder="Paste a long URL to shorten..." readOnly onClick={() => setShowCreate(true)} style={{ cursor: "pointer" }} />
                <button className="btn-primary" onClick={() => setShowCreate(true)}>Snip it →</button>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
                {[["🔒 Password protect", "password"], ["📅 Set expiry", "expiry"], ["👁️ Preview page", "preview"], ["📋 Bulk create", "bulk"]].map(([label]) => (
                  <button key={label} onClick={() => setShowCreate(true)} style={{ background: "none", border: "none", color: "var(--accent2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Latest link */}
            {latest && (
              <div style={{ background: "var(--surface)", border: "1.5px solid var(--accent2)", borderRadius: 20, padding: 20, marginBottom: 20, animation: "fadeIn .3s ease" }}>
                <div style={{ fontSize: 11, color: "var(--accent2)", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>🎀 LATEST LINK</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--accent)" }}>{latest.shortUrl}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>{latest.originalUrl}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-soft" onClick={() => copy(latest.shortUrl)}>📋 Copy</button>
                    <button className="btn-soft" onClick={() => setQrLink(latest)}>QR</button>
                    <button className="btn-soft" onClick={() => { setTab("links"); setLatest(null); }}>View all →</button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, animation: "fadeIn .6s .2s ease both" }}>
              {[
                { label: "Total Links", value: stats.totalLinks, icon: "🔗" },
                { label: "Total Clicks", value: stats.totalClicks, icon: "👆" },
                { label: "Avg. Clicks", value: stats.totalLinks ? Math.round(stats.totalClicks / stats.totalLinks) : 0, icon: "📈" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "18px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent links preview */}
            {links.slice(0, 3).length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700 }}>Recent Links</div>
                  <button className="btn-ghost" onClick={() => setTab("links")} style={{ fontSize: 12 }}>View all →</button>
                </div>
                {links.slice(0, 3).map(link => (
                  <div key={link.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 18px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.shortUrl}</div>
                      <div style={{ color: "var(--text3)", fontSize: 11, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.originalUrl}</div>
                    </div>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: "var(--accent)", minWidth: 32, textAlign: "right" }}>{link.clicks}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LINKS */}
        {tab === "links" && (
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700 }}>Your Links</h2>
                <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>{stats.totalLinks} links · {stats.totalClicks} total clicks</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {fetching && <Spinner dark />}
                <button className="btn-ghost" onClick={loadLinks} style={{ fontSize: 12 }}>↻</button>
                <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ padding: "10px 20px", fontSize: 13 }}>+ New Link</button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <input className="input" placeholder="🔍 Search links..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: "1 1 200px", minWidth: 0 }} />
              <select className="input" value={filterFolder} onChange={e => setFilterFolder(e.target.value)} style={{ flex: "0 0 auto", width: "auto", cursor: "pointer" }}>
                <option value="">📁 All folders</option>
                {folders.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select className="input" value={filterTag} onChange={e => setFilterTag(e.target.value)} style={{ flex: "0 0 auto", width: "auto", cursor: "pointer" }}>
                <option value="">🏷️ All tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {fetching && links.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 20 }} />)}
              </div>
            )}

            {!fetching && links.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                <div style={{ fontWeight: 600 }}>No links yet. Create your first one!</div>
                <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ marginTop: 20 }}>+ Create Link</button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {links.map((link, i) => (
                <div key={link.id} className="link-row" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "16px 20px", animationDelay: `${i * 0.03}s`, opacity: link.isActive ? 1 : .6, transition: "opacity .2s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700 }}>{link.shortUrl}</span>
                        {link.isPasswordProtected && <span style={{ fontSize: 10, background: "var(--accent-bg)", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: 50, padding: "1px 8px", fontWeight: 700 }}>🔒 PROTECTED</span>}
                        {link.requirePreview && <span style={{ fontSize: 10, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 50, padding: "1px 8px", fontWeight: 700 }}>👁️ PREVIEW</span>}
                        {link.expiresAt && <span style={{ fontSize: 10, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 50, padding: "1px 8px", fontWeight: 700 }}>📅 EXPIRES</span>}
                        {!link.isActive && <span style={{ fontSize: 10, background: "var(--error-bg)", color: "var(--error-text)", border: "1px solid var(--error-border)", borderRadius: 50, padding: "1px 8px", fontWeight: 700 }}>PAUSED</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>{link.originalUrl}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>{timeAgo(link.createdAt)}</span>
                        {link.folder !== "default" && <span style={{ fontSize: 11, color: "var(--accent2)" }}>📁 {link.folder}</span>}
                        {link.tags?.map(t => <span key={t} style={{ fontSize: 10, background: "var(--accent-bg)", color: "var(--accent)", borderRadius: 50, padding: "1px 8px" }}>{t}</span>)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ textAlign: "center" }}>
                        <MiniBar data={link.trend} />
                        <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 3, fontWeight: 600 }}>7d trend</div>
                      </div>
                      <div style={{ background: "var(--bg2)", borderRadius: 12, padding: "7px 12px", textAlign: "center", minWidth: 50 }}>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{link.clicks}</div>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600 }}>clicks</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-soft" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => copy(link.shortUrl)} title="Copy">📋</button>
                        <button className="btn-soft" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setQrLink(link)} title="QR Code">▦</button>
                        <button className="btn-soft" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => toggleActive(link)} title={link.isActive ? "Pause" : "Activate"}>{link.isActive ? "⏸" : "▶"}</button>
                        <button className="btn-danger" onClick={() => setDeleteId(link.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOLDERS */}
        {tab === "folders" && (
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 700, marginBottom: 24 }}>📁 Folders & Tags</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Folders</div>
                {folders.length === 0 && <div style={{ color: "var(--text3)", fontSize: 14 }}>No folders yet. Create a link with a folder name!</div>}
                {folders.map(f => (
                  <button key={f} onClick={() => { setFilterFolder(f); setTab("links"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 18px", marginBottom: 8, cursor: "pointer", width: "100%", fontFamily: "inherit", transition: "all .15s" }}>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>📁 {f}</span>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>{links.filter(l => l.folder === f).length} links</span>
                  </button>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Tags</div>
                {allTags.length === 0 && <div style={{ color: "var(--text3)", fontSize: 14 }}>No tags yet. Add tags when creating links!</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allTags.map(t => (
                    <button key={t} onClick={() => { setFilterTag(t); setTab("links"); }} style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--accent)", borderRadius: 50, padding: "6px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                      #{t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateLinkModal folders={folders} tags={allTags} onCreated={onCreated} onClose={() => setShowCreate(false)} />
      )}
      {qrLink && <QRModal link={qrLink} onClose={() => setQrLink(null)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(100,80,160,.18)", backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}
          onClick={() => setDeleteId(null)}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: 32, maxWidth: 340, width: "100%", textAlign: "center", animation: "fadeInScale .2s ease" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 34 }}>🌿</div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, marginTop: 12, marginBottom: 8 }}>Remove this link?</div>
            <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 22, lineHeight: 1.5 }}>This will permanently delete the link and all click data.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-soft" style={{ flex: 1, padding: "11px 0" }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ flex: 1, background: "linear-gradient(135deg,#f9a8d4,#ec4899)", color: "#fff", border: "none", borderRadius: 50, padding: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
                onClick={() => deleteLink(deleteId)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
