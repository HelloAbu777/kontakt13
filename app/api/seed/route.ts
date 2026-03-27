import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import contactsJson from "@/contacts.json";

export async function GET() {
  // sms_logs jadvali yaratish
  const { error: createError } = await supabase.rpc("create_sms_logs_table", {}, { head: true });
  
  // Yoki to'g'ridan-to'g'ri insert qilish (jadvalni avtomatik yaratadi)
  const { error: insertError } = await supabase
    .from("sms_logs")
    .insert({
      phones: "test",
      message: "test",
      status: "test",
    })
    .select();

  // Kontaktlarni qo'shish
  const { error } = await supabase
    .from("contacts")
    .upsert(contactsJson, { onConflict: "phone" });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: contactsJson.length });
}
