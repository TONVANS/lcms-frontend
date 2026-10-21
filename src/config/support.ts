/** Sample support contacts (spec 6.6). The only place these strings live. */
export const SUPPORT_CONTACTS = {
  phone: '+856 21 000 000',
  email: 'support@lcms.example',
} as const;

/** `tel:` URIs may not contain spaces. */
export const supportTelHref = (phone: string): string => `tel:${phone.replace(/\s+/g, '')}`;
export const supportMailHref = (email: string): string => `mailto:${email}`;
