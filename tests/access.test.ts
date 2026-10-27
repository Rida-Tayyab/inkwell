import { describe, it, expect } from 'vitest';
import { can, type Action } from '../lib/access';

describe('Access Control Matrix', () => {
  const actions: Action[] = ['read', 'edit', 'rename', 'share', 'delete'];

  describe('Owner permissions', () => {
    it('should allow all actions', () => {
      actions.forEach((action) => {
        expect(can('owner', action)).toBe(true);
      });
    });
  });

  describe('Editor permissions', () => {
    it('should allow read, edit, rename', () => {
      expect(can('editor', 'read')).toBe(true);
      expect(can('editor', 'edit')).toBe(true);
      expect(can('editor', 'rename')).toBe(true);
    });

    it('should deny share and delete', () => {
      expect(can('editor', 'share')).toBe(false);
      expect(can('editor', 'delete')).toBe(false);
    });
  });

  describe('Viewer permissions', () => {
    it('should only allow read', () => {
      expect(can('viewer', 'read')).toBe(true);
      actions.filter((a) => a !== 'read').forEach((action) => {
        expect(can('viewer', action)).toBe(false);
      });
    });
  });

  describe('No access (null)', () => {
    it('should deny all actions', () => {
      actions.forEach((action) => {
        expect(can(null, action)).toBe(false);
      });
    });
  });
});
