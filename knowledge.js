/*
 * RatnaOS Jewellery Knowledge Center — master data
 * ------------------------------------------------
 * Trilingual, source-of-truth records for categories, metals/purity,
 * measurements/units and regional trade terminology.
 *
 * Data rules:
 *  - Traditional units are regional, not universal; each record is scoped.
 *  - Karat (purity) and carat (mass) are separate measurement types.
 *  - Records needing official confirmation carry needsVerification: true.
 */

export const JEWELLERY_CATALOGUE = [
  {
    id: 'necklace', en: 'Necklaces', ne: 'सिक्री', hi: 'हार',
    keywords: ['necklace', 'haar', 'mala', 'neck'],
    types: [
      { id: 'necklace', en: 'Necklace', ne: 'सिक्री', hi: 'हार', keywords: ['haar', 'mala'] },
      { id: 'gold-necklace', en: 'Gold Necklace', ne: 'सुनको सिक्री', hi: 'सोने का हार', keywords: ['gold', 'sun'] },
      { id: 'diamond-necklace', en: 'Diamond Necklace', ne: 'हीराको सिक्री', hi: 'हीरे का हार', keywords: ['diamond', 'heera'] },
      { id: 'bridal-necklace', en: 'Bridal Necklace', ne: 'दुलहीको सिक्री', hi: 'दुल्हन का हार', keywords: ['bridal', 'wedding'] },
      { id: 'choker', en: 'Choker', ne: 'चोकर', hi: 'चोकर', keywords: ['choker', 'short necklace'] },
      { id: 'princess-necklace', en: 'Princess Necklace', ne: 'प्रिन्सेस सिक्री', hi: 'प्रिंसेस हार', keywords: ['princess', 'length'] },
      { id: 'matinee-necklace', en: 'Matinee Necklace', ne: 'म्याटिनी सिक्री', hi: 'मैटिनी हार', keywords: ['matinee'] },
      { id: 'opera-necklace', en: 'Opera Necklace', ne: 'ओपेरा सिक्री', hi: 'ओपेरा हार', keywords: ['opera', 'long'] },
      { id: 'rope-necklace', en: 'Rope Necklace', ne: 'रस्सी शैलीको सिक्री', hi: 'रस्सी शैली का हार', keywords: ['rope'] },
      { id: 'chain-necklace', en: 'Chain Necklace', ne: 'चेन सिक्री', hi: 'चेन हार', keywords: ['chain'] },
      { id: 'pendant-necklace', en: 'Pendant Necklace', ne: 'लकेट सिक्री', hi: 'लॉकेट हार', keywords: ['pendant'] },
      { id: 'layered-necklace', en: 'Layered Necklace', ne: 'तह भएको सिक्री', hi: 'लेयर्ड हार', keywords: ['layered'] },
      { id: 'temple-necklace', en: 'Temple Necklace', ne: 'मन्दिर शैलीको सिक्री', hi: 'मंदिर शैली का हार', keywords: ['temple'], region: 'IN' },
      { id: 'kundan-necklace', en: 'Kundan Necklace', ne: 'कुन्दन सिक्री', hi: 'कुंदन हार', keywords: ['kundan'], region: 'IN' },
      { id: 'polki-necklace', en: 'Polki Necklace', ne: 'पोल्की सिक्री', hi: 'पोलकी हार', keywords: ['polki'], region: 'IN' },
      { id: 'meenakari-necklace', en: 'Meenakari Necklace', ne: 'मिनाकारी सिक्री', hi: 'मीनाकारी हार', keywords: ['meenakari', 'enamel'], region: 'IN' },
      { id: 'antique-necklace', en: 'Antique Necklace', ne: 'पुरानो शैलीको सिक्री', hi: 'पुरानी शैली का हार', keywords: ['antique'] },
      { id: 'traditional-nepali-necklace', en: 'Traditional Nepali Necklace', ne: 'परम्परागत नेपाली सिक्री', hi: 'पारंपरिक नेपाली हार', keywords: ['nepali'], region: 'NP' },
      { id: 'contemporary-necklace', en: 'Contemporary Necklace', ne: 'आधुनिक सिक्री', hi: 'समकालीन हार', keywords: ['modern', 'contemporary'] },
      { id: 'tilhari', en: 'Tilhari', ne: 'तिलहरी', hi: 'तिलहरी', keywords: ['tilhari', 'mangalsutra', 'nepali'], region: 'NP' },
      { id: 'pote', en: 'Pote', ne: 'पोते', hi: 'पोते', keywords: ['pote', 'beaded', 'nepali'], region: 'NP' },
      { id: 'naugedi', en: 'Naugedi', ne: 'नौगेडी', hi: 'नौगेड़ी', keywords: ['naugedi', 'nine bead', 'nepali'], region: 'NP', needsVerification: true },
      { id: 'kantha', en: 'Kantha', ne: 'कन्ठा', hi: 'कंठा', keywords: ['kantha', 'choker', 'indian'], region: 'IN' },
      { id: 'mangalsutra', en: 'Mangalsutra', ne: 'मंगलसूत्र', hi: 'मंगलसूत्र', keywords: ['mangalsutra', 'wedding'], region: 'IN' },
      { id: 'rani-haar', en: 'Rani Haar', ne: 'रानी सिक्री', hi: 'रानी हार', keywords: ['rani haar', 'queen'], region: 'IN' },
      { id: 'satlada-haar', en: 'Satlada Haar', ne: 'सतलडा सिक्री', hi: 'सतलड़ा हार', keywords: ['satlada', 'seven layer'], region: 'IN' },
      { id: 'guluband', en: 'Guluband', ne: 'गुलुबन्द', hi: 'गुलूबंद', keywords: ['guluband', 'choker'], region: 'IN' }
    ]
  },
  {
    id: 'earring', en: 'Earrings', ne: 'कानका गहना', hi: 'कान के आभूषण',
    keywords: ['earring', 'ear', 'kundal'],
    types: [
      { id: 'stud-earring', en: 'Stud Earrings', ne: 'स्टड कानका गहना', hi: 'स्टड कान के आभूषण', keywords: ['stud'] },
      { id: 'hoop-earring', en: 'Hoop Earrings', ne: 'हुप कानका गहना', hi: 'हूप कान के आभूषण', keywords: ['hoop', 'bali'] },
      { id: 'drop-earring', en: 'Drop Earrings', ne: 'झुम्का शैली', hi: 'ड्रॉप कान के आभूषण', keywords: ['drop'] },
      { id: 'dangle-earring', en: 'Dangle Earrings', ne: 'लटकने कानका गहना', hi: 'लटकते कान के आभूषण', keywords: ['dangle'] },
      { id: 'jhumka', en: 'Jhumka', ne: 'झुम्का', hi: 'झुमका', keywords: ['jhumka', 'bell'], region: 'NP,IN' },
      { id: 'chandbali', en: 'Chandbali', ne: 'चन्दबाली', hi: 'चांदबाली', keywords: ['chandbali', 'moon'], region: 'IN' },
      { id: 'bali', en: 'Bali', ne: 'बाली', hi: 'बाली', keywords: ['bali', 'hoop'], region: 'NP,IN' },
      { id: 'ear-cuff', en: 'Ear Cuff', ne: 'इयर कफ', hi: 'इयर कफ', keywords: ['cuff'] },
      { id: 'huggie-earring', en: 'Huggie Earrings', ne: 'हगी कानका गहना', hi: 'हगी कान के आभूषण', keywords: ['huggie'] },
      { id: 'cluster-earring', en: 'Cluster Earrings', ne: 'क्लस्टर कानका गहना', hi: 'क्लस्टर कान के आभूषण', keywords: ['cluster'] },
      { id: 'diamond-earring', en: 'Diamond Earrings', ne: 'हीराको कानका गहना', hi: 'हीरे के कान के आभूषण', keywords: ['diamond'] },
      { id: 'pearl-earring', en: 'Pearl Earrings', ne: 'मोती कानका गहना', hi: 'मोती कान के आभूषण', keywords: ['pearl'] },
      { id: 'temple-earring', en: 'Temple Earrings', ne: 'मन्दिर शैली कानका गहना', hi: 'मंदिर शैली कान के आभूषण', keywords: ['temple'], region: 'IN' },
      { id: 'traditional-earring', en: 'Traditional Earrings', ne: 'परम्परागत कानका गहना', hi: 'पारंपरिक कान के आभूषण', keywords: ['traditional'] }
    ]
  },
  {
    id: 'ring', en: 'Rings', ne: 'औँठी', hi: 'अंगूठी',
    keywords: ['ring', 'aunthi', 'anguthi'],
    types: [
      { id: 'engagement-ring', en: 'Engagement Ring', ne: 'सगाईको औँठी', hi: 'सगाई की अंगूठी', keywords: ['engagement'] },
      { id: 'wedding-ring', en: 'Wedding Ring', ne: 'विवाहको औँठी', hi: 'विवाह की अंगूठी', keywords: ['wedding'] },
      { id: 'solitaire-ring', en: 'Solitaire Ring', ne: 'सोलिटेयर औँठी', hi: 'सॉलिटेयर अंगूठी', keywords: ['solitaire', 'single stone'] },
      { id: 'diamond-ring', en: 'Diamond Ring', ne: 'हीराको औँठी', hi: 'हीरे की अंगूठी', keywords: ['diamond'] },
      { id: 'gold-ring', en: 'Gold Ring', ne: 'सुनको औँठी', hi: 'सोने की अंगूठी', keywords: ['gold'] },
      { id: 'platinum-ring', en: 'Platinum Ring', ne: 'प्लेटिनम औँठी', hi: 'प्लेटिनम अंगूठी', keywords: ['platinum'] },
      { id: 'cocktail-ring', en: 'Cocktail Ring', ne: 'कक्टेल औँठी', hi: 'कॉकटेल अंगूठी', keywords: ['cocktail'] },
      { id: 'signet-ring', en: 'Signet Ring', ne: 'सिग्नेट औँठी', hi: 'सिग्नेट अंगूठी', keywords: ['signet'] },
      { id: 'eternity-ring', en: 'Eternity Ring', ne: 'इटर्निटी औँठी', hi: 'इटर्निटी अंगूठी', keywords: ['eternity'] },
      { id: 'promise-ring', en: 'Promise Ring', ne: 'प्रतिज्ञा औँठी', hi: 'प्रॉमिस अंगूठी', keywords: ['promise'] },
      { id: 'adjustable-ring', en: 'Adjustable Ring', ne: 'मिलाउन सकिने औँठी', hi: 'समायोज्य अंगूठी', keywords: ['adjustable'] },
      { id: 'mens-ring', en: "Men's Ring", ne: 'पुरुषको औँठी', hi: 'पुरुषों की अंगूठी', keywords: ['men'] },
      { id: 'womens-ring', en: "Women's Ring", ne: 'महिलाको औँठी', hi: 'महिलाओं की अंगूठी', keywords: ['women'] },
      { id: 'gemstone-ring', en: 'Gemstone Ring', ne: 'रत्नको औँठी', hi: 'रत्न की अंगूठी', keywords: ['gemstone', 'stone'] },
      { id: 'traditional-nepali-ring', en: 'Traditional Nepali Ring', ne: 'परम्परागत नेपाली औँठी', hi: 'पारंपरिक नेपाली अंगूठी', keywords: ['nepali'], region: 'NP' }
    ]
  },
  {
    id: 'bangle', en: 'Bangles & Bracelets', ne: 'बाला र ब्रेसलेट', hi: 'चूड़ियाँ और ब्रेसलेट',
    keywords: ['bangle', 'bracelet', 'chura', 'kada', 'kangan'],
    types: [
      { id: 'gold-bangle', en: 'Gold Bangle', ne: 'सुनको बाला', hi: 'सोने की चूड़ी', keywords: ['gold', 'chura'] },
      { id: 'silver-bangle', en: 'Silver Bangle', ne: 'चाँदीको बाला', hi: 'चांदी की चूड़ी', keywords: ['silver'] },
      { id: 'kada', en: 'Kada', ne: 'कडा', hi: 'कड़ा', keywords: ['kada', 'thick bangle'], region: 'IN' },
      { id: 'bracelet', en: 'Bracelet', ne: 'ब्रेसलेट', hi: 'ब्रेसलेट', keywords: ['bracelet'] },
      { id: 'chain-bracelet', en: 'Chain Bracelet', ne: 'चेन ब्रेसलेट', hi: 'चेन ब्रेसलेट', keywords: ['chain'] },
      { id: 'tennis-bracelet', en: 'Tennis Bracelet', ne: 'टेनिस ब्रेसलेट', hi: 'टेनिस ब्रेसलेट', keywords: ['tennis', 'diamond line'] },
      { id: 'charm-bracelet', en: 'Charm Bracelet', ne: 'चार्म ब्रेसलेट', hi: 'चार्म ब्रेसलेट', keywords: ['charm'] },
      { id: 'cuff-bracelet', en: 'Cuff Bracelet', ne: 'कफ ब्रेसलेट', hi: 'कफ ब्रेसलेट', keywords: ['cuff'] },
      { id: 'bridal-chura', en: 'Bridal Chura', ne: 'दुलही बाला', hi: 'दुल्हन की चूड़ी', keywords: ['bridal', 'chura'], region: 'IN' },
      { id: 'kangan', en: 'Kangan', ne: 'कंगन', hi: 'कंगन', keywords: ['kangan'], region: 'IN' },
      { id: 'kada-bracelet', en: 'Kada Bracelet', ne: 'कडा ब्रेसलेट', hi: 'कड़ा ब्रेसलेट', keywords: ['kada'] },
      { id: 'openable-bangle', en: 'Openable Bangle', ne: 'खोल्न मिल्ने बाला', hi: 'खुलने वाली चूड़ी', keywords: ['openable'] },
      { id: 'hinged-bangle', en: 'Hinged Bangle', ne: 'हिन्ज भएको बाला', hi: 'हिंज वाली चूड़ी', keywords: ['hinged'] },
      { id: 'solid-bangle', en: 'Solid Bangle', ne: 'ठोस बाला', hi: 'ठोस चूड़ी', keywords: ['solid'] },
      { id: 'hollow-bangle', en: 'Hollow Bangle', ne: 'खोक्रो बाला', hi: 'खोखली चूड़ी', keywords: ['hollow'] }
    ]
  },
  {
    id: 'other', en: 'Other Jewellery', ne: 'अन्य गहना', hi: 'अन्य आभूषण',
    keywords: ['anklet', 'nose', 'tikka', 'brooch', 'pendant', 'chain', 'mens'],
    types: [
      { id: 'anklet', en: 'Anklets', ne: 'पाउजेब', hi: 'पायल', keywords: ['anklet', 'payal'] },
      { id: 'payal', en: 'Payal', ne: 'पाउजेब', hi: 'पायल', keywords: ['payal'], region: 'IN' },
      { id: 'toe-ring', en: 'Toe Rings', ne: 'औंलाको औँठी', hi: 'पैर की अंगूठी', keywords: ['toe ring', 'bichhiya'] },
      { id: 'nose-ring', en: 'Nose Rings', ne: 'नाकको गहना', hi: 'नाक का आभूषण', keywords: ['nose'] },
      { id: 'nath', en: 'Nath', ne: 'नथिया', hi: 'नथ', keywords: ['nath', 'nose'], region: 'NP,IN' },
      { id: 'nose-pin', en: 'Nose Pins', ne: 'नाकको पिन', hi: 'नाक की पिन', keywords: ['nose pin'] },
      { id: 'maang-tikka', en: 'Maang Tikka', ne: 'माङ टिका', hi: 'मांग टीका', keywords: ['tikka', 'forehead'], region: 'NP,IN' },
      { id: 'borla', en: 'Borla', ne: 'बोर्ला', hi: 'बोरला', keywords: ['borla', 'rajasthani'], region: 'IN' },
      { id: 'matha-patti', en: 'Matha Patti', ne: 'माथा पट्टी', hi: 'माथा पट्टी', keywords: ['matha patti'], region: 'IN' },
      { id: 'mang-tikka', en: 'Mang Tikka', ne: 'माङ टिका', hi: 'मांग टीका', keywords: ['mang tikka'] },
      { id: 'waist-belt', en: 'Waist Belt', ne: 'कम्मर पट्टी', hi: 'कमरबंद', keywords: ['waist'] },
      { id: 'kamarbandh', en: 'Kamarbandh', ne: 'कमरबन्द', hi: 'कमरबंद', keywords: ['kamarbandh'], region: 'IN' },
      { id: 'armlet', en: 'Armlet', ne: 'बाहुगहना', hi: 'बाजूबंद', keywords: ['armlet', 'bajuband'] },
      { id: 'bajuband', en: 'Bajuband', ne: 'बाजुबन्द', hi: 'बाजूबंद', keywords: ['bajuband'], region: 'IN' },
      { id: 'brooch', en: 'Brooch', ne: 'ब्रोच', hi: 'ब्रोच', keywords: ['brooch'] },
      { id: 'cufflink', en: 'Cufflinks', ne: 'कफलिंक', hi: 'कफलिंक', keywords: ['cufflink'] },
      { id: 'pendant', en: 'Pendants', ne: 'लकेट', hi: 'लॉकेट', keywords: ['pendant'] },
      { id: 'locket', en: 'Lockets', ne: 'लकेट', hi: 'लॉकेट', keywords: ['locket'] },
      { id: 'chain', en: 'Chains', ne: 'चेन', hi: 'चेन', keywords: ['chain'] },
      { id: 'rosary', en: 'Rosaries', ne: 'माला', hi: 'माला', keywords: ['rosary', 'mala'] },
      { id: 'hair-accessory', en: 'Hair Accessories', ne: 'कपालका सामग्री', hi: 'बाल आभूषण', keywords: ['hair'] },
      { id: 'bridal-accessory', en: 'Bridal Accessories', ne: 'दुलहीका सामग्री', hi: 'दुल्हन के आभूषण', keywords: ['bridal'] },
      { id: 'mens-jewellery', en: "Men's Jewellery", ne: 'पुरुष गहना', hi: 'पुरुष आभूषण', keywords: ['men'] },
      { id: 'childrens-jewellery', en: "Children's Jewellery", ne: 'बालबालिकाका गहना', hi: 'बच्चों के आभूषण', keywords: ['children', 'kids'] }
    ]
  }
];

/** Regional collections (not interchangeable designs) */
export const REGIONAL_COLLECTIONS = [
  { id: 'nepali', en: 'Nepali Traditional', ne: 'नेपाली परम्परागत', hi: 'नेपाली पारंपरिक', items: ['Tilhari', 'Pote', 'Naugedi', 'Dhunge mala', 'Rudraksha mala'], itemsNe: ['तिलहरी', 'पोते', 'नौगेडी', 'ढुङ्गे माला', 'रुद्राक्ष माला'], needsVerification: true },
  { id: 'newari', en: 'Newari', ne: 'नेवारी', hi: 'नेवारी', items: ['Sisi mala', 'Lun swan', 'Naugedi', 'Tayo'], itemsNe: ['सिसी माला', 'लुन स्वाँ', 'नौगेडी', 'तायो'], needsVerification: true },
  { id: 'himalayan', en: 'Himalayan', ne: 'हिमाली', hi: 'हिमालयी', items: ['Ghau box', 'Dzi bead', 'Coral and turquoise'], itemsNe: ['घाउ बक्स', 'जी बीड', 'मुगा र फिरोजा'], needsVerification: true },
  { id: 'indian-traditional', en: 'Indian Traditional', ne: 'भारतीय परम्परागत', hi: 'भारतीय पारंपरिक', items: ['Kundan', 'Polki', 'Jadau', 'Meenakari', 'Temple jewellery'], itemsNe: ['कुन्दन', 'पोल्की', 'जडाउ', 'मिनाकारी', 'मन्दिर शैली'] },
  { id: 'rajasthani', en: 'Rajasthani', ne: 'राजस्थानी', hi: 'राजस्थानी', items: ['Borla', 'Rakhdi', 'Aad', 'Kada'], itemsNe: ['बोर्ला', 'राखडी', 'आड', 'कडा'] },
  { id: 'gujarati', en: 'Gujarati', ne: 'गुजराती', hi: 'गुजराती', items: ['Kundan choker', 'Patla', 'Kandora'], itemsNe: ['कुन्दन चोकर', 'पटला', 'कान्दोरा'] },
  { id: 'bengali', en: 'Bengali', ne: 'बंगाली', hi: 'बंगाली', items: ['Sita haar', 'Bauti', 'Kaan er jhumko'], itemsNe: ['सीता सिक्री', 'बाउटी', 'कानेर झुम्को'] },
  { id: 'south-indian', en: 'South Indian', ne: 'दक्षिण भारतीय', hi: 'दक्षिण भारतीय', items: ['Temple necklace', 'Jhumka', 'Vanki', 'Oddiyanam'], itemsNe: ['मन्दिर शैली सिक्री', 'झुम्का', 'वन्की', 'ओड्डियानम'] },
  { id: 'maharashtrian', en: 'Maharashtrian', ne: 'महाराष्ट्रीय', hi: 'महाराष्ट्रीय', items: ['Nath', 'Thushi', 'Mundavalya'], itemsNe: ['नथ', 'थुशी', 'मुण्डावल्य'] },
  { id: 'punjabi', en: 'Punjabi', ne: 'पञ्जाबी', hi: 'पंजाबी', items: ['Jhumka', 'Chooda', 'Kaleere'], itemsNe: ['झुम्का', 'चूडा', 'कलिरे'] },
  { id: 'mughal', en: 'Mughal-inspired', ne: 'मुगल शैली', hi: 'मुगल शैली', items: ['Kundan set', 'Polki choker', 'Jadau'], itemsNe: ['कुन्दन सेट', 'पोल्की चोकर', 'जडाउ'] },
  { id: 'contemporary', en: 'Contemporary International', ne: 'समकालीन अन्तर्राष्ट्रीय', hi: 'समकालीन अंतरराष्ट्रीय', items: ['Minimal', 'Geometric', 'Statement'], itemsNe: ['सादा', 'ज्यामितीय', 'आकर्षक'] }
];

export const METALS = [
  { id: 'gold', en: 'Gold', ne: 'सुन', hi: 'सोना', symbol: 'Au', density: 19.32, unit: 'gram' },
  { id: 'silver', en: 'Silver', ne: 'चाँदी', hi: 'चाँदी', symbol: 'Ag', density: 10.49, unit: 'gram' },
  { id: 'platinum', en: 'Platinum', ne: 'प्लेटिनम', hi: 'प्लैटिनम', symbol: 'Pt', density: 21.45, unit: 'gram' },
  { id: 'palladium', en: 'Palladium', ne: 'प्यालेडियम', hi: 'पैलेडियम', symbol: 'Pd', density: 12.02, unit: 'gram' },
  { id: 'copper', en: 'Copper', ne: 'तामा', hi: 'तांबा', symbol: 'Cu', density: 8.96, unit: 'gram' },
  { id: 'zinc', en: 'Zinc', ne: 'जस्ता', hi: 'जस्ता', symbol: 'Zn', density: 7.14, unit: 'gram' },
  { id: 'nickel', en: 'Nickel', ne: 'निकल', hi: 'निकल', symbol: 'Ni', density: 8.91, unit: 'gram' },
  { id: 'brass', en: 'Brass', ne: 'पित्तल', hi: 'पीतल', symbol: 'CuZn', density: 8.5, unit: 'gram' },
  { id: 'bronze', en: 'Bronze', ne: 'कांस्य', hi: 'कांसा', symbol: 'CuSn', density: 8.8, unit: 'gram' },
  { id: 'rhodium', en: 'Rhodium', ne: 'रोडियम', hi: 'रोडियम', symbol: 'Rh', density: 12.41, unit: 'gram' },
  { id: 'titanium', en: 'Titanium', ne: 'टाइटेनियम', hi: 'टाइटेनियम', symbol: 'Ti', density: 4.51, unit: 'gram' },
  { id: 'steel', en: 'Stainless Steel', ne: 'स्टेनलेस स्टिल', hi: 'स्टेनलेस स्टील', symbol: 'Fe/Cr/Ni', density: 7.85, unit: 'gram' },
  { id: 'aluminium', en: 'Aluminium', ne: 'एल्युमिनियम', hi: 'एल्युमिनियम', symbol: 'Al', density: 2.7, unit: 'gram' }
];

export const GOLD_PURITIES = [
  { karat: 24, fineness: 999.9, label: '24K', ne: '२४ क्यारेट', hi: '24 कैरेट', note: 'Commercial 999/999.9 varies by market' },
  { karat: 23, fineness: 958, label: '23K', ne: '२३ क्यारेट', hi: '23 कैरेट' },
  { karat: 22, fineness: 916.7, label: '22K', ne: '२२ क्यारेट', hi: '22 कैरेट' },
  { karat: 21, fineness: 875, label: '21K', ne: '२१ क्यारेट', hi: '21 कैरेट' },
  { karat: 20, fineness: 833, label: '20K', ne: '२० क्यारेट', hi: '20 कैरेट' },
  { karat: 18, fineness: 750, label: '18K', ne: '१८ क्यारेट', hi: '18 कैरेट' },
  { karat: 14, fineness: 583.3, label: '14K', ne: '१४ क्यारेट', hi: '14 कैरेट' },
  { karat: 12, fineness: 500, label: '12K', ne: '१२ क्यारेट', hi: '12 कैरेट' },
  { karat: 10, fineness: 416.7, label: '10K', ne: '१० क्यारेट', hi: '10 कैरेट' },
  { karat: 9, fineness: 375, label: '9K', ne: '९ क्यारेट', hi: '9 कैरेट' }
];

export const SILVER_PURITIES = [
  { fineness: 999, label: 'Fine Silver 999', ne: 'शुद्ध चाँदी ९९९', hi: 'शुद्ध चाँदी 999' },
  { fineness: 958, label: 'Britannia Silver 958', ne: 'ब्रिटानिया चाँदी ९५८', hi: 'ब्रिटानिया चाँदी 958', needsVerification: true },
  { fineness: 925, label: 'Sterling Silver 925', ne: 'स्टर्लिंग चाँदी ९२५', hi: 'स्टर्लिंग चाँदी 925' },
  { fineness: 900, label: 'Coin Silver 900', ne: 'सिक्का चाँदी ९००', hi: 'सिक्का चाँदी 900' }
];

export const MEASUREMENT_TYPES = [
  { id: 'mass', en: 'Mass / Weight', ne: 'तौल', hi: 'द्रव्यमान / वज़न', base: 'gram' },
  { id: 'stone-mass', en: 'Gemstone Weight', ne: 'रत्नको तौल', hi: 'रत्न वज़न', base: 'carat' },
  { id: 'length', en: 'Length', ne: 'लम्बाइ', hi: 'लंबाई', base: 'millimeter' },
  { id: 'purity', en: 'Metal Purity', ne: 'धातु शुद्धता', hi: 'धातु शुद्धता', base: 'fineness' },
  { id: 'ring-size', en: 'Ring Size', ne: 'औँठी नाप', hi: 'अंगूठी का नाप', base: 'circumference-mm' },
  { id: 'count', en: 'Count', ne: 'संख्या', hi: 'संख्या', base: 'piece' }
];

/**
 * toBase: multiplier to the type's base unit.
 * scope: countries where the unit is customarily used (empty = international).
 */
export const UNITS = [
  { id: 'kilogram', type: 'mass', en: 'Kilogram', ne: 'किलोग्राम', hi: 'किलोग्राम', abbr: 'kg', toBase: 1000, precision: 3, scope: [], source: 'SI' },
  { id: 'gram', type: 'mass', en: 'Gram', ne: 'ग्राम', hi: 'ग्राम', abbr: 'g', toBase: 1, precision: 3, scope: [], source: 'SI' },
  { id: 'milligram', type: 'mass', en: 'Milligram', ne: 'मिलिग्राम', hi: 'मिलीग्राम', abbr: 'mg', toBase: 0.001, precision: 3, scope: [], source: 'SI' },
  { id: 'microgram', type: 'mass', en: 'Microgram', ne: 'माइक्रोग्राम', hi: 'माइक्रोग्राम', abbr: 'µg', toBase: 0.000001, precision: 6, scope: [], source: 'SI' },
  { id: 'troy-ounce', type: 'mass', en: 'Troy Ounce', ne: 'ट्रोय औन्स', hi: 'ट्रॉय औंस', abbr: 'ozt', toBase: 31.1034768, precision: 4, scope: [], source: 'International troy system' },
  { id: 'ounce', type: 'mass', en: 'Avoirdupois Ounce', ne: 'औन्स', hi: 'औंस', abbr: 'oz', toBase: 28.349523125, precision: 4, scope: [], source: 'Avoirdupois' },
  { id: 'pennyweight', type: 'mass', en: 'Pennyweight', ne: 'पेनीवेट', hi: 'पेनीवेट', abbr: 'dwt', toBase: 1.55517384, precision: 4, scope: [], source: 'Troy system' },
  { id: 'tola', type: 'mass', en: 'Tola', ne: 'तोला', hi: 'तोला', abbr: 'tola', toBase: 11.6638, precision: 3, scope: ['NP', 'IN'], source: 'South Asian trade convention (11.6638 g); verify local practice', regional: true },
  { id: 'masha', type: 'mass', en: 'Masha', ne: 'मासा', hi: 'माशा', abbr: 'masha', toBase: 0.971983, precision: 4, scope: ['NP', 'IN'], source: '1 tola = 12 masha', regional: true, needsVerification: true },
  { id: 'ratti', type: 'mass', en: 'Ratti', ne: 'रत्ती', hi: 'रत्ती', abbr: 'ratti', toBase: 0.1215, precision: 4, scope: ['NP', 'IN'], source: 'Traditional seed weight; varies by region', regional: true, needsVerification: true },
  { id: 'ana', type: 'mass', en: 'Ana', ne: 'आना', hi: 'आना', abbr: 'ana', toBase: 0.7289875, precision: 4, scope: ['NP', 'IN'], source: '1 tola = 16 ana', regional: true, needsVerification: true },
  { id: 'lal', type: 'mass', en: 'Lal', ne: 'लाल', hi: 'लाल', abbr: 'lal', toBase: 0.116638, precision: 4, scope: ['NP', 'IN'], source: '1 tola = 100 lal', regional: true, needsVerification: true },

  { id: 'carat', type: 'stone-mass', en: 'Carat', ne: 'क्यारेट (रत्न)', hi: 'कैरेट (रत्न)', abbr: 'ct', toBase: 1, precision: 2, scope: [], source: '1 ct = 0.2 g (metric carat)' },
  { id: 'point', type: 'stone-mass', en: 'Point', ne: 'पोइन्ट', hi: 'पॉइंट', abbr: 'pt', toBase: 0.01, precision: 2, scope: [], source: '1 ct = 100 points' },
  { id: 'carat-gram', type: 'stone-mass', en: 'Carat (in grams)', ne: 'क्यारेट (ग्राममा)', hi: 'कैरेट (ग्राम में)', abbr: 'ct-g', toBase: 0.2, precision: 3, scope: [], source: 'Mass equivalent of one carat' },

  { id: 'millimeter', type: 'length', en: 'Millimeter', ne: 'मिलिमिटर', hi: 'मिलीमीटर', abbr: 'mm', toBase: 1, precision: 2, scope: [], source: 'SI' },
  { id: 'centimeter', type: 'length', en: 'Centimeter', ne: 'सेन्टिमिटर', hi: 'सेंटीमीटर', abbr: 'cm', toBase: 10, precision: 2, scope: [], source: 'SI' },
  { id: 'meter', type: 'length', en: 'Meter', ne: 'मिटर', hi: 'मीटर', abbr: 'm', toBase: 1000, precision: 3, scope: [], source: 'SI' },
  { id: 'inch', type: 'length', en: 'Inch', ne: 'इन्च', hi: 'इंच', abbr: 'in', toBase: 25.4, precision: 3, scope: [], source: 'Imperial' },

  { id: 'karat', type: 'purity', en: 'Karat', ne: 'क्यारेट (शुद्धता)', hi: 'कैरेट (शुद्धता)', abbr: 'K', toBase: 41.6666666667, precision: 2, scope: [], source: 'Gold purity: 24K = 1000 fineness' },
  { id: 'fineness', type: 'purity', en: 'Fineness', ne: 'फाइननेस', hi: 'फाइननेस', abbr: '‰', toBase: 1, precision: 1, scope: [], source: 'Parts per thousand' },
  { id: 'percent-purity', type: 'purity', en: 'Purity %', ne: 'शुद्धता प्रतिशत', hi: 'शुद्धता प्रतिशत', abbr: '%', toBase: 10, precision: 2, scope: [], source: 'Percent of fine metal' },

  { id: 'piece', type: 'count', en: 'Piece', ne: 'थान', hi: 'टुकड़ा', abbr: 'pc', toBase: 1, precision: 0, scope: [], source: 'Count' }
];

export const RING_SIZE_SYSTEMS = [
  { id: 'iso-mm', en: 'ISO circumference (mm)', ne: 'आईएसओ परिधि (मिमि)', hi: 'आईएसओ परिधि (मिमी)', verified: true },
  { id: 'us', en: 'US ring size', ne: 'अमेरिकी नाप', hi: 'अमेरिकी नाप', verified: false, note: 'Common conversion tables only; confirm metal trial before manufacturing.' },
  { id: 'uk', en: 'UK ring size', ne: 'बेलायती नाप', hi: 'ब्रिटिश नाप', verified: false, note: 'Table required; needs verification.' },
  { id: 'india', en: 'India ring size', ne: 'भारतीय नाप', hi: 'भारतीय नाप', verified: false, note: 'Regional tables vary; needs verification.' },
  { id: 'japan', en: 'Japan ring size', ne: 'जापानी नाप', hi: 'जापानी नाप', verified: false, note: 'Table required; needs verification.' },
  { id: 'eu', en: 'European ring size', ne: 'युरोपेली नाप', hi: 'यूरोपीय नाप', verified: false, note: 'Often circumference in mm; confirm with supplier.' }
];

export const REGIONS = {
  NP: {
    code: 'NP', country: 'Nepal', countryNe: 'नेपाल', countryHi: 'नेपाल',
    currency: 'NPR', symbol: 'रू', locale: 'ne-NP', timezone: 'Asia/Kathmandu',
    languages: ['ne', 'en'], fiscalYear: 'Shrawan (mid-July); configurable',
    tax: { label: 'VAT', rate: 13, inclusive: true, idLabel: 'VAT / PAN', status: 'Configurable; verify current law' },
    tradeUnits: ['tola', 'masha', 'ana', 'lal', 'ratti', 'gram'],
    hallmark: { authority: 'Nepal Bureau of Standards & Metrology (NBSM)', status: 'Needs verification' },
    invoice: { prefix: 'INV', fields: ['VAT/PAN', 'invoice number', 'date (BS/AD)', 'customer'] },
    notes: ['Gold and silver trade commonly quoted per tola.', 'Traditional units are not universal; confirm with the counterparty.']
  },
  IN: {
    code: 'IN', country: 'India', countryNe: 'भारत', countryHi: 'भारत',
    currency: 'INR', symbol: '₹', locale: 'en-IN', timezone: 'Asia/Kolkata',
    languages: ['hi', 'en'], fiscalYear: 'April; configurable',
    tax: { label: 'GST', rates: [{ name: 'CGST' }, { name: 'SGST' }, { name: 'IGST' }], hsn: '7113', status: 'Configurable with effective dates; verify current rates' },
    tradeUnits: ['tola', 'masha', 'ratti', 'gram'],
    hallmark: { authority: 'BIS', fields: ['HUID'], status: 'Needs verification' },
    invoice: { prefix: 'INV', fields: ['GSTIN', 'HSN', 'invoice number', 'place of supply'] },
    notes: ['BIS hallmarking and HUID integration points are placeholders only.', 'Tax rates must be maintained with effective dates, not hardcoded.']
  }
};

/** Regional trade terms, categorised so they are never confused with units. */
export const REGIONAL_TERMS = [
  { id: 'sun', region: 'NP', kind: 'material', en: 'Gold (spoken)', ne: 'सुन', hi: 'सोना', note: 'Trade word, not a unit' },
  { id: 'chandi', region: 'NP', kind: 'material', en: 'Silver (spoken)', ne: 'चाँदी', hi: 'चाँदी' },
  { id: 'sunko-gahanaa', region: 'NP', kind: 'product', en: 'Gold jewellery', ne: 'सुनको गहना', hi: 'सोने के आभूषण' },
  { id: 'chura', region: 'NP', kind: 'product', en: 'Bangle', ne: 'बाला', hi: 'चूड़ी' },
  { id: 'tilhari', region: 'NP', kind: 'product', en: 'Tilhari', ne: 'तिलहरी', hi: 'तिलहरी' },
  { id: 'pote', region: 'NP', kind: 'product', en: 'Pote (beaded necklace)', ne: 'पोते', hi: 'पोते' },
  { id: 'naugedi', region: 'NP', kind: 'product', en: 'Naugedi', ne: 'नौगेडी', hi: 'नौगेड़ी', needsVerification: true },
  { id: 'tola-term', region: 'NP', kind: 'measurement', en: 'Tola', ne: 'तोला', hi: 'तोला' },
  { id: 'hallmark', region: 'IN', kind: 'regulatory', en: 'Hallmark', ne: 'हलमार्क', hi: 'हॉलमार्क' },
  { id: 'bis', region: 'IN', kind: 'regulatory', en: 'BIS', ne: 'बीआईएस', hi: 'बीआईएस' },
  { id: 'huid', region: 'IN', kind: 'regulatory', en: 'HUID', ne: 'एचयूआईडी', hi: 'HUID' },
  { id: 'sona', region: 'IN', kind: 'material', en: 'Gold (spoken)', ne: 'सुन', hi: 'सोना' },
  { id: 'jadau', region: 'IN', kind: 'product', en: 'Jadau', ne: 'जडाउ', hi: 'जड़ाऊ' },
  { id: 'kundan', region: 'IN', kind: 'product', en: 'Kundan', ne: 'कुन्दन', hi: 'कुंदन' },
  { id: 'polki', region: 'IN', kind: 'product', en: 'Polki', ne: 'पोल्की', hi: 'पोलकी' },
  { id: 'meenakari', region: 'IN', kind: 'process', en: 'Meenakari (enamelling)', ne: 'मिनाकारी', hi: 'मीनाकारी' },
  { id: 'making-charges', region: 'IN', kind: 'trade', en: 'Making charges', ne: 'बनाइ शुल्क', hi: 'मेकिंग चार्ज' },
  { id: 'wastage', region: 'IN', kind: 'trade', en: 'Wastage', ne: 'क्षति', hi: 'वेस्टेज' }
];


/** Workshop tools — names are transliterations where no settled local term exists. */
export const TOOLS = [
  { id: 'rolling-mill', en: 'Rolling Mill', ne: 'रोलिङ मिल', hi: 'रोलिंग मिल', use: 'Sheet and wire reduction' },
  { id: 'draw-bench', en: 'Draw Bench', ne: 'ड्र बेन्च', hi: 'ड्रॉ बेंच', use: 'Wire drawing' },
  { id: 'wire-drawing-dies', en: 'Wire Drawing Dies', ne: 'तार तान्ने डाइ', hi: 'तार खींचने की डाई', use: 'Wire gauge reduction' },
  { id: 'rolling-mill-rollers', en: 'Mill Rollers', ne: 'मिल रोलर', hi: 'मिल रोलर', use: 'Rolling mill consumable' },
  { id: 'jewellers-saw', en: "Jeweller's Saw", ne: 'गहना काट्ने आरी', hi: 'आभूषण आरी', use: 'Fine piercing and cutting' },
  { id: 'piercing-saw-blades', en: 'Piercing Saw Blades', ne: 'सानो आरी ब्लेड', hi: 'बारीक आरी ब्लेड', use: 'Saw frame consumable' },
  { id: 'needle-files', en: 'Needle Files', ne: 'सुई फाइल', hi: 'सुई रेती', use: 'Filing and shaping' },
  { id: 'half-round-file', en: 'Half-Round File', ne: 'आधा गोलो फाइल', hi: 'आधी गोल रेती', use: 'Curved surfaces' },
  { id: 'flat-file', en: 'Flat File', ne: 'चेप्टो फाइल', hi: 'चपटी रेती', use: 'Flat surfaces' },
  { id: 'barrel-polisher', en: 'Barrel Polisher', ne: 'ब्यारल पोलिसर', hi: 'बैरल पॉलिशर', use: 'Mass finishing' },
  { id: 'magnetic-polisher', en: 'Magnetic Polisher', ne: 'चुम्बकीय पोलिसर', hi: 'चुंबकीय पॉलिशर', use: 'Pin finishing' },
  { id: 'polishing-lathe', en: 'Polishing Lathe', ne: 'पोलिसिङ लेथ', hi: 'पॉलिशिंग लेथ', use: 'Buffing and finishing' },
  { id: 'buffing-wheel', en: 'Buffing Wheel', ne: 'बफिङ चक्का', hi: 'बफिंग चक्र', use: 'Polishing consumable' },
  { id: 'polishing-compound', en: 'Polishing Compound', ne: 'पोलिसिङ कम्पाउन्ड', hi: 'पॉलिशिंग कम्पाउंड', use: 'Abrasive compound' },
  { id: 'torch', en: 'Soldering Torch', ne: 'टाँस्ने टर्च', hi: 'सोल्डरिंग टॉर्च', use: 'Soldering and annealing' },
  { id: 'pickle-pot', en: 'Pickle Pot', ne: 'पिकल भाँडो', hi: 'पिकल पात्र', use: 'Oxide removal' },
  { id: 'ultrasonic-cleaner', en: 'Ultrasonic Cleaner', ne: 'अल्ट्रासोनिक क्लिनर', hi: 'अल्ट्रासोनिक क्लीनर', use: 'Final cleaning' },
  { id: 'steam-cleaner', en: 'Steam Cleaner', ne: 'स्टिम क्लिनर', hi: 'स्टीम क्लीनर', use: 'Pre-display cleaning' },
  { id: 'ring-mandrel', en: 'Ring Mandrel', ne: 'औँठी म्यान्ड्रेल', hi: 'रिंग मैंड्रेल', use: 'Ring sizing' },
  { id: 'ring-sizer', en: 'Ring Sizer Set', ne: 'औँठी नाप सेट', hi: 'रिंग साइज़र सेट', use: 'Size measurement' },
  { id: 'vernier-caliper', en: 'Vernier Caliper', ne: 'भर्नियर क्यालिपर', hi: 'वर्नियर कैलिपर', use: 'Dimension measurement' },
  { id: 'micrometer', en: 'Micrometer', ne: 'माइक्रोमिटर', hi: 'माइक्रोमीटर', use: 'Thickness and diameter' },
  { id: 'diamond-gauge', en: 'Diamond Gauge', ne: 'हीरा नाप्ने गेज', hi: 'हीरा गेज', use: 'Stone dimension' },
  { id: 'carat-scale', en: 'Carat Scale', ne: 'क्यारेट तराजु', hi: 'कैरेट तराजू', use: 'Gemstone mass' },
  { id: 'gold-scale', en: 'Precision Gold Scale', ne: 'सुनको सूक्ष्म तराजु', hi: 'सोने का सूक्ष्म तराजू', use: 'Metal mass to 0.001 g' },
  { id: 'loupe', en: 'Jeweller Loupe (10x)', ne: 'लुप (१०x)', hi: 'लूप (10x)', use: 'Stone inspection' },
  { id: 'diamond-tester', en: 'Diamond Tester', ne: 'हीरा परीक्षक', hi: 'हीरा परीक्षक', use: 'Thermal/conductivity check' },
  { id: 'acid-test-kit', en: 'Acid Test Kit', ne: 'एसिड परीक्षण किट', hi: 'एसिड परीक्षण किट', use: 'Gold purity spot test' },
  { id: 'magnet', en: 'Magnet', ne: 'चुम्बक', hi: 'चुंबक', use: 'Ferrous contamination check' },
  { id: 'bench-pin', en: 'Bench Pin', ne: 'बेन्च पिन', hi: 'बेंच पिन', use: 'Sawing support' },
  { id: 'ring-clamp', en: 'Ring Clamp', ne: 'औँठी क्ल्याम्प', hi: 'रिंग क्लैंप', use: 'Holding work' },
  { id: 'pliers-set', en: 'Pliers Set', ne: 'प्लायर सेट', hi: 'प्लायर सेट', use: 'Bending and forming' },
  { id: 'side-cutters', en: 'Side Cutters', ne: 'साइड कटर', hi: 'साइड कटर', use: 'Wire cutting' },
  { id: 'burnisher', en: 'Burnisher', ne: 'बर्निशर', hi: 'बर्निशर', use: 'Surface compression' },
  { id: 'graver', en: 'Graver', ne: 'ग्रेभर', hi: 'ग्रेवर', use: 'Engraving' },
  { id: 'punch-set', en: 'Punch & Die Set', ne: 'पन्च र डाइ सेट', hi: 'पंच और डाई सेट', use: 'Sheet forming' },
  { id: 'dapping-block', en: 'Dapping Block', ne: 'ड्यापिङ ब्लक', hi: 'डैपिंग ब्लॉक', use: 'Doming' },
  { id: 'wax-injector', en: 'Wax Injector', ne: 'व्याक्स इन्जेक्टर', hi: 'वैक्स इंजेक्टर', use: 'Casting models' },
  { id: 'casting-machine', en: 'Casting Machine', ne: 'कास्टिङ मेसिन', hi: 'कास्टिंग मशीन', use: 'Metal casting' },
  { id: 'laser-welder', en: 'Laser Welder', ne: 'लेजर वेल्डर', hi: 'लेज़र वेल्डर', use: 'Precision joining' }
];

export const UNIT_BY_ID = Object.fromEntries(UNITS.map(u => [u.id, u]));

export function unitName(unit, lang = 'en') {
  if (!unit) return '';
  return unit[lang] || unit.en;
}

/** Convert between two units of the same measurement type. */
export function convert(value, fromId, toId) {
  const from = UNIT_BY_ID[fromId];
  const to = UNIT_BY_ID[toId];
  if (!from || !to) return { ok: false, error: 'unknown-unit' };
  if (from.type !== to.type) return { ok: false, error: 'type-mismatch', fromType: from.type, toType: to.type };
  const v = Number(value);
  if (!Number.isFinite(v)) return { ok: false, error: 'invalid-value' };
  if (fromId === toId) return { ok: true, value: v, unit: to, precision: to.precision };
  const base = v * from.toBase;
  const out = base / to.toBase;
  return { ok: true, value: out, unit: to, precision: to.precision };
}

export function convertRounded(value, fromId, toId) {
  const r = convert(value, fromId, toId);
  if (!r.ok) return r;
  const factor = Math.pow(10, Math.min(r.precision ?? 2, 6));
  return { ...r, value: Math.round(r.value * factor) / factor };
}

export function karatToFineness(karat) {
  const k = Number(karat);
  if (!Number.isFinite(k) || k < 0 || k > 24) return null;
  return Math.round((k / 24) * 1000 * 10) / 10;
}

export function finenessToKarat(fineness) {
  const f = Number(fineness);
  if (!Number.isFinite(f) || f <= 0) return null;
  return Math.round((f / 1000) * 24 * 100) / 100;
}

/** Normalised cross-language search over catalogue, units, metals and terms. */
export function searchKnowledge(query, lang = 'en') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const results = [];
  const match = (...parts) => parts.filter(Boolean).join(' ').toLowerCase().includes(q);
  JEWELLERY_CATALOGUE.forEach(cat => {
    if (match(cat.en, cat.ne, cat.hi, ...(cat.keywords || []))) {
      results.push({ kind: 'category', id: cat.id, title: cat[lang] || cat.en, subtitle: cat.en, meta: 'Category', keywords: cat.keywords });
    }
    cat.types.forEach(type => {
      if (match(type.en, type.ne, type.hi, ...(type.keywords || []), cat.en)) {
        results.push({ kind: 'type', id: type.id, title: type[lang] || type.en, subtitle: type.en, meta: cat.en, region: type.region, needsVerification: type.needsVerification });
      }
    });
  });
  UNITS.forEach(u => {
    if (match(u.en, u.ne, u.hi, u.abbr, u.source)) {
      results.push({ kind: 'unit', id: u.id, title: unitName(u, lang), subtitle: `${u.en} (${u.abbr})`, meta: u.type, note: u.regional ? 'Regional unit — confirm local definition' : '' });
    }
  });
  METALS.forEach(m => {
    if (match(m.en, m.ne, m.hi, m.symbol)) results.push({ kind: 'metal', id: m.id, title: m[lang] || m.en, subtitle: `${m.en} (${m.symbol})`, meta: 'Metal' });
  });
  TOOLS.forEach(tool => {
    if (match(tool.en, tool.ne, tool.hi, tool.use)) results.push({ kind: 'tool', id: tool.id, title: tool[lang] || tool.en, subtitle: tool.use, meta: 'Tools' });
  });
  REGIONAL_TERMS.forEach(term => {
    if (match(term.en, term.ne, term.hi)) results.push({ kind: 'term', id: term.id, title: term[lang] || term.en, subtitle: term.en, meta: `${term.region} · ${term.kind}` });
  });
  return results;
}

/** Gemstones: kind, Mohs hardness and common treatment notes are reference values. */
export const GEMSTONES = [
  { id: 'diamond', kind: 'precious', en: 'Diamond', ne: 'हीरा', hi: 'हीरा', mohs: '10', note: 'Hardest natural gem; lab-grown stones must be disclosed.' },
  { id: 'ruby', kind: 'precious', en: 'Ruby', ne: 'रुबी', hi: 'माणिक', mohs: '9', note: 'Corundum; heat treatment is common and must be disclosed.' },
  { id: 'sapphire', kind: 'precious', en: 'Sapphire', ne: 'नीलम', hi: 'नीलम', mohs: '9', note: 'Corundum in blue and fancy colours; treatments vary.' },
  { id: 'emerald', kind: 'precious', en: 'Emerald', ne: 'पन्ना', hi: 'पन्ना', mohs: '7.5–8', note: 'Beryl; often clarity-enhanced — disclose treatment.' },
  { id: 'pearl', kind: 'organic', en: 'Pearl', ne: 'मोती', hi: 'मोती', mohs: '2.5–4.5', note: 'Natural, cultured and imitation pearls are different products.' },
  { id: 'coral', kind: 'organic', en: 'Coral', ne: 'प्रवाल', hi: 'मूंगा', mohs: '3–4', note: 'Organic; dyeing and stabilisation are common.' },
  { id: 'topaz', kind: 'semi-precious', en: 'Topaz', ne: 'टोपाज', hi: 'टोपाज़', mohs: '8', note: 'Blue topaz is usually treated; disclose.' },
  { id: 'garnet', kind: 'semi-precious', en: 'Garnet', ne: 'गार्नेट', hi: 'गार्नेट', mohs: '6.5–7.5', note: 'Group of minerals with several colour varieties.' },
  { id: 'amethyst', kind: 'semi-precious', en: 'Amethyst', ne: 'अमेथिस्ट', hi: 'अमेथिस्ट', mohs: '7', note: 'Purple quartz; heat treatment changes colour.' },
  { id: 'citrine', kind: 'semi-precious', en: 'Citrine', ne: 'सिट्रिन', hi: 'सिट्रीन', mohs: '7', note: 'Yellow quartz; often heat-treated amethyst.' },
  { id: 'tourmaline', kind: 'semi-precious', en: 'Tourmaline', ne: 'टूर्मलिन', hi: 'टूर्मलीन', mohs: '7–7.5', note: 'Wide colour range; some stones are fracture-filled.' },
  { id: 'peridot', kind: 'semi-precious', en: 'Peridot', ne: 'पेरिडट', hi: 'पेरिडॉट', mohs: '6.5–7', note: 'Olivine variety; sensitive to thermal shock.' },
  { id: 'opal', kind: 'semi-precious', en: 'Opal', ne: 'ओपल', hi: 'ओपल', mohs: '5.5–6.5', note: 'Contains water; avoid heat and sudden drying.' },
  { id: 'turquoise', kind: 'semi-precious', en: 'Turquoise', ne: 'टर्कीज', hi: 'फ़िरोज़ा', mohs: '5–6', note: 'Stabilisation and dyeing are common; disclose.' },
  { id: 'moonstone', kind: 'semi-precious', en: 'Moonstone', ne: 'चन्द्रकान्त', hi: 'चंद्रकांत', mohs: '6–6.5', note: 'Feldspar with adularescence.' },
  { id: 'zircon', kind: 'semi-precious', en: 'Zircon', ne: 'जर्कन', hi: 'ज़िरकॉन', mohs: '6.5–7.5', note: 'Natural zircon is not cubic zirconia (CZ).' },
  { id: 'cz', kind: 'synthetic', en: 'Cubic Zirconia (CZ)', ne: 'क्युबिक जर्कोनिया', hi: 'क्यूबिक ज़िरकोनिया', mohs: '8–8.5', note: 'Synthetic simulant; never describe as diamond.' },
  { id: 'lab-diamond', kind: 'synthetic', en: 'Lab-Grown Diamond', ne: 'प्रयोगशालामा बनेको हीरा', hi: 'प्रयोगशाला में बना हीरा', mohs: '10', note: 'Chemically diamond; disclosure is mandatory.' }
];

/** Manufacturing processes and design styles. */
export const PROCESSES = [
  { id: 'casting', en: 'Casting', ne: 'कास्टिङ', hi: 'कास्टिंग', group: 'forming', note: 'Molten metal poured into a mould.' },
  { id: 'hand-forging', en: 'Hand Forging', ne: 'हातले पिट्ने', hi: 'हाथ से गढ़ना', group: 'forming', note: 'Hammering and shaping by hand.' },
  { id: 'rolling', en: 'Rolling', ne: 'रोलिङ', hi: 'रोलिंग', group: 'forming', note: 'Reducing thickness into sheet or wire.' },
  { id: 'wax-model', en: 'Wax Model / CAD', ne: 'व्याक्स मोडेल / सीएडी', hi: 'वैक्स मॉडल / सीएडी', group: 'design', note: 'Design prepared in wax or CAD before casting.' },
  { id: 'stone-setting', en: 'Stone Setting', ne: 'ढुङ्गा जडाउने', hi: 'पत्थर जड़ना', group: 'setting', note: 'Prong, bezel, channel or pavé setting.' },
  { id: 'kundan', en: 'Kundan Setting', ne: 'कुन्दन जडाउ', hi: 'कुंदन जड़ाउ', group: 'setting', note: 'Traditional north-Indian setting with refined gold.' },
  { id: 'meenakari', en: 'Meenakari (Enamelling)', ne: 'मिनाकारी', hi: 'मीनाकारी', group: 'finishing', note: 'Fired enamel work on metal.' },
  { id: 'filigree', en: 'Filigree', ne: 'फिलिग्री', hi: 'फिलीग्री', group: 'design', note: 'Fine wirework ornament.' },
  { id: 'engraving', en: 'Engraving', ne: 'कुँदाइ', hi: 'नक्काशी', group: 'finishing', note: 'Hand or machine cutting of patterns.' },
  { id: 'polishing', en: 'Polishing', ne: 'पोलिस', hi: 'पॉलिश', group: 'finishing', note: 'Surface smoothing and lustre.' },
  { id: 'rhodium-plating', en: 'Rhodium Plating', ne: 'रोडियम लेपन', hi: 'रोडियम चढ़ाना', group: 'finishing', note: 'White surface plating, common on white gold.' },
  { id: 'laser-welding', en: 'Laser Welding', ne: 'लेजर वेल्डिङ', hi: 'लेज़र वेल्डिंग', group: 'joining', note: 'Precision join with low heat input.' },
  { id: 'hallmarking', en: 'Hallmarking', ne: 'हलमार्किङ', hi: 'हॉलमार्किंग', group: 'compliance', note: 'Official purity mark; requirements vary by country.', needsVerification: true }
];

/** Currencies shown for formatting reference only. No exchange rates are stored. */
export const CURRENCIES = [
  { id: 'NPR', en: 'Nepalese Rupee', ne: 'नेपाली रुपैयाँ', hi: 'नेपाली रुपया', symbol: 'रु.', countries: 'Nepal', decimals: 2 },
  { id: 'INR', en: 'Indian Rupee', ne: 'भारतीय रुपैयाँ', hi: 'भारतीय रुपया', symbol: '₹', countries: 'India', decimals: 2 },
  { id: 'USD', en: 'US Dollar', ne: 'अमेरिकी डलर', hi: 'अमेरिकी डॉलर', symbol: '$', countries: 'United States', decimals: 2 },
  { id: 'EUR', en: 'Euro', ne: 'युरो', hi: 'यूरो', symbol: '€', countries: 'Euro area', decimals: 2 },
  { id: 'GBP', en: 'Pound Sterling', ne: 'बेलायती पाउन्ड', hi: 'ब्रिटिश पाउंड', symbol: '£', countries: 'United Kingdom', decimals: 2 },
  { id: 'AED', en: 'UAE Dirham', ne: 'यूएई दिरहाम', hi: 'यूएई दिरहम', symbol: 'د.إ', countries: 'United Arab Emirates', decimals: 2 },
  { id: 'SAR', en: 'Saudi Riyal', ne: 'साउदी रियाल', hi: 'सऊदी रियाल', symbol: '﷼', countries: 'Saudi Arabia', decimals: 2 },
  { id: 'CNY', en: 'Chinese Yuan', ne: 'चिनियाँ युआन', hi: 'चीनी युआन', symbol: '¥', countries: 'China', decimals: 2 },
  { id: 'JPY', en: 'Japanese Yen', ne: 'जापानी येन', hi: 'जापानी येन', symbol: '¥', countries: 'Japan', decimals: 0 },
  { id: 'CHF', en: 'Swiss Franc', ne: 'स्विस फ्र्याङ्क', hi: 'स्विस फ्रैंक', symbol: 'CHF', countries: 'Switzerland', decimals: 2 },
  { id: 'AUD', en: 'Australian Dollar', ne: 'अस्ट्रेलियाली डलर', hi: 'ऑस्ट्रेलियाई डॉलर', symbol: 'A$', countries: 'Australia', decimals: 2 },
  { id: 'CAD', en: 'Canadian Dollar', ne: 'क्यानाडाली डलर', hi: 'कनाडाई डॉलर', symbol: 'C$', countries: 'Canada', decimals: 2 },
  { id: 'SGD', en: 'Singapore Dollar', ne: 'सिङ्गापुर डलर', hi: 'सिंगापुर डॉलर', symbol: 'S$', countries: 'Singapore', decimals: 2 },
  { id: 'HKD', en: 'Hong Kong Dollar', ne: 'हङकङ डलर', hi: 'हांगकांग डॉलर', symbol: 'HK$', countries: 'Hong Kong', decimals: 2 },
  { id: 'THB', en: 'Thai Baht', ne: 'थाई बाट', hi: 'थाई बात', symbol: '฿', countries: 'Thailand', decimals: 2 },
  { id: 'MYR', en: 'Malaysian Ringgit', ne: 'मलेसियाली रिङ्गिट', hi: 'मलेशियाई रिंगिट', symbol: 'RM', countries: 'Malaysia', decimals: 2 }
];

/** International standards and schemes referenced by the trade. Statuses are informational. */
export const INTERNATIONAL_STANDARDS = [
  { id: 'iso-9202', en: 'ISO 9202 — Gold alloy fineness', ne: 'आईएसओ ९२०२ — सुनको मिश्रण शुद्धता', hi: 'आईएसओ 9202 — स्वर्ण मिश्र धातु शुद्धता', body: 'ISO', scope: 'Purity', status: 'Reference' },
  { id: 'iso-11210', en: 'ISO 11210 — Platinum jewellery fineness', ne: 'आईएसओ ११२१० — प्लाटिनम शुद्धता', hi: 'आईएसओ 11210 — प्लेटिनम शुद्धता', body: 'ISO', scope: 'Purity', status: 'Reference' },
  { id: 'iso-8654', en: 'ISO 8654 — Gold alloy colour', ne: 'आईएसओ ८६५४ — सुनको रङ', hi: 'आईएसओ 8654 — स्वर्ण रंग', body: 'ISO', scope: 'Colour', status: 'Reference' },
  { id: 'iso-11596', en: 'ISO 11596 — Jewellery marking', ne: 'आईएसओ ११५९६ — गहना चिन्ह', hi: 'आईएसओ 11596 — आभूषण चिह्न', body: 'ISO', scope: 'Marking', status: 'Reference' },
  { id: 'iso-4217', en: 'ISO 4217 — Currency codes', ne: 'आईएसओ ४२१७ — मुद्रा कोड', hi: 'आईएसओ 4217 — मुद्रा कोड', body: 'ISO', scope: 'Currency', status: 'Reference' },
  { id: 'cibjo-blue', en: 'CIBJO Blue Books', ne: 'सीआईबीजेओ ब्लु बुक', hi: 'सीआईबीजेओ ब्लू बुक', body: 'CIBJO', scope: 'Gemstone & jewellery terminology', status: 'Reference' },
  { id: 'kpcs', en: 'Kimberley Process (KPCS)', ne: 'किम्बर्ली प्रक्रिया (केपीसीएस)', hi: 'किम्बरली प्रक्रिया (केपीसीएस)', body: 'Kimberley Process', scope: 'Rough diamond trade', status: 'Reference' },
  { id: 'lbma', en: 'LBMA Good Delivery', ne: 'एलबीएमए गुड डेलिभरी', hi: 'एलबीएमए गुड डिलीवरी', body: 'LBMA', scope: 'Bullion refiner standards', status: 'Reference' },
  { id: 'rjc', en: 'Responsible Jewellery Council (RJC)', ne: 'रिस्पोन्सिबल ज्वेलरी काउन्सिल', hi: 'रिस्पॉन्सिबल ज्वेलरी काउंसिल', body: 'RJC', scope: 'Supply-chain certification', status: 'Reference' },
  { id: 'bis', en: 'BIS Hallmarking — India', ne: 'बीआईएस हलमार्क — भारत', hi: 'बीआईएस हॉलमार्क — भारत', body: 'BIS', scope: 'Hallmarking + HUID', status: 'Needs local confirmation', needsVerification: true },
  { id: 'nbsm', en: 'NBSM Hallmarking — Nepal', ne: 'एनबीएसएम हलमार्क — नेपाल', hi: 'एनबीएसएम हॉलमार्क — नेपाल', body: 'NBSM', scope: 'Hallmarking', status: 'Needs local confirmation', needsVerification: true }
];

/**
 * Common published ring-size mappings around ISO circumference.
 * The whole table is reference-only; confirm with a physical sizing set.
 */
export const RING_SIZE_TABLE = [
  { circ: 44.2, us: '3', uk: 'H', eu: '44', jp: '4', india: '6' },
  { circ: 45.5, us: '3½', uk: 'I', eu: '45.5', jp: '5', india: '7' },
  { circ: 46.8, us: '4', uk: 'J', eu: '47', jp: '6', india: '8' },
  { circ: 48.0, us: '4½', uk: 'K', eu: '48', jp: '7', india: '9' },
  { circ: 49.3, us: '5', uk: 'L', eu: '49.5', jp: '8', india: '10' },
  { circ: 50.6, us: '5½', uk: 'M', eu: '50.5', jp: '9', india: '11' },
  { circ: 51.9, us: '6', uk: 'N', eu: '52', jp: '10', india: '12' },
  { circ: 53.1, us: '6½', uk: 'O', eu: '53', jp: '11', india: '13' },
  { circ: 54.4, us: '7', uk: 'P', eu: '54.5', jp: '12', india: '14' },
  { circ: 55.7, us: '7½', uk: 'Q', eu: '55.5', jp: '13', india: '15' },
  { circ: 57.0, us: '8', uk: 'R', eu: '57', jp: '14', india: '16' },
  { circ: 58.3, us: '8½', uk: 'S', eu: '58', jp: '15', india: '17' },
  { circ: 59.5, us: '9', uk: 'T', eu: '59.5', jp: '16', india: '18' },
  { circ: 60.8, us: '9½', uk: 'U', eu: '60.5', jp: '17', india: '19' },
  { circ: 62.1, us: '10', uk: 'V', eu: '62', jp: '18', india: '20' },
  { circ: 63.4, us: '10½', uk: 'W', eu: '63', jp: '19', india: '21' },
  { circ: 64.6, us: '11', uk: 'X', eu: '64.5', jp: '20', india: '22' },
  { circ: 65.9, us: '11½', uk: 'Y', eu: '65.5', jp: '21', india: '23' },
  { circ: 67.2, us: '12', uk: 'Z', eu: '67', jp: '22', india: '24' },
  { circ: 68.5, us: '12½', uk: 'Z+1', eu: '68.5', jp: '23', india: '25' },
  { circ: 70.0, us: '13', uk: 'Z+2', eu: '70', jp: '24', india: '26' }
];

/** Facts that must be confirmed locally before invoice use. */
export const CONFIRMATION_ITEMS = [
  { id: 'tola', en: 'Tola factor (11.6638 g)', ne: 'तोला गुणक (११.६६३८ ग्राम)', use: 'Weight conversion and gold pricing', needsVerification: true },
  { id: 'masha', en: 'Masha / ana / lal / ratti factors', ne: 'मासा / आना / लाल / रत्ती गुणक', use: 'Traditional weight sub-units', needsVerification: true },
  { id: 'nbsm', en: 'NBSM hallmarking details — Nepal', ne: 'एनबीएसएम हलमार्क विवरण — नेपाल', use: 'Hallmark field on invoice', needsVerification: true },
  { id: 'bis', en: 'BIS hallmarking + HUID — India', ne: 'बीआईएस हलमार्क + एचयूआईडी — भारत', use: 'Hallmark / HUID fields', needsVerification: true },
  { id: 'vat', en: 'VAT rate and label — Nepal', ne: 'भ्याट दर र लेबल — नेपाल', use: 'Invoice tax lines', needsVerification: true },
  { id: 'gst', en: 'GST rates, HSN and place of supply — India', ne: 'जीएसटी दर, एचएसएन र आपूर्ति स्थान — भारत', use: 'Invoice tax lines', needsVerification: true }
];

export function ringSizeNearest(circumference) {
  const mm = Number(circumference);
  if (!Number.isFinite(mm) || mm <= 0) return null;
  return RING_SIZE_TABLE.reduce((best, row) =>
    Math.abs(row.circ - mm) < Math.abs(best.circ - mm) ? row : best
  );
}

export function ringSizeToCircumference(size, system = 'us') {
  const raw = String(size ?? '').trim();
  if (!raw) return null;
  if (system === 'iso-mm' || system === 'eu') {
    const mm = Number(raw.replace(',', '.'));
    return Number.isFinite(mm) ? mm : null;
  }
  const normalized = raw.replace('½', '.5').toUpperCase();
  const row = RING_SIZE_TABLE.find(r => String(r[system]).toUpperCase() === normalized);
  return row ? row.circ : null;
}
