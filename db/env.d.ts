declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: R2Bucket;
    ADMIN_ACCESS_CODE?: string;
    ADMIN_SESSION_SECRET?: string;
    WHATSAPP_NUMBER?: string;
  }
}
