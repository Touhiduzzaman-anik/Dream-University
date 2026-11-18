import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/authFetch';
import type { EligibilityResultItem } from '../../types/domain';
import { StudentProfileForm } from './StudentProfileForm';
import { StudentReportsView } from './StudentReportsView';

interface StudentProfileAndReportSectionProps {
  activeTab: 'profile' | 'report';
  onTabChange?: (tab: 'profile' | 'report') => void;
}

export function StudentProfileAndReportSection({
  activeTab,
}: StudentProfileAndReportSectionProps) {
  const { user, profile } = useAuth();
  const [results, setResults] = useState<EligibilityResultItem[]>([]);

  const loadEligibility = useCallback(async () => {
    if (user?.accountType !== 'student') return;
    const res = await apiFetch('/api/student/eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'all' }),
    });
    if (res.ok) {
      const data = (await res.json()) as { evaluations?: EligibilityResultItem[] };
      setResults(data.evaluations ?? []);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'report') {
      void loadEligibility();
    }
  }, [activeTab, loadEligibility, profile]);

  if (activeTab === 'report') {
    return <StudentReportsView results={results} />;
  }

  return (
    <StudentProfileForm
      onSaved={() => {
        void loadEligibility();
      }}
    />
  );
}
