import { useState, useEffect } from "react";
import { api } from "../api";
import { Modal, Spinner } from "../components/ui";

export default function QRModal({ link, onClose }) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getQR(link.id)
      .then(data => setQr(data.qr))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [link.id]);

  const download = () => {
    const a = document.createElement("a");
    a.href = qr;
    a.download = `snip-qr-${link.code}.png`;
    a.click();
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ fontFamily: "'Nunito', sans-serif", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>QR Code</h2>
        <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>{link.shortUrl}</p>

        {loading && (
          <div style={{ padding: 40, color: "var(--text3)" }}>
            <Spinner dark /> <span style={{ marginLeft: 10 }}>Generating QR...</span>
          </div>
        )}

        {error && <div style={{ color: "var(--error-text)", fontSize: 14 }}>Error: {error}</div>}

        {qr && (
          <>
            <div style={{ background: "var(--bg2)", borderRadius: 20, padding: 20, display: "inline-block", border: "1px solid var(--border)" }}>
              <img src={qr} alt="QR Code" style={{ width: 200, height: 200, display: "block" }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--text3)" }}>Scan to open: {link.shortUrl}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn-soft" style={{ flex: 1 }} onClick={() => navigator.clipboard.writeText(link.shortUrl)}>
                📋 Copy URL
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={download}>
                ⬇️ Download PNG
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
