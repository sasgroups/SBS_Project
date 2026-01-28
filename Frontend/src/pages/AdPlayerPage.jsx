// WelcomeAdPage.js - WITH INDEXEDDB CACHING (CLEANED VERSION)
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:7000";
const DB_NAME = "AdCacheDB";
const DB_VERSION = 1;

export default function WelcomeAdPage() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [adIndex, setAdIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [KIOSK_ID, setKioskId] = useState(null);
  const [socket, setSocket] = useState(null);
  
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const dbRef = useRef(null);

  const carouselData = [
    {
      title: "Welcome to Smart Baggage Check",
      description: "Fast, accurate weight and dimension measurement for all airlines",
    },
    {
      title: "Touch Screen to Begin",
      description: "Place your baggage on the scale and follow the instructions",
    },
    {
      title: "Multiple Airlines Supported",
      description: "Real-time baggage limit checking for over 50 airlines worldwide",
    },
  ];

  // Initialize IndexedDB
  const initDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${DB_NAME}_${KIOSK_ID}`, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        dbRef.current = event.target.result;
        resolve(dbRef.current);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('ads_meta')) {
          const metaStore = db.createObjectStore('ads_meta', { keyPath: 'id' });
          metaStore.createIndex('filename', 'filename', { unique: false });
          metaStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('ads_files')) {
          const fileStore = db.createObjectStore('ads_files', { keyPath: 'id' });
          fileStore.createIndex('filename', 'filename', { unique: false });
        }
      };
    });
  }, [KIOSK_ID]);

  // Get ad from IndexedDB
  const getAdFromCache = useCallback(async (adId) => {
    if (!dbRef.current) return null;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(['ads_meta', 'ads_files'], 'readonly');
      const metaStore = transaction.objectStore('ads_meta');
      const fileStore = transaction.objectStore('ads_files');

      const metaRequest = metaStore.get(adId);
      const fileRequest = fileStore.get(adId);

      metaRequest.onsuccess = async () => {
        const meta = metaRequest.result;
        if (!meta) {
          resolve(null);
          return;
        }

        fileRequest.onsuccess = () => {
          const fileData = fileRequest.result;
          if (fileData && fileData.blob) {
            const blob = fileData.blob;
            const url = URL.createObjectURL(blob);
            resolve({
              ...meta,
              local_url: url,
              blob: blob
            });
          } else {
            resolve(meta);
          }
        };

        fileRequest.onerror = () => {
          resolve(meta);
        };
      };

      metaRequest.onerror = () => {
        resolve(null);
      };
    });
  }, []);

  // Save ad to IndexedDB
  const saveAdToCache = useCallback(async (ad, blob) => {
    if (!dbRef.current || !ad) return;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(['ads_meta', 'ads_files'], 'readwrite');
      const metaStore = transaction.objectStore('ads_meta');
      const fileStore = transaction.objectStore('ads_files');

      const metaData = {
        id: ad.id,
        filename: ad.filename,
        type: ad.type,
        file_hash: ad.file_hash,
        file_size: ad.file_size,
        last_modified: ad.last_modified || new Date().toISOString(),
        kiosk_id: ad.kiosk_id,
        updated_at: ad.updated_at || new Date().toISOString(),
        title: ad.title || '',
        is_default: ad.is_default || false,
        created_at: ad.created_at || new Date().toISOString()
      };

      const metaRequest = metaStore.put(metaData);

      if (blob) {
        const fileData = {
          id: ad.id,
          filename: ad.filename,
          blob: blob,
          size: blob.size,
          type: blob.type,
          cached_at: new Date().toISOString()
        };

        const fileRequest = fileStore.put(fileData);

        fileRequest.onsuccess = () => {
          resolve();
        };

        fileRequest.onerror = (event) => {
          reject(event.target.error);
        };
      } else {
        resolve();
      }

      metaRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }, []);

  // Delete ad from cache
  const deleteAdFromCache = useCallback(async (adId) => {
    if (!dbRef.current) return;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(['ads_meta', 'ads_files'], 'readwrite');
      const metaStore = transaction.objectStore('ads_meta');
      const fileStore = transaction.objectStore('ads_files');

      const metaRequest = metaStore.delete(adId);
      const fileRequest = fileStore.delete(adId);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }, []);

  // Get all cached ads
  const getAllCachedAds = useCallback(async () => {
    if (!dbRef.current) return [];

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(['ads_meta', 'ads_files'], 'readonly');
      const metaStore = transaction.objectStore('ads_meta');
      const fileStore = transaction.objectStore('ads_files');

      const metaRequest = metaStore.getAll();
      const ads = [];

      metaRequest.onsuccess = async () => {
        const metas = metaRequest.result;

        for (const meta of metas) {
          try {
            const fileRequest = fileStore.get(meta.id);

            await new Promise((fileResolve) => {
              fileRequest.onsuccess = () => {
                const fileData = fileRequest.result;
                if (fileData && fileData.blob) {
                  const url = URL.createObjectURL(fileData.blob);
                  ads.push({
                    ...meta,
                    local_url: url,
                    blob: fileData.blob
                  });
                } else {
                  ads.push(meta);
                }
                fileResolve();
              };

              fileRequest.onerror = () => {
                ads.push(meta);
                fileResolve();
              };
            });
          } catch (error) {
            ads.push(meta);
          }
        }

        resolve(ads);
      };

      metaRequest.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }, []);

  // Initialize kiosk
  useEffect(() => {
    const token = localStorage.getItem("kioskToken");
    const id = localStorage.getItem("kiosk_id");

    if (!token || !id) {
      navigate("/");
      return;
    }

    setKioskId(id);

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Clean up blob URLs
      ads.forEach(ad => {
        if (ad.local_url) {
          URL.revokeObjectURL(ad.local_url);
        }
      });
    };
  }, [navigate]);

  // Initialize cache and load ads
  useEffect(() => {
    if (!KIOSK_ID) return;

    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // Initialize IndexedDB
        await initDB();

        // Load cached ads
        const cachedAds = await getAllCachedAds();

        if (cachedAds.length > 0) {
          setAds(cachedAds);
          
          // Check for updates in background
          setTimeout(() => {
            checkForUpdates();
          }, 3000);
        } else {
          // No cache, download fresh
          await downloadFullCache();
        }

      } catch (error) {
        // Fallback to server
        fetchServerAds();
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [KIOSK_ID]);

  // Initialize WebSocket
  useEffect(() => {
    if (!KIOSK_ID) return;

    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      newSocket.emit('kiosk_join', KIOSK_ID);
    });

    newSocket.on('ad_updated', (data) => {
      handleAdUpdate(data);
    });

    newSocket.on('global_ad_updated', (data) => {
      handleAdUpdate(data);
    });

    setSocket(newSocket);

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('kiosk_heartbeat', {
          kioskId: KIOSK_ID,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      newSocket.disconnect();
    };
  }, [KIOSK_ID]);

  // Download full cache
  const downloadFullCache = async () => {
    if (!KIOSK_ID) return;

    try {
      const response = await axios.get(`${API_URL}/api/ads/kiosk/${KIOSK_ID}`, {
        params: { include_metadata: 'true' }
      });

      if (response.data.success) {
        const adsMetadata = response.data.ads || [];

        const downloadedAds = [];
        for (const ad of adsMetadata) {
          try {
            const fileResponse = await axios.get(
              ad.download_url || `${API_URL}/api/ads/download/${ad.id}?kioskId=${KIOSK_ID}`,
              { responseType: 'blob' }
            );

            await saveAdToCache(ad, fileResponse.data);

            const localUrl = URL.createObjectURL(fileResponse.data);
            downloadedAds.push({
              ...ad,
              local_url: localUrl,
              blob: fileResponse.data
            });

            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            // Skip failed downloads
          }
        }

        setAds(downloadedAds);
      }
    } catch (error) {
      fetchServerAds();
    }
  };

  // Fetch ads directly from server (fallback)
  const fetchServerAds = async () => {
    if (!KIOSK_ID) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/ads/kiosk/${KIOSK_ID}`);
      
      if (response.data.success && response.data.ads && response.data.ads.length > 0) {
        const serverAds = response.data.ads || [];
        
        const processedAds = await Promise.all(
          serverAds.map(async (ad) => {
            try {
              const cachedAd = await getAdFromCache(ad.id);
              if (cachedAd && cachedAd.local_url) {
                return cachedAd;
              }
              
              return {
                ...ad,
                local_url: null,
                url: ad.download_url || `${API_URL}/uploads/${ad.filename}`
              };
            } catch (error) {
              return {
                ...ad,
                local_url: null,
                url: ad.download_url || `${API_URL}/uploads/${ad.filename}`
              };
            }
          })
        );
        
        setAds(processedAds);
      } else {
        // No ads from server, use default
        setAds([{
          id: 0,
          filename: "default-ad.png",
          type: "image",
          title: "Welcome to Baggage Check",
          is_default: true,
          local_url: "/default-ad.png"
        }]);
      }
    } catch (error) {
      // Use default ad
      setAds([{
        id: 0,
        filename: "default-ad.png",
        type: "image",
        title: "Welcome to Baggage Check",
        is_default: true,
        local_url: "/default-ad.png"
      }]);
    }
  };

  // Check for updates
  const checkForUpdates = async () => {
    if (!KIOSK_ID) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/ads/kiosk/${KIOSK_ID}`, {
        timeout: 10000
      });
      
      if (response.data.success && response.data.ads) {
        const serverAds = response.data.ads || [];
        const serverAdIds = new Set(serverAds.map(ad => ad.id));
        const localAdIds = new Set(ads.map(ad => ad.id));
        
        // Check for differences
        const hasDeletions = Array.from(localAdIds).some(id => !serverAdIds.has(id));
        const hasAdditions = Array.from(serverAdIds).some(id => !localAdIds.has(id));
        
        if (hasDeletions || hasAdditions) {
          // Simple sync - just fetch all ads again
          fetchServerAds();
        }
      }
    } catch (error) {
      // Ignore update check errors
    }
  };

  // Handle real-time updates
  const handleAdUpdate = async (data) => {
    if (!KIOSK_ID || !data) return;

    try {
      if (!data.type) return;

      switch (data.type) {
        case 'ADDED':
          const isForThisKiosk = !data.ad || !data.ad.kiosk_id ||
            data.ad.kiosk_id == KIOSK_ID ||
            data.ad.is_global;

          if (isForThisKiosk && data.ad) {
            try {
              const fileResponse = await axios.get(
                `${API_URL}/api/ads/download/${data.ad.id}?kioskId=${KIOSK_ID}`,
                { responseType: 'blob', timeout: 10000 }
              );

              await saveAdToCache(data.ad, fileResponse.data);

              const localUrl = URL.createObjectURL(fileResponse.data);
              const newAd = {
                ...data.ad,
                local_url: localUrl,
                blob: fileResponse.data
              };

              setAds(prev => {
                const existingIndex = prev.findIndex(ad => ad.id === newAd.id);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  if (updated[existingIndex].local_url) {
                    URL.revokeObjectURL(updated[existingIndex].local_url);
                  }
                  updated[existingIndex] = newAd;
                  return updated;
                }
                return [...prev, newAd];
              });
            } catch (downloadError) {
              setAds(prev => {
                const existingIndex = prev.findIndex(ad => ad.id === data.ad.id);
                if (existingIndex >= 0) {
                  return prev;
                }
                return [...prev, data.ad];
              });
            }
          }
          break;

        case 'DELETED':
          if (!data.ad_id) return;

          setAds(prev => {
            const updated = prev.filter(ad => ad.id !== data.ad_id);
            const deletedAd = prev.find(ad => ad.id === data.ad_id);
            if (deletedAd && deletedAd.local_url) {
              URL.revokeObjectURL(deletedAd.local_url);
            }
            return updated;
          });

          try {
            await deleteAdFromCache(data.ad_id);
          } catch (cacheError) {
            // Ignore cache deletion errors
          }

          break;

        case 'UPDATED':
          // Trigger sync to get updated ad
          setTimeout(() => checkForUpdates(), 1000);
          break;
      }
    } catch (error) {
      // Fallback to full sync
      setTimeout(() => checkForUpdates(), 2000);
    }
  };

  // Get ad source - prioritize local cache
  const getAdSource = useCallback((ad) => {
    if (!ad) return "/default-ad.png";
    
    // Use local URL if available
    if (ad.local_url) {
      return ad.local_url;
    }
    
    // Fallback to server URL
    if (ad.url) {
      return ad.url;
    }
    
    if (ad.filename) {
      return `${API_URL}/uploads/${ad.filename}`;
    }
    
    return "/default-ad.png";
  }, [API_URL]);

  // Ad rotation logic with continuous video playback for single ads
  useEffect(() => {
    // If there's only one ad and it's a video, let it loop continuously
    if (ads.length === 1 && ads[0]?.type === "video") {
      return;
    }
    
    // If there's only one ad and it's an image, don't rotate
    if (ads.length <= 1) return;
    
    const currentAd = ads[adIndex];
    
    if (currentAd?.type === "image") {
      // Show image for 7 seconds
      const timer = setTimeout(() => {
        setAdIndex((prev) => (prev + 1) % ads.length);
      }, 7000);
      
      return () => clearTimeout(timer);
    }
    
    // For videos with multiple ads, handle in onEnded event
  }, [ads, adIndex]);

  // Carousel auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselData.length]);

  // Handle video end for multiple ads
  const handleVideoEnded = () => {
    // Only rotate if there are multiple ads
    if (ads.length > 1) {
      setAdIndex((prev) => (prev + 1) % ads.length);
    }
  };

  // Handle video errors
  const handleVideoError = (e) => {
    // Try to play next ad if multiple ads exist
    if (ads.length > 1) {
      setTimeout(() => {
        setAdIndex((prev) => (prev + 1) % ads.length);
      }, 1000);
    }
  };

  // Handle image errors
  const handleImageError = (e) => {
    e.target.src = "/default-ad.png";
    
    // If default also fails, go to next ad if multiple exist
    e.target.onerror = () => {
      if (ads.length > 1) {
        setTimeout(() => {
          setAdIndex((prev) => (prev + 1) % ads.length);
        }, 1000);
      }
    };
  };

  // Navigate on click
  const handleClick = () => {
    navigate("/home");
  };

  // Safely get current ad with fallback
  const currentAd = ads[adIndex] || {
    id: 0,
    filename: "default-ad.png",
    type: "image",
    title: "Welcome to Baggage Check",
    is_default: true,
    local_url: "/default-ad.png"
  };

  // Get ad source safely
  const adSource = getAdSource(currentAd);
  const isImage = currentAd.type === "image";
  const isVideo = currentAd.type === "video";
  const hasAds = ads.length > 0;
  const hasSingleVideo = ads.length === 1 && ads[0]?.type === "video";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col cursor-pointer bg-black"
      onClick={handleClick}
    >
      {/* Loading screen */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-white text-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
            Loading advertisements...
          </div>
        </div>
      )}

      {/* Top Carousel */}
      <div className="h-[11%] min-h-[120px] pb-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white p-2">
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold mb-1 tracking-tight">
            {carouselData[carouselIndex].title}
          </h1>
          <p className="text-lg mb-2 text-slate-200">{carouselData[carouselIndex].description}</p>
          <p className="text-xl text-amber-400 font-semibold">
            Touch anywhere to continue
          </p>
        </div>

        <div className="flex mt-2 gap-2">
          {carouselData.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCarouselIndex(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === carouselIndex 
                  ? "bg-white scale-110" 
                  : "bg-gray-500 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            ></button>
          ))}
        </div>
      </div>

      {/* Ad Display Area */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {hasAds ? (
          isImage ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                ref={imageRef}
                src={adSource}
                className="w-full h-full object-cover"
                alt={currentAd.title || "Advertisement"}
                loading="eager"
                onError={handleImageError}
              />
            </div>
          ) : isVideo ? (
            <div className="w-full h-full">
              <video
                ref={videoRef}
                src={adSource}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onEnded={ads.length > 1 ? handleVideoEnded : undefined} // Only end if multiple ads
                loop={hasSingleVideo} // Loop continuously if single video
                onError={handleVideoError}
                preload="auto"
                disablePictureInPicture
                disableRemotePlayback
              />
              
              <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
              
              {currentAd.title && (
                <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1.5 rounded text-sm backdrop-blur-sm">
                  {currentAd.title}
                </div>
              )}
            </div>
          ) : (
            // Unknown type, show default
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <img
                src="/default-ad.png"
                alt="Default Advertisement"
                className="w-full h-full object-cover"
              />
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <img
              src="/default-ad.png"
              alt="Default Advertisement"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-10 text-center">
              <p className="text-2xl">No advertisements available.</p>
              <p className="text-lg mt-2 text-gray-400">Touch screen to continue</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 flex justify-between items-center z-40">
        <div>
          Kiosk: {KIOSK_ID} | Ads: {ads.length}
        </div>
        <div>
          {socket?.connected ? (
            <span className="px-2 py-1 bg-green-600 rounded">Connected</span>
          ) : (
            <span className="px-2 py-1 bg-red-600 rounded">Disconnected</span>
          )}
        </div>
      </div>
      
      {/* Styles */}
      <style>{`
        video {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000;
          -webkit-transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          -webkit-perspective: 1000;
        }
        
        * {
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        /* Optimize for 4K displays */
        @media (min-width: 3840px) {
          .text-3xl { font-size: 2.5rem; }
          .text-xl { font-size: 1.75rem; }
          .text-lg { font-size: 1.5rem; }
          .text-sm { font-size: 1rem; }
        }
        
        /* Force hardware acceleration */
        .bg-black {
          -webkit-transform: translate3d(0,0,0);
          transform: translate3d(0,0,0);
        }
      `}</style>
    </div>
  );
}