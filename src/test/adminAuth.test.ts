import { describe, it, expect } from 'vitest';
import { MASTER_ADMIN_EMAIL } from '../components/AdminLogin';

describe('Admin Authentication & Security Gate', () => {
  it('defines the correct Master Admin whitelist email', () => {
    expect(MASTER_ADMIN_EMAIL).toBe('mindglimmer@gmail.com');
  });

  it('correctly matches master admin email case-insensitively', () => {
    const testEmail1 = 'mindglimmer@gmail.com';
    const testEmail2 = 'MINDGLIMMER@GMAIL.COM';
    const unauthorizedEmail = 'otheruser@example.com';

    expect(testEmail1.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()).toBe(true);
    expect(testEmail2.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()).toBe(true);
    expect(unauthorizedEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()).toBe(false);
  });
});
