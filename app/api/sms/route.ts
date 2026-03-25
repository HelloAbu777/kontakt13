import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/sms
export async function POST(req: NextRequest) {
  const { contactIds, message } = await req.json() as {
    contactIds: number[];
    message: string;
  };

  if (!contactIds?.length || !message?.trim())
    return NextResponse.json({ error: "contactIds va message kerak" }, { status: 400 });

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("id, name, phone")
    .in("id", contactIds);

  if (error || !contacts?.length)
    return NextResponse.json({ error: "Kontaktlar topilmadi" }, { status: 404 });

  // SMS logini saqlash
  const logs = contacts.map((c) => ({
    contact_id: c.id,
    phone: c.phone,
    message,
  }));
  await supabase.from("sms_logs").insert(logs);

  const phones = contacts.map((c) => c.phone).join(";");
  const smsUri = `sms:${phones}?body=${encodeURIComponent(message)}`;

  return NextResponse.json({ success: true, count: contacts.length, smsUri, contacts });
}

// GET /api/sms
export async function GET() {
  const { data, error } = await supabase
    .from("sms_logs")
    .select("*, contacts(name, role)")
    .order("sent_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
