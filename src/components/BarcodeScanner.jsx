import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

// Live camera barcode scanner. Calls onDetected(barcode) once a code is read.
export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    async function start() {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined, // default camera (prefers back camera on mobile)
          videoRef.current,
          (result, err, ctrl) => {
            controlsRef.current = ctrl;
            if (result && !cancelled) {
              cancelled = true;
              ctrl.stop();
              onDetected(result.getText());
            }
          }
        );
        controlsRef.current = controls;
      } catch (e) {
        setError(
          e?.name === "NotAllowedError"
            ? "Camera access was denied. Please allow camera permission."
            : "Could not start the camera. You can search by name instead."
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, [onDetected]);

  return (
    <div className="scanner">
      <div className="scanner-video-wrap">
        <video ref={videoRef} className="scanner-video" muted playsInline />
        <div className="scanner-reticle" />
      </div>
      {error ? (
        <p className="scanner-error">{error}</p>
      ) : (
        <p className="scanner-hint">Point your camera at a product barcode</p>
      )}
      <button className="btn btn-ghost" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
}
