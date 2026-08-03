import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel serverless entry — all routes rewrite here (see vercel.json).
 * Uses the Nest build output from `npm run build` / vercel buildCommand.
 */
// Nest emits CommonJS into dist/
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getVercelExpressApp } = require('../dist/create-app') as {
  getVercelExpressApp: () => Promise<
    (req: VercelRequest, res: VercelResponse) => void
  >;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getVercelExpressApp();
  return expressApp(req, res);
}
