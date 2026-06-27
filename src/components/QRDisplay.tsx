import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useT } from '../i18n'

interface Props {
  code: string
  joinUrl: string
}

export function QRDisplay({ code, joinUrl }: Props) {
  const tr = useT()
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-3 rounded-2xl">
        <QRCodeSVG value={joinUrl} size={160} bgColor="#ffffff" fgColor="#0F0F0F" />
      </div>
      <div className="flex items-center gap-3">
        <div className="px-6 py-3 bg-[#1A1A1A] rounded-2xl">
          <span className="text-3xl font-black tracking-widest text-[#FFE500]">{code}</span>
        </div>
        <button
          onClick={copyCode}
          className="px-4 py-3 bg-[#1A1A1A] rounded-2xl text-sm font-semibold text-white hover:bg-white/10 transition-colors min-h-[48px]"
        >
          {copied ? `✓ ${tr('copied')}` : tr('copy')}
        </button>
      </div>
      <p className="text-gray-500 text-xs text-center">
        {tr('scanOrEnterAt')} <span className="text-gray-400" dir="ltr">{window.location.host}/join</span>
      </p>
    </div>
  )
}
