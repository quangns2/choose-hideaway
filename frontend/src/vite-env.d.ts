/// <reference types="vite/client" />

interface Window {
  gtag_report_conversion?: (url?: string) => boolean;
}
