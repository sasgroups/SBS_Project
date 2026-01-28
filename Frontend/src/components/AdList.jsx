import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { 
  Filter, 
  Globe, 
  Monitor, 
  ListVideo, 
  ChevronDown,
  Search,
  X,
  Play,
  Image as ImageIcon,
  Video,
  Calendar,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  Edit,
  Copy,
  ExternalLink,
  Check,
  Shield
} from "lucide-react";
import ToastContext from "../components/ToastContext";

export default function AdList({ onAdDelete }) {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("all");
  const [kiosks, setKiosks] = useState([]);
  const [showKioskDropdown, setShowKioskDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAds, setSelectedAds] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingAdId, setSyncingAdId] = useState(null);
  const [deletingAdId, setDeletingAdId] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;
  
  // Use Toast Context
  const { showToast } = useContext(ToastContext);

  // Fetch kiosks
  const fetchKiosks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/kiosks/getAllKiosks`);
      setKiosks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching kiosks:", err);
      showToast({
        type: "error",
        title: "Error",
        message: "Failed to fetch kiosks. Please try again.",
      });
      setKiosks([]);
    }
  };

  // Fetch ads
  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_URL}/api/ads`;
      
      if (filter === "global") {
        url += "?global_only=true";
      } else if (filter && filter !== "all") {
        url += `?kiosk_id=${filter}`;
      }
      
      const res = await axios.get(url);
      
      let adsData = [];
      if (Array.isArray(res.data)) {
        adsData = res.data;
      } else if (res.data && Array.isArray(res.data.ads)) {
        adsData = res.data.ads;
      } else if (res.data && Array.isArray(res.data.data)) {
        adsData = res.data.data;
      } else if (res.data && typeof res.data === 'object') {
        adsData = Object.values(res.data);
      }
      
      if (!Array.isArray(adsData)) {
        console.warn("Unexpected response format, defaulting to empty array:", res.data);
        adsData = [];
      }
      
      // Add status and sync info
      const now = new Date();
      adsData = adsData.map(ad => ({
        ...ad,
        last_synced: ad.last_synced || null,
        sync_status: 'pending',
        is_active: true
      }));
      
      setAds(adsData);
      
      // Show toast on successful fetch
      if (adsData.length > 0) {
        showToast({
          type: "success",
          title: "Ads Loaded",
          message: `Successfully loaded ${adsData.length} advertisements`,
          duration: 3000,
        });
      }
    } catch (err) {
      console.error("Error fetching ads:", err);
      setError("Failed to load advertisements. Please try again.");
      showToast({
        type: "error",
        title: "Load Failed",
        message: "Failed to load advertisements. Please try again.",
        duration: 5000,
      });
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  // Force sync ad to all kiosks
  const forceSyncAd = async (adId) => {
    try {
      setSyncing(true);
      setSyncingAdId(adId);
      
      showToast({
        type: "info",
        title: "Syncing",
        message: "Sending sync command to all kiosks...",
        duration: 3000,
      });
      
      const response = await fetch(`${API_URL}/api/ads/force-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Update local state
        setAds(prev => prev.map(ad => 
          ad.id === adId 
            ? { ...ad, last_synced: new Date().toISOString(), sync_status: 'synced' }
            : ad
        ));
        
        showToast({
          type: "success",
          title: "Sync Successful",
          message: "Sync command sent to all kiosks successfully!",
          duration: 4000,
        });
      } else {
        throw new Error('Sync command failed');
      }
    } catch (error) {
      console.error('Force sync failed:', error);
      showToast({
        type: "error",
        title: "Sync Failed",
        message: "Failed to sync advertisement. Please try again.",
        duration: 5000,
      });
    } finally {
      setSyncing(false);
      setSyncingAdId(null);
    }
  };

// In AdList.js, update the deleteAd function:
const deleteAd = async (id, adData) => {
  setDeletingAdId(id);
  
  showToast({
    type: "warning",
    title: "Confirm Delete",
    message: `Are you sure you want to delete "${adData.filename}"?`,
    duration: 6000,
    action: {
      label: "Delete",
      onClick: async () => {
        try {
          await axios.delete(`${API_URL}/api/ads/${id}`);
          
          // IMPORTANT: Call onAdDelete with proper structure
          if (onAdDelete) {
            onAdDelete(id, adData); // This triggers the WebSocket event
          }
          
          // ... rest of the function
        } catch (err) {
          // ... error handling
        }
      }
    }
  });
  
  setDeletingAdId(null);
};

  // Bulk delete
  const bulkDelete = async () => {
    if (selectedAds.length === 0) {
      showToast({
        type: "warning",
        title: "No Selection",
        message: "Please select ads to delete first.",
        duration: 3000,
      });
      return;
    }
    
    // Show confirmation toast
    showToast({
      type: "warning",
      title: "Confirm Bulk Delete",
      message: `Are you sure you want to delete ${selectedAds.length} selected ads?`,
      duration: 6000,
      action: {
        label: "Delete All",
        onClick: async () => {
          try {
            const deletePromises = selectedAds.map(id => 
              axios.delete(`${API_URL}/api/ads/${id}`)
            );
            await Promise.all(deletePromises);
            
            // Store names for toast message
            const deletedNames = ads
              .filter(ad => selectedAds.includes(ad.id))
              .map(ad => ad.filename)
              .join(", ");
            
            // Update local state
            setAds(prev => prev.filter(ad => !selectedAds.includes(ad.id)));
            setSelectedAds([]);
            
            showToast({
              type: "success",
              title: "Bulk Delete Successful",
              message: `${selectedAds.length} ads have been deleted successfully.`,
              duration: 5000,
            });
          } catch (err) {
            console.error("Error deleting ads:", err);
            showToast({
              type: "error",
              title: "Delete Failed",
              message: "Failed to delete advertisements. Please try again.",
              duration: 5000,
            });
          }
        }
      }
    });
  };

  // Toggle select ad
  const toggleSelectAd = (id) => {
    setSelectedAds(prev => 
      prev.includes(id) 
        ? prev.filter(adId => adId !== id)
        : [...prev, id]
    );
    
    const ad = ads.find(a => a.id === id);
    if (ad) {
      const action = selectedAds.includes(id) ? "deselected" : "selected";
      showToast({
        type: "info",
        title: action === "selected" ? "Ad Selected" : "Ad Deselected",
        message: `"${ad.filename}" ${action}`,
        duration: 2000,
      });
    }
  };

  // Select all ads
  const selectAllAds = () => {
    if (!Array.isArray(filteredAds)) return;
    
    if (selectedAds.length === filteredAds.length) {
      setSelectedAds([]);
      showToast({
        type: "info",
        title: "All Deselected",
        message: "All ads have been deselected.",
        duration: 2000,
      });
    } else {
      setSelectedAds(filteredAds.map(ad => ad.id));
      showToast({
        type: "info",
        title: "All Selected",
        message: `All ${filteredAds.length} ads have been selected.`,
        duration: 2000,
      });
    }
  };

  // Filter ads based on search
  const filteredAds = Array.isArray(ads) ? ads.filter(ad => {
    if (!ad) return false;
    
    const filename = ad.filename || '';
    const type = ad.type || '';
    const kioskId = ad.kiosk_id || '';
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      filename.toLowerCase().includes(searchLower) ||
      type.toLowerCase().includes(searchLower) ||
      (kioskId && `kiosk ${kioskId}`.includes(searchLower))
    );
  }) : [];

  // Get filter display name
  const getFilterDisplayName = () => {
    if (filter === "all") return "All Ads";
    if (filter === "global") return "Global Ads";
    
    const selectedKiosk = kiosks.find(k => String(k.id) === filter);
    return selectedKiosk ? `${selectedKiosk.name}` : "Select Kiosk";
  };

  // Copy ad URL to clipboard
  const copyAdUrl = async (filename) => {
    try {
      const url = `${API_URL}/uploads/${filename}`;
      await navigator.clipboard.writeText(url);
      
      showToast({
        type: "success",
        title: "URL Copied",
        message: "Advertisement URL copied to clipboard!",
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast({
        type: "error",
        title: "Copy Failed",
        message: "Failed to copy URL. Please try again.",
        duration: 3000,
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilter("all");
    setSearchTerm("");
    showToast({
      type: "info",
      title: "Filters Cleared",
      message: "All filters have been cleared.",
      duration: 3000,
    });
  };

  useEffect(() => {
    fetchKiosks();
    fetchAds();
  }, [filter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.kiosk-dropdown')) {
        setShowKioskDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Safely calculate stats
  const totalAds = Array.isArray(ads) ? ads.length : 0;
  const globalAds = Array.isArray(ads) ? ads.filter(ad => !ad?.kiosk_id).length : 0;
  const activeAds = Array.isArray(ads) ? ads.filter(ad => ad.is_active !== false).length : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Advertisement Library</h1>
            <p className="text-blue-100">Manage and organize your kiosk advertisements</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalAds}</div>
              <div className="text-sm text-blue-200">Total Ads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{globalAds}</div>
              <div className="text-sm text-blue-200">Global Ads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{activeAds}</div>
              <div className="text-sm text-blue-200">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
          <button 
            onClick={fetchAds}
            className="mt-2 text-sm underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Side - Filters and Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            {/* Kiosk Filter Dropdown */}
            <div className="relative kiosk-dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowKioskDropdown(!showKioskDropdown);
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 min-w-[200px]"
              >
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 flex-1 text-left">
                  {getFilterDisplayName()}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                  showKioskDropdown ? "rotate-180" : ""
                }`} />
              </button>

              {showKioskDropdown && (
                <div className="absolute z-50 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
                  <div className="p-3">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search kiosks..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Quick Filter Options */}
                    <div className="space-y-1 mb-3">
                      <div
                        onClick={() => {
                          setFilter("all");
                          setShowKioskDropdown(false);
                          showToast({
                            type: "info",
                            title: "Filter Applied",
                            message: "Showing all advertisements",
                            duration: 2000,
                          });
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                          filter === "all" ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <ListVideo className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">All Ads</span>
                        </div>
                        {filter === "all" && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      
                      <div
                        onClick={() => {
                          setFilter("global");
                          setShowKioskDropdown(false);
                          showToast({
                            type: "info",
                            title: "Filter Applied",
                            message: "Showing global advertisements only",
                            duration: 2000,
                          });
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                          filter === "global" ? "bg-green-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Global Ads</span>
                        </div>
                        {filter === "global" && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                        Specific Kiosks ({kiosks.length})
                      </div>
                      {kiosks.map((kiosk) => (
                        <div
                          key={kiosk.id}
                          onClick={() => {
                            setFilter(String(kiosk.id));
                            setShowKioskDropdown(false);
                            showToast({
                              type: "info",
                              title: "Filter Applied",
                              message: `Showing ads for ${kiosk.name}`,
                              duration: 2000,
                            });
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer mb-1 ${
                            filter === String(kiosk.id) ? "bg-purple-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded ${
                              filter === String(kiosk.id) ? "bg-purple-100" : "bg-gray-100"
                            }`}>
                              <Monitor className={`w-4 h-4 ${
                                filter === String(kiosk.id) ? "text-purple-600" : "text-gray-600"
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{kiosk.name}</div>
                              <div className="text-xs text-gray-500">ID: {kiosk.id}</div>
                            </div>
                          </div>
                          {filter === String(kiosk.id) && (
                            <Check className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ads by filename, type, or kiosk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    showToast({
                      type: "info",
                      title: "Search Cleared",
                      message: "Search filter has been cleared",
                      duration: 2000,
                    });
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Clear Filters Button */}
            {(filter !== "all" || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Right Side - Actions and View Toggle */}
          <div className="flex items-center space-x-3">
            {/* Bulk Actions */}
            {selectedAds.length > 0 && (
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-sm text-gray-600">
                  {selectedAds.length} selected
                </span>
                <button
                  onClick={bulkDelete}
                  disabled={deletingAdId}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {deletingAdId ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Delete All</span>
                </button>
              </div>
            )}

            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  setViewMode("grid");
                  showToast({
                    type: "info",
                    title: "View Changed",
                    message: "Switched to grid view",
                    duration: 2000,
                  });
                }}
                className={`px-3 py-2 ${
                  viewMode === "grid" 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => {
                  setViewMode("list");
                  showToast({
                    type: "info",
                    title: "View Changed",
                    message: "Switched to list view",
                    duration: 2000,
                  });
                }}
                className={`px-3 py-2 ${
                  viewMode === "list" 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                List
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchAds}
              disabled={loading}
              className="p-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Refresh ads"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Select All (if there are ads) */}
      {filteredAds.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedAds.length === filteredAds.length && filteredAds.length > 0}
              onChange={selectAllAds}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {selectedAds.length > 0 
                ? `${selectedAds.length} ads selected`
                : "Select all ads"}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {filteredAds.length} ads found • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading advertisements...</p>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? "No ads match your search criteria"
              : filter === "global" 
                ? "No global ads available"
                : filter !== "all" 
                  ? "No ads available for this kiosk"
                  : "No ads available. Upload some to get started!"
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                showToast({
                  type: "info",
                  title: "Search Cleared",
                  message: "Search filter has been cleared",
                  duration: 2000,
                });
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAds.map((ad) => (
            <div 
              key={ad.id} 
              className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg group ${
                selectedAds.includes(ad.id) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
              }`}
            >
              {/* Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedAds.includes(ad.id)}
                  onChange={() => toggleSelectAd(ad.id)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </div>

              {/* Media Preview */}
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                {ad.type === "image" ? (
                  <img
                    src={`${API_URL}/uploads/${ad.filename}`}
                    alt={ad.filename || "Advertisement"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                    }}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={`${API_URL}/uploads/${ad.filename}`}
                      className="w-full h-full object-cover"
                      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%234f46e5'/%3E%3Cpath d='M115 80l60 40-60 40z' fill='%23fff'/%3E%3C/svg%3E"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-80" />
                    </div>
                  </div>
                )}
                
                {/* Type Badge */}
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  ad.type === "image" 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {ad.type ? ad.type.toUpperCase() : 'UNKNOWN'}
                </div>

                {/* Sync Status */}
                <div className="absolute bottom-3 right-3 flex items-center space-x-1">
                  {ad.last_synced && (
                    <span className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded">
                      Synced
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 truncate mb-1" title={ad.filename}>
                    {ad.filename || 'Unnamed File'}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-3 h-3 mr-1" />
                    {ad.created_at ? new Date(ad.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Unknown date'}
                  </div>
                  
                  {/* Kiosk Badge */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    ad.kiosk_id 
                      ? "bg-purple-100 text-purple-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {ad.kiosk_id ? (
                      <>
                        <Monitor className="w-3 h-3 mr-1.5" />
                        Kiosk #{ad.kiosk_id}
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 mr-1.5" />
                        All Kiosks
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copyAdUrl(ad.filename)}
                    className="flex items-center justify-center space-x-1.5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    title="Copy URL to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy URL</span>
                  </button>
                  <button
                    onClick={() => forceSyncAd(ad.id)}
                    disabled={syncing && syncingAdId === ad.id}
                    className="flex items-center justify-center space-x-1.5 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    title="Force sync to all kiosks"
                  >
                    {syncing && syncingAdId === ad.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Shield className="w-4 h-4" />
                    )}
                    <span>Force Sync</span>
                  </button>
                  <a
                    href={`${API_URL}/uploads/${ad.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-1.5 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                    title="Preview in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Preview</span>
                  </a>
                  <button
                    onClick={() => deleteAd(ad.id, ad)}
                    disabled={deletingAdId === ad.id}
                    className="flex items-center justify-center space-x-1.5 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    title="Delete advertisement"
                  >
                    {deletingAdId === ad.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAds.length === filteredAds.length && filteredAds.length > 0}
                      onChange={selectAllAds}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Media</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Filename</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Distribution</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Uploaded</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Synced</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedAds.includes(ad.id)}
                        onChange={() => toggleSelectAd(ad.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex-shrink-0 h-16 w-24 rounded overflow-hidden bg-gray-100 relative group">
                        {ad.type === "image" ? (
                          <img
                            src={`${API_URL}/uploads/${ad.filename}`}
                            alt={ad.filename}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/96x64?text=Image";
                            }}
                          />
                        ) : (
                          <>
                            {/* Static Video Icon */}
                            <div className="h-full w-full bg-indigo-600 flex items-center justify-center">
                              <Video className="w-8 h-8 text-white" />
                            </div>
                            
                            {/* Video Overlay on Hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/90">
                              <video
                                src={`${API_URL}/uploads/${ad.filename}`}
                                className="h-full w-full object-cover"
                                muted
                                loop
                                preload="metadata"
                                autoPlay
                                onMouseEnter={(e) => e.target.play()}
                                onMouseLeave={(e) => {
                                  e.target.pause();
                                  e.target.currentTime = 0;
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.target.paused ? e.target.play() : e.target.pause();
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                              <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                                  Click to pause/play
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 truncate max-w-xs">
                        {ad.filename || 'Unnamed File'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ad.type === "image" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {ad.type === "image" ? (
                          <ImageIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <Video className="w-3 h-3 mr-1" />
                        )}
                        {ad.type ? ad.type.toUpperCase() : 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ad.kiosk_id 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {ad.kiosk_id ? (
                          <>
                            <Monitor className="w-3 h-3 mr-1" />
                            Kiosk #{ad.kiosk_id}
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Global
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {ad.created_at ? new Date(ad.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-500">
                        {ad.last_synced 
                          ? new Date(ad.last_synced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Never'
                        }
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => copyAdUrl(ad.filename)}
                          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => forceSyncAd(ad.id)}
                          disabled={syncing && syncingAdId === ad.id}
                          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                          title="Force Sync"
                        >
                          {syncing && syncingAdId === ad.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={`${API_URL}/uploads/${ad.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => deleteAd(ad.id, ad)}
                          disabled={deletingAdId === ad.id}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingAdId === ad.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredAds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredAds.length}</span> of <span className="font-medium">{totalAds}</span> ads
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to Top
            </button>
            <button 
              onClick={fetchAds}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}