import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { phones, message, names } = await req.json();
  if (!phones?.length || !message?.trim())
    return NextResponse.json({ error: "phones va message kerak" }, { status: 400 });

  const token    = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;
  const smsUrl  = `sms:${phones.join(",")}?body=${encodeURIComponent(message)}`;
  const phoneList = phones.map((p: string, i: number) => `${names?.[i] || "Noma'lum"}: ${p}`).join("\n");
  const text = `📱 SMS so'rovi\n\n💬 Xabar: ${message}\n\n📞 Kontaktlar:\n${phoneList}`;

  // SMS so'rovini bazaga saqlash
  const { data: smsData } = await supabase
    .from("sms_logs")
    .insert({
      phones: phones.join(","),
      message,
      status: "pending",
    })
    .select()
    .single();

  const smsId = smsData?.id || "unknown";

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "✅ Tasdiqlash",
              callback_data: `confirm_sms_${smsId}`,
            },
            {
              text: "❌ Bekor qilish",
              callback_data: `cancel_sms_${smsId}`,
            },
          ],
        ],
      },
    }),
  });

  const tgData = await tgRes.json();
  if (!tgData.ok) return NextResponse.json({ error: tgData.description }, { status: 500 });

  return NextResponse.json({ success: true });
}
