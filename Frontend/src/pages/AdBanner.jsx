import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;
const DB_NAME = "AdBannerCacheDB";
const DB_VERSION = 1;

export default function AdBanner() {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [KIOSK_ID, setKioskId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ total: 0, size: '0 MB' });
  
  const mediaCache = useRef(new Map());
  const nextAdTimer = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const dbRef = useRef(null);

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
        console.log("IndexedDB opened successfully");
        resolve(dbRef.current);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for cached media
        if (!db.objectStoreNames.contains('cached_media')) {
          const store = db.createObjectStore('cached_media', { keyPath: 'id' });
          store.createIndex('filename', 'filename', { unique: false });
          store.createIndex('cached_at', 'cached_at', { unique: false });
        }
        
        // Create object store for metadata
        if (!db.objectStoreNames.contains('ad_metadata')) {
          db.createObjectStore('ad_metadata', { keyPath: 'id' });
        }
      };
    });
  }, [KIOSK_ID]);

  // Get media from cache
  const getMediaFromCache = useCallback(async (adId) => {
    if (!dbRef.current) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(['cached_media'], 'readonly');
      const store = transaction.objectStore('cached_media');
      const request = store.get(adId);
      
      request.onsuccess = () => {
        const cachedData = request.result;
        if (cachedData && cachedData.blob) {
          const url = URL.createObjectURL(cachedData.blob);
          resolve({
            ...cachedData,
            local_url: url,
            cached: true
          });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        resolve(null);
      };
    });
  }, []);

  // Save media to cache
  const saveMediaToCache = useCallback(async (ad, blob) => {
    if (!dbRef.current || !ad || !blob) return;
    
    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(['cached_media', 'ad_metadata'], 'readwrite');
      const mediaStore = transaction.objectStore('cached_media');
      const metaStore = transaction.objectStore('ad_metadata');
      
      // Prepare media data
      const mediaData = {
        id: ad.id,
        filename: ad.filename,
        blob: blob,
        size: blob.size,
        type: blob.type,
        cached_at: new Date().toISOString(),
        ad_type: ad.type || (blob.type.startsWith('video/') ? 'video' : 'image')
      };
      
      // Save metadata
      const metaData = {
        id: ad.id,
        filename: ad.filename,
        type: ad.type,
        title: ad.title || '',
        updated_at: ad.updated_at || new Date().toISOString(),
        kiosk_id: ad.kiosk_id,
        cached_at: new Date().toISOString()
      };
      
      const mediaRequest = mediaStore.put(mediaData);
      const metaRequest = metaStore.put(metaData);
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }, []);

  // Update cache info
  const updateCacheInfo = async () => {
    if (!dbRef.current) return;
    
    try {
      const transaction = dbRef.current.transaction(['cached_media'], 'readonly');
      const store = transaction.objectStore('cached_media');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const files = request.result;
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        setCacheInfo({
          total: files.length,
          size: `${sizeMB} MB`
        });
      };
    } catch (error) {
      console.error('Error updating cache info:', error);
    }
  };

  // Get KIOSK_ID from localStorage on component mount
  useEffect(() => {
    const kioskId = localStorage.getItem("kiosk_id");
    if (kioskId) {
      setKioskId(kioskId);
    } else {
      console.warn("No KIOSK_ID found in localStorage");
      setError("Kiosk ID not found. Please set up the kiosk.");
      setIsLoading(false);
    }
  }, []);

  // Initialize database
  useEffect(() => {
    if (!KIOSK_ID) return;
    
    const initDatabase = async () => {
      try {
        await initDB();
        await updateCacheInfo();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initDatabase();
  }, [KIOSK_ID, initDB]);

  // Function to get ad source with caching support
  const getAdSource = useCallback(async (ad) => {
    if (!ad) return "";
    
    // Try to get from cache first
    if (ad.id) {
      const cachedMedia = await getMediaFromCache(ad.id);
      if (cachedMedia && cachedMedia.local_url) {
        return cachedMedia.local_url;
      }
    }
    
    // Fallback to server URL
    if (ad.url) {
      return ad.url;
    }
    
    // Construct URL from filename
    if (ad.filename) {
      return `${API_URL}/uploads/${ad.filename}`;
    }
    
    return "";
  }, [API_URL, getMediaFromCache]);

  // Determine if ad is video
  const isAdVideo = useCallback((ad) => {
    return ad.type?.toLowerCase() === "video" || 
           ad.filename?.endsWith(".mp4") ||
           ad.filename?.endsWith(".webm") ||
           ad.filename?.endsWith(".mov");
  }, []);

  // Preload media and store in cache
  const preloadMedia = useCallback(async (ad) => {
    const isVideo = isAdVideo(ad);
    const adSource = await getAdSource(ad);
    
    return new Promise((resolve) => {
      // Try cache first
      if (ad.id) {
        getMediaFromCache(ad.id).then(cachedMedia => {
          if (cachedMedia && cachedMedia.local_url) {
            // Already cached
            mediaCache.current.set(ad.filename, {
              type: isVideo ? "video" : "image",
              local_url: cachedMedia.local_url,
              duration: isVideo ? (cachedMedia.duration || 15000) : 7000,
              loaded: true,
              cached: true,
              ad: ad,
              source: cachedMedia.local_url
            });
            resolve(true);
            return;
          }
          
          // Not in cache, download and cache
          fetchAndCacheMedia(ad, isVideo, adSource).then(success => {
            resolve(success);
          });
        });
      } else {
        // No id, just fetch without caching
        fetchMediaWithoutCache(ad, isVideo, adSource).then(success => {
          resolve(success);
        });
      }
    });
  }, [isAdVideo, getAdSource, getMediaFromCache]);

  // Fetch and cache media
  const fetchAndCacheMedia = async (ad, isVideo, adSource) => {
    return new Promise((resolve) => {
      if (isVideo) {
        const video = document.createElement("video");
        video.src = adSource;
        video.preload = "auto";
        video.muted = true;
        
        video.addEventListener("loadeddata", async () => {
          try {
            // Fetch the video blob
            const response = await fetch(adSource);
            const blob = await response.blob();
            
            // Save to cache
            await saveMediaToCache(ad, blob);
            
            const url = URL.createObjectURL(blob);
            mediaCache.current.set(ad.filename, {
              type: "video",
              local_url: url,
              duration: video.duration * 1000 || 15000,
              loaded: true,
              cached: true,
              ad: ad,
              source: url
            });
            
            await updateCacheInfo();
            resolve(true);
          } catch (error) {
            console.warn(`Failed to cache video: ${adSource}`, error);
            resolve(false);
          }
        });
        
        video.addEventListener("error", () => {
          console.warn(`Failed to load video: ${adSource}`);
          mediaCache.current.set(ad.filename, {
            type: "video",
            local_url: null,
            duration: 15000,
            loaded: false,
            cached: false,
            ad: ad,
            source: adSource
          });
          resolve(false);
        });
        
        video.load();
      } else {
        // Image
        fetch(adSource)
          .then(response => response.blob())
          .then(async (blob) => {
            try {
              // Save to cache
              await saveMediaToCache(ad, blob);
              
              const url = URL.createObjectURL(blob);
              const img = new Image();
              img.src = url;
              
              img.onload = () => {
                mediaCache.current.set(ad.filename, {
                  type: "image",
                  local_url: url,
                  duration: 7000,
                  loaded: true,
                  cached: true,
                  ad: ad,
                  source: url
                });
                
                updateCacheInfo();
                resolve(true);
              };
              
              img.onerror = () => {
                console.warn(`Failed to load image: ${adSource}`);
                mediaCache.current.set(ad.filename, {
                  type: "image",
                  local_url: null,
                  duration: 7000,
                  loaded: false,
                  cached: false,
                  ad: ad,
                  source: adSource
                });
                resolve(false);
              };
            } catch (error) {
              console.warn(`Failed to cache image: ${adSource}`, error);
              resolve(false);
            }
          })
          .catch(() => {
            console.warn(`Failed to fetch image: ${adSource}`);
            mediaCache.current.set(ad.filename, {
              type: "image",
              local_url: null,
              duration: 7000,
              loaded: false,
              cached: false,
              ad: ad,
              source: adSource
            });
            resolve(false);
          });
      }
    });
  };

  // Fetch media without caching (fallback)
  const fetchMediaWithoutCache = (ad, isVideo, adSource) => {
    return new Promise((resolve) => {
      if (isVideo) {
        const video = document.createElement("video");
        video.src = adSource;
        video.preload = "auto";
        video.muted = true;
        
        video.addEventListener("loadeddata", () => {
          mediaCache.current.set(ad.filename, {
            type: "video",
            local_url: adSource,
            duration: video.duration * 1000 || 15000,
            loaded: true,
            cached: false,
            ad: ad,
            source: adSource
          });
          resolve(true);
        });
        
        video.addEventListener("error", () => {
          console.warn(`Failed to load video: ${adSource}`);
          mediaCache.current.set(ad.filename, {
            type: "video",
            local_url: null,
            duration: 15000,
            loaded: false,
            cached: false,
            ad: ad,
            source: adSource
          });
          resolve(false);
        });
        
        video.load();
      } else {
        const img = new Image();
        img.src = adSource;
        
        img.onload = () => {
          mediaCache.current.set(ad.filename, {
            type: "image",
            local_url: adSource,
            duration: 7000,
            loaded: true,
            cached: false,
            ad: ad,
            source: adSource
          });
          resolve(true);
        };
        
        img.onerror = () => {
          console.warn(`Failed to load image: ${adSource}`);
          mediaCache.current.set(ad.filename, {
            type: "image",
            local_url: null,
            duration: 7000,
            loaded: false,
            cached: false,
            ad: ad,
            source: adSource
          });
          resolve(false);
        };
      }
    });
  };

  // Preload all ads
  const preloadAllAds = useCallback(async (adsList) => {
    const preloadPromises = adsList.map(ad => preloadMedia(ad));
    await Promise.all(preloadPromises);
  }, [preloadMedia]);

  // Fetch ads for the specific kiosk
  useEffect(() => {
    if (!KIOSK_ID) return;

    const fetchAds = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/api/ads/kiosk/${KIOSK_ID}`, {
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        let adsData = [];
        
        if (response.data && response.data.success === true) {
          adsData = response.data.ads || [];
        } else {
          throw new Error('Invalid response format');
        }
        
        // If no ads, use default ad
        if (!adsData.length) {
          adsData = [{
            id: 0,
            filename: "default-ad.png",
            type: "image",
            title: "Welcome",
            is_default: true
          }];
        }
        
        setAds(adsData);
        
        // Preload ads
        await preloadAllAds(adsData);
        
        // Start playing immediately after preloading
        if (adsData.length > 0) {
          playCurrentAd(adsData[0]);
        }
        
      } catch (error) {
        console.error("Failed to fetch ads:", error);
        setError("Failed to load advertisements");
        
        // Fallback to default ad
        const defaultAd = [{
          id: 0,
          filename: "default-ad.png",
          type: "image",
          title: "Welcome",
          is_default: true
        }];
        
        setAds(defaultAd);
        await preloadAllAds(defaultAd);
        
        if (defaultAd.length > 0) {
          playCurrentAd(defaultAd[0]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAds();
    
    // Auto-refresh ads every 5 minutes
    const refreshInterval = setInterval(fetchAds, 5 * 60 * 1000);
    
    return () => {
      if (nextAdTimer.current) clearTimeout(nextAdTimer.current);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
      
      // Clean up blob URLs
      mediaCache.current.forEach(item => {
        if (item.local_url && item.cached) {
          URL.revokeObjectURL(item.local_url);
        }
      });
      mediaCache.current.clear();
      
      clearInterval(refreshInterval);
    };
  }, [KIOSK_ID, preloadAllAds]);

  // Play current ad
  const playCurrentAd = useCallback((ad) => {
    if (!ad) return;
    
    const cachedAd = mediaCache.current.get(ad.filename);
    const isVideo = isAdVideo(ad);
    
    // Clear previous timer
    if (nextAdTimer.current) clearTimeout(nextAdTimer.current);
    
    if (isVideo && videoRef.current) {
      const adSource = cachedAd?.local_url || cachedAd?.source || "";
      
      if (!adSource) {
        // If no source, skip to next ad
        setCurrentAdIndex(prev => (prev + 1) % ads.length);
        return;
      }
      
      // Set video source and play
      videoRef.current.src = adSource;
      videoRef.current.load();
      
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
          
          // Set timer based on video duration
          const duration = cachedAd?.duration || 15000;
          nextAdTimer.current = setTimeout(() => {
            // Video will trigger ended event, but this is a backup
            if (videoRef.current && !videoRef.current.ended) {
              setCurrentAdIndex(prev => (prev + 1) % ads.length);
            }
          }, duration);
        }).catch((e) => {
          console.error("Video play failed:", e);
          // If video fails to play, fallback to next ad
          setCurrentAdIndex(prev => (prev + 1) % ads.length);
        });
      }
    } else {
      // For images, just set the timer
      const duration = cachedAd?.duration || 7000;
      nextAdTimer.current = setTimeout(() => {
        setCurrentAdIndex(prev => (prev + 1) % ads.length);
      }, duration);
      setIsPlaying(false);
    }
  }, [ads.length, isAdVideo]);

  // Handle video events
  const handleVideoEnded = useCallback(() => {
    if (nextAdTimer.current) clearTimeout(nextAdTimer.current);
    setCurrentAdIndex(prev => (prev + 1) % ads.length);
  }, [ads.length]);

  const handleVideoError = useCallback((e) => {
    console.error("Video error:", e);
    setIsPlaying(false);
    if (nextAdTimer.current) clearTimeout(nextAdTimer.current);
    setCurrentAdIndex(prev => (prev + 1) % ads.length);
  }, [ads.length]);

  const handleVideoCanPlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Handle image error
  const handleImageError = useCallback((e) => {
    console.error("Image load error");
    e.target.src = `${API_URL}/uploads/default-ad.png`;
  }, [API_URL]);

  // Handle ad rotation
  useEffect(() => {
    if (!ads.length || isLoading || !KIOSK_ID) return;
    
    const currentAd = ads[currentAdIndex];
    if (!currentAd) return;
    
    playCurrentAd(currentAd);
    
    return () => {
      if (nextAdTimer.current) clearTimeout(nextAdTimer.current);
    };
  }, [currentAdIndex, ads, isLoading, KIOSK_ID, playCurrentAd]);

  if (!KIOSK_ID && !isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center p-4">
          <div className="text-red-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xl font-semibold">Kiosk Not Configured</p>
          <p className="text-gray-400 mt-2">Please set up the kiosk ID in settings</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p>Loading advertisements...</p>
        </div>
      </div>
    );
  }

  if (!ads.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-2xl">No advertisements available.</p>
        </div>
      </div>
    );
  }

  const currentAd = ads[currentAdIndex];
  const cachedAd = mediaCache.current.get(currentAd.filename);
  const isVideo = isAdVideo(currentAd);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Error overlay */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/80 text-white p-3 rounded z-10">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Always render video element (hidden when not used) */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${isVideo ? 'block' : 'hidden'}`}
        muted
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        onCanPlayThrough={handleVideoCanPlay}
      />

      {/* Always render image element (hidden when not used) */}
      {!isVideo && (
        <img
          ref={imageRef}
          src={cachedAd?.local_url || cachedAd?.source || `${API_URL}/uploads/${currentAd.filename}`}
          alt={currentAd.title || "Ad"}
          className="w-full h-full object-contain"
          onError={handleImageError}
        />
      )}
      
      {/* Preload indicator */}
      {cachedAd && !cachedAd.loaded && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
            <div className="text-white text-sm">Buffering...</div>
          </div>
        </div>
      )}
      
      {/* Cache indicator (optional) */}
      {cachedAd?.cached && (
        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
          Cached
        </div>
      )}
    
    </div>
  );
}