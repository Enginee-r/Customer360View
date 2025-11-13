import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown } from 'lucide-react';

interface OpCo {
  id: string;
  name: string;
  code: string;
  region: string;
}

interface OpCoSwitcherProps {
  selectedOpCo: string | null;
  onSelectOpCo: (opCoId: string | null) => void;
}

export default function OpCoSwitcher({ selectedOpCo, onSelectOpCo }: OpCoSwitcherProps) {
  const [opcos, setOpcos] = useState<OpCo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Fetch OpCos list and their stats
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    fetch(`${apiUrl}/opcos`)
      .then(res => res.json())
      .then(data => {
        const opcoList = data.opcos || [];
        setOpcos(opcoList);

        // Fetch stats for all OpCos
        opcoList.forEach((opco: OpCo) => {
          fetch(`${apiUrl}/opco/${opco.id}/stats`)
            .then(res => res.json())
            .then(statsData => {
              setStats(prev => ({ ...prev, [opco.id]: statsData }));
            })
            .catch(err => console.error(`Error fetching stats for ${opco.id}:`, err));
        });
      })
      .catch(err => console.error('Error fetching OpCos:', err));
  }, []);

  useEffect(() => {
    // Fetch stats for selected OpCo
    if (selectedOpCo) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      fetch(`${apiUrl}/opco/${selectedOpCo}/stats`)
        .then(res => res.json())
        .then(data => {
          setStats(prev => ({ ...prev, [selectedOpCo]: data }));
        })
        .catch(err => console.error('Error fetching OpCo stats:', err));
    }
  }, [selectedOpCo]);

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
        const dropdownElement = document.querySelector('[data-dropdown="opco-switcher"]');
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

  const currentOpCo = opcos.find(o => o.id === selectedOpCo);
  const currentStats = selectedOpCo ? stats[selectedOpCo] : null;

  // Group OpCos by region for better organization
  const opcosByRegion = opcos.reduce((acc, opco) => {
    if (!acc[opco.region]) {
      acc[opco.region] = [];
    }
    acc[opco.region].push(opco);
    return acc;
  }, {} as Record<string, OpCo[]>);

  const dropdownContent = isOpen && createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Dropdown */}
      <div
        data-dropdown="opco-switcher"
        className="rounded-lg shadow-lg bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary max-h-96 overflow-y-auto"
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top + 8}px`,
          left: `${dropdownPosition.left}px`,
          width: '288px',
          zIndex: 9999,
        }}
      >
        {/* All OpCos Option */}
        <button
          onClick={() => {
            onSelectOpCo(null);
            setIsOpen(false);
          }}
          className={`w-full text-left px-4 py-3 hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary ${
            !selectedOpCo ? 'bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-tertiary' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-gray-400" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                All OpCos
              </div>
              <div className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                View all OpCos
              </div>
            </div>
          </div>
        </button>

        {/* Individual OpCos grouped by region */}
        {Object.entries(opcosByRegion).sort(([a], [b]) => a.localeCompare(b)).map(([region, regionOpcos]) => (
          <div key={region}>
            <div className="px-4 py-2 bg-datacamp-bg-secondary/50 dark:bg-datacamp-dark-bg-main/50">
              <div className="text-xs font-semibold text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle uppercase tracking-wide">
                {region}
              </div>
            </div>
            {regionOpcos.sort((a, b) => a.name.localeCompare(b.name)).map(opco => {
              const opcoStats = stats[opco.id];
              return (
                <button
                  key={opco.id}
                  onClick={() => {
                    onSelectOpCo(opco.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary last:border-b-0 ${
                    selectedOpCo === opco.id ? 'bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-tertiary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg leading-none">
                      {opco.code}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                        {opco.name}
                      </div>
                      {opcoStats && (
                        <div className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                          {opcoStats.total_customers} customers • ${(opcoStats.total_revenue / 1000000).toFixed(1)}M revenue
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
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
      >
        <Globe className="h-4 w-4 text-datacamp-brand" />
        <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary whitespace-nowrap">
          {currentOpCo ? currentOpCo.name : 'All OpCos'}
        </span>
        <ChevronDown className="h-4 w-4 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
      </button>

      {dropdownContent}
    </div>
  );
}
