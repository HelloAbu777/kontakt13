import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function sendTelegram(queueId: number, phones: string[], message: string, names: string[]) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const nameList = names.join(", ");
  const text = `📱 SMS yuborish so'rovi\n\n👥 Kimga: ${nameList}\n📞 Raqamlar: ${phones.join(", ")}\n\n💬 Xabar:\n${message}\n\n✅ Tasdiqlash uchun quyidagi tugmani bosing:`;

  const smsUri = `sms:${phones.join(";")}?body=${encodeURIComponent(message)}`;
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app"}/api/sms/confirm?id=${queueId}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [[
          { text: "📲 SMS Yuborish", url: smsUri },
          { text: "✅ Tasdiqlandi", callback_data: `confirm_${queueId}` },
        ]],
      },
    }),
  });
}

// POST /api/sms — kompyuterdan yuborish so'rovi
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

  const phones = contacts.map(c => c.phone);
  const names  = contacts.map(c => c.name);

  // Queue ga yozish
  const { data: queue, error: qErr } = await supabase
    .from("sms_queue")
    .insert({ phones, message, status: "pending" })
    .select()
    .single();

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  // Telegram ga xabar yuborish
  await sendTelegram(queue.id, phones, message, names);

  return NextResponse.json({ success: true, queued: true, count: contacts.length });
}

// GET /api/sms — log
export async function GET() {
  const { data, error } = await supabase
    .from("sms_logs")
    .select("id, phone, message, sent_at, contact_id, contacts(name, role)")
    .order("sent_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logs = (data ?? []).map((l: Record<string, unknown>) => {
    const c = l.contacts as { name?: string; role?: string } | null;
    return { ...l, name: c?.name ?? "", role: c?.role ?? "", contacts: undefined };
  });
  return NextResponse.json(logs);
}
