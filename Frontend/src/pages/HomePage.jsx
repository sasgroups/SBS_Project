import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { useTranslation } from "react-i18next";

// Import components
import AdBanner from "./AdBanner";
import LoadingOverlay from "../components/Homepagecomponents/LoadingOverlay";
import ScannerSection from "../components/Homepagecomponents/ScannerSection";
import ManualEntrySection from "../components/Homepagecomponents/ManualEntrySection";
import InstructionsModal from "../components/Homepagecomponents/InstructionsModal";
import Timmer from "../components/Timmer";
import AssistanceFooter from "../components/Homepagecomponents/AssistanceFooter";
import AirportHeader from "../components/Homepagecomponents/AirportHeader";
import BackgroundElements from "../components/Homepagecomponents/BackgroundElements";

// Import design tokens
import { designTokens } from "../styles/designTokens.js";

const API_URL = process.env.REACT_APP_API_URL;
const API_URL2 = process.env.REACT_APP_API_URL_KIOSK;
const socket = io(API_URL2);

const HomePage = () => {
  const [flights, setFlights] = useState([]);
  const [selectedAirline, setSelectedAirline] = useState("");
  const [selectedFlightType, setSelectedFlightType] = useState("");
  const [loadingFlight, setLoadingFlight] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [barcodeDetected, setBarcodeDetected] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  // Load flights
  useEffect(() => {
    loadFlights();
  }, []);

  // WebSocket barcode listener
  useEffect(() => {
    setupSocketListeners();
    return cleanupSocketListeners;
  }, [flights, navigate]);

  const loadFlights = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/flights`);
      setFlights(response.data);
     
    } catch (err) {
      console.error("Failed to fetch flights:", err);
      setScanError("Unable to load airline data. Please use manual entry or seek assistance.");
    }
  };

  const setupSocketListeners = () => {
    socket.on("barcode_data", handleBarcodeData);
    socket.on("connect", handleScannerConnect);
    socket.on("connect_error", handleScannerError);
  };

  const cleanupSocketListeners = () => {
    socket.off("barcode_data");
    socket.off("connect");
    socket.off("connect_error");
  };

  const handleBarcodeData = useCallback(({ barcode, details }) => {
    if (!details) {
      setScanError("Invalid boarding pass. Please try again.");
      setTimeout(() => setScanError(null), 3000);
      return;
    }

    setBarcodeDetected(true);
    processBarcodeData(details);
  }, [flights, navigate]);

  const processBarcodeData = (details) => {
    setTimeout(() => {
      const matchedFlight = findMatchingFlight(details);

      if (!matchedFlight) {
        handleFlightNotFound();
        return;
      }

      const baggageData = createBaggageData(matchedFlight, details);
      proceedToBaggageCheck(baggageData);
    }, 800);
  };

  const findMatchingFlight = (details) => {
    const scannedAirline = details.airlineName?.trim().toLowerCase();
    const scannedCode = details.airlineCode?.trim().toLowerCase();

    return flights.find((f) => {
      const airlineName = f.airline?.trim().toLowerCase();
      const airlineCode = f.code?.trim().toLowerCase();
      return (
        airlineName === scannedAirline ||
        airlineCode === scannedCode ||
        airlineName?.includes(scannedAirline) ||
        scannedAirline?.includes(airlineName)
      );
    });
  };

  const createBaggageData = (flight, details) => {
    const maxWeight = details.flightType === "Domestic"
      ? flight.max_weight_domestic
      : flight.max_weight_international;

    const maxVolume = details.flightType === "Domestic"
      ? flight.max_volume_domestic
      : flight.max_volume_international;

    return {
      airline: flight.airline,
      airlineLogo: flight.logo,
      flightType: details.flightType,
      origin: details.origin,
      destination: details.destination,
      flightNumber: details.flightNumber,
      departureTime: details.departureTime,
      maxWeight,
      maxVolume,
      passengerName: details.passengerName,
      seat: details.seat,
    };
  };

  const proceedToBaggageCheck = (baggageData) => {
    setLoadingFlight({
      name: baggageData.airline,
      logo: baggageData.airlineLogo,
      flight: baggageData.flightNumber,
    });

    setTimeout(() => {
      navigate("/baggageCheckPage", { state: { baggageData } });
      setLoadingFlight(null);
      setBarcodeDetected(false);
    }, 1500);
  };

  const handleFlightNotFound = () => {
    setScanError("Flight not found. Please try manual entry.");
    setTimeout(() => {
      setScanError(null);
      setBarcodeDetected(false);
    }, 3000);
  };

  const handleScannerConnect = () => {
    console.log("Scanner connected");
    setScanError(null);
  };

  const handleScannerError = () => {
  
    setScanError("Scanner unavailable. Please use manual entry.");
  };

  const handleManualEntry = () => {
    const match = flights.find((flight) => flight.airline === selectedAirline);
    if (!match) {
      setScanError("Please select a valid airline");
      setTimeout(() => setScanError(null), 3000);
      return;
    }

    const baggageData = createManualBaggageData(match);
    handleManualFlightLoading(baggageData);
  };

  const createManualBaggageData = (match) => ({
    airline: match.airline,
    airlineLogo: match.logo,
    flightType: selectedFlightType,
    maxWeight: selectedFlightType === "Domestic"
      ? match.max_weight_domestic
      : match.max_weight_international,
    maxVolume: selectedFlightType === "Domestic"
      ? match.max_volume_domestic
      : match.max_volume_international,
    flightNumber: "---",
    passengerName: "Manual Entry",
  });

  const handleManualFlightLoading = (baggageData) => {
    setLoadingFlight({
      name: baggageData.airline,
      logo: baggageData.airlineLogo,
    });

    setTimeout(() => {
      navigate("/baggageCheckPage", { state: { baggageData } });
      setLoadingFlight(null);
    }, 1200);
  };

  const handleScanButton = () => {
    setScanning(true);
    socket.emit("trigger_scan");
    setTimeout(() => setScanning(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-white" style={styles.pageContainer}>
      <BackgroundElements />

      {loadingFlight && <LoadingOverlay loadingFlight={loadingFlight} />}
      <div className="h-[55vh] bg-black overflow-hidden"> {/* Changed to bg-black */}
        <AdBanner />
      </div>

<Timmer/>

      <div className="h-[45vh] bg-slate-900 flex flex-col overflow-hidden">
        <AirportHeader />
        <div className="   text-white flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {/* {scanError && <ErrorAlert error={scanError} onClose={() => setScanError(null)} />} */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ScannerSection
                scanning={scanning}
                barcodeDetected={barcodeDetected}
                onScan={handleScanButton}
                onShowInstructions={() => setShowInstructions(!showInstructions)}
              />

              <ManualEntrySection
                flights={flights}
                selectedAirline={selectedAirline}
                setSelectedAirline={setSelectedAirline}
                selectedFlightType={selectedFlightType}
                setSelectedFlightType={setSelectedFlightType}
                onManualEntry={handleManualEntry}
                t={t}
              />
            </div>

            {showInstructions && <InstructionsModal onClose={() => setShowInstructions(false)} />}

            <AssistanceFooter />
          </div>
        </div>
      </div>

      <style jsx>{styles.globalStyles}</style>
    </div>
  );
};

const styles = {
  pageContainer: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
    fontWeight: 400,
  },
  globalStyles: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes progress {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }
    
    @keyframes scan {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-20px) translateX(10px); }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%) skewY(-12deg); }
      100% { transform: translateX(100%) skewY(-12deg); }
    }
    
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
    
    .animate-progress {
      animation: progress 1.5s ease-in-out infinite;
    }
    
    .animate-scan {
      animation: scan 1s linear infinite;
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.5);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.7);
    }
    
    /* Selection color */
    ::selection {
      background-color: ${designTokens.primary[500]}40;
      color: ${designTokens.neutral[900]};
    }
  `,
};

export default HomePage;