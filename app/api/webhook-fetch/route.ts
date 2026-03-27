import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const COLORS = ["#6c63ff","#ff6b6b","#43e97b","#f7971e","#c471ed","#12c2e9","#f64f59"];

const PHONE_KEYS = ["phone", "telefon", "tel", "mobile", "raqam", "phone_number", "msisdn", "contact"];
const NAME_KEYS  = ["name", "fullname", "full_name", "fullName", "ism", "client_name", "username", "first_name", "lead_name", "fio"];

function extractContacts(data: unknown, results: { phone: string; name: string }[] = []) {
  if (Array.isArray(data)) {
    for (const item of data) extractContacts(item, results);
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Butun object va nested lardan phone va name topamiz
    function findValue(o: Record<string, unknown>, keys: string[]): string {
      for (const key of Object.keys(o)) {
        const k = key.toLowerCase();
        const val = o[key];
        if (keys.some(nk => k === nk || k.includes(nk))) {
          if (typeof val === "string" && val.trim()) return val.trim();
          if (typeof val === "number") return String(val);
        }
        if (val && typeof val === "object" && !Array.isArray(val)) {
          const found = findValue(val as Record<string, unknown>, keys);
          if (found) return found;
        }
      }
      return "";
    }

    const phone = findValue(obj, PHONE_KEYS);
    const name  = findValue(obj, NAME_KEYS);

    if (phone) {
      results.push({ phone, name: name || "Noma'lum" });
    }
  }
  return results;
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL kerak" }, { status: 400 });

  let raw: unknown;
  try {
    const res = await fetch(url);
    raw = await res.json();
  } catch {
    return NextResponse.json({ error: "URL dan ma'lumot olib bo'lmadi" }, { status: 422 });
  }

  const contacts = extractContacts(raw);

  if (!contacts.length)
    return NextResponse.json({ error: "Telefon raqam topilmadi" }, { status: 422 });

  // Dublikatlarni olib tashlash
  const seen = new Set<string>();
  const unique = contacts.filter(c => {
    if (seen.has(c.phone)) return false;
    seen.add(c.phone);
    return true;
  });

  const rows = unique.map(c => ({
    phone: c.phone,
    name:  c.name,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const { error } = await supabase.from("contacts").upsert(rows, { onConflict: "phone" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, count: rows.length });
}
