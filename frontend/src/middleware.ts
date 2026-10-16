import { NextResponse, type NextRequest } from "next/server";

/**
 * Melindungi dashboard petugas dan API antrean (berisi nama & HP pasien) dengan Basic Auth.
 * Browser menampilkan kotak login sekali; request fetch dari dashboard otomatis ikut terautentikasi.
 * Isi STAFF_USER dan STAFF_PASSWORD di .env.local dan di Vercel.
 */
export function middleware(req: NextRequest) {
  const user = process.env.STAFF_USER;
  const pass = process.env.STAFF_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Login petugas belum dikonfigurasi (isi STAFF_USER dan STAFF_PASSWORD)", { status: 503 });
    }
    return NextResponse.next(); // mode dev lokal: dibiarkan terbuka
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const i = decoded.indexOf(":");
      if (decoded.slice(0, i) === user && decoded.slice(i + 1) === pass) return NextResponse.next();
    } catch {
      /* jatuh ke 401 */
    }
  }
  return new NextResponse("Login petugas diperlukan", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Petugas PuskesmasPintar"' },
  });
}

export const config = { matcher: ["/dashboard/:path*", "/api/queue/:path*"] };
