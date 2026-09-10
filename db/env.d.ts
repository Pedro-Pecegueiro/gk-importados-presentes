declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: R2Bucket;
    ADMIN_ACCESS_CODE?: string;
    WHATSAPP_NUMBER?: string;
  }
}
