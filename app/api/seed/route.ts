import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import contactsJson from "@/contacts.json";

export async function GET() {
  const { error } = await supabase
    .from("contacts")
    .upsert(contactsJson, { onConflict: "phone" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: contactsJson.length });
}
git 