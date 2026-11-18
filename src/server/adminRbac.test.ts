import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessAdminSection,
  canModifyTargetAdmin,
  formatAdminAttribution,
  isValidInvitedAdminRole,
  normalizeAdminRole,
} from './adminRbac';

test('normalizeAdminRole strictly allows only super_admin and admin (rejects editor/moderator/legacy roles)', () => {
  assert.equal(normalizeAdminRole('super_admin'), 'super_admin');
  assert.equal(normalizeAdminRole('admin'), 'admin');
  assert.equal(normalizeAdminRole('editor'), null);
  assert.equal(normalizeAdminRole('moderator'), null);
  assert.equal(normalizeAdminRole('data_entry_admin'), null);
  assert.equal(normalizeAdminRole('reviewer_admin'), null);
  assert.equal(normalizeAdminRole(null), null);
});

test('isValidInvitedAdminRole restricts in-app invitations strictly to team admin', () => {
  assert.equal(isValidInvitedAdminRole('admin'), true);
  assert.equal(isValidInvitedAdminRole(undefined), true);
  assert.equal(isValidInvitedAdminRole('super_admin'), false);
  assert.equal(isValidInvitedAdminRole('editor'), false);
  assert.equal(isValidInvitedAdminRole('moderator'), false);
});

test('canAccessAdminSection grants operational tabs to both roles and Manage Admins strictly to super_admin', () => {
  const operationalTabs = [
    'overview',
    'institutions',
    'rankings',
    'circulars',
    'verification',
    'publications',
    'users',
    'help_support',
    'audit',
  ] as const;

  for (const tab of operationalTabs) {
    assert.equal(canAccessAdminSection('super_admin', tab), true);
    assert.equal(canAccessAdminSection('admin', tab), true);
  }

  assert.equal(canAccessAdminSection('super_admin', 'manage_admins'), true);
  assert.equal(canAccessAdminSection('admin', 'manage_admins'), false);
});

test('canModifyTargetAdmin protects super_admin from edit/demote/delete by any admin or super_admin', () => {
  const superAdminTarget = { id: 1, accountType: 'admin', adminRole: 'super_admin' };
  const teamAdminTarget = { id: 2, accountType: 'admin', adminRole: 'admin' };

  // No admin can ever modify super_admin
  const adminAttemptOnOwner = canModifyTargetAdmin(2, 'admin', superAdminTarget);
  assert.equal(adminAttemptOnOwner.allowed, false);
  assert.equal(adminAttemptOnOwner.status, 403);

  // Even super_admin cannot edit/demote/delete super_admin
  const ownerSelfModify = canModifyTargetAdmin(1, 'super_admin', superAdminTarget);
  assert.equal(ownerSelfModify.allowed, false);
  assert.equal(ownerSelfModify.status, 403);

  // Regular admin cannot modify another admin
  const adminOnOtherAdmin = canModifyTargetAdmin(3, 'admin', teamAdminTarget);
  assert.equal(adminOnOtherAdmin.allowed, false);
  assert.equal(adminOnOtherAdmin.status, 403);

  // Super Admin can manage team admins
  const ownerOnTeamAdmin = canModifyTargetAdmin(1, 'super_admin', teamAdminTarget);
  assert.equal(ownerOnTeamAdmin.allowed, true);
});

test('formatAdminAttribution formats logged-in admin fullName and email clearly', () => {
  assert.equal(
    formatAdminAttribution({ fullName: 'Nadia Rahman', email: 'nadia@dreamuniversity.edu.bd' }),
    'Nadia Rahman (nadia@dreamuniversity.edu.bd)'
  );
  assert.equal(
    formatAdminAttribution({ fullName: '', email: 'ops@dreamuniversity.edu.bd' }),
    'ops@dreamuniversity.edu.bd'
  );
});
