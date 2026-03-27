import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export const loadEnv = () => {
  const backendEnvPath = path.resolve(process.cwd(), '.env');
  const rootEnvPath = path.resolve(process.cwd(), '..', '.env');

  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
    return { loadedFrom: backendEnvPath };
  }

  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
    return { loadedFrom: rootEnvPath };
  }

  dotenv.config();
  return { loadedFrom: null };
};

