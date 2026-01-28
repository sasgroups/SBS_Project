import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Timmer from "../components/Timmer";
import axios from "axios";
import { useTranslation } from "react-i18next";
import AdBanner from "./AdBanner";
import Language from "../components/Language";

const API_URL = process.env.REACT_APP_API_URL;
const API_URL2 = process.env.REACT_APP_API_URL_KIOSK;
const API_URL3 = process.env.REACT_APP_API_URL_Camera;

export default function BaggageCheckPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { baggageData = {} } = location.state || {};

  const [currentWeight, setCurrentWeight] = useState(0);
  const [volume, setVolume] = useState(0);
  const [dimensions, setDimensions] = useState({
    height: 0,
    width: 0,
    length: 0,
  });
  const [objectDetected, setObjectDetected] = useState(false);
  const [noBagTimeout, setNoBagTimeout] = useState(false);
  const [weightStable, setWeightStable] = useState(false); // Add stability check

  const { t } = useTranslation();
  const [limits, setLimits] = useState({ maxWeight: null, maxVolume: null });
  const { airline = "", flightType = "", origin, destination } = baggageData;

  // ✅ Save baggage check result
  const handleCompleteCheck = async () => {
    // Prevent submission if weight is 0 or no baggage detected
    if (currentWeight <= 0 || volume <= 0) {
      alert(t("noBaggageDetectedAlert") || "Please place baggage on the scale");
      return;
    }

    const payload = {
      airline,
      flightType,
      origin,
      destination,
      weight: currentWeight,
      height: dimensions.height,
      width: dimensions.width,
      length: dimensions.length,
      volume,
      status: {
        weight: currentWeight <= limits.maxWeight ? "ok" : "over",
        volume: volume <= limits.maxVolume ? "ok" : "over",
      },
    };

    console.log("📦 Sending baggage data:", payload);

    try {
      const res = await axios.post(`${API_URL}/api/baggage/save-check`, payload);
      console.log("✅ Backend response:", res.data);
      navigate("/ad_player"); // redirect home
    } catch (err) {
      console.error("❌ Failed to save baggage check:", err.message);
      if (err.response) console.error("Server error:", err.response.data);
      alert("❌ Failed to save baggage check!");
    }
  };

  // Fetch weight every 1s with stability check
  useEffect(() => {
    let stableCount = 0;
    let previousWeight = 0;

    const fetchWeight = async () => {
      try {
        const res = await axios.get(`${API_URL2}/api/weight`);
        if (res.data?.weight !== undefined) {
          const newWeight = res.data.weight;
          setCurrentWeight(newWeight);
          
          // Check if weight is stable (within 0.1kg for 3 consecutive readings)
          if (Math.abs(newWeight - previousWeight) < 0.1) {
            stableCount++;
            if (stableCount >= 3 && newWeight > 0.1) {
              setWeightStable(true);
            }
          } else {
            stableCount = 0;
            setWeightStable(false);
          }
          previousWeight = newWeight;
        }
      } catch (err) {
        console.error("❌ Failed to fetch weight:", err.message);
      }
    };
    
    fetchWeight();
    const interval = setInterval(fetchWeight, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch object/dimensions every 5s
  useEffect(() => {
    let timeoutId;

    const fetchObject = async () => {
      try {
        const res = await axios.get(`${API_URL3}/api/detection`);
        if (res.data?.detected && weightStable && currentWeight > 0.1) {
          clearTimeout(timeoutId); // clear previous timeout
          setDimensions({
            height: res.data.height_cm,
            width: res.data.width_cm,
            length: res.data.length_cm,
          });
          // Fix: Proper volume calculation (L + W + H)
          const totalLinearCm = res.data.height_cm + res.data.width_cm + res.data.length_cm;
          setVolume(Math.round(totalLinearCm));
          setObjectDetected(true);
          setNoBagTimeout(false); // reset no-bag timeout
        } else {
          setDimensions({ height: 0, width: 0, length: 0 });
          setVolume(0);
          setObjectDetected(false);

          // Set timeout to show "No baggage detected" after 3s
          timeoutId = setTimeout(() => setNoBagTimeout(true), 1500);
        }
      } catch (err) {
        console.error("❌ Failed to fetch object data:", err.message);
      }
    };

    fetchObject();
    const interval = setInterval(fetchObject, 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [currentWeight, weightStable]);

  // Fetch airline limits
  useEffect(() => {
    if (baggageData.maxWeight && baggageData.maxVolume) {
      setLimits({
        maxWeight: baggageData.maxWeight,
        maxVolume: baggageData.maxVolume,
      });
    } else if (airline && flightType) {
      axios
        .get(`${API_URL}/api/flights`)
        .then((res) => {
          const match = res.data.find((f) => f.airline === airline);
          if (match) {
            setLimits({
              maxWeight:
                flightType === "Domestic"
                  ? match.max_weight_domestic
                  : match.max_weight_international,
              maxVolume:
                flightType === "Domestic"
                  ? match.max_volume_domestic
                  : match.max_volume_international,
            });
          }
        })
        .catch((err) => console.error("❌ Failed to fetch limits:", err.message));
    }
  }, [airline, flightType, baggageData]);

  const weightLimit = parseFloat(limits.maxWeight) || 0;
  const volumeLimit = parseFloat(limits.maxVolume) || 0;

  const getStatus = (value, limit) => {
    if (value <= 0) return "gray"; // No baggage
    const diff = value - limit;
    if (diff <= 0) return "green";
    if (diff > 0 && diff <= 5) return "yellow";
    return "red";
  };

  const weightStatus = getStatus(currentWeight, weightLimit);
  const volumeStatus = getStatus(volume, volumeLimit);

  const statusColors = {
    gray: {
      bg: "bg-slate-700/50",
      border: "border-slate-600/50",
      text: "text-slate-400",
      icon: "⚪",
    },
    green: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: "✅",
    },
    yellow: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: "⚠️",
    },
    red: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      icon: "❌",
    },
  };

  // Determine if baggage is properly placed
  const isBaggagePlaced = currentWeight > 0.1 && volume > 0 && objectDetected;

  // Show error if airline limits not loaded
  if (!limits.maxWeight || !limits.maxVolume) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-3">
            ❌ {t("missingData")}
          </h1>
          <p className="text-slate-300 mb-6">{t("missingDataDesc")}</p>
          <button
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
            onClick={() => navigate(-1)}
          >
            {t("goBack")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Top Ad */}
      <div style={{ height: "50vh" }}>
        <AdBanner height="100%" />
      </div>

      {/* Bottom Content */}
      <div
        className="h-full overflow-y-auto px-4"
        style={{ height: "50vh" }}
      >
        <Timmer />
        <div className="w-full">
          <Language />
        </div>

        <div className="bg-slate-800/50 text-white border border-slate-700/50 rounded-xl p-8 shadow-lg w-full max-w-7xl flex flex-col gap-6 text-center m-10 mx-auto backdrop-blur-sm">
          {!isBaggagePlaced ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-300 font-semibold">
              <span className="text-6xl mb-2">🛄</span>
              <p className="text-2xl text-slate-200">{t("No Baggage Detected")}</p>
              <p className="text-lg text-slate-400">{t("Please place your baggage on the scale")}</p>
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-500">
                  Current reading: Weight = {currentWeight.toFixed(2)} kg
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-slate-100">⚖️ {t("placeBaggage")}</h1>
                <p className="mt-2 text-slate-400">{t("scaleInstruction")}</p>
                {airline && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                    <span className="text-slate-300">✈️ {airline}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{flightType}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{origin} → {destination}</span>
                  </div>
                )}
              </div>

              {/* Measurement Cards */}
              <div className="flex justify-center gap-8 w-full max-w-7xl">
                {/* Weight Card */}
                <div
                  className={`relative w-full sm:w-[500px] p-8 rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 ${statusColors[weightStatus].bg} ${statusColors[weightStatus].border} border`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-4xl rounded-full shadow-lg p-3 border border-slate-600">
                    ⚖️
                  </div>
                  <h2 className="text-xl font-semibold mb-4 text-slate-300">{t("weight")}</h2>
                  <p className="text-7xl font-dsdigital text-slate-100">
                    {currentWeight > 0 ? currentWeight.toFixed(2) : "--"}{" "}
                    <span className="text-2xl ml-2 text-slate-400">{t("kg")}</span>
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{t("max")}:</p>
                      <p className="text-xl font-semibold text-slate-300">
                        {limits.maxWeight || "--"} {t("kg")}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${statusColors[weightStatus].bg} border ${statusColors[weightStatus].border}`}>
                      <p className={`text-lg font-semibold flex items-center gap-2 ${statusColors[weightStatus].text}`}>
                        <span>{statusColors[weightStatus].icon}</span>
                        {weightStatus === "gray"
                          ? t("noBaggage")
                          : weightStatus === "green"
                          ? t("withinLimit")
                          : weightStatus === "yellow"
                          ? t("slightlyOver")
                          : t("overLimit")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Volume Card */}
                <div
                  className={`relative w-full sm:w-[500px] p-8 rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 ${statusColors[volumeStatus].bg} ${statusColors[volumeStatus].border} border`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-4xl rounded-full shadow-lg p-3 border border-slate-600">
                    📏
                  </div>
                  <h2 className="text-xl font-semibold mb-4 text-slate-300">{t("Total Size (L+W+H)")}</h2>
                  <p className="text-7xl font-dsdigital text-slate-100 tracking-widest">
                    {volume > 0 ? volume : "--"} <span className="text-2xl ml-2 text-slate-400">cm</span>
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{t("max")}:</p>
                      <p className="text-xl font-semibold text-slate-300">
                        {limits.maxVolume || "--"} cm
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${statusColors[volumeStatus].bg} border ${statusColors[volumeStatus].border}`}>
                      <p className={`text-lg font-semibold flex items-center gap-2 ${statusColors[volumeStatus].text}`}>
                        <span>{statusColors[volumeStatus].icon}</span>
                        {volumeStatus === "gray"
                          ? t("noBaggage")
                          : volumeStatus === "green"
                          ? t("withinLimit")
                          : volumeStatus === "yellow"
                          ? t("slightlyOver")
                          : t("overLimit")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Dimensions */}
              <div className="flex justify-between gap-4 mt-6">
                <div className="flex-1 bg-slate-800/50 text-slate-100 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-400 mb-2">{t("Length")}</p>
                  <p className="text-4xl font-dsdigital text-white">
                    {dimensions.length > 0 ? dimensions.length : "--"}
                  </p>
                  <span className="text-sm text-slate-500">cm</span>
                </div>
                <div className="flex-1 bg-slate-800/50 text-slate-100 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-400 mb-2">{t("Width")}</p>
                  <p className="text-4xl font-dsdigital text-white">
                    {dimensions.width > 0 ? dimensions.width : "--"}
                  </p>
                  <span className="text-sm text-slate-500">cm</span>
                </div>
                <div className="flex-1 bg-slate-800/50 text-slate-100 p-4 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-slate-400 mb-2">{t("Height")}</p>
                  <p className="text-4xl font-dsdigital text-white">
                    {dimensions.height > 0 ? dimensions.height : "--"}
                  </p>
                  <span className="text-sm text-slate-500">cm</span>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-6 mt-10 flex-wrap justify-center">
            <button
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-200"
              onClick={() => navigate(-1)}
            >
              {t("scanAgain")}
            </button>
            <button
              className={`px-8 py-3 font-semibold rounded-xl transition-all duration-200 ${
                !isBaggagePlaced 
                  ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700" 
                  : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 hover:scale-105 shadow-lg shadow-blue-900/20"
              }`}
              onClick={handleCompleteCheck} 
              disabled={!isBaggagePlaced}
            >
              {t("completeCheck")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import Timmer from "../components/Timmer";
// import axios from "axios";
// import { useTranslation } from "react-i18next";
// import AdBanner from "./AdBanner";
// import Language from "../components/Language";

// const API_URL = process.env.REACT_APP_API_URL;
// const API_URL2 = process.env.REACT_APP_API_URL_KIOSK;

// export default function BaggageCheckPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { baggageData = {} } = location.state || {};

//   const [currentWeight, setCurrentWeight] = useState(0);
//   const [volume, setVolume] = useState(0);
//   const [dimensions, setDimensions] = useState({
//     height: 0,
//     width: 0,
//     length: 0,
//   });
//   const [objectDetected, setObjectDetected] = useState(false);
//   const [noBagTimeout, setNoBagTimeout] = useState(false);

//   const { t } = useTranslation();
//   const [limits, setLimits] = useState({ maxWeight: null, maxVolume: null });
//   const { airline = "", flightType = "", origin, destination } = baggageData;

//   // ✅ Save baggage check result
//   const handleCompleteCheck = async () => {
//     const payload = {
//       airline,
//       flightType,
//       origin,
//       destination,
//       weight: currentWeight,
//       height: dimensions.height,
//       width: dimensions.width,
//       length: dimensions.length,
//       volume,
//       status: {
//         weight: currentWeight <= limits.maxWeight ? "ok" : "over",
//         volume: volume <= limits.maxVolume ? "ok" : "over",
//       },
//     };

//     console.log("📦 Sending baggage data:", payload);

//     try {
//       const res = await axios.post(`${API_URL}/api/baggage/save-check`, payload);
//       console.log("✅ Backend response:", res.data);
//       navigate("/ad_player"); // redirect home
//     } catch (err) {
//       console.error("❌ Failed to save baggage check:", err.message);
//       if (err.response) console.error("Server error:", err.response.data);
//       alert("❌ Failed to save baggage check!");
//     }
//   };

//   // Fetch weight every 1s
//   useEffect(() => {
//     const fetchWeight = async () => {
//       try {
//         const res = await axios.get(`${API_URL2}/api/weight`);
//         if (res.data?.weight !== undefined) {
//           setCurrentWeight(res.data.weight);
//         }
//       } catch (err) {
//         console.error("❌ Failed to fetch weight:", err.message);
//       }
//     };
//     fetchWeight();
//     const interval = setInterval(fetchWeight, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   // Fetch object/dimensions every 5s
//   useEffect(() => {
//     let timeoutId;

//     const fetchObject = async () => {
//       try {
//         const res = await axios.get(`${API_URL2}/api/object`);
//         if (res.data?.detected) {
//           clearTimeout(timeoutId); // clear previous timeout
//           setDimensions({
//             height: res.data.height_cm,
//             width: res.data.width_cm,
//             length: res.data.length_cm,
//           });
//           setVolume(
//             Math.round(
//               res.data.height_cm + res.data.width_cm + res.data.length_cm
//             )
//           );
//           setObjectDetected(true);
//           setNoBagTimeout(false); // reset no-bag timeout
//         } else {
//           setDimensions({ height: 0, width: 0, length: 0 });
//           setVolume(0);
//           setObjectDetected(false);

//           // Set timeout to show "No baggage detected" after 3s
//           timeoutId = setTimeout(() => setNoBagTimeout(true), 1500);
//         }
//       } catch (err) {
//         console.error("❌ Failed to fetch object data:", err.message);
//       }
//     };

//     fetchObject();
//     const interval = setInterval(fetchObject, 5000);
//     return () => {
//       clearInterval(interval);
//       clearTimeout(timeoutId);
//     };
//   }, []);

//   // Fetch airline limits
//   useEffect(() => {
//     if (baggageData.maxWeight && baggageData.maxVolume) {
//       setLimits({
//         maxWeight: baggageData.maxWeight,
//         maxVolume: baggageData.maxVolume,
//       });
//     } else if (airline && flightType) {
//       axios
//         .get(`${API_URL}/api/flights`)
//         .then((res) => {
//           const match = res.data.find((f) => f.airline === airline);
//           if (match) {
//             setLimits({
//               maxWeight:
//                 flightType === "Domestic"
//                   ? match.max_weight_domestic
//                   : match.max_weight_international,
//               maxVolume:
//                 flightType === "Domestic"
//                   ? match.max_volume_domestic
//                   : match.max_volume_international,
//             });
//           }
//         })
//         .catch((err) => console.error("❌ Failed to fetch limits:", err.message));
//     }
//   }, [airline, flightType, baggageData]);

//   const weightLimit = parseFloat(limits.maxWeight) || 0;
//   const volumeLimit = parseFloat(limits.maxVolume) || 0;

//   const getStatus = (value, limit) => {
//     const diff = value - limit;
//     if (diff <= 0) return "green";
//     if (diff > 0 && diff <= 5) return "yellow";
//     return "red";
//   };

//   const weightStatus = getStatus(currentWeight, weightLimit);
//   const volumeStatus = getStatus(volume, volumeLimit);

//   const statusColors = {
//     green: {
//       bg: "bg-emerald-500/10",
//       border: "border-emerald-500/30",
//       text: "text-emerald-400",
//       icon: "✅",
//     },
//     yellow: {
//       bg: "bg-amber-500/10",
//       border: "border-amber-500/30",
//       text: "text-amber-400",
//       icon: "⚠️",
//     },
//     red: {
//       bg: "bg-red-500/10",
//       border: "border-red-500/30",
//       text: "text-red-400",
//       icon: "❌",
//     },
//   };

//   // Show error if airline limits not loaded
//   if (!limits.maxWeight || !limits.maxVolume) {
//     return (
//       <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900">
//         <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg max-w-md text-center">
//           <h1 className="text-2xl font-bold text-red-400 mb-3">
//             ❌ {t("missingData")}
//           </h1>
//           <p className="text-slate-300 mb-6">{t("missingDataDesc")}</p>
//           <button
//             className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
//             onClick={() => navigate(-1)}
//           >
//             {t("goBack")}
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen flex flex-col bg-slate-900">
//       {/* Top Ad */}
//       <div style={{ height: "50vh" }}>
//         <AdBanner height="100%" />
//       </div>

//       {/* Bottom Content */}
//       <div
//         className="h-full overflow-y-auto px-4"
//         style={{ height: "50vh" }}
//       >
//         <Timmer />
//         <div className="w-full">
//           <Language />
//         </div>

//         <div className="bg-slate-800/50 text-white border border-slate-700/50 rounded-xl p-8 shadow-lg w-full max-w-7xl flex flex-col gap-6 text-center m-10 mx-auto backdrop-blur-sm">
//           {!objectDetected && noBagTimeout ? (
//             <div className="flex flex-col items-center justify-center gap-4 py-20 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-300 font-semibold">
//               <span className="text-6xl mb-2">🛄</span>
//               <p className="text-2xl text-slate-200">{t("No Baggage Detected")}</p>
//               <p className="text-lg text-slate-400">{t("Please place your baggage on the scale")}</p>
//             </div>
//           ) : (
//             <>
//               <div className="mb-2">
//                 <h1 className="text-3xl font-bold text-slate-100">⚖️ {t("placeBaggage")}</h1>
//                 <p className="mt-2 text-slate-400">{t("scaleInstruction")}</p>
//                 {airline && (
//                   <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
//                     <span className="text-slate-300">✈️ {airline}</span>
//                     <span className="text-slate-400">•</span>
//                     <span className="text-slate-300">{flightType}</span>
//                     <span className="text-slate-400">•</span>
//                     <span className="text-slate-300">{origin} → {destination}</span>
//                   </div>
//                 )}
//               </div>

//               {/* Measurement Cards */}
//               <div className="flex justify-center gap-8 w-full max-w-7xl">
//                 {/* Weight Card */}
//                 <div
//                   className={`relative w-full sm:w-[500px] p-8 rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 ${statusColors[weightStatus].bg} ${statusColors[weightStatus].border} border`}
//                 >
//                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-4xl rounded-full shadow-lg p-3 border border-slate-600">
//                     ⚖️
//                   </div>
//                   <h2 className="text-xl font-semibold mb-4 text-slate-300">{t("weight")}</h2>
//                   <p className="text-7xl font-dsdigital text-slate-100">
//                     {currentWeight > 0 ? currentWeight.toFixed(2) : "--"}{" "}
//                     <span className="text-2xl ml-2 text-slate-400">{t("kg")}</span>
//                   </p>
//                   <div className="mt-6 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-slate-400">{t("max")}:</p>
//                       <p className="text-xl font-semibold text-slate-300">
//                         {limits.maxWeight || "--"} {t("kg")}
//                       </p>
//                     </div>
//                     <div className={`px-4 py-2 rounded-lg ${statusColors[weightStatus].bg} border ${statusColors[weightStatus].border}`}>
//                       <p className={`text-lg font-semibold flex items-center gap-2 ${statusColors[weightStatus].text}`}>
//                         <span>{statusColors[weightStatus].icon}</span>
//                         {weightStatus === "green"
//                           ? t("withinLimit")
//                           : weightStatus === "yellow"
//                           ? t("slightlyOver")
//                           : t("overLimit")}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Volume Card */}
//                 <div
//                   className={`relative w-full sm:w-[500px] p-8 rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-300 ${statusColors[volumeStatus].bg} ${statusColors[volumeStatus].border} border`}
//                 >
//                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-4xl rounded-full shadow-lg p-3 border border-slate-600">
//                     📏
//                   </div>
//                   <h2 className="text-xl font-semibold mb-4 text-slate-300">{t("Total Size (L+W+H)")}</h2>
//                   <p className="text-7xl font-dsdigital text-slate-100 tracking-widest">
//                     {volume > 0 ? volume : "--"} <span className="text-2xl ml-2 text-slate-400">cm</span>
//                   </p>
//                   <div className="mt-6 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm text-slate-400">{t("max")}:</p>
//                       <p className="text-xl font-semibold text-slate-300">
//                         {limits.maxVolume || "--"} cm
//                       </p>
//                     </div>
//                     <div className={`px-4 py-2 rounded-lg ${statusColors[volumeStatus].bg} border ${statusColors[volumeStatus].border}`}>
//                       <p className={`text-lg font-semibold flex items-center gap-2 ${statusColors[volumeStatus].text}`}>
//                         <span>{statusColors[volumeStatus].icon}</span>
//                         {volumeStatus === "green"
//                           ? t("withinLimit")
//                           : volumeStatus === "yellow"
//                           ? t("slightlyOver")
//                           : t("overLimit")}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Individual Dimensions */}
//              <div className="flex justify-between gap-4 mt-6">
//   <div className="flex-1 bg-slate-800/50 text-slate-100 p-4 rounded-xl border border-slate-700/50">
//     <p className="text-sm text-slate-400 mb-2">{t("Length")}</p>
//     <p className="text-4xl font-dsdigital text-white">
//       {dimensions.length > 0 ? dimensions.length : "--"}
//     </p>
//     <span className="text-sm text-slate-500">cm</span>
//   </div>
//   <div className="flex-1 bg-slate-800/50 text-slate-100 p-4 rounded-xl border border-slate-700/50">
//     <p className="text-sm text-slate-400 mb-2">{t("Width")}</p>
//     <p className="text-4xl font-dsdigital text-white">
//       {dimensions.width > 0 ? dimensions.width : "--"}
//     </p>
//     <span className="text-sm text-slate-500">cm</span>
//   </div>
//   <div className="flex-1 bg-slate-800/50 text-slate-100 p-4 rounded-xl border border-slate-700/50">
//     <p className="text-sm text-slate-400 mb-2">{t("Height")}</p>
//     <p className="text-4xl font-dsdigital text-white">
//       {dimensions.height > 0 ? dimensions.height : "--"}
//     </p>
//     <span className="text-sm text-slate-500">cm</span>
//   </div>
// </div>
//             </>
//           )}

//           {/* Action Buttons */}
//           <div className="flex gap-6 mt-10 flex-wrap justify-center">
//             <button
//               className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-200"
//               onClick={() => navigate(-1)}
//             >
//               {t("scanAgain")}
//             </button>
//             <button
//               className={`px-8 py-3 font-semibold rounded-xl transition-all duration-200 ${
//                 volume === 0 
//                   ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700" 
//                   : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 hover:scale-105 shadow-lg shadow-blue-900/20"
//               }`}
//               onClick={handleCompleteCheck} 
//               disabled={volume === 0}
//             >
//               {t("completeCheck")}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
