// Runtime configuration. Secrets such as CEREBRAS_API_KEY are read only where needed, never exported here.
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export default env;
