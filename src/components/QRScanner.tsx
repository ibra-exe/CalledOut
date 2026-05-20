import { useEffect, useRef, useState } from 'react'
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

function getCameraBlockReason(): string | null {
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  const isHttps = window.location.protocol === 'https:'
  if (!isLocalhost && !isHttps) {
    return 'Camera requires HTTPS. Use "Upload QR" instead, or open the app via a secure (https://) link.'
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Camera not supported in this browser. Try Chrome or Safari.'
  }
  return null
}

export function QRScanner({ onScan, onClose }: Props) {
  const regionRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5QrcodeType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const blocked = getCameraBlockReason()
    if (blocked) {
      setError(blocked)
      return
    }

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!regionRef.current) return
        const html5QrCode = new Html5Qrcode('qr-scanner-region')
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (text) => {
            const match = text.match(/\/join\/([A-Z0-9]{6})/i)
            if (match) onScan(match[1].toUpperCase())
            else onScan(text.trim().toUpperCase().slice(0, 6))
          },
          () => {}
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
          setError('Camera permission denied. Please allow camera access in your browser settings.')
        } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
          setError('No camera found on this device.')
        } else {
          setError('Could not start camera. Try the "Upload QR" option instead.')
        }
      }
    }

    startScanner()

    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-3xl p-4 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white font-bold">Scan QR Code</span>
          <button onClick={onClose} className="text-gray-400 text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        {error ? (
          <div className="py-6 px-2 flex flex-col items-center gap-3">
            <span className="text-3xl">📵</span>
            <p className="text-gray-300 text-sm text-center leading-relaxed">{error}</p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-3 rounded-xl bg-[#FFE500] text-[#0F0F0F] font-bold text-sm"
            >
              Use Upload QR Instead
            </button>
          </div>
        ) : (
          <>
            <div id="qr-scanner-region" ref={regionRef} className="rounded-xl overflow-hidden" />
            <p className="text-gray-500 text-xs text-center mt-3">Point camera at the QR code</p>
          </>
        )}
      </div>
    </div>
  )
}
