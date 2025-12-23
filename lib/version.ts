import packageJson from '../package.json';

export const APP_VERSION = packageJson.version;
export const APP_NAME = 'MSF Admin Portal';

export const getVersionInfo = () => ({
  version: APP_VERSION,
  name: APP_NAME,
  buildDate: process.env.BUILD_DATE || new Date().toISOString().split('T')[0],
  environment: process.env.NODE_ENV || 'development'
});