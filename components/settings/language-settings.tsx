"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguageStore } from "@/lib/services/languageService";

export default function LanguageSettings() {
  const { currentLanguage, setLanguage, t } = useLanguageStore();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as 'en' | 'id');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Language Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select Language
            </label>
            <Select value={currentLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Current language: {currentLanguage === 'en' ? 'English' : 'Indonesia'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}