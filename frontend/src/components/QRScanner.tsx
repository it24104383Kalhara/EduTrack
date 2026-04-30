import React, { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "../css/QRScanner.css";

interface QRScannerProps {
  onScan: (text: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [scannerOn, setScannerOn] = useState(false);
  const isStartingRef = useRef(false);
  const isMounted = useRef(true);

  const startScanner = async () => {
    // Prevent multiple simultaneous start attempts
    if (isStartingRef.current || scannerOn) return;

    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    }

    isStartingRef.current = true;
    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 300 },
        (decodedText) => {
          if (isMounted.current) onScan(decodedText);
        },
        () => {}
      );
      if (isMounted.current) setScannerOn(true);
    } catch (err) {
      console.error("Unable to start scanner:", err);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (!scannerOn || !html5QrCodeRef.current) return;
    try {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
      if (isMounted.current) setScannerOn(false);
    } catch (err) {
      console.warn("Error stopping scanner:", err);
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      isMounted.current = false;
      if (html5QrCodeRef.current && scannerOn) {
        html5QrCodeRef.current.stop().catch(() => {});
        try {
          html5QrCodeRef.current.clear();
        } catch {}
      }
    };
  }, []); // Empty dependency array – starts once on mount

  return (
    <div style={{ textAlign: "center" }}>
      <div id="qr-reader" />
      {scannerOn && (
        <button onClick={stopScanner}>Stop Scanner</button>
      )}
    </div>
  );
};

export default QRScanner;