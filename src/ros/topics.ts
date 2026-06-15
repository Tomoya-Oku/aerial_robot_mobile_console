export function normalizeNs(ns: string): string {
  const trimmed = ns.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }
  return trimmed.startsWith('/') ? trimmed.replace(/\/+$/, '') : `/${trimmed.replace(/\/+$/, '')}`;
}

export function nsJoin(ns: string, name: string): string {
  const cleanName = name.startsWith('/') ? name.slice(1) : name;
  const cleanNs = normalizeNs(ns);
  return cleanNs ? `${cleanNs}/${cleanName}` : `/${cleanName}`;
}

export function serviceName(name: string): string {
  return name.startsWith('/') ? name : `/${name}`;
}
