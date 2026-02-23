"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";

type ExportFormat = "png" | "jpeg";

const PREVIEW_SIZE = 260;
const DEFAULT_EXPORT_SIZE = 1024;
const DEFAULT_INPUT = "https://example.com";

function buildQrOptions(params: {
  data: string;
  foregroundColor: string;
  backgroundColor: string;
  isTransparent: boolean;
  size: number;
  margin: number;
}) {
  const {
    data,
    foregroundColor,
    backgroundColor,
    isTransparent,
    size,
    margin
  } = params;

  return {
    width: size,
    height: size,
    type: "canvas" as const,
    data: data || " ",
    margin,
    dotsOptions: {
      color: foregroundColor
    },
    backgroundOptions: {
      color: isTransparent ? "transparent" : backgroundColor
    }
  };
}

export default function QRGenerator() {
  const [inputValue, setInputValue] = useState(DEFAULT_INPUT);
  const [foregroundColor, setForegroundColor] = useState("#111827");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [isTransparent, setIsTransparent] = useState(false);
  const [size, setSize] = useState(DEFAULT_EXPORT_SIZE);
  const [margin, setMargin] = useState(2);
  const [statusMessage, setStatusMessage] = useState("");

  const qrInstanceRef = useRef<QRCodeStyling | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const sanitizedSize = useMemo(() => {
    if (Number.isNaN(size)) {
      return DEFAULT_EXPORT_SIZE;
    }
    return Math.min(2048, Math.max(128, size));
  }, [size]);

  useEffect(() => {
    qrInstanceRef.current = new QRCodeStyling(
      buildQrOptions({
        data: inputValue,
        foregroundColor,
        backgroundColor,
        isTransparent,
        size: PREVIEW_SIZE,
        margin
      })
    );

    if (previewRef.current && qrInstanceRef.current) {
      previewRef.current.innerHTML = "";
      qrInstanceRef.current.append(previewRef.current);
    }

    return () => {
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!qrInstanceRef.current) {
      return;
    }

    qrInstanceRef.current.update(
      buildQrOptions({
        data: inputValue,
        foregroundColor,
        backgroundColor,
        isTransparent,
        size: PREVIEW_SIZE,
        margin
      })
    );
  }, [inputValue, foregroundColor, backgroundColor, isTransparent, margin]);

  async function createBlob(
    format: ExportFormat,
    overrideTransparent?: boolean
  ): Promise<Blob> {
    const instance = new QRCodeStyling(
      buildQrOptions({
        data: inputValue,
        foregroundColor,
        backgroundColor,
        isTransparent: overrideTransparent ?? isTransparent,
        size: sanitizedSize,
        margin
      })
    );

    const result = await instance.getRawData(format);
    
    // Handle both Blob and Buffer return types
    if (!result) {
      throw new Error("Failed to generate QR image.");
    }
    
    // Check if it's a Buffer (Node.js environment)
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(result)) {
      // Convert Buffer to Uint8Array first, then to Blob
      // This avoids the SharedArrayBuffer issue
      const uint8Array = new Uint8Array(result);
      return new Blob([uint8Array], { type: `image/${format === "jpeg" ? "jpeg" : "png"}` });
    }
    
    // It's already a Blob (browser environment)
    return result as Blob;
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadPNG() {
    setStatusMessage("");
    try {
      const blob = await createBlob("png");
      triggerDownload(blob, "qr-code.png");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to download PNG."
      );
    }
  }

  async function downloadJPG() {
    setStatusMessage("");
    try {
      const blob = await createBlob("jpeg", false);
      triggerDownload(blob, "qr-code.jpg");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to download JPG."
      );
    }
  }

  async function downloadTransparentPNG() {
    setStatusMessage("");
    try {
      const blob = await createBlob("png", true);
      triggerDownload(blob, "qr-code-transparent.png");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to download transparent PNG."
      );
    }
  }

  async function copyToClipboard() {
    setStatusMessage("");
    try {
      const blob = await createBlob("png");
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setStatusMessage("Copied to clipboard.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Clipboard copy failed."
      );
    }
  }

  return (
    <section className="generator">
      <div className="controls">
        <label className="field">
          <span>Input</span>
          <input
            className="text-input"
            type="text"
            placeholder="Enter URL, text, email, or phone"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </label>

        <div className="panel">
          <h2>Customization</h2>

          <div className="row">
            <label className="field">
              <span>Foreground</span>
              <input
                type="color"
                value={foregroundColor}
                onChange={(event) => setForegroundColor(event.target.value)}
                aria-label="QR foreground color"
              />
            </label>
            <label className="field">
              <span>Background</span>
              <input
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                disabled={isTransparent}
                aria-label="QR background color"
              />
            </label>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={isTransparent}
              onChange={(event) => setIsTransparent(event.target.checked)}
            />
            <span>Transparent background</span>
          </label>

          <label className="field">
            <span>Margin</span>
            <input
              className="range-input"
              type="range"
              min={0}
              max={12}
              value={margin}
              onChange={(event) => setMargin(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span>Export size (px)</span>
            <input
              className="text-input"
              type="number"
              min={128}
              max={2048}
              step={64}
              value={sanitizedSize}
              onChange={(event) => setSize(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="preview">
        <div className="preview-box" ref={previewRef} aria-live="polite" />
        <div className="actions">
          <button type="button" onClick={downloadPNG}>
            Download PNG
          </button>
          <button type="button" onClick={downloadJPG}>
            Download JPG
          </button>
          <button type="button" onClick={downloadTransparentPNG}>
            Download Transparent PNG
          </button>
          <button type="button" onClick={copyToClipboard}>
            Copy to Clipboard
          </button>
        </div>
        {statusMessage ? (
          <p className="status" role="status">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}