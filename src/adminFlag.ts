const FLAG = 'lounge-idle-admin'

export function isAdminEnabled(): boolean {
  const params = new URLSearchParams(window.location.search)
  const raw = window.location.search.toLowerCase()
  const wantOn =
    params.get('admin') === '1' ||
    params.get('admin') === 'true' ||
    params.get('admin') === '' ||
    params.has('admin=1') ||
    raw.includes('admin%3d1') ||
    raw.includes('admin=1')

  if (params.get('admin') === '0') {
    sessionStorage.setItem(FLAG, '0')
    return false
  }
  if (wantOn) {
    sessionStorage.setItem(FLAG, '1')
    return true
  }

  const stored = sessionStorage.getItem(FLAG)
  if (stored === '0') return false
  if (stored === '1') return true
  return false
}
