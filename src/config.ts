const ACCOUNT_ID = process.env.ACCOUNT_ID;

const {
  VERCEL_ENV,
  VERCEL_URL,
  VERCEL_BRANCH_URL,
  VERCEL_PROJECT_PRODUCTION_URL,
} = process.env;

const PLUGIN_URL = (() => {
  switch (VERCEL_ENV) {
    case "production":
      return `https://${VERCEL_PROJECT_PRODUCTION_URL}`;
    case "preview":
      return `https://${VERCEL_BRANCH_URL || VERCEL_URL}`;
    default:
      return `http://localhost:${process.env.PORT || 3000}`;
  }
})();

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error(`${key} is not set`);
  }
  return value;
}

const SUPPORTED_NETWORKS = ["solana"];

export { ACCOUNT_ID, PLUGIN_URL, SUPPORTED_NETWORKS };
