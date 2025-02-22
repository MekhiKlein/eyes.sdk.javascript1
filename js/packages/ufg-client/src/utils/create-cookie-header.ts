import type {Cookie} from '../types'

export function createCookieHeader({url, cookies = []}: {url: string; cookies: Cookie[]}) {
  const resourceUrl = new URL(url)
  return cookies.reduce((header, cookie) => {
    const domainMatch = cookie.domain?.startsWith('.')
      ? resourceUrl.hostname.includes(cookie.domain.substring(1))
      : resourceUrl.hostname === cookie.domain
    if (!domainMatch) return header

    const pathMatch = !!cookie.path && resourceUrl.pathname.startsWith(cookie.path)
    if (!pathMatch) return header

    const secureProtocol = resourceUrl.protocol === 'https:'
    if (cookie.secure && !secureProtocol) return header

    const expired = !!cookie.expiry && cookie.expiry >= 0 && Date.now() > cookie.expiry * 1000
    if (expired) return header

    return header + `${cookie.name}=${cookie.value};`
  }, '')
}
