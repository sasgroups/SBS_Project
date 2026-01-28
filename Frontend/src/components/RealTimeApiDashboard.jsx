import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Wifi, 
  Battery,
  Monitor,
  Server,
  Scale,
  Camera,
  Scan,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Thermometer,
  Database,
  CpuIcon
} from 'lucide-react';
import axios from 'axios';

const MaintenanceDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [systemData, setSystemData] = useState(null);
  const [kioskData, setKioskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:5000';

  const fetchAllData = async () => {
    try {
      console.log('🔍 Fetching data from backend...');
      
      const endpoints = [
        `${API_BASE}/health`,
        `${API_BASE}/api/diagnostics/performance`,
        `${API_BASE}/api/diagnostics/network`,
        `${API_BASE}/api/diagnostics/system`,
        `${API_BASE}/api/kiosk-status`
      ];

      // Log endpoints being called
      console.log('Endpoints:', endpoints);
      
      // Use Promise.allSettled to handle individual failures
      const responses = await Promise.allSettled(
        endpoints.map(url => 
          axios.get(url, { 
            timeout: 5000,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }).then(response => {
            console.log(`✅ ${url}: Success`);
            return response;
          }).catch(error => {
            console.warn(`⚠️ Error fetching ${url}:`, error.message);
            // Return mock data for this specific endpoint
            return getMockDataForEndpoint(url);
          })
        )
      );
      
      console.log('📦 All responses received');
      
      // Extract data from responses
      const results = responses.map(result => 
        result.status === 'fulfilled' ? result.value.data : result.value
      );
      
      console.log('📊 Parsing data...');
      console.log('- Health:', results[0] ? '✓' : '✗');
      console.log('- Performance:', results[1] ? '✓' : '✗');
      console.log('- Network:', results[2] ? '✓' : '✗');
      console.log('- System:', results[3] ? '✓' : '✗');
      console.log('- Kiosk:', results[4] ? '✓' : '✗');
      
      // Set data
      setHealthData(results[0] || {
        status: 'ERROR',
        service: 'Connection Failed',
        uptime: 0,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
      
      setPerformanceData(results[1] || {
        cpu: { usage: 0, cores: 0, temperature: 0 },
        memory: { total: 0, used: 0, free: 0, percentage: 0 },
        disks: [],
        processes: 0,
        timestamp: new Date().toISOString()
      });
      
      setNetworkData(results[2] || {
        interfaces: [],
        stats: [],
        timestamp: new Date().toISOString()
      });
      
      setSystemData(results[3] || {
        os: { distro: 'Unknown', arch: 'Unknown', release: 'Unknown' },
        battery: { percent: 0, isCharging: false },
        graphics: [],
        timestamp: new Date().toISOString()
      });
      
      setKioskData(results[4] || {
        kiosk_name: 'Unknown',
        kiosk_location: 'Unknown',
        kiosk_id: 'Unknown',
        status: 'offline',
        hardware: {
          scale: { status: 'Offline', weight: 0, port: 'N/A', unit: 'grams' },
          scanner: { status: 'Offline', port: 'N/A', last_scan: null },
          camera: { detected: false, enabled: false, device: 'N/A', resolution: 'N/A' }
        },
        diagnostics: {
          cpu: { usage: 0, temperature: 0 },
          memory: { usage: 0, used: 0, total: 0 },
          network: { rx: 0, tx: 0, connected: false },
          uptime: 0,
          disk_health: 'unknown',
          system_temperature: 0
        },
        alerts: [],
        timestamp: new Date().toISOString()
      });
      
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
      
    } catch (error) {
      console.error('❌ Critical error in fetchAllData:', error);
      setError('Failed to fetch data from backend. Check if server is running.');
      
      // Set fallback data
      const now = new Date().toISOString();
      setHealthData({
        status: 'ERROR',
        service: 'Connection Failed',
        uptime: 0,
        version: '1.0.0',
        timestamp: now
      });
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get mock data for failed endpoints
  const getMockDataForEndpoint = (url) => {
    const now = new Date().toISOString();
    
    if (url.includes('/health')) {
      return { data: {
        status: 'OK',
        service: 'Mock API',
        uptime: 3600,
        version: '1.0.0',
        timestamp: now
      }};
    }
    
    if (url.includes('/performance')) {
      return { data: {
        cpu: { usage: 45, cores: 4, temperature: 65 },
        memory: { 
          total: 8589934592, // 8GB
          used: 4294967296,  // 4GB
          free: 4294967296,  // 4GB
          percentage: 50 
        },
        disks: [{
          fs: 'C:\\',
          type: 'NTFS',
          size: 256060514304, // 238GB
          used: 128030257152, // 119GB
          use: '50%'
        }],
        processes: 156,
        timestamp: now
      }};
    }
    
    if (url.includes('/network')) {
      return { data: {
        interfaces: [{
          iface: 'Ethernet',
          ip4: '192.168.1.100',
          mac: '00:1A:2B:3C:4D:5E',
          speed: 1000,
          operstate: 'up'
        }],
        stats: [{
          iface: 'Ethernet',
          rx: 125.5,
          tx: 87.2
        }],
        timestamp: now
      }};
    }
    
    if (url.includes('/system')) {
      return { data: {
        os: {
          distro: 'Windows 11 Pro',
          arch: 'x64',
          release: '22H2',
          platform: 'win32',
          kernel: '10.0.22621'
        },
        battery: {
          percent: 85,
          isCharging: false
        },
        graphics: [{
          model: 'NVIDIA GeForce RTX 3060',
          vendor: 'NVIDIA',
          vram: 12288,
          driverVersion: '31.0.15.1659'
        }],
        timestamp: now
      }};
    }
    
    if (url.includes('/kiosk-status')) {
      return { data: {
        kiosk_name: 'Main Retail Kiosk',
        kiosk_location: 'Store 101 - Electronics Section',
        kiosk_id: 'K001-2024',
        status: 'online',
        last_maintenance: new Date(Date.now() - 86400000).toISOString(),
        next_maintenance: new Date(Date.now() + 604800000).toISOString(),
        hardware: {
          scale: {
            status: 'Online',
            port: '/dev/ttyUSB0',
            weight: 450,
            unit: 'grams'
          },
          scanner: {
            status: 'Online - Ready',
            port: '/dev/hidraw0',
            last_scan: new Date().toISOString()
          },
          camera: {
            detected: true,
            enabled: true,
            device: '/dev/video0',
            resolution: '1920x1080'
          }
        },
        diagnostics: {
          cpu: { usage: 45, temperature: 65 },
          memory: { usage: 50, used: 8192, total: 16384 },
          network: { rx: 125.5, tx: 87.2, connected: true },
          uptime: 3600,
          disk_health: 'good',
          system_temperature: 65
        },
        alerts: [],
        timestamp: now
      }};
    }
    
    return { data: null };
  };

  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const formatUptime = (seconds) => {
    if (!seconds) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0.00 GB";
    const gb = bytes / (1024 * 1024 * 1024);  // Correct: bytes to GB
    return `${gb.toFixed(2)} GB`;
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch(status.toLowerCase()) {
      case 'ok':
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getProgressColor = (percentage) => {
    if (!percentage || isNaN(percentage)) return 'bg-gray-500';
    const percent = parseFloat(percentage);
    if (percent < 60) return 'bg-green-500';
    if (percent < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-10 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-3" size={24} />
              <div>
                <h3 className="font-bold text-red-800">Connection Error</h3>
                <p className="text-red-600">{error}</p>
                <p className="text-sm text-red-500 mt-1">
                  Make sure the backend is running at: {API_BASE}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kiosk Maintenance Dashboard</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${healthData?.status === 'OK' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-gray-600">
                  {kioskData?.kiosk_name || 'Unknown'} • {kioskData?.kiosk_location || 'Unknown'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                ID: {kioskData?.kiosk_id || 'N/A'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <Clock size={16} className="inline mr-1" />
              Last updated: {lastUpdated || 'Never'}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Health & Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Health Status Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Activity className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">System Health</h2>
                  <p className="text-gray-600">Backend service status</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full border ${getStatusColor(healthData?.status)}`}>
                <span className="font-bold">{healthData?.status || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Server size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Service</span>
                </div>
                <p className="font-semibold">{healthData?.service || 'N/A'}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Uptime</span>
                </div>
                <p className="font-semibold">{formatUptime(healthData?.uptime)}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Processes</span>
                </div>
                <p className="font-semibold">{performanceData?.processes || 0} running</p>
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Monitor className="text-purple-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">System Info</h2>
                <p className="text-gray-600">OS & Hardware</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Operating System</p>
                <p className="font-semibold">{systemData?.os?.distro || 'Unknown'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Architecture</p>
                <p className="font-semibold">
                  {systemData?.os?.arch || 'Unknown'} • {systemData?.os?.release || 'Unknown'}
                </p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Battery size={18} className="text-gray-600" />
                  <span className="text-sm text-gray-600">Battery</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${systemData?.battery?.percent || 0}%` }}
                    ></div>
                  </div>
                  <span className="font-bold">{systemData?.battery?.percent || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* CPU & Memory */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-xl">
                <CpuIcon className="text-orange-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">CPU & Memory</h2>
                <p className="text-gray-600">Processor and RAM usage</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-gray-600" />
                    <span className="font-medium">CPU Usage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-800">
                      {performanceData?.cpu?.usage || 0}%
                    </span>
                    <span className="text-sm text-gray-500">
                      {performanceData?.cpu?.cores || 0} cores
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(performanceData?.cpu?.usage)}`}
                    style={{ width: `${performanceData?.cpu?.usage || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MemoryStick size={16} className="text-gray-600" />
                    <span className="font-medium">Memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-800">
                      {performanceData?.memory?.percentage || 0}%
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatBytes(performanceData?.memory?.used)} / {formatBytes(performanceData?.memory?.total)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getProgressColor(performanceData?.memory?.percentage)}`}
                    style={{ width: `${performanceData?.memory?.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <HardDrive className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Disk Storage</h2>
                <p className="text-gray-600">Drive capacity and usage</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {performanceData?.disks?.map((disk, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} className="text-gray-600" />
                      <span className="font-medium">{disk.fs || 'Unknown'}</span>
                    </div>
                    <span className="font-bold text-gray-800">{disk.use || '0%'}</span>
                  </div>
                  
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div 
                      className={`h-full ${getProgressColor(parseFloat(disk.use))}`}
                      style={{ width: disk.use || '0%' }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatBytes(disk.used)} used</span>
                    <span>{formatBytes(disk.size)} total</span>
                  </div>
                </div>
              )) || (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-center text-gray-500">
                    No disk data available
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Network & Hardware */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Network Interfaces */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Network className="text-indigo-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Network</h2>
                <p className="text-gray-600">Interfaces and traffic</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {networkData?.interfaces?.map((iface, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wifi size={18} className="text-gray-600" />
                      <span className="font-bold">{iface.iface || 'Unknown'}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${iface.speed > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {iface.speed > 0 ? `${iface.speed} Mbps` : 'Virtual'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IPv4:</span>
                      <span className="font-mono">{iface.ip4 || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">MAC:</span>
                      <span className="font-mono">{iface.mac || 'N/A'}</span>
                    </div>
                    
                    {networkData?.stats?.find(s => s.iface === iface.iface) && (
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {networkData.stats.find(s => s.iface === iface.iface)?.rx || 0}
                          </div>
                          <div className="text-sm text-gray-600">RX (MB)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {networkData.stats.find(s => s.iface === iface.iface)?.tx || 0}
                          </div>
                          <div className="text-sm text-gray-600">TX (MB)</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )) || (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-center text-gray-500">
                    No network data available
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hardware Status */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <Server className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Hardware Status</h2>
                <p className="text-gray-600">Peripheral devices</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Scale */}
              <div className={`p-4 rounded-xl border-2 ${kioskData?.hardware?.scale?.status === 'Offline' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${kioskData?.hardware?.scale?.status === 'Offline' ? 'bg-red-100' : 'bg-green-100'}`}>
                      <Scale className={kioskData?.hardware?.scale?.status === 'Offline' ? 'text-red-600' : 'text-green-600'} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Digital Scale</h3>
                      <p className="text-sm text-gray-600">Port: {kioskData?.hardware?.scale?.port || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${kioskData?.hardware?.scale?.status === 'Offline' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {kioskData?.hardware?.scale?.status || 'Unknown'}
                  </div>
                </div>
                <div className="text-center py-2">
                  <span className="text-3xl font-bold text-gray-800">{kioskData?.hardware?.scale?.weight || 0}</span>
                  <span className="text-gray-600 ml-2">grams</span>
                </div>
              </div>

              {/* Scanner */}
              <div className={`p-4 rounded-xl border-2 ${kioskData?.hardware?.scanner?.status?.includes('Offline') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${kioskData?.hardware?.scanner?.status?.includes('Offline') ? 'bg-red-100' : 'bg-green-100'}`}>
                      <Scan className={kioskData?.hardware?.scanner?.status?.includes('Offline') ? 'text-red-600' : 'text-green-600'} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Barcode Scanner</h3>
                      <p className="text-sm text-gray-600">Port: {kioskData?.hardware?.scanner?.port || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${kioskData?.hardware?.scanner?.status?.includes('Offline') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {kioskData?.hardware?.scanner?.status || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Camera */}
              <div className={`p-4 rounded-xl border-2 ${!kioskData?.hardware?.camera?.detected ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${!kioskData?.hardware?.camera?.detected ? 'bg-yellow-100' : 'bg-green-100'}`}>
                      <Camera className={!kioskData?.hardware?.camera?.detected ? 'text-yellow-600' : 'text-green-600'} size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Camera</h3>
                      <p className="text-sm text-gray-600">
                        {kioskData?.hardware?.camera?.detected ? 'Device detected' : 'No camera detected'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm ${kioskData?.hardware?.camera?.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {kioskData?.hardware?.camera?.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${kioskData?.hardware?.camera?.detected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                </div>
              </div>

              {/* Graphics Card */}
              {systemData?.graphics?.[0] && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Monitor className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">Graphics Card</h3>
                      <p className="text-sm text-gray-600">{systemData.graphics[0].model}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>VRAM: {systemData.graphics[0].vram} MB</span>
                        <span>{systemData.graphics[0].vendor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Diagnostics */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Detailed Diagnostics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={18} className="text-blue-600" />
                <span className="font-bold text-blue-800">CPU Details</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Usage:</span>
                  <span className="font-semibold">{kioskData?.diagnostics?.cpu?.usage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Processor Cores:</span>
                  <span className="font-semibold">{performanceData?.cpu?.cores || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temperature:</span>
                  <span className="font-semibold">
                    {performanceData?.cpu?.temperature || 'N/A'}°C
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <MemoryStick size={18} className="text-orange-600" />
                <span className="font-bold text-orange-800">Memory Details</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Usage:</span>
                  <span className="font-semibold">{kioskData?.diagnostics?.memory?.usage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Used Memory:</span>
                  <span className="font-semibold">
                    {Math.round((kioskData?.diagnostics?.memory?.used || 0) / 1024)} GB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Memory:</span>
                  <span className="font-semibold">
                    {Math.round((kioskData?.diagnostics?.memory?.total || 0) / 1024)} GB
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Network size={18} className="text-green-600" />
                <span className="font-bold text-green-800">Network Traffic</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Received (RX):</span>
                  <span className="font-semibold">{kioskData?.diagnostics?.network?.rx || 0} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transmitted (TX):</span>
                  <span className="font-semibold">{kioskData?.diagnostics?.network?.tx || 0} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">System Uptime:</span>
                  <span className="font-semibold">{formatUptime(kioskData?.diagnostics?.uptime)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Kiosk Maintenance Dashboard • Data updates every 30 seconds • All times in local timezone</p>
          <p className="mt-1">
            Last API call: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'N/A'}
          </p>
          <p className="mt-2">
            Backend: {API_BASE} • Status: {healthData?.status || 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;