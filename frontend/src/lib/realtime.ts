/** Supabase Realtime (browser, anon key). Memanggil onChange setiap tabel queue_tickets berubah. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function subscribeQueueChanges(onChange: () => void): () => void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project")) return () => {}; // belum dikonfigurasi: polling saja

  if (!client) client = createClient(url, key);
  const c = client;
  const channel = c
    .channel("queue-tickets-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "queue_tickets" }, () => onChange())
    .subscribe();
  return () => {
    c.removeChannel(channel);
  };
}
