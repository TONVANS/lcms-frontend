import { env } from './env';

export const siteConfig = {
  name: 'EDL LCMS',
  shortName: 'EDL LCMS',
  title: 'EDL LCMS - ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ | Legal Contract Management System',
  slogan: 'ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ ຍົກລະດັບການຄຸ້ມຄອງ',
  description:
    'EDL LCMS (Legal Contract Management System) - ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL). ລວມສັນຍາພະລັງງານໄຟຟ້າ (PPA), ສັນຍາທົ່ວໄປ (GC) ແລະ ວຽກງານນິຕິກຳ ໄວ້ໃນບ່ອນດຽວ ພ້ອມແຈ້ງເຕືອນ Real-time ປອດໄພມາດຕະຖານສາກົນ SSL 256-bit.',
  url: env.NEXT_PUBLIC_SITE_URL || 'https://lcms.edl.com.la',
  ogImage: '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: 'EDL LCMS - ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ | ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)',
  logo: '/logo/logo.png',
  locale: 'lo_LA',
  creator: 'ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)',
  publisher: 'Electricite du Laos (EDL)',
  organization: {
    name: 'ລັດວິສາຫະກິດໄຟຟ້າລາວ',
    englishName: 'Electricite du Laos (EDL)',
    url: 'https://www.edl.com.la',
    logo: '/logo/logo.png',
  },
  authors: [
    {
      name: 'ທີມງານພັດທະນາລະບົບ LCMS - ລັດວິສາຫະກິດໄຟຟ້າລາວ (EDL)',
      url: 'https://www.edl.com.la',
    },
  ] as Array<{ name: string; url?: string }>,
  keywords: [
    'EDL',
    'LCMS',
    'EDL LCMS',
    'ລັດວິສາຫະກິດໄຟຟ້າລາວ',
    'Electricite du Laos',
    'ລະບົບບໍລິຫານສັນຍາ',
    'ລະບົບບໍລິຫານສັນຍາ ແລະ ກົດໝາຍ',
    'ສັນຍາຊື້-ຂາຍໄຟຟ້າ',
    'PPA',
    'Power Purchase Agreements',
    'COD',
    'ສັນຍາທົ່ວໄປ',
    'ຈັດຊື້-ຈັດຈ້າງ',
    'General Contracts',
    'Procurement',
    'ນິຕິກຳ',
    'ຄະດີຄວາມ',
    'ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
    'Legal Regulations',
    'Litigation',
    'Legal Contract Management System',
    'ການຄຸ້ມຄອງສັນຍາ',
    'ແຈ້ງເຕືອນສັນຍາ',
    'Smart Alerts',
    'SSL 256-bit',
  ] as string[],
  links: {
    website: 'https://www.edl.com.la',
  },
};

export type SiteConfig = typeof siteConfig;
