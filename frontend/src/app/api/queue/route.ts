import { NextResponse } from "next/server";
import { getTickets, updateTicketStatus } from "@/lib/db";
import { registerPatient } from "@/lib/registration";

export const dynamic = "force-dynamic";

// GET /api/queue?puskesmasId=...  (dilindungi login petugas lewat middleware.ts)
export async function GET(req: Request) {
  try {
    const puskesmasId = new URL(req.url).searchParams.get("puskesmasId") || undefined;
    return NextResponse.json({ tickets: await getTickets(puskesmasId) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST = pasien walk-in yang diinput petugas
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await registerPatient(body, body.queueType === "ONLINE" ? "ONLINE" : "WALK_IN");
    return NextResponse.json({ ticket: result.ticket, triage: result.triage, simulation: result.simulation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH = petugas mengubah status tiket
export async function PATCH(req: Request) {
  try {
    const { ticketId, status, assignedCounter } = await req.json();
    if (!ticketId || !status) {
      return NextResponse.json({ error: "ticketId dan status wajib diisi" }, { status: 400 });
    }
    const updated = await updateTicketStatus(ticketId, status, assignedCounter);
    if (!updated) return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ ticket: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
