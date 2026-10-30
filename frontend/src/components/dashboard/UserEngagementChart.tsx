import { useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useAnalyticsStore } from '../../store/analyticsStore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const UserEngagementChart = () => {
  // Get analytics data from store
  const { 
    engagement, 
    isLoading, 
    fetchEngagementData 
  } = useAnalyticsStore(state => ({
    engagement: state.engagement,
    isLoading: state.isLoading,
    fetchEngagementData: state.fetchEngagementData
  }));

  // Fetch initial data
  useEffect(() => {
    fetchEngagementData();
  }, [fetchEngagementData]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEngagementData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEngagementData]);

  // Loading state UI
  if (isLoading && !engagement) {
    return (
      <div className="glass rounded-lg p-6 mb-8 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent mb-4"></div>
          <p>Loading engagement data...</p>
        </div>
      </div>
    );
  }

  // Fall back to empty data if engagement is null
  const data = engagement || {
    dailyViews: [],
    weeklyUploads: [],
    monthlyActiveUsers: [],
    resourceTypeDistribution: {},
    timeSpent: {},
    totalNotes: 0,
    totalUsers: 0,
    growthMetrics: {
      viewsGrowth: 0,
      uploadsGrowth: 0,
      usersGrowth: 0
    }
  };

  // Destructure data for easier access
  const { 
    dailyViews, 
    weeklyUploads, 
    monthlyActiveUsers, 
    resourceTypeDistribution, 
    timeSpent, 
    growthMetrics,
    totalNotes,
    totalUsers
  } = data;

  // Chart options and data
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
    },
    color: 'rgba(255, 255, 255, 0.7)',
  };
  
  // Generate days of the week dynamically for the last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    days.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  // Generate last 6 months dynamically
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    months.push(month.toLocaleDateString('en-US', { month: 'short' }));
  }

  const viewsData = {
    labels: days,
    datasets: [
      {
        label: 'Daily Page Views',
        data: dailyViews,
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const uploadsData = {
    labels: days,
    datasets: [
      {
        label: 'Weekly Uploads',
        data: weeklyUploads,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 5,
      },
    ],
  };

  const usersData = {
    labels: months.slice(0, monthlyActiveUsers.length),
    datasets: [
      {
        label: 'Monthly Active Users',
        data: monthlyActiveUsers,
        borderColor: 'rgba(139, 92, 246, 0.8)',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const resourceTypeData = {
    labels: Object.keys(resourceTypeDistribution || {}),
    datasets: [
      {
        label: 'Resource Types',
        data: Object.values(resourceTypeDistribution || {}),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',  // blue
          'rgba(16, 185, 129, 0.7)',  // green
          'rgba(239, 68, 68, 0.7)',   // red
          'rgba(139, 92, 246, 0.7)',  // purple
          'rgba(245, 158, 11, 0.7)',  // amber
          'rgba(99, 102, 241, 0.7)',  // indigo
        ],
        borderWidth: 1,
      },
    ],
  };

  const timeSpentData = {
    labels: Object.keys(timeSpent || {}),
    datasets: [
      {
        label: 'Time Spent',
        data: Object.values(timeSpent || {}),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',  // blue
          'rgba(16, 185, 129, 0.7)',  // green
          'rgba(239, 68, 68, 0.7)',   // red
          'rgba(139, 92, 246, 0.7)',  // purple
          'rgba(245, 158, 11, 0.7)',  // amber
        ],
        borderWidth: 1,
      },
    ],
  };

  // Check if we have any data before rendering
  const hasResourceTypeData = resourceTypeDistribution && Object.keys(resourceTypeDistribution).length > 0;
  const hasTimeSpentData = timeSpent && Object.keys(timeSpent).length > 0;

  return (
    <div className="glass rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6 gradient-text">User Engagement Dashboard</h2>
      
      {/* Key metrics with growth indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-light p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-light-darker">Page Views (7d)</p>
              <p className="text-2xl font-bold mt-1">{dailyViews.length > 0 ? dailyViews.reduce((a, b) => a + b, 0) : 0}</p>
            </div>
            <div className={`flex items-center ${growthMetrics.viewsGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {growthMetrics.viewsGrowth >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
              <span>{Math.abs(growthMetrics.viewsGrowth).toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-dark-light mt-2 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-blue-500 rounded-full" 
              style={{ width: `${dailyViews.length > 0 ? Math.min(100, (dailyViews[6] / Math.max(1, dailyViews.reduce((a, b) => Math.max(a, b), 0))) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div className="glass-light p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-light-darker">New Uploads (7d)</p>
              <p className="text-2xl font-bold mt-1">{weeklyUploads.length > 0 ? weeklyUploads.reduce((a, b) => a + b, 0) : 0}</p>
            </div>
            <div className={`flex items-center ${growthMetrics.uploadsGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {growthMetrics.uploadsGrowth >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
              <span>{Math.abs(growthMetrics.uploadsGrowth).toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-dark-light mt-2 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-green-500 rounded-full" 
              style={{ width: `${weeklyUploads.length > 0 ? Math.min(100, (weeklyUploads[6] / Math.max(1, weeklyUploads.reduce((a, b) => Math.max(a, b), 0))) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div className="glass-light p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-light-darker">Active Users</p>
              <p className="text-2xl font-bold mt-1">{totalUsers || 0}</p>
            </div>
            <div className={`flex items-center ${growthMetrics.usersGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {growthMetrics.usersGrowth >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
              <span>{Math.abs(growthMetrics.usersGrowth).toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-dark-light mt-2 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-purple-500 rounded-full" 
              style={{ width: `${totalUsers > 0 ? Math.min(100, (totalUsers / (totalUsers * 1.5)) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Main charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-light p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Daily Page Views</h3>
          <div className="h-64">
            <Line options={lineChartOptions} data={viewsData} />
          </div>
        </div>
        
        <div className="glass-light p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Weekly Uploads</h3>
          <div className="h-64">
            <Bar options={lineChartOptions} data={uploadsData} />
          </div>
        </div>
      </div>

      {/* Secondary charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-light p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Monthly Active Users</h3>
          <div className="h-64">
            <Line options={lineChartOptions} data={usersData} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {hasResourceTypeData && (
            <div className="glass-light p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Resource Types</h3>
              <div className="h-52 flex justify-center">
                <Doughnut 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: 'rgba(255, 255, 255, 0.7)',
                          boxWidth: 15,
                          padding: 10,
                          font: {
                            size: 11
                          }
                        },
                      },
                    },
                  }} 
                  data={resourceTypeData} 
                />
              </div>
            </div>
          )}

          {hasTimeSpentData && (
            <div className="glass-light p-4 rounded-lg mt-auto">
              <h3 className="text-lg font-semibold mb-2">User Activity Distribution</h3>
              <div className="h-52 flex justify-center">
                <Doughnut 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: 'rgba(255, 255, 255, 0.7)',
                          boxWidth: 15,
                          padding: 10,
                          font: {
                            size: 11
                          }
                        },
                      },
                    },
                  }} 
                  data={timeSpentData} 
                />
              </div>
            </div>
          )}

          {!hasResourceTypeData && !hasTimeSpentData && (
            <div className="glass-light p-4 rounded-lg flex items-center justify-center">
              <p className="text-light-darker">No activity data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Total resources display */}
      <div className="glass-light p-4 rounded-lg mt-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Total Resources</h3>
        <p className="text-3xl font-bold gradient-text">{totalNotes}</p>
        <p className="text-sm text-light-darker mt-1">Documents and resources available on the platform</p>
      </div>
    </div>
  );
};

export default UserEngagementChart; 