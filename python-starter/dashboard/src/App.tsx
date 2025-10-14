import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Moon, Sun, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import CustomerSearch from './components/CustomerSearch';
import PersonaDashboard from './components/PersonaDashboard';
import MetricDrillDown from './components/MetricDrillDown';
import { Chatbot } from './components/Chatbot';

const queryClient = new QueryClient();

function App() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [drillDownMetric, setDrillDownMetric] = useState<'customers' | 'revenue' | 'health' | 'at-risk' | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<{ type: 'health' | 'region', value: string } | null>(null);
  const [expandedHealthStatus, setExpandedHealthStatus] = useState<string | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-datacamp-bg-main dark:bg-datacamp-dark-bg-main transition-colors">
        <header className="shadow-sm border-b border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-main overflow-x-auto overflow-y-visible">
          <div className="mx-auto px-3 py-3 sm:px-6 lg:px-8 min-w-max relative">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              {/* Left side - Logo and Title */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <a
                  href="https://www.cassavatechnologies.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  aria-label="Cassava Technologies"
                >
                  <img
                    src="https://www.cassavatechnologies.com/wp-content/uploads/2022/06/Cassava-Logo.png"
                    alt="Cassava Technologies"
                    className="h-8 sm:h-10 w-auto"
                  />
                </a>
                <div className="border-l border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary pl-2 sm:pl-4 h-10 sm:h-12 flex flex-col justify-center">
                  <h1
                    className="text-base sm:text-xl lg:text-2xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary hover:opacity-80 transition-opacity cursor-pointer leading-tight whitespace-nowrap"
                    onClick={() => setSelectedCustomerId(null)}
                  >
                    Customer 360° View
                  </h1>
                  <button
                    onClick={() => setSelectedCustomerId(null)}
                    className="text-xs font-medium mt-0.5 hover:opacity-80 transition-opacity inline-block hidden sm:inline-block text-left whitespace-nowrap"
                    style={{ color: '#00c0ab' }}
                  >
                    Intelligence Platform
                  </button>
                </div>
              </div>

              {/* Right side - Search and Actions */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-8 sm:ml-12 md:ml-16">
                <div className="w-48 sm:w-56 md:w-72 lg:w-80">
                  <CustomerSearch onSelectCustomer={setSelectedCustomerId} />
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-secondary hover:bg-datacamp-bg-tertiary dark:hover:bg-datacamp-dark-bg-tertiary transition-colors flex-shrink-0"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-datacamp-brand" />
                  ) : (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-datacamp-text-subtle" />
                  )}
                </button>
                <span className="hidden sm:inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-datacamp-brand/10 text-datacamp-brand border border-datacamp-brand/20 flex-shrink-0 whitespace-nowrap">
                  Live
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

          {/* Content area with proper spacing */}
          <div className="relative z-0 pt-6">
            {selectedCustomerId && (
              <PersonaDashboard customerId={selectedCustomerId} />
            )}

            {!selectedCustomerId && (
              <div className="space-y-8">
                {/* Search prompt */}
                <div className="text-center py-8 mt-16">
                  <svg
                    className="mx-auto h-12 w-12 text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                    Search for a customer
                  </h3>
                  <p className="mt-1 text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">
                    Get started by searching for a customer above to view their 360° profile
                  </p>
                </div>

                {/* Key Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Customers */}
                  <div
                    onClick={() => setDrillDownMetric('customers')}
                    className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-brand"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Total Customers</h3>
                      <svg className="h-5 w-5 text-datacamp-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">2,847</p>
                    <p className="mt-2 text-xs text-datacamp-success">↑ 12.3% from last month</p>
                  </div>

                  {/* Total Revenue */}
                  <div
                    onClick={() => setDrillDownMetric('revenue')}
                    className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-brand"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Annual Revenue</h3>
                      <svg className="h-5 w-5 text-datacamp-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">$284M</p>
                    <p className="mt-2 text-xs text-datacamp-success">↑ 8.7% YoY growth</p>
                  </div>

                  {/* Health Score */}
                  <div
                    onClick={() => setDrillDownMetric('health')}
                    className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-brand"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Avg Health Score</h3>
                      <svg className="h-5 w-5 text-datacamp-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">78.5</p>
                    <p className="mt-2 text-xs text-datacamp-text-subtle">Across all accounts</p>
                  </div>

                  {/* At-Risk Customers */}
                  <div
                    onClick={() => setDrillDownMetric('at-risk')}
                    className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary cursor-pointer transition-all hover:shadow-lg hover:scale-105 hover:border-datacamp-brand"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">At-Risk Accounts</h3>
                      <svg className="h-5 w-5 text-datacamp-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-datacamp-text-primary dark:text-datacamp-dark-text-primary">187</p>
                    <p className="mt-2 text-xs text-datacamp-red">↑ 5 new this week</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Customer Distribution */}
                  <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary lg:col-span-2">
                    <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">Customer Health Distribution</h3>
                    <div className="space-y-4">
                      {/* Healthy */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedHealthStatus(expandedHealthStatus === 'Healthy' ? null : 'Healthy')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Healthy</span>
                              {expandedHealthStatus === 'Healthy' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                            <span className="text-sm font-medium text-datacamp-success">1,847 (65%)</span>
                          </div>
                          <div className="w-full bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary rounded-full h-2">
                            <div className="bg-datacamp-success h-2 rounded-full transition-all hover:h-3" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                        {expandedHealthStatus === 'Healthy' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div className="flex justify-between">
                                <span>• Safaricom Kenya</span>
                                <span className="text-datacamp-text-subtle">East Africa</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• MTN Nigeria</span>
                                <span className="text-datacamp-text-subtle">West Africa</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Vodacom South Africa</span>
                                <span className="text-datacamp-text-subtle">Southern Africa</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'health', value: 'Healthy' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 1,847 →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* At-Risk */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedHealthStatus(expandedHealthStatus === 'At-Risk' ? null : 'At-Risk')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">At-Risk</span>
                              {expandedHealthStatus === 'At-Risk' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                            <span className="text-sm font-medium text-datacamp-warning">813 (28.5%)</span>
                          </div>
                          <div className="w-full bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary rounded-full h-2">
                            <div className="bg-datacamp-warning h-2 rounded-full transition-all hover:h-3" style={{ width: '28.5%' }}></div>
                          </div>
                        </div>
                        {expandedHealthStatus === 'At-Risk' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div className="flex justify-between">
                                <span>• Airtel Tanzania</span>
                                <span className="text-datacamp-text-subtle">East Africa</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Orange Senegal</span>
                                <span className="text-datacamp-text-subtle">West Africa</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Telkom SA</span>
                                <span className="text-datacamp-text-subtle">Southern Africa</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'health', value: 'At-Risk' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 813 →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Critical */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedHealthStatus(expandedHealthStatus === 'Critical' ? null : 'Critical')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Critical</span>
                              {expandedHealthStatus === 'Critical' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                            <span className="text-sm font-medium text-datacamp-red">187 (6.5%)</span>
                          </div>
                          <div className="w-full bg-datacamp-bg-tertiary dark:bg-datacamp-dark-bg-tertiary rounded-full h-2">
                            <div className="bg-datacamp-red h-2 rounded-full transition-all hover:h-3" style={{ width: '6.5%' }}></div>
                          </div>
                        </div>
                        {expandedHealthStatus === 'Critical' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-2">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div className="flex justify-between">
                                <span>• Cell C South Africa</span>
                                <span className="text-datacamp-text-subtle">Southern Africa</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Zamtel</span>
                                <span className="text-datacamp-text-subtle">Southern Africa</span>
                              </div>
                              <div className="flex justify-between">
                                <span>• Ethio Telecom</span>
                                <span className="text-datacamp-text-subtle">East Africa</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'health', value: 'Critical' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 187 →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Regional Split */}
                  <div className="bg-datacamp-bg-contrast dark:bg-datacamp-dark-bg-secondary rounded-lg p-6 border border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary">
                    <h3 className="text-lg font-semibold text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-4">Top Regions</h3>
                    <div className="space-y-3">
                      {/* East Africa */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedRegion(expandedRegion === 'East Africa' ? null : 'East Africa')}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">East Africa</span>
                            {expandedRegion === 'East Africa' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">842</span>
                        </div>
                        {expandedRegion === 'East Africa' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Countries:</p>
                            <div className="text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-2">
                              Kenya • Tanzania • Uganda • Rwanda • Ethiopia
                            </div>
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div>• Safaricom Kenya</div>
                              <div>• Airtel Tanzania</div>
                              <div>• MTN Uganda</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'region', value: 'East Africa' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 842 →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* West Africa */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedRegion(expandedRegion === 'West Africa' ? null : 'West Africa')}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">West Africa</span>
                            {expandedRegion === 'West Africa' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">735</span>
                        </div>
                        {expandedRegion === 'West Africa' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Countries:</p>
                            <div className="text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-2">
                              Nigeria • Ghana • Senegal • Ivory Coast • Benin
                            </div>
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div>• MTN Nigeria</div>
                              <div>• Orange Senegal</div>
                              <div>• Vodafone Ghana</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'region', value: 'West Africa' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 735 →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Southern Africa */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedRegion(expandedRegion === 'Southern Africa' ? null : 'Southern Africa')}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Southern Africa</span>
                            {expandedRegion === 'Southern Africa' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">621</span>
                        </div>
                        {expandedRegion === 'Southern Africa' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Countries:</p>
                            <div className="text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-2">
                              South Africa • Zambia • Zimbabwe • Botswana • Namibia
                            </div>
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div>• Vodacom South Africa</div>
                              <div>• Telkom SA</div>
                              <div>• Zamtel</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'region', value: 'Southern Africa' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 621 →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Central Africa */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedRegion(expandedRegion === 'Central Africa' ? null : 'Central Africa')}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">Central Africa</span>
                            {expandedRegion === 'Central Africa' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">453</span>
                        </div>
                        {expandedRegion === 'Central Africa' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Countries:</p>
                            <div className="text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-2">
                              DRC • Cameroon • Gabon • Chad • CAR
                            </div>
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div>• Vodacom DRC</div>
                              <div>• MTN Cameroon</div>
                              <div>• Airtel Gabon</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'region', value: 'Central Africa' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 453 →
                            </button>
                          </div>
                        )}
                      </div>

                      {/* North Africa */}
                      <div className="bg-datacamp-bg-secondary dark:bg-datacamp-dark-bg-main rounded-lg p-3">
                        <div
                          onClick={() => setExpandedRegion(expandedRegion === 'North Africa' ? null : 'North Africa')}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle">North Africa</span>
                            {expandedRegion === 'North Africa' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-medium text-datacamp-text-primary dark:text-datacamp-dark-text-primary">196</span>
                        </div>
                        {expandedRegion === 'North Africa' && (
                          <div className="mt-3 pt-3 border-t border-datacamp-bg-tertiary dark:border-datacamp-dark-bg-tertiary space-y-2">
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Countries:</p>
                            <div className="text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary mb-2">
                              Egypt • Morocco • Algeria • Tunisia • Libya
                            </div>
                            <p className="text-xs font-medium text-datacamp-text-subtle dark:text-datacamp-dark-text-subtle mb-1">Sample Customers:</p>
                            <div className="space-y-1 text-xs text-datacamp-text-primary dark:text-datacamp-dark-text-primary">
                              <div>• Orange Egypt</div>
                              <div>• Maroc Telecom</div>
                              <div>• Ooredoo Algeria</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterCriteria({ type: 'region', value: 'North Africa' });
                                setDrillDownMetric('customers');
                              }}
                              className="mt-2 text-xs text-datacamp-brand hover:underline"
                            >
                              View all 196 →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Drill-down Modal */}
        {drillDownMetric && (
          <MetricDrillDown
            metric={drillDownMetric}
            filterCriteria={filterCriteria}
            onClose={() => {
              setDrillDownMetric(null);
              setFilterCriteria(null);
            }}
          />
        )}

        {/* Chatbot */}
        <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

        {/* Chatbot Toggle Button */}
        {!isChatbotOpen && (
          <button
            onClick={() => setIsChatbotOpen(true)}
            className="fixed bottom-4 right-4 p-4 bg-datacamp-brand hover:bg-datacamp-green/90 text-white rounded-full shadow-lg transition-all hover:scale-110 z-40"
            aria-label="Open chatbot"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
