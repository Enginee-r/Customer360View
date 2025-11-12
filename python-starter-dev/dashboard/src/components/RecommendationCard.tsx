import { useState } from 'react';
import { Calendar, DollarSign, Target } from 'lucide-react';
import { executeAction } from '../api/customer360';

interface RecommendationCardProps {
  recommendation: {
    recommendation_id: string;
    priority: string;
    category: string;
    title: string;
    description: string;
    expected_outcome: string;
    estimated_impact: number;
    status: string;
  };
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);

  const getPriorityConfig = () => {
    switch (recommendation.priority) {
      case 'HIGH':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeColor: 'bg-red-100 text-red-800',
        };
      case 'MEDIUM':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          badgeColor: 'bg-orange-100 text-orange-800',
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeColor: 'bg-blue-100 text-blue-800',
        };
    }
  };

  const config = getPriorityConfig();

  const handleSchedule = async () => {
    setExecuting(true);
    try {
      await executeAction(recommendation.recommendation_id);
      setExecuted(true);
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setExecuting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
              {recommendation.priority}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {recommendation.category}
            </span>
          </div>
          <h4 className="text-base font-semibold text-gray-900 mb-2">
            {recommendation.title}
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            {recommendation.description}
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Target className="h-4 w-4 mr-2" />
              <span className="font-medium mr-1">Expected Outcome:</span>
              {recommendation.expected_outcome}
            </div>
            {recommendation.estimated_impact > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="font-medium mr-1">Estimated Impact:</span>
                {formatCurrency(recommendation.estimated_impact)}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {!executed ? (
            <button
              onClick={handleSchedule}
              disabled={executing}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                executing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {executing ? 'Scheduling...' : 'Schedule'}
            </button>
          ) : (
            <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md">
              Scheduled ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
