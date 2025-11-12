import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown } from 'lucide-react';

interface Subsidiary {
  id: string;
  name: string;
  short_name: string;
  color: string;
  description: string;
}

interface SubsidiarySwitcherProps {
  selectedSubsidiary: string | null;
  onSelectSubsidiary: (subsidiaryId: string | null) => void;
}

export default function SubsidiarySwitcher({ selectedSubsidiary, onSelectSubsidiary }: SubsidiarySwitcherProps) {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Fetch subsidiaries list
    const apiUrl = 'http://localhost:5001';
    fetch(`${apiUrl}/api/subsidiaries`)
      .then(res => res.json())
      .then(data => {
        setSubsidiaries(data.subsidiaries || []);
      })
      .catch(err => console.error('Error fetching subsidiaries:', err));
  }, []);

  useEffect(() => {
    // Fetch stats for selected subsidiary
    if (selectedSubsidiary) {
      const apiUrl = 'http://localhost:5001';
      fetch(`${apiUrl}/api/subsidiary/${selectedSubsidiary}/stats`)
        .then(res => res.json())
        .then(data => {
          setStats(prev => ({ ...prev, [selectedSubsidiary]: data }));
        })
        .catch(err => console.error('Error fetching subsidiary stats:', err));
    }
  }, [selectedSubsidiary]);

  useEffect(() => {
    // Update dropdown position when it opens
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const dropdownElement = document.querySelector('[data-dropdown="subsidiary-switcher"]');
        if (!dropdownElement || !dropdownElement.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentSubsidiary = subsidiaries.find(s => s.id === selectedSubsidiary);
  const currentStats = selectedSubsidiary ? stats[selectedSubsidiary] : null;

  const dropdownContent = isOpen && createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown */}
      <div
        data-dropdown="subsidiary-switcher"
        className="rounded-lg shadow-lg bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary max-h-96 overflow-y-auto"
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top + 8}px`,
          left: `${dropdownPosition.left}px`,
          width: '288px',
          zIndex: 9999,
        }}
      >
        {/* All Subsidiaries Option */}
        <button
          onClick={() => {
            onSelectSubsidiary(null);
            setIsOpen(false);
          }}
          className={`w-full text-left px-4 py-3 hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary ${
            !selectedSubsidiary ? 'bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-tertiary' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                All Subsidiaries
              </div>
              <div className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                View all Cassava Group customers
              </div>
            </div>
          </div>
        </button>

        {/* Individual Subsidiaries */}
        {subsidiaries.map(sub => {
          const subStats = stats[sub.id];
          return (
            <button
              key={sub.id}
              onClick={() => {
                onSelectSubsidiary(sub.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary last:border-b-0 ${
                selectedSubsidiary === sub.id ? 'bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-tertiary' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: sub.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {sub.short_name}
                  </div>
                  <div className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                    {sub.description}
                  </div>
                  {subStats && (
                    <div className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                      {subStats.total_customers} customers • ${(subStats.total_revenue / 1000000).toFixed(1)}M revenue
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-secondary hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary"
        style={currentSubsidiary ? { borderColor: currentSubsidiary.color + '40' } : {}}
      >
        <Building2
          className="h-4 w-4"
          style={currentSubsidiary ? { color: currentSubsidiary.color } : {}}
        />
        <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary whitespace-nowrap">
          {currentSubsidiary ? currentSubsidiary.short_name : 'All Subsidiaries'}
        </span>
        <ChevronDown className="h-4 w-4 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
      </button>

      {dropdownContent}
    </div>
  );
}
