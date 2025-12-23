export const APP_VERSION = '1.3.0';
export const APP_NAME = 'MSF Admin Portal';

export const getVersionInfo = () => ({
  version: APP_VERSION,
  name: APP_NAME,
  buildDate: process.env.BUILD_DATE || new Date().toISOString().split('T')[0],
  environment: process.env.NODE_ENV || 'development'
});