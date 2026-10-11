/**
 * Runtime configuration, validated at startup.
 */

const DEFAULT_PORT = 5000;
const DEFAULT_DEV_CLIENT_ORIGIN = 'http://localhost:5173';
const DEFAULT_ENGINE_URL = 'http://127.0.0.1:8000';

function parseInteger(name, value, { min, max, fallback }) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

function parseOrigins(value, isProduction) {
  if (!value) {
    if (isProduction) throw new Error('CLIENT_ORIGIN must be set when NODE_ENV=production.');
    return [DEFAULT_DEV_CLIENT_ORIGIN];
  }
  return value.split(',').map((origin) => {
    const trimmed = origin.trim();
    if (trimmed === '*') return '*';
    try {
      return new URL(trimmed).origin;
    } catch {
      try {
        return new URL(`https://${trimmed}`).origin;
      } catch {
        return trimmed;
      }
    }
  });
}

export function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  return Object.freeze({
    nodeEnv,
    isProduction,
    port: parseInteger('PORT', source.PORT, { min: 1, max: 65535, fallback: DEFAULT_PORT }),
    clientOrigins: parseOrigins(source.CLIENT_ORIGIN, isProduction),
    engineUrl: (source.ENGINE_URL || DEFAULT_ENGINE_URL).replace(/\/+$/, ''),
    trustProxy: parseInteger('TRUST_PROXY', source.TRUST_PROXY, { min: 0, max: 10, fallback: 0 }),
    openaiApiKey: source.OPENAI_API_KEY || null,
    openaiModel: source.OPENAI_MODEL || 'gpt-4o-mini',
  });
}
