import { INSTAGRAM_URL, supportWaUrl } from "./contact";

// In-app section links.
export const NAV_LINKS = [
  { label: "Beranda", href: "/" },
  { label: "Price List", href: "/#pricelist" },
  { label: "Promo", href: "/#promo" },
];

// External contact/social links (same values NavbarMenuOverlay used to
// build inline).
export const SOCIAL_LINKS = [
  { label: "Instagram", href: INSTAGRAM_URL },
  { label: "Whatsapp", href: supportWaUrl() },
];
