import { describe, it, expect } from '@jest/globals';
import {
  resolveRoleFromAccountType,
  UserRole,
  PUBLIC_ACCOUNT_TYPES,
} from '../constants/userRoles';

describe('userRoles', () => {
  it('maps public account types to internal roles', () => {
    expect(resolveRoleFromAccountType('student')).toBe(UserRole.STUDENT);
    expect(resolveRoleFromAccountType('consultant')).toBe(UserRole.CONSULTANT);
    expect(resolveRoleFromAccountType('hiring_manager')).toBe(UserRole.RECRUITER);
  });

  it('rejects admin and other privileged roles', () => {
    expect(resolveRoleFromAccountType('admin')).toBeNull();
    expect(resolveRoleFromAccountType('recruiter')).toBeNull();
    expect(resolveRoleFromAccountType('')).toBeNull();
  });

  it('only exposes student, consultant, and hiring_manager for public signup', () => {
    expect(PUBLIC_ACCOUNT_TYPES).toEqual(['student', 'consultant', 'hiring_manager']);
    expect(PUBLIC_ACCOUNT_TYPES).not.toContain('admin');
  });
});
