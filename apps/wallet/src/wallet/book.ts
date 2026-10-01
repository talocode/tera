export type AddressName = { address: string; name: string };

const KEY = "tera.wallet.address-book";

export function loadAddressBook(): AddressName[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]") as AddressName[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.address && item.name) : [];
  } catch {
    return [];
  }
}

export function saveAddressName(address: string, name: string): AddressName[] {
  const trimmed = name.trim();
  const current = loadAddressBook().filter((item) => item.address !== address);
  const next = trimmed ? [{ address, name: trimmed }, ...current].slice(0, 50) : current;
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
