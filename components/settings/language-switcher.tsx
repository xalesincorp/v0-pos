"use client";
import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { useLanguageStore } from "@/lib/services/languageService";

interface LanguageSwitcherProps {
  showLabel?: boolean;
  variant?: "default" | "compact";
}

export default function LanguageSwitcher({ 
  showLabel = true, 
  variant = "default" 
}: LanguageSwitcherProps) {
  const { currentLanguage, setLanguage } = useLanguageStore();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as 'en' | 'id');
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'id':
        return 'Indonesia';
      default:
        return lang;
    }
  };

  if (variant === "compact") {
    return (
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">EN</SelectItem>
          <SelectItem value="id">ID</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-sm font-medium text-foreground">
          Language
        </span>
      )}
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">
            <div className="flex items-center gap-2">
              <span>🇺🇸</span>
              <span>English</span>
            </div>
          </SelectItem>
          <SelectItem value="id">
            <div className="flex items-center gap-2">
              <span>🇮🇩</span>
              <span>Indonesia</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}