import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from 'react-query';
import { Search } from 'lucide-react';
import { searchCustomers } from '../api/customer360';

interface CustomerSearchProps {
  onSelectCustomer: (customerId: string) => void;
  subsidiaryFilter?: string | null;
}

export default function CustomerSearch({ onSelectCustomer, subsidiaryFilter }: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the search box and the dropdown
      if (searchRef.current && !searchRef.current.contains(target)) {
        // Also check if the click is not on the dropdown (which is now portaled)
        const dropdownElement = document.querySelector('[data-dropdown="customer-search"]');
        if (!dropdownElement || !dropdownElement.contains(target)) {
          setShowResults(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showResults && searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [showResults]);

  const { data: customers, isLoading } = useQuery(
    ['customers', searchQuery, subsidiaryFilter],
    async () => {
      const apiUrl = 'http://localhost:5001';

      // If subsidiary filter is active, fetch from subsidiary endpoint
      if (subsidiaryFilter) {
        const response = await fetch(`${apiUrl}/api/subsidiary/${subsidiaryFilter}/customers`);
        const allCustomers = await response.json();

        // Filter by search query if provided
        if (searchQuery) {
          return allCustomers.filter((c: any) =>
            c.account_name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        return allCustomers;
      }

      // Otherwise use regular search
      return searchCustomers(searchQuery);
    },
    {
      enabled: showResults,
      keepPreviousData: true,
    }
  );

  const handleSelect = (customerId: string) => {
    onSelectCustomer(customerId);
    setShowResults(false);
    setSearchQuery('');
  };

  const dropdownContent = showResults && (
    <div
      data-dropdown="customer-search"
      className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary shadow-xl rounded-lg border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary overflow-y-auto"
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top + 8}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        maxHeight: '15rem',
        zIndex: 9999,
      }}
    >
          {isLoading && (
            <div className="px-4 py-3 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
              Loading customers...
            </div>
          )}

          {!isLoading && customers && customers.length === 0 && (
            <div className="px-4 py-3 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
              {searchQuery.length >= 2 ? 'No customers found' : 'No customers available'}
            </div>
          )}

          {!isLoading && customers && customers.length > 0 && (
            <ul className="divide-y divide-datacamp-bg-tertiary dark:divide-datacamp-dark-bg-tertiary">
              {customers.map((customer: any) => (
                <li
                  key={customer.account_id}
                  className="px-4 py-3 cursor-pointer transition-colors hover:bg-datacamp-bg-secondary dark:hover:bg-datacamp-dark-bg-contrast"
                  onClick={() => handleSelect(customer.account_id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                        {customer.account_name}
                      </p>
                      <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5">
                        {customer.region}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                        customer.health_status === 'Healthy'
                          ? 'bg-datacamp-success/10 text-datacamp-success border border-datacamp-success/20'
                          : customer.health_status === 'At-Risk'
                          ? 'bg-datacamp-warning/10 text-datacamp-warning border border-datacamp-warning/20'
                          : 'bg-datacamp-red/10 text-datacamp-red border border-datacamp-red/20'
                      }`}
                    >
                      {customer.health_status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
    </div>
  );

  return (
    <>
      <div ref={searchRef} className="relative z-50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary rounded-lg leading-5 bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary placeholder-datacamp-text-subtle dark:placeholder-datacamp-dark-text-subtle text-datacamp-text-primary dark:text-datacamp-dark-text-primary focus:outline-none focus:ring-2 focus:ring-datacamp-brand focus:border-datacamp-brand text-sm transition-colors relative z-10"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
        </div>
      </div>
      {showResults && createPortal(dropdownContent, document.body)}
    </>
  );
}
