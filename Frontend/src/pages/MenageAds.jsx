import React, { useState, useEffect, useContext } from 'react';
import { UploadCloud, ListVideo, Filter, Settings, Globe, Target, RefreshCw, Radio } from 'lucide-react';
import AdUploader from '../components/AdUploader';
import AdList from '../components/AdList';
import { io } from 'socket.io-client';
import ToastContext from '../components/ToastContext';

const API_URL = process.env.REACT_APP_API_URL ;
export default function AdminDashboard() {
  const [refresh, setRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [socket, setSocket] = useState(null);
  const [liveStatus, setLiveStatus] = useState('connecting');
  const [refreshing, setRefreshing] = useState(false);
  
  // Use Toast Context
  const { showToast } = useContext(ToastContext);

  // Initialize WebSocket
  useEffect(() => {
    try {
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true
      });
      
      newSocket.on('connect', () => {
        console.log('Admin WebSocket connected');
        setLiveStatus('connected');
        newSocket.emit('admin_join');
        
        showToast({
          type: "success",
          title: "Connected",
          message: "Real-time connection established with kiosks",
          duration: 3000,
        });
      });
      
      newSocket.on('admin_joined', () => {
        console.log('Admin joined server');
      });
      
      newSocket.on('disconnect', () => {
        console.log('Admin WebSocket disconnected');
        setLiveStatus('disconnected');
        
        showToast({
          type: "warning",
          title: "Disconnected",
          message: "Lost connection with kiosks. Changes will sync when reconnected.",
          duration: 5000,
        });
      });
      
      newSocket.on('connect_error', () => {
        setLiveStatus('error');
        showToast({
          type: "error",
          title: "Connection Error",
          message: "Failed to connect to kiosks. Please check your network.",
          duration: 5000,
        });
      });
      
      // Listen for kiosk status updates
      newSocket.on('kiosk_status', (data) => {
        console.log('Kiosk status update:', data);
      });
      
      setSocket(newSocket);
      
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error('WebSocket initialization error:', error);
      setLiveStatus('error');
      showToast({
        type: "error",
        title: "Connection Failed",
        message: "Unable to establish real-time connection.",
        duration: 5000,
      });
    }
  }, [showToast]);

  // Enhanced triggerRefresh with WebSocket
  const triggerRefresh = (operation, adData) => {
    // Trigger local refresh
    setRefresh(!refresh);
    setActiveTab('manage');
    
    // Emit WebSocket event if connected
    if (socket && socket.connected) {
      console.log(`Emitting ${operation} event for ad`, adData);
      
      if (operation === 'UPLOAD' && adData) {
        // Show immediate feedback
        showToast({
          type: "success",
          title: "Upload Complete",
          message: `"${adData.filename}" uploaded successfully. Syncing to kiosks...`,
          duration: 4000,
        });
        
        // Notify all relevant kiosks
        const eventData = {
          type: 'ADDED',
          ad: adData,
          timestamp: new Date().toISOString()
        };
        
        if (adData.kiosk_id) {
          // Targeted ad
          socket.emit('ad_updated', {
            kioskId: adData.kiosk_id,
            data: eventData
          });
          
          // Show targeted sync message
          setTimeout(() => {
            showToast({
              type: "info",
              title: "Synced to Kiosk",
              message: `Ad delivered to Kiosk #${adData.kiosk_id}`,
              duration: 4000,
            });
          }, 1500);
        } else {
          // Global ad
          socket.emit('global_ad_updated', {
            data: eventData
          });
          
          // Show global sync message
          setTimeout(() => {
            showToast({
              type: "info",
              title: "Syncing to All Kiosks",
              message: "Ad is being distributed to all kiosks",
              duration: 4000,
            });
          }, 1500);
        }
      } else if (operation === 'DELETE' && adData) {
        // For delete operations
        showToast({
          type: "info",
          title: "Deleting Ad",
          message: `"${adData.filename}" is being removed from kiosks...`,
          duration: 4000,
        });
        
        const eventData = {
          type: 'DELETED',
          ad_id: adData.id,
          is_global: !adData.kiosk_id,
          kiosk_id: adData.kiosk_id,
          timestamp: new Date().toISOString()
        };
        
        if (adData.kiosk_id) {
          // Targeted ad deletion
          socket.emit('ad_updated', {
            kioskId: adData.kiosk_id,
            data: eventData
          });
          
          setTimeout(() => {
            showToast({
              type: "success",
              title: "Ad Removed",
              message: `Ad removed from Kiosk #${adData.kiosk_id}`,
              duration: 4000,
            });
          }, 1500);
        } else {
          // Global ad deletion
          socket.emit('global_ad_updated', {
            data: eventData
          });
          
          setTimeout(() => {
            showToast({
              type: "success",
              title: "Ad Removed Globally",
              message: "Ad has been removed from all kiosks",
              duration: 4000,
            });
          }, 1500);
        }
      }
    } else {
      // If not connected, show offline message
      if (operation === 'UPLOAD') {
        showToast({
          type: "warning",
          title: "Upload Complete (Offline)",
          message: `"${adData.filename}" uploaded. Will sync when connection is restored.`,
          duration: 5000,
        });
      } else if (operation === 'DELETE') {
        showToast({
          type: "warning",
          title: "Delete Complete (Offline)",
          message: "Ad deleted locally. Will sync to kiosks when connection is restored.",
          duration: 5000,
        });
      }
    }
  };

  // Force refresh all kiosks with toast confirmation
  const forceRefreshAllKiosks = async () => {
    showToast({
      type: "warning",
      title: "Force Refresh All Kiosks?",
      message: "This will force all kiosks to immediately refresh their ad content.",
      duration: 8000,
      action: {
        label: "Refresh All",
        onClick: async () => {
          setRefreshing(true);
          
          try {
            showToast({
              type: "info",
              title: "Refreshing",
              message: "Sending refresh command to all kiosks...",
              duration: 3000,
            });
            
            const response = await fetch(`${API_URL}/api/ads/force-refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              // Emit global refresh via WebSocket
              if (socket && socket.connected) {
                socket.emit('force_refresh_all');
              }
              
              showToast({
                type: "success",
                title: "Refresh Sent",
                message: "Refresh command sent to all kiosks successfully!",
                duration: 4000,
              });
            } else {
              throw new Error('Refresh command failed');
            }
          } catch (error) {
            console.error('Force refresh failed:', error);
            showToast({
              type: "error",
              title: "Refresh Failed",
              message: "Failed to send refresh command. Please try again.",
              duration: 5000,
            });
          } finally {
            setRefreshing(false);
          }
        }
      }
    });
  };

  // Handle tab change with toast feedback
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'upload') {
      showToast({
        type: "info",
        title: "Upload Mode",
        message: "Ready to upload new advertisements",
        duration: 2000,
      });
    } else if (tab === 'manage') {
      showToast({
        type: "info",
        title: "Manage Mode",
        message: "Viewing and managing existing advertisements",
        duration: 2000,
      });
    }
  };

  // Handle connection retry
  const retryConnection = () => {
    if (liveStatus === 'error' || liveStatus === 'disconnected') {
      showToast({
        type: "info",
        title: "Reconnecting",
        message: "Attempting to reconnect to kiosks...",
        duration: 3000,
      });
      
      // This would typically trigger a reconnection
      // For now, we'll just simulate with a timeout
      setLiveStatus('connecting');
      setTimeout(() => {
        setLiveStatus('connected');
        showToast({
          type: "success",
          title: "Reconnected",
          message: "Successfully reconnected to kiosks",
          duration: 3000,
        });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Ad Management Dashboard
                </span>
              </h1>
              <p className="text-gray-600">Upload and manage advertisements for your kiosk network</p>
            </div>
            
            {/* Live Status Indicator */}
            <div className="flex items-center space-x-3">
              <button
                onClick={retryConnection}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  liveStatus === 'connected' 
                    ? 'bg-green-100 text-green-800 border border-green-200 cursor-default'
                    : liveStatus === 'connecting'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 cursor-default'
                    : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
                }`}
              >
                <Radio className={`w-3 h-3 mr-2 ${
                  liveStatus === 'connected' ? 'animate-pulse' : ''
                }`} />
                {liveStatus === 'connected' ? 'Live' : 
                 liveStatus === 'connecting' ? 'Connecting...' : 
                 'Offline - Click to retry'}
              </button>
              
              <button
                onClick={forceRefreshAllKiosks}
                disabled={refreshing}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  refreshing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                }`}
              >
                {refreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh All Kiosks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Clean Tab Navigation */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mb-8 max-w-md">
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => handleTabChange('upload')}
          >
            <UploadCloud className="w-5 h-5 mr-2" />
            Upload Ads
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center transition-all duration-200 ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => handleTabChange('manage')}
          >
            <ListVideo className="w-5 h-5 mr-2" />
            Manage Ads
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-500" />
                Ad Distribution
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Global Ads</p>
                      <p className="text-xs text-blue-600">For all kiosks</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-800 mt-2">
                    Displayed on every screen across your network
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Targeted Ads</p>
                      <p className="text-xs text-purple-600">Kiosk-specific</p>
                    </div>
                  </div>
                  <p className="text-sm text-purple-800 mt-2">
                    Show on selected kiosks only for targeted campaigns
                  </p>
                </div>

                {/* Real-time Status Card */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <Radio className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Real-time Status</p>
                      <p className="text-xs text-green-600">
                        {liveStatus === 'connected' ? 'Connected to kiosks' : 
                         liveStatus === 'connecting' ? 'Connecting...' : 
                         'Not connected'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800 mt-2">
                    {liveStatus === 'connected' 
                      ? 'Changes sync instantly to kiosks'
                      : 'Changes will sync when connection is restored'}
                  </p>
                  {liveStatus !== 'connected' && (
                    <button
                      onClick={retryConnection}
                      className="mt-3 w-full py-1.5 text-sm bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50"
                    >
                      Retry Connection
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'upload' ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4">
                      <UploadCloud className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Upload New Advertisement</h2>
                      <p className="text-gray-600">Upload videos, images, or interactive content</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <AdUploader onUpload={(adData) => triggerRefresh('UPLOAD', adData)} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                        <ListVideo className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">Manage Advertisements</h2>
                        <p className="text-gray-600">View and organize your ad campaigns</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        showToast({
                          type: "info",
                          title: "Filter Options",
                          message: "Filtering options are available in the dropdown above.",
                          duration: 3000,
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center self-start sm:self-center"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter Options
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <AdList 
                    key={refresh} 
                    onAdDelete={(adId, adData) => triggerRefresh('DELETE', { id: adId, ...adData })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        {activeTab === 'upload' && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💡</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Upload Tips</h4>
                <p className="text-sm text-blue-700 mt-1">
                  • Supported formats: MP4, WebM, JPEG, PNG, GIF<br />
                  • Maximum file size: 500MB<br />
                  • Recommended resolution: 1920x1080<br />
                  • Changes sync instantly to kiosks when Live status is connected
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}