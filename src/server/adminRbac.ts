import type { AdminRole, AdminSectionId } from '../types/domain';

export function normalizeAdminRole(role: unknown): AdminRole | null {
  if (role === 'super_admin' || role === 'admin') {
    return role;
  }
  return null;
}

export function isValidInvitedAdminRole(role: unknown): role is 'admin' {
  // Only team 'admin' users can be invited in-app. Super Admin is strictly .env-controlled.
  return role === undefined || role === null || role === '' || role === 'admin';
}

export function formatAdminAttribution(actor: {
  fullName?: string | null;
  email?: string | null;
  uid?: string | null;
}): string {
  const name = actor.fullName?.trim();
  const email = actor.email?.trim() || actor.uid?.trim() || 'Admin';
  if (name && email && !name.toLowerCase().includes(email.toLowerCase())) {
    return `${name} (${email})`;
  }
  return name || email;
}

export function canAccessAdminSection(
  adminRole: AdminRole,
  section: AdminSectionId
): boolean {
  if (section === 'manage_admins') {
    return adminRole === 'super_admin';
  }
  return adminRole === 'super_admin' || adminRole === 'admin';
}

export function canModifyTargetAdmin(
  actorUserId: number,
  actorRole: AdminRole,
  targetUser: {
    id: number;
    accountType: string;
    adminRole: string | null;
  }
): { allowed: boolean; status: number; reason?: string } {
  if (targetUser.accountType === 'admin' && targetUser.adminRole === 'super_admin') {
    return {
      allowed: false,
      status: 403,
      reason: 'The Super Admin owner account is protected and cannot be edited, demoted, or deleted.',
    };
  }

  if (targetUser.id === actorUserId) {
    return {
      allowed: false,
      status: 400,
      reason: 'You cannot modify or remove your own active administrator account.',
    };
  }

  if (actorRole !== 'super_admin') {
    return {
      allowed: false,
      status: 403,
      reason: 'Only the Super Admin can manage administrator accounts.',
    };
  }

  return { allowed: true, status: 200 };
}
