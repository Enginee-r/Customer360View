import { Building2, DollarSign, Ticket, Calendar } from 'lucide-react';

interface SubsidiaryRelationship {
  subsidiary_id: string;
  subsidiary_name: string;
  subsidiary_short_name: string;
  services: string[];
  service_count: number;
  annual_revenue: number;
  tickets_count: number;
  relationship_start: string;
  primary: boolean;
}

interface SubsidiaryCardProps {
  subsidiaries: SubsidiaryRelationship[];
  subsidiaryConfig?: any;
}

export default function SubsidiaryCard({ subsidiaries, subsidiaryConfig }: SubsidiaryCardProps) {
  if (!subsidiaries || subsidiaries.length === 0) {
    return null;
  }

  const getSubsidiaryColor = (subId: string) => {
    if (!subsidiaryConfig || !subsidiaryConfig.subsidiaries) return '#6B7280';
    const sub = subsidiaryConfig.subsidiaries.find((s: any) => s.id === subId);
    return sub?.color || '#6B7280';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-datacamp-brand" />
        <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
          Subsidiary Relationships
        </h3>
        <span className="px-2 py-0.5 text-xs rounded-full bg-datacamp-brand/10 text-datacamp-brand border border-datacamp-brand/20">
          {subsidiaries.length} {subsidiaries.length === 1 ? 'Subsidiary' : 'Subsidiaries'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subsidiaries.map((sub) => {
          const color = getSubsidiaryColor(sub.subsidiary_id);
          return (
            <div
              key={sub.subsidiary_id}
              className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4 border-l-4 transition-all hover:shadow-md"
              style={{ borderLeftColor: color }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                      {sub.subsidiary_short_name}
                    </h4>
                    {sub.primary && (
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: color + '20', color: color }}>
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5">
                    {sub.subsidiary_name}
                  </p>
                </div>
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0 mt-2"
                  style={{ backgroundColor: color }}
                />
              </div>

              {/* Services */}
              <div className="mb-3">
                <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">
                  Services ({sub.service_count})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sub.services.slice(0, 3).map((service, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary text-datacamp-text-primary dark:text-datacamp-dark-text-primary"
                    >
                      {service}
                    </span>
                  ))}
                  {sub.services.length > 3 && (
                    <span className="px-2 py-1 text-xs rounded bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      +{sub.services.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3" style={{ color: color }} />
                    <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Revenue</p>
                  </div>
                  <p className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {formatCurrency(sub.annual_revenue)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Ticket className="h-3 w-3" style={{ color: color }} />
                    <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Tickets</p>
                  </div>
                  <p className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {sub.tickets_count}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" style={{ color: color }} />
                    <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Since</p>
                  </div>
                  <p className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {formatDate(sub.relationship_start)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
