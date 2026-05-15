import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "DashCore CMS API",
    version: "1.0.0",
    baseUrl: "/api/v1",
    authentication: {
      headers: { "x-api-key": "dk_your_key_here", "x-api-secret": "your_secret_here" },
    },
    publicEndpoints: [
      { method: "GET", path: "/api/v1/status", description: "Health check (no auth)" },
      { method: "GET", path: "/api/v1/docs", description: "This documentation (no auth)" },
    ],
    endpoints: {
      apiKeys: [
        { method: "GET", path: "/api/v1/api-keys", description: "List all API keys", auth: "admin Bearer OR api-keys:manage" },
        { method: "POST", path: "/api/v1/api-keys", description: "Create new API key", auth: "admin Bearer OR api-keys:manage" },
        { method: "GET", path: "/api/v1/api-keys/:id", description: "Get API key details", auth: "admin Bearer OR api-keys:manage" },
        { method: "PATCH", path: "/api/v1/api-keys/:id", description: "Update API key", auth: "admin Bearer OR api-keys:manage" },
        { method: "DELETE", path: "/api/v1/api-keys/:id", description: "Delete API key", auth: "admin Bearer OR api-keys:manage" },
      ],
      cms: [
        { method: "GET", path: "/api/v1/cms", description: "List CMS instances (supports ?status, ?page, ?limit)", permission: "cms:read" },
        { method: "POST", path: "/api/v1/cms", description: "Create new CMS instance with auto-generated admin credentials", permission: "cms:write" },
        { method: "GET", path: "/api/v1/cms/:cmsId", description: "Get CMS details including users", permission: "cms:read" },
        { method: "PATCH", path: "/api/v1/cms/:cmsId", description: "Update CMS (name, domain, status, settings, tier)", permission: "cms:write" },
        { method: "DELETE", path: "/api/v1/cms/:cmsId", description: "Deactivate CMS (sets status to suspended)", permission: "cms:write" },
      ],
      license: [
        { method: "GET", path: "/api/v1/license/:cmsId", description: "Get license status (days remaining, expired)", permission: "cms:read" },
        { method: "PATCH", path: "/api/v1/license/:cmsId", description: "Update license. Actions: renew (with days), suspend, activate. Or set licenseExpiresAt/subscriptionTier/reminderSchedule directly", permission: "cms:write" },
      ],
      subscriptions: [
        { method: "GET", path: "/api/v1/subscriptions", description: "List all subscriptions with expiry info (supports ?status, ?expiring=true for 7-day window)", permission: "cms:read" },
      ],
      dns: [
        { method: "GET", path: "/api/v1/cms/:cmsId/dns", description: "Get DNS settings for a CMS", permission: "dns:read" },
        { method: "PATCH", path: "/api/v1/cms/:cmsId/dns", description: "Update domain and DNS settings", permission: "dns:write" },
      ],
      users: [
        { method: "GET", path: "/api/v1/cms/:cmsId/users", description: "List users for a CMS", permission: "users:read" },
        { method: "POST", path: "/api/v1/cms/:cmsId/users", description: "Create user (username, email, password, role)", permission: "users:write" },
        { method: "GET", path: "/api/v1/cms/:cmsId/users/:userId", description: "Get specific user", permission: "users:read" },
        { method: "PATCH", path: "/api/v1/cms/:cmsId/users/:userId", description: "Update user (password, email, role, active)", permission: "users:write" },
      ],
      server: [
        { method: "GET", path: "/api/v1/server/status", description: "System health: CPU, memory, uptime, CMS counts", permission: "server:read" },
        { method: "GET", path: "/api/v1/server/status/:id", description: "Detailed status for a specific CMS instance", permission: "server:read" },
      ],
      cron: [
        { method: "POST", path: "/api/v1/cron/license-check", description: "Process license expiry reminders and auto-suspend expired instances. Auth: x-cron-secret header", auth: "x-cron-secret" },
      ],
      health: [
        { method: "GET", path: "/api/v1/health", description: "Authenticated health check (DB connectivity, memory)", permission: "server:read" },
      ],
    },
    permissions: [
      "cms:read", "cms:write",
      "dns:read", "dns:write",
      "users:read", "users:write",
      "server:read",
      "api-keys:manage",
      "* (full access)",
    ],
  });
}
