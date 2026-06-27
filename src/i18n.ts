import { useEffect, useState } from 'react'
import { STRINGS } from './strings'

export type Lang = 'en' | 'ar'

const LANG_KEY = 'calledout_lang'

export function getLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

export function applyDir(lang: Lang): void {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

export function setLang(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang)
  applyDir(lang)
  // Notify all useLang subscribers in this tab (storage event only fires cross-tab)
  window.dispatchEvent(new Event('calledout-langchange'))
}

export function useLang(): Lang {
  const [lang, setL] = useState<Lang>(getLang)
  useEffect(() => {
    const handler = () => setL(getLang())
    window.addEventListener('calledout-langchange', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('calledout-langchange', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])
  return lang
}

type Params = Record<string, string | number>

export function t(key: string, lang: Lang, params?: Params): string {
  const dict = STRINGS[lang] ?? STRINGS.en
  let s = dict[key] ?? STRINGS.en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.split(`{${k}}`).join(String(v))
    }
  }
  return s
}

// Ergonomic hook: const tr = useT(); tr('createRoom')
export function useT(): (key: string, params?: Params) => string {
  const lang = useLang()
  return (key: string, params?: Params) => t(key, lang, params)
}
