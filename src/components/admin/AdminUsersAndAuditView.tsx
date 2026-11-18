import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  History,
  KeyRound,
  Lock,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/authFetch';
import type { AdminRole, AuditLogRecord, UserAccountRecord } from '../../types/domain';

export interface StudentAnalyticsSummary {
  totalStudents: number;
  activeStudents: number;
  completedProfiles: number;
  secondTimers: number;
  groupCounts: Record<string, number>;
}

interface AdminUsersViewProps {
  users: UserAccountRecord[];
  analytics: StudentAnalyticsSummary | null;
  onRefresh: () => Promise<void>;
}

export function AdminUsersView({ users, analytics, onRefresh }: AdminUsersViewProps) {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filteredStudents = users.filter((u) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  });

  const handleToggleActive = async (targetUser: UserAccountRecord) => {
    setFeedback(null);
    setBusyId(targetUser.id);
    try {
      const res = await apiFetch(`/api/admin/users/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !targetUser.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Status update failed.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `${targetUser.fullName} এর স্ট্যাটাস হালনাগাদ হয়েছে।`
            : `Updated account status for ${targetUser.fullName}.`,
      });
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Status update failed.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const summary = analytics ?? {
    totalStudents: users.length,
    activeStudents: users.filter((u) => u.isActive).length,
    completedProfiles: 0,
    secondTimers: 0,
    groupCounts: {},
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-5">
        <div className="flex items-start gap-2.5">
          <Users className="mt-1 h-5 w-5 text-[#00796B] dark:text-[#26A69A] shrink-0" aria-hidden="true" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
              {lang === 'bn' ? 'ব্যবহারকারী অ্যানালিটিক্স ও শিক্ষার্থী তালিকা' : 'User Analytics & Student Directory'}
            </h1>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn'
                ? 'নিবন্ধিত শিক্ষার্থীদের পরিসংখ্যান, প্রোফাইল সম্পূর্ণতার হার এবং অ্যাকাউন্ট অবস্থা পর্যবেক্ষণ করুন।'
                : 'Monitor registered student metrics, profile completion, HSC group distribution, and account access.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? 'মোট শিক্ষার্থী' : 'Total Students'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
              {summary.totalStudents}
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Students'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#2E7D32] dark:text-[#66BB6A]">
              {summary.activeStudents}
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? 'প্রোফাইল সম্পন্ন' : 'Profiles Completed'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#00796B] dark:text-[#26A69A]">
              {summary.completedProfiles}
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? 'সেকেন্ড টাইমার' : 'Second Timers'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#E65100] dark:text-[#FFA726]">
              {summary.secondTimers}
            </p>
          </div>
        </div>

        {Object.keys(summary.groupCounts).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? 'এইচএসসি বিভাগ:' : 'HSC Group Breakdown:'}
            </span>
            {Object.entries(summary.groupCounts).map(([group, count]) => (
              <span
                key={group}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1 font-medium text-[#0F172A] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC]"
              >
                <span>{group}</span>
                <span className="font-mono font-bold tabular-nums text-[#00796B] dark:text-[#26A69A]">
                  {count}
                </span>
              </span>
            ))}
          </div>
        )}

        <div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'শিক্ষার্থীর নাম, ইমেইল বা ফোন দিয়ে খুঁজুন...'
                : 'Search students by name, email, or phone...'
            }
            className="h-10 w-full max-w-md rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
          />
        </div>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-xs font-medium ${
              feedback.type === 'error'
                ? 'border-[#D32F2F]/35 bg-[#D32F2F]/10 text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]'
                : 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden dark:border-[#222222] dark:bg-[#121212]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Account</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn' ? 'কোনো শিক্ষার্থী পাওয়া যায়নি।' : 'No matching student accounts found.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{u.fullName}</p>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        {u.email || u.phone || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#475569] dark:text-[#94A3B8]">
                      student
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          u.isActive
                            ? 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
                            : 'border-[#D32F2F]/35 bg-[#D32F2F]/10 text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#475569] dark:text-[#94A3B8] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => void handleToggleActive(u)}
                        className="inline-flex h-8 items-center rounded-md border border-[#E2E8F0] px-2.5 font-semibold text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50 dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                      >
                        {u.isActive
                          ? lang === 'bn'
                            ? 'নিষ্ক্রিয় করুন'
                            : 'Deactivate'
                          : lang === 'bn'
                          ? 'সক্রিয় করুন'
                          : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface AdminManageAdminsViewProps {
  adminRole: AdminRole;
  currentUserId: number;
  admins: UserAccountRecord[];
  onRefresh: () => Promise<void>;
}

export function AdminManageAdminsView({
  adminRole,
  currentUserId,
  admins,
  onRefresh,
}: AdminManageAdminsViewProps) {
  const { lang } = useLanguage();
  const isSuperAdmin = adminRole === 'super_admin';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyAdminId, setBusyAdminId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-[#F57C00]/35 bg-[#F57C00]/10 p-6 text-sm text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]">
        {lang === 'bn'
          ? 'এই বিভাগটি শুধুমাত্র সুপার অ্যাডমিনের (.env মালিক) জন্য সংরক্ষিত।'
          : 'This section is strictly restricted to the Super Admin owner account.'}
      </div>
    );
  }

  const handleInviteAdmin = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          temporaryPassword,
          adminRole: 'admin',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to invite admin user.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `নতুন টিম অ্যাডমিন (${data.user.email}) যুক্ত হয়েছে।`
            : `Invited team Admin account for ${data.user.email}.`,
      });
      setFullName('');
      setEmail('');
      setTemporaryPassword('');
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to invite administrator.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdminAccess = async (target: UserAccountRecord) => {
    setFeedback(null);
    setBusyAdminId(target.id);
    try {
      const res = await apiFetch(`/api/admin/admins/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !target.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update admin access.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `${target.email} এর অ্যাক্সেস ${!target.isActive ? 'সক্রিয়' : 'বাতিল'} করা হয়েছে।`
            : `${!target.isActive ? 'Restored' : 'Revoked'} admin access for ${target.email}.`,
      });
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update admin access.',
      });
    } finally {
      setBusyAdminId(null);
    }
  };

  const handleResetPasswordSubmit = async (target: UserAccountRecord) => {
    if (newTempPassword.trim().length < 6) {
      setFeedback({
        type: 'error',
        text:
          lang === 'bn'
            ? 'অস্থায়ী পাসওয়ার্ড/OTP কমপক্ষে ৬ অক্ষরের হতে হবে।'
            : 'Temporary password/OTP must be at least 6 characters.',
      });
      return;
    }
    setFeedback(null);
    setBusyAdminId(target.id);
    try {
      const res = await apiFetch(`/api/admin/admins/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temporaryPassword: newTempPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset temporary password.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `${target.email} এর অস্থায়ী পাসওয়ার্ড হালনাগাদ হয়েছে।`
            : `Updated temporary password/OTP for ${target.email}.`,
      });
      setResetPasswordId(null);
      setNewTempPassword('');
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update password.',
      });
    } finally {
      setBusyAdminId(null);
    }
  };

  const handleRemoveAdmin = async (target: UserAccountRecord) => {
    setFeedback(null);
    setBusyAdminId(target.id);
    try {
      const res = await apiFetch(`/api/admin/admins/${target.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove admin.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `অ্যাডমিন (${target.email}) অপসারণ করা হয়েছে।`
            : `Removed admin account (${target.email}).`,
      });
      setConfirmRemoveId(null);
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to remove admin.',
      });
    } finally {
      setBusyAdminId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-1 h-5 w-5 text-[#00796B] dark:text-[#26A69A] shrink-0" aria-hidden="true" />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
                {lang === 'bn' ? 'অ্যাডমিন টিম ব্যবস্থাপনা' : 'Manage Admins'}
              </h1>
              <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn'
                  ? 'শুধুমাত্র সুপার অ্যাডমিন (.env থেকে নির্ধারিত) নতুন টিম অ্যাডমিন যুক্ত করতে, অ্যাক্সেস বাতিল করতে বা অপসারণ করতে পারবেন।'
                  : 'Only the environment-controlled Super Admin (.env) can invite team Admin accounts, revoke access, or remove admins.'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00796B]/30 bg-[#00796B]/10 px-3 py-1.5 text-xs font-semibold text-[#00796B] dark:border-[#26A69A]/35 dark:bg-[#26A69A]/12 dark:text-[#26A69A] shrink-0">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            {lang === 'bn' ? 'টু-টিয়ার RBAC: super_admin · admin' : 'Two-Tier RBAC: super_admin · admin'}
          </span>
        </div>

        {feedback && (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-xs font-medium ${
              feedback.type === 'error'
                ? 'border-[#D32F2F]/35 bg-[#D32F2F]/10 text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]'
                : 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <form
          onSubmit={handleInviteAdmin}
          className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 dark:border-[#222222] dark:bg-[#0A0A0A] space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldPlus className="h-4 w-4 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
              <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn' ? 'নতুন অ্যাডমিন যুক্ত করুন' : 'Add New Team Admin'}
              </h3>
            </div>
            <span className="rounded-md border border-[#E2E8F0] bg-white px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[#475569] dark:border-[#222222] dark:bg-[#121212] dark:text-[#94A3B8]">
              Role: admin
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn' ? 'পূর্ণ নাম *' : 'Full Name *'}
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Nusrat Jahan"
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn' ? 'ইমেইল ঠিকানা *' : 'Email Address *'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@dreamuniversity.edu.bd"
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn' ? 'অস্থায়ী পাসওয়ার্ড / OTP *' : 'Temporary Password / OTP *'}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                placeholder={lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn'
                ? 'টিম অ্যাডমিনরা সার্কুলার, বিশ্ববিদ্যালয় তথ্য, র‍্যাঙ্কিং এবং অ্যানালিটিক্স পরিচালনা করতে পারবেন, তবে অ্যাডমিন যোগ/বাতিল করতে পারবেন না।'
                : 'Invited admins can manage circulars, institutions, rankings, and user analytics, but cannot access Manage Admins.'}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
            >
              {saving
                ? lang === 'bn'
                  ? 'যুক্ত হচ্ছে...'
                  : 'Adding Admin...'
                : lang === 'bn'
                ? 'অ্যাডমিন যুক্ত করুন'
                : 'Add Team Admin'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden dark:border-[#222222] dark:bg-[#121212]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
              <tr>
                <th className="px-4 py-3 font-semibold">Administrator</th>
                <th className="px-4 py-3 font-semibold">Tier Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
              {admins.map((admin) => {
                const isOwner = admin.adminRole === 'super_admin';
                const isSelf = admin.id === currentUserId;
                const isBusy = busyAdminId === admin.id;
                return (
                  <tr key={admin.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {admin.fullName}
                      </p>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        {admin.email || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                          isOwner
                            ? 'border-[#00796B]/30 bg-[#00796B]/10 text-[#00796B] dark:border-[#26A69A]/35 dark:bg-[#26A69A]/12 dark:text-[#26A69A]'
                            : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]'
                        }`}
                      >
                        {isOwner ? 'super_admin' : 'admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          admin.isActive
                            ? 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
                            : 'border-[#D32F2F]/35 bg-[#D32F2F]/10 text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]'
                        }`}
                      >
                        {admin.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Active
                          </>
                        ) : (
                          'Revoked'
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isOwner || isSelf ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
                          <Lock className="h-3 w-3 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
                          {lang === 'bn' ? 'সুরক্ষিত মালিক (.env)' : 'Protected Owner (.env)'}
                        </span>
                      ) : (
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          {resetPasswordId === admin.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="password"
                                minLength={6}
                                value={newTempPassword}
                                onChange={(e) => setNewTempPassword(e.target.value)}
                                placeholder="New temp password"
                                className="h-8 w-36 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                              />
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleResetPasswordSubmit(admin)}
                                className="h-8 rounded-md bg-[#00796B] px-2.5 text-[11px] font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setResetPasswordId(null);
                                  setNewTempPassword('');
                                }}
                                className="h-8 rounded-md border border-[#E2E8F0] px-2 text-[11px] font-semibold text-[#475569] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:bg-[#1E1E1E]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setResetPasswordId(admin.id);
                                setNewTempPassword('');
                              }}
                              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E2E8F0] px-2.5 font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                            >
                              <KeyRound className="h-3 w-3" aria-hidden="true" />
                              {lang === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset OTP'}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleToggleAdminAccess(admin)}
                            className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 font-semibold ${
                              admin.isActive
                                ? 'border-[#F57C00]/35 bg-[#F57C00]/10 text-[#E65100] hover:bg-[#F57C00]/20 dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]'
                                : 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] hover:bg-[#388E3C]/20 dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
                            }`}
                          >
                            {admin.isActive ? (
                              <>
                                <UserX className="h-3 w-3" aria-hidden="true" />
                                {lang === 'bn' ? 'অ্যাক্সেস বাতিল' : 'Revoke Access'}
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3" aria-hidden="true" />
                                {lang === 'bn' ? 'অ্যাক্সেস ফিরিয়ে দিন' : 'Restore Access'}
                              </>
                            )}
                          </button>

                          {confirmRemoveId === admin.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleRemoveAdmin(admin)}
                                className="h-8 rounded-md bg-[#D32F2F] px-2.5 text-[11px] font-semibold text-white hover:bg-[#B71C1C] dark:bg-[#FF4D4D] dark:text-[#050505]"
                              >
                                {lang === 'bn' ? 'নিশ্চিত অপসারণ' : 'Confirm Remove'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveId(null)}
                                className="h-8 rounded-md border border-[#E2E8F0] px-2 text-[11px] font-semibold text-[#475569] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:bg-[#1E1E1E]"
                              >
                                {lang === 'bn' ? 'না' : 'Cancel'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmRemoveId(admin.id)}
                              className="inline-flex h-8 items-center gap-1 rounded-md border border-[#D32F2F]/35 px-2.5 font-semibold text-[#D32F2F] hover:bg-[#D32F2F]/10 dark:border-[#FF4D4D]/40 dark:text-[#FF4D4D] dark:hover:bg-[#FF4D4D]/12"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                              {lang === 'bn' ? 'অপসারণ' : 'Remove'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminAuditLogsView({ logs }: { logs: AuditLogRecord[] }) {
  const { lang } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] flex items-center gap-2">
        <History className="h-5 w-5 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
            {lang === 'bn' ? 'অপরিবর্তনীয় অডিট লগ' : 'PostgreSQL Audit Logs'}
          </h1>
          <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
            {lang === 'bn'
              ? 'প্রতিটি প্রতিষ্ঠান হালনাগাদ, র‍্যাঙ্কিং পরিবর্তন, সার্কুলার আপলোড ও অ্যাডমিন অ্যাকাউন্ট কার্যক্রমের রেকর্ড।'
              : 'Recorded trail of institution updates, ranking changes, Gemini extractions, workflow transitions, and admin management.'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden dark:border-[#222222] dark:bg-[#121212]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Actor / Updated By</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn' ? 'এখনো কোনো অডিট লগ নেই।' : 'No audit logs recorded yet.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const updatedBy =
                    typeof log.details?.updatedBy === 'string' ? log.details.updatedBy : null;
                  return (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E1E1E]/60">
                      <td className="px-4 py-3 font-mono whitespace-nowrap text-[#475569] dark:text-[#94A3B8]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {updatedBy || log.actorEmail}
                        </p>
                        <p className="font-mono text-[11px] text-[#00796B] dark:text-[#26A69A]">
                          {log.actorRole} · {log.actorEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#475569] dark:text-[#94A3B8]">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-[#475569] dark:text-[#94A3B8] max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
