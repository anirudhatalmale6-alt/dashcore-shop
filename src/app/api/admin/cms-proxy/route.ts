import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminAuth";

const BACKEND_URL = process.env.CMS_BACKEND_URL || "https://backend.dashcore.eu";
const API_KEY = process.env.CMS_API_KEY || "";
const API_SECRET = process.env.CMS_API_SECRET || "";

async function proxyToBackend(path: string, method: string, body?: unknown) {
  const headers: Record<string, string> = {
    "x-api-key": API_KEY,
    "x-api-secret": API_SECRET,
    "Content-Type": "application/json",
  };

  const opts: RequestInit = { method, headers };
  if (body && method !== "GET") opts.body = JSON.stringify(body);

  const res = await fetch(`${BACKEND_URL}${path}`, opts);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/api/v1/cms";
  return proxyToBackend(path, "GET");
}

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/api/v1/cms";
  const body = await req.json();
  return proxyToBackend(path, "POST", body);
}

export async function PATCH(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/api/v1/cms";
  const body = await req.json();
  return proxyToBackend(path, "PATCH", body);
}

export async function DELETE(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/api/v1/cms";
  return proxyToBackend(path, "DELETE");
}
