"use client";
import { useEffect, useState, useRef } from "react";

type Contact = { id: number; name: string; phone: string; role: string; color: string };
type SmsLog  = { id: number; name: string; phone: string; message: string; sent_at: string };

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

const QUICK = [
  "Salom! Siz bilan bog'lanmoqchi edim.",
  "Iltimos, telefon qilib qo'ying.",
  "Yig'ilish bugun soat 15:00 da.",
  "Buyurtmangiz tayyor. Olib keta olasiz.",
];

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
      border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
      background: checked ? "var(--accent)" : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s",
    }}>
      {checked && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function Home() {
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [filtered, setFiltered]   = useState<Contact[]>([]);
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [message, setMessage]     = useState("");
  const [search, setSearch]       = useState("");
  const [toast, setToast]         = useState("");
  const [logs, setLogs]           = useState<SmsLog[]>([]);
  const [showLogs, setShowLogs]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [activeTab, setActiveTab] = useState<"contacts" | "message">("contacts");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(d => {
      setContacts(d); setFiltered(d); setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)));
  }, [search, contacts]);

  function toggle(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleAll() {
    const allSel = filtered.every(c => selected.has(c.id));
    setSelected(prev => {
      const n = new Set(prev);
      allSel ? filtered.forEach(c => n.delete(c.id)) : filtered.forEach(c => n.add(c.id));
      return n;
    });
  }

  function showToastMsg(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  }

  async function sendSMS() {
    if (!message.trim() || selected.size === 0 || sending) return;
    setSending(true);
    const res  = await fetch("/api/sms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactIds: [...selected], message }),
    });
    const data = await res.json();
    setSending(false);
    if (data.smsUri) {
      window.location.href = data.smsUri;
      showToastMsg(`SMS yuborildi (${data.count} ta)`);
    }
  }

  async function loadLogs() {
    const res = await fetch("/api/sms");
    setLogs(await res.json());
    setShowLogs(true);
  }

  const selContacts = contacts.filter(c => selected.has(c.id));
  const allSel      = filtered.length > 0 && filtered.every(c => selected.has(c.id));
  const canSend     = selected.size > 0 && message.trim().length > 0;

  const card: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 20, overflow: "hidden", marginBottom: 12,
  };

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(108,99,255,0.09) 0%, transparent 70%)",
      }} />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 100px", position: "relative", zIndex: 1 }}>

        <header className="fade-up" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13, flexShrink: 0,
            background: "linear-gradient(135deg,#6c63ff,#ff6b6b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 0 20px rgba(108,99,255,0.3)",
          }}></div>
          <div>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 21, fontWeight: 800, lineHeight: 1.1 }}>
              SMS <span style={{ color: "var(--accent)" }}>Yuboruvchi</span>
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{contacts.length} ta kontakt</div>
          </div>
          <button onClick={loadLogs} style={{
            marginLeft: "auto", background: "var(--surface2)", border: "1px solid var(--border)",
            color: "var(--muted)", fontSize: 12, padding: "8px 12px", borderRadius: 12, cursor: "pointer",
          }}> Loglar</button>
        </header>

        <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { val: selected.size, label: "Tanlangan", color: "var(--accent)" },
            { val: contacts.length, label: "Jami", color: "var(--accent2)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="fade-up" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5,
          background: "var(--surface2)", borderRadius: 14, padding: 4, marginBottom: 14,
        }}>
          {(["contacts", "message"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "11px", borderRadius: 11, border: "none", cursor: "pointer",
              fontFamily: "Syne,sans-serif", fontSize: 13, fontWeight: 700,
              background: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "white" : "var(--muted)",
              transition: "all 0.2s",
            }}>
              {tab === "contacts" ? `Kontaktlar${selected.size > 0 ? ` (${selected.size})` : ""}` : "Xabar"}
            </button>
          ))}
        </div>

        {activeTab === "contacts" && (
          <div className="scale-in" style={card}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
                style={{
                  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "11px 14px", color: "var(--text)",
                  fontFamily: "DM Sans,sans-serif", fontSize: 15, outline: "none",
                }}
              />
            </div>

            <div onClick={toggleAll} className="contact-row" style={{
              padding: "12px 16px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              background: allSel ? "rgba(108,99,255,0.08)" : "transparent",
            }}>
              <Checkbox checked={allSel} />
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>Barchasini tanlash</span>
              {selected.size > 0 && (
                <span style={{
                  marginLeft: "auto", background: "rgba(108,99,255,0.15)",
                  border: "1px solid rgba(108,99,255,0.4)", color: "var(--accent)",
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                }}>{selected.size} ta</span>
              )}
            </div>

            <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}></div>Yuklanmoqda...
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>Topilmadi</div>
              ) : (
                <div className="stagger">
                  {filtered.map(c => {
                    const sel = selected.has(c.id);
                    return (
                      <div key={c.id} onClick={() => toggle(c.id)} className="contact-row fade-up" style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer",
                        borderBottom: "1px solid rgba(37,37,53,0.7)",
                        background: sel ? "rgba(108,99,255,0.08)" : "transparent", position: "relative",
                      }}>
                        {sel && <div style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          width: 3, background: "var(--accent)", borderRadius: "0 3px 3px 0",
                        }} />}
                        <div style={{
                          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                          background: c.color + "20", color: c.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 15,
                          border: `1.5px solid ${sel ? c.color + "55" : "transparent"}`,
                          transition: "border-color 0.2s",
                        }}>{initials(c.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                            {c.phone}
                            {c.role && <span style={{ color: "var(--accent)", marginLeft: 6, fontSize: 11 }}>{c.role}</span>}
                          </div>
                        </div>
                        <Checkbox checked={sel} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selected.size > 0 && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
                <button onClick={() => setActiveTab("message")} style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: "var(--accent)", color: "white",
                  fontFamily: "Syne,sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Xabar yozishga o'tish </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "message" && (
          <div className="scale-in" style={card}>
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--border)",
              background: "var(--surface2)", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)" }}>Xabar</span>
              <span style={{
                marginLeft: "auto", background: "rgba(108,99,255,0.15)",
                border: "1px solid rgba(108,99,255,0.4)", color: "var(--accent)",
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              }}>{message.length}/160</span>
            </div>

            <div style={{ padding: 14 }}>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="SMS matningizni yozing..." rows={5}
                style={{
                  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "12px 14px", color: "var(--text)",
                  fontFamily: "DM Sans,sans-serif", fontSize: 15, outline: "none",
                  resize: "none", lineHeight: 1.6, minHeight: 120, transition: "border-color 0.2s",
                }}
              />
            </div>

            <div style={{ padding: "0 14px 14px" }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Tezkor</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {QUICK.map(q => (
                  <button key={q} onClick={() => setMessage(q)} className="quick-btn" style={{
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--muted)",
                    cursor: "pointer", textAlign: "left", fontFamily: "DM Sans,sans-serif",
                  }}>{q}</button>
                ))}
              </div>
            </div>

            {selContacts.length > 0 && (
              <div style={{
                margin: "0 14px 14px", padding: "10px 12px",
                background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13,
              }}>
                <span style={{ color: "var(--muted)" }}>Yuboriladi: </span>
                {selContacts.map(c => <span key={c.id} style={{ color: "var(--accent)", marginRight: 6 }}>{c.name}</span>)}
              </div>
            )}

            <div style={{ padding: "0 14px 14px" }}>
              <button onClick={sendSMS} disabled={!canSend || sending} className="send-btn" style={{
                width: "100%", padding: "16px", border: "none", borderRadius: 14,
                background: canSend ? "linear-gradient(135deg,#6c63ff,#8b5cf6)" : "var(--surface2)",
                color: canSend ? "white" : "var(--muted)",
                fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800,
                cursor: canSend ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: canSend ? "0 4px 24px rgba(108,99,255,0.4)" : "none",
              }}>
                {sending ? " Yuborilmoqda..." : <><span></span>{selected.size > 0 ? `${selected.size} ta kontaktga yuborish` : "Kontakt tanlang"}</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {showLogs && (
        <div onClick={() => setShowLogs(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)", zIndex: 50,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} className="modal-overlay" style={{
            background: "var(--surface)", borderRadius: "20px 20px 0 0",
            padding: "20px 20px 40px", width: "100%", maxWidth: 520,
            maxHeight: "75vh", overflowY: "auto",
            border: "1px solid var(--border)", borderBottom: "none",
          }}>
            <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 4, margin: "0 auto 20px" }} />
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: 17, fontWeight: 800, marginBottom: 16 }}>SMS Loglar</h3>
            {logs.length === 0
              ? <p style={{ color: "var(--muted)", fontSize: 14 }}>Hali SMS yuborilmagan.</p>
              : logs.map(l => (
                <div key={l.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 13, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 500 }}>{l.name} <span style={{ color: "var(--muted)", fontSize: 12 }}>{l.phone}</span></div>
                  <div style={{ color: "var(--muted)", marginTop: 2 }}>{l.message}</div>
                  <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>{new Date(l.sent_at).toLocaleString("uz")}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "var(--surface2)", border: "1px solid var(--accent3)",
          color: "var(--accent3)", padding: "12px 20px", borderRadius: 14,
          fontSize: 14, fontWeight: 500, zIndex: 100, whiteSpace: "nowrap",
          animation: "toastIn 0.3s ease both", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>{toast}</div>
      )}
    </div>
  );
}