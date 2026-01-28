import React from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },       // Bengali
  { code: "tl", label: "Tagalog" },    // Filipino/Tagalog
  // { code: "ml", label: "മലയാളം" }
];

export default function LanguageTabs() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    // Handle RTL when Arabic is selected
  };

  return (
    <div className="flex justify-center w-full items-center py-3 px-4 border-b border-slate-800">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-center gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`px-4 py-2.5 text-xl font-medium transition-all duration-200 ${
                i18n.language === lang.code
                  ? "text-slate-100 border-b-2 border-slate-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}