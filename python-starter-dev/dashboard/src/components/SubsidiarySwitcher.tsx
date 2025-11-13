import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown } from 'lucide-react';

interface BusinessUnit {
  id: string;
  name: string;
  short_name: string;
  color: string;
  description: string;
}

interface BusinessUnitSwitcherProps {
  selectedBusinessUnit: string | null;
  onSelectBusinessUnit: (businessUnitId: string | null) => void;
}

export default function BusinessUnitSwitcher({ selectedBusinessUnit, onSelectBusinessUnit }: BusinessUnitSwitcherProps) {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Fetch business units list
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    fetch(`${apiUrl}/subsidiaries`)
      .then(res => res.json())
      .then(data => {
        setBusinessUnits(data.subsidiaries || []);
      })
      .catch(err => console.error('Error fetching business units:', err));
  }, []);

  useEffect(() => {
    // Fetch stats for selected business unit
    if (selectedBusinessUnit) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      fetch(`${apiUrl}/subsidiary/${selectedBusinessUnit}/stats`)
        .then(res => res.json())
        .then(data => {
          setStats(prev => ({ ...prev, [selectedBusinessUnit]: data }));
        })
        .catch(err => console.error('Error fetching business unit stats:', err));
    }
  }, [selectedBusinessUnit]);

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
        const dropdownElement = document.querySelector('[data-dropdown="business-unit-switcher"]');
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

  const currentBusinessUnit = businessUnits.find(s => s.id === selectedBusinessUnit);
  const currentStats = selectedBusinessUnit ? stats[selectedBusinessUnit] : null;

  const dropdownContent = isOpen && createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown */}
      <div
        data-dropdown="business-unit-switcher"
        className="rounded-lg shadow-lg bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary max-h-96 overflow-y-auto"
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top + 8}px`,
          left: `${dropdownPosition.left}px`,
          width: '288px',
          zIndex: 9999,
        }}
      >
        {/* All Business Units Option */}
        <button
          onClick={() => {
            onSelectBusinessUnit(null);
            setIsOpen(false);
          }}
          className={`w-full text-left px-4 py-3 hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary ${
            !selectedBusinessUnit ? 'bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-tertiary' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                All Business Units
              </div>
              <div className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                View all Cassava Group customers
              </div>
            </div>
          </div>
        </button>

        {/* Individual Business Units */}
        {businessUnits.map(sub => {
          const subStats = stats[sub.id];
          return (
            <button
              key={sub.id}
              onClick={() => {
                onSelectBusinessUnit(sub.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary last:border-b-0 ${
                selectedBusinessUnit === sub.id ? 'bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-tertiary' : ''
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
        style={currentBusinessUnit ? { borderColor: currentBusinessUnit.color + '40' } : {}}
      >
        <Building2
          className="h-4 w-4"
          style={currentBusinessUnit ? { color: currentBusinessUnit.color } : {}}
        />
        <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary whitespace-nowrap">
          {currentBusinessUnit ? currentBusinessUnit.short_name : 'All Business Units'}
        </span>
        <ChevronDown className="h-4 w-4 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
      </button>

      {dropdownContent}
    </div>
  );
}
