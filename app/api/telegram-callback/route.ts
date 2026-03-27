import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const callbackQuery = payload.callback_query;

  if (!callbackQuery) {
    return NextResponse.json({ ok: true });
  }

  const { data, id } = callbackQuery;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Callback data: "confirm_sms_123" yoki "cancel_sms_123"
  if (data?.startsWith("confirm_sms_")) {
    const smsId = data.replace("confirm_sms_", "");

    // SMS so'rovini bazadan olish
    const { data: smsData } = await supabase
      .from("sms_logs")
      .select("*")
      .eq("id", smsId)
      .single();

    if (smsData) {
      const phones = smsData.phones.split(",");
      const message = smsData.message;
      const smsUrl = `sms:${phones.join(",")}?body=${encodeURIComponent(message)}`;

      // Telegram xabarni tahrirlash - SMS link bilan
      await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: id,
          text: `✅ Tasdiqlandi!\n\n<a href="${smsUrl}">📲 SMS yuborish</a>`,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [] },
        }),
      });

      // Bazada status ni "confirmed" qilish
      await supabase
        .from("sms_logs")
        .update({ status: "confirmed" })
        .eq("id", smsId);
    }
  } else if (data?.startsWith("cancel_sms_")) {
    const smsId = data.replace("cancel_sms_", "");

    // Telegram xabarni tahrirlash
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: id,
        text: "❌ Bekor qilindi",
        reply_markup: { inline_keyboard: [] },
      }),
    });

    // Bazada status ni "cancelled" qilish
    await supabase
      .from("sms_logs")
      .update({ status: "cancelled" })
      .eq("id", smsId);
  }

  return NextResponse.json({ ok: true });
}
