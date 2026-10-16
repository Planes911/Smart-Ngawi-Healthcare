import { NextResponse } from "next/server";
import { registerPatient } from "@/lib/registration";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const result = await registerPatient(await req.json(), "ONLINE");
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuat booking" }, { status: 400 });
  }
}
