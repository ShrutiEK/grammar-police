"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lingo-jungle-accessibility-preferences";

const themes = [
  { label: "Default", value: "default" },
  { label: "High contrast", value: "high-contrast" },
  { label: "Dark", value: "dark" },
] as const;

const fontSizes = [
  { label: "Standard", shortLabel: "A", value: "standard" },
  { label: "Large", shortLabel: "A+", value: "large" },
  { label: "Extra large", shortLabel: "A++", value: "extra-large" },
] as const;

const letterSpacings = [
  { label: "Standard", shortLabel: "Normal", value: "standard" },
  { label: "Wide", shortLabel: "Wide", value: "wide" },
  { label: "Extra wide", shortLabel: "Wider", value: "extra-wide" },
] as const;

type Theme = (typeof themes)[number]["value"];
type FontSize = (typeof fontSizes)[number]["value"];
type LetterSpacing = (typeof letterSpacings)[number]["value"];

type AccessibilityPreferences = Readonly<{
  fontSize: FontSize;
  letterSpacing: LetterSpacing;
  theme: Theme;
}>;

const defaultPreferences: AccessibilityPreferences = {
  fontSize: "standard",
  letterSpacing: "standard",
  theme: "default",
};

function isAccessibilityPreferences(
  value: unknown,
): value is AccessibilityPreferences {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    fontSizes.some(({ value: fontSize }) => fontSize === candidate.fontSize) &&
    letterSpacings.some(
      ({ value: letterSpacing }) => letterSpacing === candidate.letterSpacing,
    ) &&
    themes.some(({ value: theme }) => theme === candidate.theme)
  );
}

function applyPreferences(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  root.dataset.fontSize = preferences.fontSize;
  root.dataset.letterSpacing = preferences.letterSpacing;
  root.dataset.theme = preferences.theme;
}

export function AccessibilityToolkit() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<AccessibilityPreferences>(defaultPreferences);

  useEffect(() => {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);

    if (!savedPreferences) {
      applyPreferences(defaultPreferences);
      return;
    }

    try {
      const parsedPreferences = JSON.parse(savedPreferences) as unknown;

      if (isAccessibilityPreferences(parsedPreferences)) {
        applyPreferences(parsedPreferences);
        const restorePreferencesTimer = window.setTimeout(() => {
          setPreferences(parsedPreferences);
        }, 0);

        return () => window.clearTimeout(restorePreferencesTimer);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    applyPreferences(defaultPreferences);
  }, []);

  function updatePreferences(updates: Partial<AccessibilityPreferences>) {
    const nextPreferences = { ...preferences, ...updates };
    setPreferences(nextPreferences);
    applyPreferences(nextPreferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  }

  function resetPreferences() {
    setPreferences(defaultPreferences);
    applyPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <aside
      aria-label="Accessibility settings"
      className="accessibility-toolkit"
    >
      <button
        aria-controls="accessibility-toolkit-panel"
        aria-expanded={isOpen}
        className="accessibility-toolkit-trigger"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span aria-hidden="true">Aa</span>
        <span>Accessibility</span>
      </button>

      {isOpen && (
        <div
          className="accessibility-toolkit-panel"
          id="accessibility-toolkit-panel"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Reading settings</h2>
              <p className="mt-1 text-base text-muted">
                Adjust this display for easier reading.
              </p>
            </div>
            <button
              aria-label="Close accessibility settings"
              className="toolkit-icon-button"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <ToolkitOptions
            label="Theme"
            options={themes}
            selectedValue={preferences.theme}
            onSelect={(theme) => updatePreferences({ theme })}
          />
          <ToolkitOptions
            label="Font size"
            options={fontSizes}
            selectedValue={preferences.fontSize}
            onSelect={(fontSize) => updatePreferences({ fontSize })}
          />
          <ToolkitOptions
            label="Letter spacing"
            options={letterSpacings}
            selectedValue={preferences.letterSpacing}
            onSelect={(letterSpacing) => updatePreferences({ letterSpacing })}
          />

          <button
            className="toolkit-reset-button"
            onClick={resetPreferences}
            type="button"
          >
            Reset reading settings
          </button>
        </div>
      )}
    </aside>
  );
}

type ToolkitOptionsProperties<Value extends string> = Readonly<{
  label: string;
  options: ReadonlyArray<{
    label: string;
    shortLabel?: string;
    value: Value;
  }>;
  selectedValue: Value;
  onSelect: (value: Value) => void;
}>;

function ToolkitOptions<Value extends string>({
  label,
  options,
  selectedValue,
  onSelect,
}: ToolkitOptionsProperties<Value>) {
  return (
    <fieldset className="toolkit-fieldset">
      <legend>{label}</legend>
      <div className="toolkit-option-grid">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <button
              aria-label={`${option.label} ${label.toLowerCase()}`}
              aria-pressed={isSelected}
              className="toolkit-option"
              key={option.value}
              onClick={() => onSelect(option.value)}
              type="button"
            >
              <span aria-hidden="true">{isSelected ? "✓ " : ""}</span>
              {option.shortLabel ?? option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
