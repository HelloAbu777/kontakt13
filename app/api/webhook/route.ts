import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Supabase webhook formati: { type, table, record: { ... } }
  // Oddiy webhook formati: to'g'ridan-to'g'ri { phone, name, ... }
  const record = (payload.record ?? payload) as Record<string, unknown>;

  const phone = String(record.phone ?? record.tel ?? record.mobile ?? "").trim();
  const name  = String(record.name ?? record.full_name ?? "Noma'lum").trim();
  const role  = String(record.role ?? record.position ?? "").trim();

  if (!phone) {
    return NextResponse.json({ error: "Telefon raqam topilmadi" }, { status: 422 });
  }

  const COLORS = ["#6c63ff","#ff6b6b","#43e97b","#f7971e","#c471ed","#12c2e9","#f64f59"];
  const color  = String(record.color ?? COLORS[Math.floor(Math.random() * COLORS.length)]);

  const { data, error } = await supabase
    .from("contacts")
    .upsert({ name, phone, role, color }, { onConflict: "phone" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, contact: data });
}
