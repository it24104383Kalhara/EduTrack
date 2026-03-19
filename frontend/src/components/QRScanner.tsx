import React, { useRef, useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "./QRScanner.css";

interface QRScannerProps {
  onScan: (text: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [scannerOn, setScannerOn] = useState(false);

  const startScanner = async () => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    }

    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 300 },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {}
      );

      isRunningRef.current = true;
      setScannerOn(true);
      console.log("Scanner started");
    } catch (err) {
      console.error("Unable to start scanner:", err);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isRunningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        isRunningRef.current = false;
        setScannerOn(false);
        console.log("Scanner stopped");
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    }
  };

  // 🚀 AUTO START WHEN PAGE LOADS
  useEffect(() => {
    startScanner();

    return () => {
      if (html5QrCodeRef.current && isRunningRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        try {
          html5QrCodeRef.current.clear();
        } catch {}
      }
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div id="qr-reader" />

      {scannerOn && (
        <button onClick={stopScanner}>
          Stop Scanner
        </button>
      )}
    </div>
  );
};

export default QRScanner;