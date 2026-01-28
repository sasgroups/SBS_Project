import React from "react";
import { useTranslation } from "react-i18next";
import Language from "../components/Language";

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 w-full z-50 text-white py-6 px-6 rounded-b-3xl shadow-md overflow-hidden">
      {/* Background Pattern */}
      <img
        src="https://www.transparenttextures.com/patterns/geometry.png"
        alt="pattern"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-500 opacity-90"></div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
        {/* Title + Subtitle */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">🧳 Smart Baggage Check</h1>
          <p className="text-base mt-2 font-light">
            Fast, accurate baggage dimension and weight detection
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center mt-4 md:mt-0">
          <p className="pr-1 text-xl">{t("language")} :</p>
          <Language />
        </div>
      </div>
    </header>
  );
};

export default Header;
