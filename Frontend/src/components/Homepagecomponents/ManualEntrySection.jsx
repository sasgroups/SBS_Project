// src/components/ManualEntrySection.js
import React from "react";

const ManualEntrySection = ({
  flights,
  selectedAirline,
  setSelectedAirline,
  selectedFlightType,
  setSelectedFlightType,
  onManualEntry,
  t
}) => {
  return (
    <div className="rounded-2xl p-1.5 bg-gradient-to-br from-slate-800/50 via-slate-800/30 to-slate-900/50 border border-slate-700/30">
      <div className="rounded-xl p-6 h-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/20">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700">
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {t("manualEntry")}
            </h2>
            <p className="text-sm mt-1 text-slate-400">
              {t("alternativeMethod")} • 2 minutes • {t("noScannerNeeded")}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                {t("selectAirline")}
              </label>
              {selectedAirline && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600">
                  ✓ {t("selected")}
                </span>
              )}
            </div>
            <select
              value={selectedAirline}
              onChange={(e) => setSelectedAirline(e.target.value)}
              className="w-full p-4 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 outline-none appearance-none bg-slate-800/50 border-slate-700 text-slate-200"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              <option value="" className="text-slate-500 bg-slate-900">
                {t("chooseAirline")}
              </option>
              {[...new Set(flights.map((f) => f.airline))].map((airline, idx) => (
                <option key={idx} value={airline} className="text-slate-300 bg-slate-900">
                  {airline}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-3 text-slate-300">
              {t("flightType")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "domestic", icon: "🏠", labelKey: "domestic", descKey: "domesticDesc" },
                { value: "international", icon: "🌎", labelKey: "international", descKey: "internationalDesc" }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedFlightType(type.value)}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                    selectedFlightType === type.value
                      ? 'border-slate-500 bg-slate-800'
                      : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-2xl opacity-90">{type.icon}</span>
                  <span className={`font-semibold ${
                    selectedFlightType === type.value ? 'text-slate-100' : 'text-slate-300'
                  }`}>
                    {t(type.labelKey)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t(type.descKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onManualEntry}
              disabled={!selectedAirline || !selectedFlightType}
              className={`w-full mt-6 py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                selectedAirline && selectedFlightType
                  ? 'bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-100 border border-slate-600 hover:border-slate-500 hover:shadow-lg hover:shadow-slate-900/30'
                  : 'bg-slate-800/30 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
                {selectedAirline && selectedFlightType
                  ? t("continueToBaggageCheck")
                  : t("selectAirlineAndType")
                }
              </div>
            </button>
            
            <p className="text-xs text-center mt-3 flex items-center justify-center gap-1 text-slate-500">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t("noPersonalDataRequired")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntrySection;