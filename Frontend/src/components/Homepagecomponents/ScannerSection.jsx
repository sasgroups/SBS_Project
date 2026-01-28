import React from "react";
import { useTranslation } from "react-i18next";

const ScannerSection = ({ scanning, barcodeDetected, onScan, onShowInstructions }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl p-1.5 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/30">
      <div className="rounded-xl p-6 h-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
                <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  {t("scanBoardingPass")}
                </h2>
                <p className="text-sm mt-1 text-slate-400">
                  {t("fastestMethod")} • {t("seconds", { seconds: 30 })} • {t("recommended")}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-600">
            <div className={`w-2 h-2 rounded-full ${scanning ? 'bg-blue-500 animate-pulse' : barcodeDetected ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
            <span className={`text-xs whitespace-nowrap font-medium ${scanning ? 'text-blue-400' : barcodeDetected ? 'text-emerald-400' : 'text-slate-300'}`}>
              {scanning ? t("scanning") : barcodeDetected ? t("detected") : t("scannerReady")}
            </span>
          </div>
        </div>

        <div className="relative mb-8">
          <div className={`relative p-8 rounded-xl border transition-all duration-300 ${
            barcodeDetected 
              ? 'border-emerald-500/50 bg-slate-800/60' 
              : scanning 
              ? 'border-blue-500/50 bg-slate-800/60' 
              : 'border-dashed border-slate-600 bg-slate-800/40'
          }`}>
            {scanning && (
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent animate-scan"></div>
              </div>
            )}
            
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                barcodeDetected 
                  ? 'bg-emerald-500/10 animate-pulse' 
                  : scanning 
                  ? 'bg-blue-500/10' 
                  : 'bg-slate-800 border border-slate-700'
              }`}></div>
              <img
                src="https://img.icons8.com/color/144/barcode-scanner.png"
                alt={t("scanIconAlt")}
                className={`relative z-10 w-16 h-16 transition-all duration-300 filter ${scanning ? 'brightness-125 scale-110' : 'brightness-110'}`}
              />
              
              {barcodeDetected && (
                <div className="absolute -top-2 -right-2 z-20">
                  <div className="bg-emerald-500 text-white p-2 rounded-full border border-emerald-400/30">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div 
                  key={i}
                  className={`h-8 transition-all duration-300 ${
                    scanning ? 'animate-pulse' : ''
                  }`}
                  style={{
                    width: `${Math.random() * 16 + 8}px`,
                    backgroundColor: scanning ? '#3b82f6' : '#475569',
                    opacity: scanning ? 0.7 : 0.4,
                    borderRadius: '4px',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <h3 className={`text-lg font-semibold mb-2 transition-colors ${
              barcodeDetected ? 'text-emerald-400' : scanning ? 'text-blue-400' : 'text-slate-200'
            }`}>
              {barcodeDetected 
                ? t("boardingPassDetected")
                : scanning 
                ? t("scanningInProgress")
                : t("readyToScan")
              }
            </h3>
            <p className="text-sm text-slate-500">
              {barcodeDetected 
                ? t("processingFlightInfo")
                : t("holdPass")
              }
            </p>
          </div>
        </div>

        {/* <button
          onClick={onScan}
          disabled={scanning || barcodeDetected}
          className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
            scanning || barcodeDetected
              ? 'bg-slate-800/30 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-100 border border-slate-600 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-900/30'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <svg className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {scanning ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            {scanning ? t("scanning") : barcodeDetected ? t("processing") : t("startScanning")}
          </div>
        </button> */}

        <button
          onClick={onShowInstructions}
          className="mt-4 text-sm font-medium flex items-center gap-2 mx-auto hover:opacity-80 transition-opacity text-slate-400 hover:text-slate-300"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("howToScanProperly")}
        </button>
      </div>
    </div>
  );
};

export default ScannerSection;