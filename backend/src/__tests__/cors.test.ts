import { isOriginAllowed, getAllowedOrigins } from '../config/cors';

describe('CORS configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_ALLOW_LOCALHOST;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('allows requests with no Origin (native mobile apps)', () => {
    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it('allows deployed Vercel dashboard and API origins', () => {
    expect(isOriginAllowed('https://tray-dashboard-eight.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://tray-ecru.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://tray-ai-backend.vercel.app')).toBe(true);
  });

  it('blocks unknown browser origins in production', () => {
    expect(isOriginAllowed('https://evil.com')).toBe(false);
  });

  it('allows localhost when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('http://localhost:4000')).toBe(true);
  });

  it('allows LAN IPs in development for Metro / device testing', () => {
    process.env.NODE_ENV = 'development';
    expect(isOriginAllowed('http://192.168.1.42:8081')).toBe(true);
    expect(isOriginAllowed('exp://192.168.1.42:8081')).toBe(true);
  });

  it('allows ngrok in development', () => {
    process.env.NODE_ENV = 'development';
    expect(isOriginAllowed('https://semiexpansible-unescheated-genoveva.ngrok-free.dev')).toBe(
      true,
    );
  });

  it('merges CORS_ALLOWED_ORIGINS extras', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://custom-preview.vercel.app';
    expect(getAllowedOrigins()).toContain('https://custom-preview.vercel.app');
    expect(isOriginAllowed('https://custom-preview.vercel.app')).toBe(true);
  });
});
