import { useState } from 'react';
import { Building2, DollarSign, Ticket, Calendar, X, Star, Smile, Heart, TrendingUp } from 'lucide-react';

interface BusinessUnitRelationship {
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

interface BusinessUnitCardProps {
  subsidiaries: BusinessUnitRelationship[];
  subsidiaryConfig?: any;
  customerData?: any;
}

export default function BusinessUnitCard({ subsidiaries, subsidiaryConfig, customerData }: BusinessUnitCardProps) {
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnitRelationship | null>(null);

  if (!subsidiaries || subsidiaries.length === 0) {
    return null;
  }

  const getBusinessUnitColor = (subId: string) => {
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
    <>
      <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="h-4 w-4 text-datacamp-brand" />
        <h3 className="text-base font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
          Business Unit Relationships
        </h3>
        <span className="px-1.5 py-0.5 text-xs rounded-full bg-datacamp-brand/10 text-datacamp-brand border border-datacamp-brand/20">
          {subsidiaries.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {subsidiaries.map((sub) => {
          const color = getBusinessUnitColor(sub.subsidiary_id);
          return (
            <div
              key={sub.subsidiary_id}
              className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-2.5 border-l-3 transition-all hover:shadow-md cursor-pointer"
              style={{ borderLeftColor: color }}
              onClick={() => setSelectedUnit(sub)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                      {sub.subsidiary_short_name}
                    </h4>
                    {sub.primary && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full font-medium flex-shrink-0" style={{ backgroundColor: color + '20', color: color }}>
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-0.5 truncate">
                    {sub.subsidiary_name}
                  </p>
                </div>
                <div
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1"
                  style={{ backgroundColor: color }}
                />
              </div>

              {/* Services */}
              <div className="mb-2">
                <p className="text-[10px] font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">
                  Services ({sub.service_count})
                </p>
                <div className="flex flex-wrap gap-1">
                  {sub.services.slice(0, 2).map((service, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary text-datacamp-text-primary dark:text-datacamp-dark-text-primary"
                    >
                      {service}
                    </span>
                  ))}
                  {sub.services.length > 2 && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      +{sub.services.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <DollarSign className="h-2.5 w-2.5" style={{ color: color }} />
                    <p className="text-[10px] text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Rev</p>
                  </div>
                  <p className="text-xs font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                    {formatCurrency(sub.annual_revenue)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <Ticket className="h-2.5 w-2.5" style={{ color: color }} />
                    <p className="text-[10px] text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Tix</p>
                  </div>
                  <p className="text-xs font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {sub.tickets_count}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    <Calendar className="h-2.5 w-2.5" style={{ color: color }} />
                    <p className="text-[10px] text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Since</p>
                  </div>
                  <p className="text-xs font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary truncate">
                    {formatDate(sub.relationship_start)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Drill-down Modal */}
      {selectedUnit && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary border-l-4"
            style={{ borderLeftColor: getBusinessUnitColor(selectedUnit.subsidiary_id) }}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" style={{ color: getBusinessUnitColor(selectedUnit.subsidiary_id) }} />
              <div>
                <h2 className="text-xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                  {selectedUnit.subsidiary_short_name}
                </h2>
                <p className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                  {selectedUnit.subsidiary_name}
                </p>
              </div>
              {selectedUnit.primary && (
                <span
                  className="px-2 py-1 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: getBusinessUnitColor(selectedUnit.subsidiary_id) + '20',
                    color: getBusinessUnitColor(selectedUnit.subsidiary_id)
                  }}
                >
                  Primary
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedUnit(null)}
              className="p-2 hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {/* Customer Satisfaction Metrics */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
                Customer Satisfaction Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NPS */}
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      Net Promoter Score
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {customerData?.nps_score || 'N/A'}
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                    {customerData?.nps_score >= 50 ? 'Promoter' : customerData?.nps_score >= 0 ? 'Passive' : 'Detractor'}
                  </p>
                </div>

                {/* CSAT */}
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center gap-2 mb-3">
                    <Smile className="h-5 w-5 text-blue-500" />
                    <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      Customer Satisfaction
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {customerData?.csat_score ? `${customerData.csat_score.toFixed(1)}/5.0` : 'N/A'}
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                    {customerData?.csat_score >= 4 ? 'Satisfied' : 'Needs Attention'}
                  </p>
                </div>

                {/* CES */}
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-5 w-5 text-purple-500" />
                    <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      Customer Effort Score
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {customerData?.ces_score ? `${customerData.ces_score.toFixed(1)}/7.0` : 'N/A'}
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                    Lower is better
                  </p>
                </div>

                {/* CLV */}
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <p className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      Customer Lifetime Value
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {customerData?.customer_lifetime_value ? formatCurrency(customerData.customer_lifetime_value) : 'N/A'}
                  </p>
                  <p className="text-xs text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mt-1">
                    Total value
                  </p>
                </div>
              </div>
            </div>

            {/* Business Unit Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
                Relationship Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" style={{ color: getBusinessUnitColor(selectedUnit.subsidiary_id) }} />
                    <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      Annual Revenue
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {formatCurrency(selectedUnit.annual_revenue)}
                  </p>
                </div>

                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="h-4 w-4" style={{ color: getBusinessUnitColor(selectedUnit.subsidiary_id) }} />
                    <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      Support Tickets
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {selectedUnit.tickets_count}
                  </p>
                </div>

                <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" style={{ color: getBusinessUnitColor(selectedUnit.subsidiary_id) }} />
                    <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                      Customer Since
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    {formatDate(selectedUnit.relationship_start)}
                  </p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">
                Services ({selectedUnit.service_count})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedUnit.services.map((service, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-sm rounded bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary text-datacamp-text-primary dark:text-datacamp-dark-text-primary"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
