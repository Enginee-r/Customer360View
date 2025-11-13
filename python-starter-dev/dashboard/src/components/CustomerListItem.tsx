import { useEffect, useState } from 'react';

interface Subsidiary {
  subsidiary_id: string;
  subsidiary_name: string;
  subsidiary_short_name: string;
  services: string[];
  annual_revenue: number;
  tickets_count: number;
  primary: boolean;
}

interface CustomerListItemProps {
  customer: {
    account_id: string;
    account_name: string;
    region: string;
    health_status?: string;
    annual_revenue?: number;
    subsidiaries?: Subsidiary[];
    subsidiary_count?: number;
  };
  onClick?: () => void;
  showRevenue?: boolean;
}

interface BusinessUnitConfig {
  id: string;
  color: string;
  short_name: string;
}

export default function CustomerListItem({ customer, onClick, showRevenue = false }: CustomerListItemProps) {
  const [businessUnitConfig, setBusinessUnitConfig] = useState<Record<string, BusinessUnitConfig>>({});

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    fetch(`${apiUrl}/subsidiaries`)
      .then(res => res.json())
      .then(data => {
        const config: Record<string, BusinessUnitConfig> = {};
        if (data.subsidiaries) {
          data.subsidiaries.forEach((sub: any) => {
            config[sub.id] = {
              id: sub.id,
              color: sub.color,
              short_name: sub.short_name
            };
          });
        }
        setBusinessUnitConfig(config);
      })
      .catch(err => console.error('Error fetching business unit config:', err));
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div
      className="flex items-center justify-between py-2 px-3 hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary rounded cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-datacamp-text-primary dark:text-datacamp-dark-text-primary font-medium truncate">
            {customer.account_name}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
            {customer.region}
          </span>
          {customer.subsidiaries && customer.subsidiaries.length > 0 && (
            <>
              <span className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">•</span>
              <div className="flex items-center gap-1 flex-wrap">
                {customer.subsidiaries.map((sub, idx) => {
                  const config = businessUnitConfig[sub.subsidiary_id];
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: config?.color ? `${config.color}15` : '#f3f4f6',
                        borderLeft: `2px solid ${config?.color || '#9ca3af'}`
                      }}
                    >
                      <span
                        className="font-medium"
                        style={{ color: config?.color || '#6b7280' }}
                      >
                        {config?.short_name || sub.subsidiary_short_name}
                      </span>
                      {showRevenue && sub.annual_revenue > 0 && (
                        <span className="text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                          ({formatCurrency(sub.annual_revenue)})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {showRevenue && customer.annual_revenue !== undefined && (
        <div className="text-right ml-4">
          <span className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
            {formatCurrency(customer.annual_revenue)}
          </span>
        </div>
      )}
    </div>
  );
}
