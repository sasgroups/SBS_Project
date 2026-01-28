import React from "react";
import { useTranslation } from "react-i18next";

const AssistanceFooter = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-8 pt-6 border-t border-slate-700/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assistance */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <div className="p-2 rounded-lg bg-slate-700/50">
            <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200 mb-0.5">
              {t("needAssistance")}
            </p>
            <p className="text-xs text-slate-400">
              {t("call")}: <span className="font-medium text-slate-300">{t("phoneNumber")}</span>
            </p>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">
                {t("systemOperational")}
              </p>
              <p className="text-xs text-slate-500">
                {t("uptime", { percent: "98%" })}
              </p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-700"></div>
          
          <div>
            <p className="text-xs text-slate-400">
              {t("averageWaitTime")}
            </p>
            <p className="text-sm font-semibold text-slate-300">
              {t("waitTime", { minutes: 2 })}
            </p>
          </div>
        </div>
        
        {/* Security */}
        <div className="flex items-center justify-center p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-slate-300 font-medium">Secure Connection</p>
            </div>
            <p className="text-xs text-slate-500">
              {t("encryptedData")} • {t("support247")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistanceFooter;