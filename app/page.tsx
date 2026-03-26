"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ovpekmsswwduwmonvjse.supabase.co",
  "sb_publishable_4C42PMnRxHPIKs3Ir-c5Gw_a0CnkMub"
);

type Contact = { id: number; name: string; phone: string; role?: string; color?: string };

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}

const COLORS = ["#6c63ff","#ff6b6b","#43e97b","#f7971e","#c471ed","#12c2e9","#f64f59"];

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filtered, setFiltered] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage]   = useState("");
  const [search, setSearch]     = useState("");
  const [toast, setToast]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [activeTab, setActiveTab] = useState<"contacts"|"message"|"add">("contacts");
  const [newName, setNewName]   = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole]   = useState("");
  const [adding, setAdding]     = useState(false);

  async function fetchContacts() {
    const { data, error } = await supabase.from("contacts").select("*").order("name");
    if (!error) { setContacts(data || []); setFiltered(data || []); }
    setLoading(false);
  }

  useEffect(() => { fetchContacts(); }, []);

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
    setTimeout(() => setToast(""), 3000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newPhone) return alert("Ism va telefon kerak!");
    setAdding(true);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const { error } = await supabase.from("contacts").insert([{ name: newName, phone: newPhone, role: newRole, color }]);
    if (error) { alert("Xato: " + error.message); }
    else {
      setNewName(""); setNewPhone(""); setNewRole("");
      await fetchContacts();
      showToastMsg("Kontakt qo'shildi!");
      setActiveTab("contacts");
    }
    setAdding(false);
  }

  async function deleteContact(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    await fetchContacts();
    showToastMsg("Kontakt o'chirildi");
  }

  async function sendSMS() {
    if (!message.trim() || selected.size === 0 || sending) return;
    setSending(true);
    const selContacts = contacts.filter(c => selected.has(c.id));
    const phones = selContacts.map(c => c.phone).join(";");
    // Log saqlash
    await supabase.from("sms_logs").insert(
      selContacts.map(c => ({ contact_id: c.id, phone: c.phone, message }))
    );
    setSending(false);
    window.location.href = `sms:${phones}?body=${encodeURIComponent(message)}`;
    showToastMsg(`${selContacts.length} ta kontaktga SMS yuborildi`);
  }

  const selContacts = contacts.filter(c => selected.has(c.id));
  const allSel = filtered.length > 0 && filtered.every(c => selected.has(c.id));
  const canSend = selected.size > 0 && message.trim().length > 0;

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

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg,#6c63ff,#ff6b6b)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 16px rgba(108,99,255,0.3)",
          }}>💬</div>
          <div>
            <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>
              SMS <span style={{ color: "var(--accent)" }}>Yuboruvchi</span>
            </h1>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
              {contacts.length} kontakt
              {selected.size > 0 && <span style={{ color: "var(--accent)", marginLeft: 8 }}>· {selected.size} tanlangan</span>}
            </div>
          </div>
        </header>



        {/* Tabs */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5,
          background: "var(--surface2)", borderRadius: 14, padding: 4, marginBottom: 14,
        }}>
          {(["contacts","message","add"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px", borderRadius: 11, border: "none", cursor: "pointer",
              fontFamily: "Syne,sans-serif", fontSize: 12, fontWeight: 700,
              background: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "white" : "var(--muted)",
              transition: "all 0.2s",
            }}>
              {tab === "contacts" ? `Kontaktlar${selected.size > 0 ? ` (${selected.size})` : ""}` : tab === "message" ? "Xabar" : "+ Qo'shish"}
            </button>
          ))}
        </div>

        {/* CONTACTS TAB */}
        {activeTab === "contacts" && (
          <div style={card}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..."
                style={{
                  width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "11px 14px", color: "var(--text)",
                  fontFamily: "DM Sans,sans-serif", fontSize: 15, outline: "none",
                }}
              />
            </div>

            <div onClick={toggleAll} style={{
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
                <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>Yuklanmoqda...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>Topilmadi</div>
              ) : filtered.map(c => {
                const sel = selected.has(c.id);
                const color = c.color || COLORS[c.id % COLORS.length];
                return (
                  <div key={c.id} onClick={() => toggle(c.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer",
                    borderBottom: "1px solid rgba(37,37,53,0.7)",
                    background: sel ? "rgba(108,99,255,0.08)" : "transparent", position: "relative",
                  }}>
                    {sel && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--accent)", borderRadius: "0 3px 3px 0" }} />}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: color + "20", color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 15,
                      border: `1.5px solid ${sel ? color + "55" : "transparent"}`,
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
                    <button onClick={(e) => deleteContact(c.id, e)} style={{
                      background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)",
                      color: "#ff6b6b", borderRadius: 8, width: 30, height: 30,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0, fontSize: 14,
                    }}>✕</button>
                  </div>
                );
              })}
            </div>

            {selected.size > 0 && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
                <button onClick={() => setActiveTab("message")} style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: "var(--accent)", color: "white",
                  fontFamily: "Syne,sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Xabar yozishga o'tish →</button>
              </div>
            )}
          </div>
        )}

        {/* MESSAGE TAB */}
        {activeTab === "message" && (
          <div style={card}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)", display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)" }}>Xabar</span>
              <span style={{ marginLeft: "auto", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.4)", color: "var(--accent)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{message.length}/160</span>
            </div>
            <div style={{ padding: 14 }}>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="SMS matningizni yozing..." rows={5}
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", color: "var(--text)", fontFamily: "DM Sans,sans-serif", fontSize: 15, outline: "none", resize: "none", lineHeight: 1.6, minHeight: 120 }}
              />
            </div>
            {selContacts.length > 0 && (
              <div style={{ margin: "0 14px 14px", padding: "10px 12px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ color: "var(--muted)" }}>Yuboriladi: </span>
                {selContacts.map(c => <span key={c.id} style={{ color: "var(--accent)", marginRight: 6 }}>{c.name}</span>)}
              </div>
            )}
            <div style={{ padding: "0 14px 14px" }}>
              <button onClick={sendSMS} disabled={!canSend || sending} style={{
                width: "100%", padding: "16px", border: "none", borderRadius: 14,
                background: canSend ? "linear-gradient(135deg,#6c63ff,#8b5cf6)" : "var(--surface2)",
                color: canSend ? "white" : "var(--muted)",
                fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800,
                cursor: canSend ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: canSend ? "0 4px 24px rgba(108,99,255,0.4)" : "none",
              }}>
                {sending ? "Yuborilmoqda..." : `🚀 ${selected.size > 0 ? `${selected.size} ta kontaktga yuborish` : "Kontakt tanlang"}`}
              </button>
            </div>
          </div>
        )}

        {/* ADD TAB */}
        {activeTab === "add" && (
          <div style={card}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--muted)" }}>Yangi kontakt</span>
            </div>
            <form onSubmit={handleAdd} style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { val: newName, set: setNewName, ph: "Ism Familiya", type: "text" },
                { val: newPhone, set: setNewPhone, ph: "Telefon (+998...)", type: "tel" },
                { val: newRole, set: setNewRole, ph: "Lavozim (ixtiyoriy)", type: "text" },
              ].map(f => (
                <input key={f.ph} type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", color: "var(--text)", fontFamily: "DM Sans,sans-serif", fontSize: 15, outline: "none" }}
                />
              ))}
              <button type="submit" disabled={adding} style={{
                width: "100%", padding: "14px", border: "none", borderRadius: 12,
                background: "var(--accent)", color: "white",
                fontFamily: "Syne,sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4,
              }}>{adding ? "Saqlanmoqda..." : "Bazaga qo'shish 🌍"}</button>
            </form>
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "var(--surface2)", border: "1px solid var(--accent3)",
          color: "var(--accent3)", padding: "12px 20px", borderRadius: 14,
          fontSize: 14, fontWeight: 500, zIndex: 100, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}>{toast}</div>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 7, flexShrink: 0,
      border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
      background: checked ? "var(--accent)" : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s",
    }}>
      {checked && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
  );
}
