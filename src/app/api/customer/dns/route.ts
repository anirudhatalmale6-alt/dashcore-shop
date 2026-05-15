import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/customerAuth";

const CMS_BACKEND_URL = process.env.CMS_BACKEND_URL || "https://backend.dashcore.eu";
const CMS_API_KEY = process.env.CMS_API_KEY || "";
const CMS_API_SECRET = process.env.CMS_API_SECRET || "";

/**
 * GET /api/customer/dns
 * Returns CMS instances owned by this customer with their DNS info.
 * Parses CMS IDs from order notes and fetches details from the backend.
 */
export async function GET(req: NextRequest) {
  const user = getCustomerFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Find all paid orders with CMS instances for this customer
    const orders = await prisma.order.findMany({
      where: {
        customerEmail: user.email,
        paymentStatus: "paid",
        notes: { contains: "[CMS Auto-Created]" },
      },
      select: { orderId: true, tierName: true, notes: true },
    });

    const instances = [];
    for (const order of orders) {
      const match = order.notes?.match(
        /\[CMS Auto-Created\] ID: ([^\s|]+)\s*\|\s*Domain: ([^\s|]+)/
      );
      if (!match) continue;

      const cmsId = match[1];
      const originalDomain = match[2];

      // Fetch current CMS detail from backend to get live dns/subdomain
      try {
        const res = await fetch(`${CMS_BACKEND_URL}/api/v1/cms?unique_id=${cmsId}`, {
          headers: {
            "x-api-key": CMS_API_KEY,
            "x-api-secret": CMS_API_SECRET,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const cmsList = data.data || [];
        const cms = Array.isArray(cmsList)
          ? cmsList.find((c: { unique_id: string }) => c.unique_id === cmsId)
          : null;

        if (cms) {
          const autoGenDns = cms.subdomain ? `${cms.subdomain}.dashcore.eu` : "";
          const customDomain = cms.dns && cms.dns !== autoGenDns ? cms.dns : "";
          instances.push({
            cmsId,
            backendId: cms.id,
            orderId: order.orderId,
            tierName: order.tierName,
            subdomain: cms.subdomain || "",
            autoDns: autoGenDns,
            customDomain,
            currentDns: cms.dns || originalDomain,
          });
        } else {
          // Fallback: couldn't fetch live data, use what we have
          const subdomain = originalDomain.replace(/\.dashcore\.eu$/, "");
          instances.push({
            cmsId,
            backendId: null,
            orderId: order.orderId,
            tierName: order.tierName,
            subdomain,
            autoDns: originalDomain,
            customDomain: "",
            currentDns: originalDomain,
          });
        }
      } catch {
        // Backend fetch failed, use parsed data
        const subdomain = originalDomain.replace(/\.dashcore\.eu$/, "");
        instances.push({
          cmsId,
          backendId: null,
          orderId: order.orderId,
          tierName: order.tierName,
          subdomain,
          autoDns: originalDomain,
          customDomain: "",
          currentDns: originalDomain,
        });
      }
    }

    return NextResponse.json(instances);
  } catch (err) {
    console.error("Customer DNS fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/customer/dns
 * Update custom domain for a customer's CMS instance.
 * Body: { cmsId: string, customDomain: string }
 * If customDomain is empty, resets to auto-generated DNS.
 */
export async function PATCH(req: NextRequest) {
  const user = getCustomerFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { cmsId, customDomain } = body;

    if (!cmsId) {
      return NextResponse.json({ error: "cmsId is required" }, { status: 400 });
    }

    // Verify this customer owns this CMS instance
    const ownerOrder = await prisma.order.findFirst({
      where: {
        customerEmail: user.email,
        paymentStatus: "paid",
        notes: { contains: cmsId },
      },
    });

    if (!ownerOrder) {
      return NextResponse.json({ error: "CMS instance not found or not owned by you" }, { status: 403 });
    }

    // Fetch the CMS backend ID
    const listRes = await fetch(`${CMS_BACKEND_URL}/api/v1/cms?unique_id=${cmsId}`, {
      headers: {
        "x-api-key": CMS_API_KEY,
        "x-api-secret": CMS_API_SECRET,
        "Content-Type": "application/json",
      },
    });
    const listData = await listRes.json();
    const cmsList = listData.data || [];
    const cms = Array.isArray(cmsList)
      ? cmsList.find((c: { unique_id: string }) => c.unique_id === cmsId)
      : null;

    if (!cms) {
      return NextResponse.json({ error: "CMS instance not found on backend" }, { status: 404 });
    }

    // Determine what DNS to set
    const autoGenDns = cms.subdomain ? `${cms.subdomain}.dashcore.eu` : cms.dns;
    const newDns = customDomain?.trim() || autoGenDns;

    // Basic domain validation
    if (customDomain?.trim()) {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(customDomain.trim())) {
        return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
      }
    }

    // Update DNS via backend API
    const updateRes = await fetch(`${CMS_BACKEND_URL}/api/v1/dns/${cms.id}`, {
      method: "PATCH",
      headers: {
        "x-api-key": CMS_API_KEY,
        "x-api-secret": CMS_API_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dns: newDns }),
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return NextResponse.json(
        { error: `Backend error: ${updateData.message || updateRes.status}` },
        { status: updateRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      dns: newDns,
      customDomain: customDomain?.trim() || "",
      autoDns: autoGenDns,
    });
  } catch (err) {
    console.error("Customer DNS update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
