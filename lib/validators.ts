export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

export function validateGithubUrl(value: string): string | null {
  const url = normalizeUrl(value);
  if (!url) return 'GitHub URL is required';
  try {
    const u = new URL(url);
    if (!u.hostname.includes('github.com')) return 'Must be a github.com URL';
    return null;
  } catch {
    return 'Enter a valid GitHub URL';
  }
}

export function validateLinkedinUrl(value: string): string | null {
  const url = normalizeUrl(value);
  if (!url) return 'LinkedIn URL is required';
  try {
    const u = new URL(url);
    if (!u.hostname.includes('linkedin.com') || !u.pathname.includes('/in/')) {
      return 'Must be a linkedin.com/in/ profile URL';
    }
    return null;
  } catch {
    return 'Enter a valid LinkedIn URL';
  }
}

export function validateGithubOrLinkedinUrl(value: string): string | null {
  if (!value.trim()) return null;
  const gh = validateGithubUrl(value);
  const li = validateLinkedinUrl(value);
  if (!gh || !li) return null;
  return 'Enter a valid GitHub or LinkedIn profile URL';
}

export function validateLoomUrl(value: string): string | null {
  const url = normalizeUrl(value);
  if (!url) return 'Loom URL is required';
  try {
    const u = new URL(url);
    if (!u.hostname.includes('loom.com')) return 'Must be a loom.com URL';
    return null;
  } catch {
    return 'Enter a valid Loom URL';
  }
}
