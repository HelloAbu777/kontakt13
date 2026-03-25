import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/contacts
export async function GET() {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/contacts
export async function POST(req: NextRequest) {
  const { name, phone, role = "", color = "#6c63ff" } = await req.json();
  if (!name || !phone)
    return NextResponse.json({ error: "name va phone majburiy" }, { status: 400 });

  const { data, error } = await supabase
    .from("contacts")
    .insert({ name, phone, role, color })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/contacts?id=1
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id kerak" }, { status: 400 });
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
