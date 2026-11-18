import { CheckSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ALL_ELIGIBILITY_CHECKBOX_CATEGORIES,
  ELIGIBILITY_CHECKBOX_CATEGORIES,
  toggleEligibilityCategory,
  type EligibilityCheckboxCategory,
} from '../../utils/eligibilityGrouping';

interface CategoryCheckboxBarProps {
  selectedCategories: EligibilityCheckboxCategory[];
  onChange: (next: EligibilityCheckboxCategory[]) => void;
  idPrefix?: string;
}

export function CategoryCheckboxBar({
  selectedCategories,
  onChange,
  idPrefix = 'elig-cat',
}: CategoryCheckboxBarProps) {
  const { lang } = useLanguage();
  const allSelected = selectedCategories.length === ALL_ELIGIBILITY_CHECKBOX_CATEGORIES.length;

  return (
    <fieldset className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-[#26A69A]">
          <CheckSquare className="h-3.5 w-3.5 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
          <span>
            {lang === 'bn'
              ? 'প্রতিষ্ঠানের ক্যাটাগরি নির্বাচন করুন (মাল্টি-সিলেক্ট)'
              : 'Select Institution Categories (Multi-Select)'}
          </span>
        </legend>

        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onChange([...ALL_ELIGIBILITY_CHECKBOX_CATEGORIES])}
            disabled={allSelected}
            className="text-[#00796B] hover:underline disabled:text-[#475569]/40 disabled:no-underline dark:text-[#26A69A] dark:disabled:text-[#94A3B8]/40"
          >
            {lang === 'bn' ? 'সবগুলো টিক দিন' : 'Select All'}
          </button>
          <span className="text-[#E2E8F0] dark:text-[#222222]" aria-hidden="true">
            |
          </span>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selectedCategories.length === 0}
            className="text-[#475569] hover:underline disabled:text-[#475569]/40 disabled:no-underline dark:text-[#94A3B8] dark:disabled:text-[#94A3B8]/40"
          >
            {lang === 'bn' ? 'সব বাদ দিন' : 'Clear'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {ELIGIBILITY_CHECKBOX_CATEGORIES.map((cat) => {
          const checked = selectedCategories.includes(cat.id);
          const inputId = `${idPrefix}-${cat.id}`;
          return (
            <label
              key={cat.id}
              htmlFor={inputId}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors select-none ${
                checked
                  ? 'border-[#00796B] bg-white text-[#0F172A] shadow-2xs dark:border-[#26A69A] dark:bg-[#121212] dark:text-[#26A69A]'
                  : 'border-[#E2E8F0] bg-white/60 text-[#475569] hover:border-[#00796B]/40 dark:border-[#222222] dark:bg-[#121212]/60 dark:text-[#94A3B8] dark:hover:border-[#26A69A]/40'
              }`}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleEligibilityCategory(selectedCategories, cat.id))}
                className="h-4 w-4 rounded border-[#E2E8F0] accent-[#00796B] dark:border-[#222222] dark:accent-[#26A69A]"
              />
              <span>{lang === 'bn' ? cat.labelBn : cat.labelEn}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
