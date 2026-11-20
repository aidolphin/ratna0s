export const JEWELRY_CATEGORIES = [
  { id: 'ring', label: 'Rings', icon: 'ring', category: 'gold', subTypes: ['Engagement', 'Wedding', 'Eternity', 'Signet', 'Cocktail', 'Stackable', 'Promise', 'Midi'] },
  { id: 'necklace', label: 'Necklaces', icon: 'necklace', category: 'gold', subTypes: ['Chain', 'Pendant', 'Choker', 'Collar', 'Opera', 'Lariat', 'Bib', 'Station'] },
  { id: 'earring', label: 'Earrings', icon: 'earring', category: 'gold', subTypes: ['Stud', 'Hoop', 'Drop', 'Chandelier', 'Huggie', 'Cuff', 'Threader', 'Jacket'] },
  { id: 'bracelet', label: 'Bracelets', icon: 'bracelet', category: 'gold', subTypes: ['Bangle', 'Cuff', 'Chain', 'Tennis', 'Charm', 'Link', 'Beaded', 'Slave'] },
  { id: 'pendant', label: 'Pendants', icon: 'pendant', category: 'gold', subTypes: ['Solitaire', 'Halo', 'Cluster', 'Initial', 'Religious', 'Gemstone', 'Pearl', 'Locket'] },
  { id: 'bangle', label: 'Bangles', icon: 'bangle', category: 'gold', subTypes: ['Solid', 'Hinged', 'Flexible', 'Diamond-cut', 'Enamel', 'Kundan', 'Polki', 'Temple'] },
  { id: 'anklet', label: 'Anklets', icon: 'anklet', category: 'silver', subTypes: ['Chain', 'Charm', 'Beaded', 'Payal', 'Ghungroo', 'Layered'] },
  { id: 'nosepin', label: 'Nose Pins', icon: 'nosepin', category: 'gold', subTypes: ['Stud', 'Hoop', 'Septum', 'Nath', 'Phul', 'Latkan', 'Diamond', 'Pearl'] },
  { id: 'maangtikka', label: 'Maang Tikka', icon: 'maangtikka', category: 'gold', subTypes: ['Traditional', 'Contemporary', 'Matha Patti', 'Borla', 'Rakhdi', 'Jhoomar'] },
  { id: 'earcuff', label: 'Ear Cuffs', icon: 'earcuff', category: 'gold', subTypes: ['Simple', 'Chain', 'Gemstone', 'Climber', 'Wrap', 'Double'] },
  { id: 'brooch', label: 'Brooches', icon: 'brooch', category: 'platinum', subTypes: ['Floral', 'Animal', 'Geometric', 'Cameo', 'Enamel', 'Jeweled', 'Vintage'] },
  { id: 'cufflink', label: 'Cufflinks', icon: 'cufflink', category: 'platinum', subTypes: ['Classic', 'Chain', 'Gemstone', 'Engraved', 'Novelty', 'Silk Knot'] },
  { id: 'tiepin', label: 'Tie Pins', icon: 'tiepin', category: 'platinum', subTypes: ['Classic', 'Gemstone', 'Pearl', 'Monogram', 'Themed'] },
  { id: 'watch', label: 'Watches', icon: 'watch', category: 'platinum', subTypes: ['Dress', 'Sports', 'Chronograph', 'Skeleton', 'Tourbillon', 'Smart'] },
  { id: 'coin', label: 'Gold Coins', icon: 'coin', category: 'gold', subTypes: ['1g', '2g', '5g', '8g', '10g', '20g', '50g', '100g'] },
  { id: 'bar', label: 'Gold Bars', icon: 'bar', category: 'gold', subTypes: ['5g', '10g', '20g', '50g', '100g', '250g', '500g', '1kg'] },
  { id: 'loose-diamond', label: 'Loose Diamonds', icon: 'diamond', category: 'diamond', subTypes: ['Round', 'Princess', 'Oval', 'Cushion', 'Emerald', 'Pear', 'Marquise', 'Heart'] },
  { id: 'loose-gemstone', label: 'Loose Gemstones', icon: 'gemstone', category: 'gemstone', subTypes: ['Ruby', 'Sapphire', 'Emerald', 'Tanzanite', 'Tourmaline', 'Spinel', 'Topaz', 'Garnet'] },
  { id: 'pearl', label: 'Pearls', icon: 'pearl', category: 'gemstone', subTypes: ['Akoya', 'South Sea', 'Tahitian', 'Freshwater', 'Keshi', 'Mabe', 'Baroque'] },
];

export const ITEM_CATEGORIES = JEWELRY_CATEGORIES.map(c => c.id);
export const PURITY_OPTIONS = ['24K','22K','21K','20K','18K','14K','12K','9K','999','925','950','PT950','PT900','PT850'];
export const METAL_TYPES = ['Gold','Silver','Platinum','Rose Gold','White Gold','Two-Tone','Tri-Color'];

export const METAL_TYPES_BY_CATEGORY = {
  gold: ['Gold','Rose Gold','White Gold','Two-Tone','Tri-Color'],
  silver: ['Silver','Platinum'],
  diamond: ['Gold','Silver','Platinum','Rose Gold','White Gold'],
  gemstone: ['Gold','Silver','Platinum','Rose Gold','White Gold']
};
export const STONE_TYPES = ['Diamond','Ruby','Sapphire','Emerald','Cubic Zirconia','Coral','Pearl','Navaratna','Spinel','Tourmaline','Topaz','Garnet','Opal','Tanzanite','Aquamarine','Morganite','Peridot','Amethyst','Citrine','Moonstone','Labradorite'];
export const STATUS_OPTIONS = ['stock','reserved','in_production','sold','returned','damaged'];
export const LOCATIONS = ['Showcase','Vault','Karigar','Workshop','Safe','Transit','Customer','Exhibition','Repair'];
export const MOVEMENT_TYPES = ['IN','OUT','ADJUSTMENT'];
export const MOVEMENT_REASONS = {IN:['Purchase','Production','Return from Karigar','Exchange In','Repair Return','Stock Found','Exhibition Return'],OUT:['Sale','Issue to Karigar','Exchange Out','Repair Send','Stock Transfer','Gift/Sample','Exhibition Send'],ADJUSTMENT:['Physical Count','Damage','Loss','Wastage','Revaluation','Stone Replacement','Resizing']};
export const PAYMENT_METHODS = ['Cash','Bank Transfer','Card','Wallet','UPI','Credit','Cheque','Gold Exchange','Installment'];

export const METAL_TXN_TYPES = [
  {value:'OPENING_BALANCE',label:'Opening Balance',icon:'📊',color:'var(--info)'},
  {value:'PURCHASE',label:'Purchase',icon:'📥',color:'var(--success)'},
  {value:'ISSUE',label:'Issue to Production',icon:'📤',color:'var(--warning)'},
  {value:'RETURN',label:'Return from Production',icon:'🔄',color:'var(--info)'},
  {value:'RECEIPT',label:'Old Gold Receipt',icon:'♻️',color:'var(--gold-primary)'},
  {value:'WASTAGE',label:'Wastage/Loss',icon:'🗑️',color:'var(--error)'},
  {value:'ADJUSTMENT',label:'Adjustment',icon:'⚖️',color:'var(--text-muted)'}
];
export const GOLD_PURITIES = ['24K','22K','21K','20K','18K','14K','12K','9K'];
export const SILVER_PURITIES = ['999','950','925','900','800'];
export const PLATINUM_PURITIES = ['PT950','PT900','PT850'];
export const METAL_UNITS = ['gram','tola','suki','aana','lal','kg','pennyweight','ounce'];

export const JOB_STATUSES = ['Pending','In Progress','QC','Rework','Completed'];
export const JOB_STAGES = [
  {id:'received',label:'Material Received',order:1,icon:'📥'},
  {id:'casting',label:'Casting',order:2,icon:'🔥'},
  {id:'filing',label:'Filing/Finishing',order:3,icon:'🔧'},
  {id:'stone_setting',label:'Stone Setting',order:4,icon:'💎'},
  {id:'polishing',label:'Polishing',order:5,icon:'✨'},
  {id:'qc',label:'Quality Check',order:6,icon:'🔍'},
  {id:'packing',label:'Packing',order:7,icon:'📦'},
  {id:'delivered',label:'Delivered',order:8,icon:'🚚'}
];
export const LABOUR_METHODS = ['perGram','perTola','flat','pctMetal'];
export const KARIGAR_SPECIALTIES = ['Casting','Filing','Stone Setting','Polishing','Engraving','Enameling','Chain Making','Wire Drawing','Filigree','Kundan','Meenakari','Thewa','Jadau','Other'];
export const QC_RESULTS = ['Pass','Fail','Conditional Pass'];
export const PRIORITY_OPTIONS = ['low','normal','high','urgent'];

export const JEWELRY_ICONS = {
  ring: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" stroke-width="1.25"/></svg>`,
  necklace: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 0-7 2.5-8 6 1.5 4.5 5.5 7 8 7s6.5-2.5 8-7c-1-3.5-4-6-8-6z"/><circle cx="12" cy="15" r="2.5" stroke-width="1.25"/></svg>`,
  earring: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a5.5 5.5 0 0 0-5.5 5.5c0 3.2 3 5 5.5 8.5s5.5-5.3 5.5-8.5A5.5 5.5 0 0 0 12 5z"/><circle cx="12" cy="10.5" r="2" stroke-width="1.25"/></svg>`,
  bracelet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="8.5" ry="5.5"/><ellipse cx="12" cy="12" rx="5" ry="3" stroke-width="1.25"/></svg>`,
  pendant: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5l5.5 13H6.5L12 4.5z"/><circle cx="12" cy="7" r="1.8" stroke-width="1.25"/></svg>`,
  bangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="6.5"/><ellipse cx="12" cy="12" rx="5.5" ry="3.8" stroke-width="1.25"/></svg>`,
  anklet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="17" rx="7" ry="3.5"/><path d="M5 17c0-2.5 2.5-3.5 7-3.5s7 1 7 3.5"/></svg>`,
  nosepin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><path d="M12 14.5v4M10 16.5h4"/></svg>`,
  maangtikka: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5v5M8 7h8"/><circle cx="12" cy="15" r="4.5"/><circle cx="12" cy="15" r="1.8" stroke-width="1.25"/></svg>`,
  earcuff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.5 12a6.5 6.5 0 0 1-13 0"/><circle cx="12" cy="12" r="2.2" stroke-width="1.25"/></svg>`,
  brooch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="7.5" ry="5.5"/><path d="M12 7v10M7 12h10"/></svg>`,
  cufflink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="7.5" width="13" height="9" rx="2"/><line x1="12" y1="10.5" x2="12" y2="14.5"/></svg>`,
  tiepin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4.5" x2="12" y2="19.5"/><circle cx="12" cy="8" r="3.2"/></svg>`,
  watch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.5l3.5 2"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="4.5" stroke-width="1.25"/></svg>`,
  bar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="6" rx="1.5"/><line x1="12" y1="9" x2="12" y2="15"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 8-8 8-8-8 8-8z"/></svg>`,
  gemstone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l8 5v8l-8 5-8-5V8.5l8-5z"/><path d="M12 3.5v17M4.5 8.5l7.5 5 7.5-5"/></svg>`,
  pearl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="10.5" cy="10.5" r="1.8" stroke-width="1.25"/></svg>`,
};

export const NAV_ICONS = {
  dashboard:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.25"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.25"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.25"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.25"/></svg>`,
  inventory:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  pos:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2.5"/><line x1="3" y1="11" x2="21" y2="11"/></svg>`,
  metals:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5L2 7.5l10 5 10-5-10-5z"/><path d="M2 17.5l10 5 10-5"/><path d="M2 12.5l10 5 10-5"/></svg>`,
  exchange:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/><path d="M3 12h18"/></svg>`,
  karigar:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  production:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  reports:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  knowledge:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6A2.5 2.5 0 0 1 7 3.5H20v16H7A2.5 2.5 0 0 0 4.5 21.5z"/><path d="M4.5 6v16"/><path d="M9.5 9h7"/><path d="M9.5 13h5"/></svg>`,
  accounting:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 4h15v16H4.5z"/><path d="M8.5 8h7"/><path d="M8.5 12h7"/><path d="M8.5 16h4"/><circle cx="16.5" cy="16" r="0.5" fill="currentColor" stroke="none"/></svg>`,
  tax:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4h11l3 16H3.5z"/><path d="M9.5 9h5"/><path d="M9.5 13h5"/><path d="M9.5 17h3"/></svg>`,
  suppliers:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-4-4H17a4 4 0 0 0-4 4v2"/><circle cx="21" cy="7" r="4"/></svg>`,
  expenses:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v6l3.5 1.8"/></svg>`,
  settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09c-.658.003-1.25.396-1.51 1z"/></svg>`
};

export const ICON_PATHS = {
  menu: '<line x1="4.5" y1="6.5" x2="19.5" y2="6.5" stroke-width="2" stroke-linecap="round"/><line x1="4.5" y1="12" x2="19.5" y2="12" stroke-width="2" stroke-linecap="round"/><line x1="4.5" y1="17.5" x2="19.5" y2="17.5" stroke-width="2" stroke-linecap="round"/>',
  close: '<line x1="6.5" y1="6.5" x2="17.5" y2="17.5" stroke-width="2" stroke-linecap="round"/><line x1="17.5" y1="6.5" x2="6.5" y2="17.5" stroke-width="2" stroke-linecap="round"/>',
  plus: '<line x1="12" y1="5.5" x2="12" y2="18.5" stroke-width="2" stroke-linecap="round"/><line x1="5.5" y1="12" x2="18.5" y2="12" stroke-width="2" stroke-linecap="round"/>',
  minus: '<line x1="5.5" y1="12" x2="18.5" y2="12" stroke-width="2" stroke-linecap="round"/>',
  search: '<circle cx="11" cy="11" r="7" stroke-width="1.75"/><line x1="16.5" y1="16.5" x2="20.5" y2="20.5" stroke-width="1.75" stroke-linecap="round"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" stroke-width="1.75"/><path d="M13.7 20a2 2 0 0 1-3.4 0" stroke-width="1.75"/>',
  user: '<circle cx="12" cy="8" r="4.5" stroke-width="1.75"/><path d="M4.5 21v-1a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v1" stroke-width="1.75"/>',
  users: '<circle cx="9" cy="8" r="3.5" stroke-width="1.75"/><path d="M2.5 20v-1a5.5 5.5 0 0 1 5.5-5.5h2A5.5 5.5 0 0 1 15.5 19v1" stroke-width="1.75"/><path d="M16.5 5.2a3.5 3.5 0 0 1 0 6.6" stroke-width="1.75"/><path d="M18.5 20v-1a5.4 5.4 0 0 0-2.2-4.4" stroke-width="1.75"/>',
  logout: '<path d="M15.5 4.5h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 16l-3.5-3.5 3.5-3.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><line x1="5.5" y1="12" x2="15.5" y2="12" stroke-width="1.75" stroke-linecap="round"/>',
  edit: '<path d="M4.5 19.5h4l10-10a2.8 2.8 0 0 0-4-4L4.5 15.5v4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><line x1="13.5" y1="6.5" x2="17.5" y2="10.5" stroke-width="1.75" stroke-linecap="round"/>',
  trash: '<path d="M4.5 7.5h15" stroke-width="1.75" stroke-linecap="round"/><path d="M9.5 7.5V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 7.5l.8 12.2a1.8 1.8 0 0 0 1.8 1.8h6.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="11.5" x2="10" y2="16.5" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="11.5" x2="13" y2="16.5" stroke-width="1.5" stroke-linecap="round"/>',
  save: '<path d="M5.5 4h10l3 3v14H5.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 4v5h6V4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 20v-6h7v6" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  print: '<path d="M7.5 10V4h9v6" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><rect x="4.5" y="10" width="15" height="7" rx="2" stroke-width="1.75"/><path d="M7.5 15h9v6H7.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  download: '<path d="M12 4.5v11" stroke-width="1.75" stroke-linecap="round"/><path d="M7 11l5 5 5-5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 18.5h15" stroke-width="1.75" stroke-linecap="round"/>',
  upload: '<path d="M12 16V5" stroke-width="1.75" stroke-linecap="round"/><path d="M7 9l5-5 5 5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 18.5h15" stroke-width="1.75" stroke-linecap="round"/>',
  check: '<path d="M5 13l4.5 4.5 9-9.5" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>',
  checkCircle: '<circle cx="12" cy="12" r="9.5" stroke-width="1.75"/><path d="M8 13l3.5 3.5L16 9.5" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>',
  alert: '<path d="M12 4.5l8.5 15H3.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9.5" x2="12" y2="13.5" stroke-width="1.75" stroke-linecap="round"/><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none"/>',
  info: '<circle cx="12" cy="12" r="9.5" stroke-width="1.75"/><line x1="12" y1="11" x2="12" y2="15.5" stroke-width="1.75" stroke-linecap="round"/><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none"/>',
  sparkle: '<path d="M12 3.5l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3.5z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  crown: '<path d="M3.5 9l4 3 5-7 5 7 4-3-2 11H5.5z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 20h13" stroke-width="1.5" stroke-linecap="round"/>',
  gem: '<path d="M7 4h10l4 6-9 11L3 10z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 10h18" stroke-width="1.75"/><path d="M12 20.5L8 9l4-6 4 6-4 11.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  diamond: '<path d="M12 3l8.5 8.5-8.5 9.5-8.5-9.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 11.5h16" stroke-width="1.75"/>',
  cart: '<circle cx="9" cy="19.5" r="1.8" stroke-width="1.75"/><circle cx="18" cy="19.5" r="1.8" stroke-width="1.75"/><path d="M4 5h2.2l2 9.5h10.6L21 7H6" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  wallet: '<path d="M4 9.5A2.5 2.5 0 0 1 6.5 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 18.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 10h16" stroke-width="1.75"/><circle cx="16.5" cy="14.5" r="1.3" stroke-width="1.75"/>',
  chart: '<path d="M5 19.5V10" stroke-width="1.75" stroke-linecap="round"/><path d="M11 19.5V5" stroke-width="1.75" stroke-linecap="round"/><path d="M17 19.5v-6.5" stroke-width="1.75" stroke-linecap="round"/><path d="M23 19.5V6" stroke-width="1.75" stroke-linecap="round"/>',
  clock: '<circle cx="12" cy="12" r="9.5" stroke-width="1.75"/><path d="M12 8.5V12l3 2" stroke-width="1.75" stroke-linecap="round"/>',
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2.5" stroke-width="1.75"/><line x1="4" y1="11" x2="20" y2="11" stroke-width="1.75"/><line x1="9" y1="4" x2="9" y2="7.5" stroke-width="1.75" stroke-linecap="round"/><line x1="15" y1="4" x2="15" y2="7.5" stroke-width="1.75" stroke-linecap="round"/>',
  chevronRight: '<path d="M9.5 5.5l7 7-7 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  chevronDown: '<path d="M5.5 9.5l7 7 7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  arrowUp: '<path d="M12 19.5V5.5" stroke-width="1.75" stroke-linecap="round"/><path d="M7 11.5l5-5 5 5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  arrowDown: '<path d="M12 4.5v15" stroke-width="1.75" stroke-linecap="round"/><path d="M17.5 13l-5.5 5.5-5.5-5.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  filter: '<path d="M4 6h16l-6.5 7.5v5l-3.5 1.8v-7.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  refresh: '<path d="M20.5 11a8.5 8.5 0 1 0-2.5 6.5" stroke-width="1.75" stroke-linecap="round"/><path d="M20.5 5.5v5.5h-5.5" stroke-width="1.75" stroke-linecap="round"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5" stroke-width="1.75"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  mail: '<rect x="4" y="6" width="16" height="12" rx="2.5" stroke-width="1.75"/><path d="M4.5 7.5l8.5 6 8.5-6" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  phone: '<path d="M7 4.5l2.5 2.5-1.5 2a11 11 0 0 0 5 5l2-1.5 2.5 2.5-1.2 2.2a2 2 0 0 1-2.2.9C10 17.8 6.8 14.5 5 8A2 2 0 0 1 5.5 6z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  mapPin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" stroke-width="1.75"/><circle cx="12" cy="10" r="2.6" stroke-width="1.75"/>',
  camera: '<path d="M4.5 9h2.5l1.5-2h7L17.5 9h2.5a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 20H4.5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 4.5 9z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="14" r="3.4" stroke-width="1.75"/>',
  star: '<path d="M12 4l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 18l-5.4 2.9 1-6.1L3.7 10.5l6.1-.9z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  heart: '<path d="M12 20.5S4 15.5 4 9.5A4.5 4.5 0 0 1 12 6.5a4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  scale: '<path d="M12 4v16" stroke-width="1.75" stroke-linecap="round"/><path d="M5.5 20h13" stroke-width="1.75" stroke-linecap="round"/><path d="M8 8h8" stroke-width="1.75" stroke-linecap="round"/><path d="M8 8l-3.5 6.5h7z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 8l-3.5 6.5h7z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  scissors: '<circle cx="6.5" cy="6.5" r="2.5" stroke-width="1.75"/><circle cx="6.5" cy="17.5" r="2.5" stroke-width="1.75"/><path d="M8.5 8L20 19" stroke-width="1.75" stroke-linecap="round"/><path d="M8.5 16L20 5" stroke-width="1.75" stroke-linecap="round"/>',
  gift: '<rect x="4" y="10" width="16" height="10" rx="2" stroke-width="1.75"/><path d="M4 13.5h16" stroke-width="1.75"/><path d="M12 10v10" stroke-width="1.75"/><path d="M12 10c-2 0-5-.8-5-2.5a2.5 2.5 0 0 1 5 0c0 2 0 2.5 0 2.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 10c2 0 5-.8 5-2.5a2.5 2.5 0 0 0-5 0c0 2 0 2.5 0 2.5z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  flame: '<path d="M12 20.5c4 0 6.5-2.6 6.5-6 0-4.5-4.5-6.5-4.5-11 0 0-2 2.5-2 5.5 0 1.8-1 2.5-1.8 1.7C9.8 10.5 9 8 9 8c-1.5 2-3.5 4.2-3.5 7 0 3.4 2.5 6 6.5 6z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  trash2: '<path d="M4.5 7.5h15" stroke-width="1.75" stroke-linecap="round"/><path d="M9.5 7.5V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 7.5l.8 12.2a1.8 1.8 0 0 0 1.8 1.8h6.8a1.8 1.8 0 0 0 1.8-1.8L17.5 7.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="11.5" x2="10" y2="16.5" stroke-width="1.5" stroke-linecap="round"/><line x1="13" y1="11.5" x2="13" y2="16.5" stroke-width="1.5" stroke-linecap="round"/>',
  eye: '<path d="M2 12c0-4 2.5-7.5 6.5-7.5s6.5 3.5 6.5 7.5-2.5 7.5-6.5 7.5-6.5-3.5-6.5-7.5z" stroke-width="1.75"/><circle cx="12" cy="12" r="3.5" stroke-width="1.75"/>',
  eyeOff: '<path d="M2 12c0-4 2.5-7.5 6.5-7.5s6.5 3.5 6.5 7.5-2.5 7.5-6.5 7.5-6.5-3.5-6.5-7.5z" stroke-width="1.75"/><path d="M9 9l6 6M9 15l6-6" stroke-width="1.75" stroke-linecap="round"/>',
  share: '<circle cx="18" cy="5" r="2.5" stroke-width="1.75"/><circle cx="6" cy="12" r="2.5" stroke-width="1.75"/><circle cx="18" cy="19" r="2.5" stroke-width="1.75"/><path d="M8.5 5l6.5 7-6.5 7" stroke-width="1.75" stroke-linecap="round"/>',
  link: '<path d="M10 13.5a4.5 4.5 0 1 0 0-6.3l3 3a3 3 0 1 1 0-4.2l-3-3"/><path d="M14 10.5a4.5 4.5 0 1 1 0 6.3l-3-3a3 3 0 1 0 0 4.2l3 3" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  expand: '<path d="M8 4H4a2 2 0 0 0-2 2v4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4h4a2 2 0 0 1 2 2v4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 20H4a2 2 0 0 1-2-2v-4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 20h4a2 2 0 0 0 2-2v-4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  minimize: '<path d="M8 4H4a2 2 0 0 0-2 2v4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4h4a2 2 0 0 1 2 2v4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 20H4a2 2 0 0 1-2-2v-4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 20h4a2 2 0 0 0 2-2v-4" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12h16" stroke-width="1.75" stroke-linecap="round"/>',
  rotateCw: '<path d="M20 12a8 8 0 1 0-2.5 6.5" stroke-width="1.75" stroke-linecap="round"/><path d="M20 5v5h-5" stroke-width="1.75" stroke-linecap="round"/>',
  rotateCcw: '<path d="M4 12a8 8 0 1 1 2.5 6.5" stroke-width="1.75" stroke-linecap="round"/><path d="M4 5v5h5" stroke-width="1.75" stroke-linecap="round"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1" stroke-width="1.75"/><rect x="14" y="4" width="6" height="6" rx="1" stroke-width="1.75"/><rect x="4" y="14" width="6" height="6" rx="1" stroke-width="1.75"/><rect x="14" y="14" width="6" height="6" rx="1" stroke-width="1.75"/>',
  list: '<line x1="4" y1="6" x2="20" y2="6" stroke-width="1.75" stroke-linecap="round"/><line x1="4" y1="12" x2="20" y2="12" stroke-width="1.75" stroke-linecap="round"/><line x1="4" y1="18" x2="20" y2="18" stroke-width="1.75" stroke-linecap="round"/><circle cx="6" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="6" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
  layers: '<path d="M12 3L3 7v10l9 4 9-4V7z" stroke-width="1.75"/><path d="M3 17v-10l9-4 9 4" stroke-width="1.75"/><path d="M12 3v18" stroke-width="1.75"/>',
  file: '<path d="M14 4.5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><polyline points="14 4.5 14 9.5 19 9.5" stroke-width="1.75"/>',
  folder: '<path d="M4 19.5h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-6l-2-2H6a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2z" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  home: '<path d="M3 9.5l9-6 9 6" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 19.5v-11h6v11" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  sun: '<circle cx="12" cy="12" r="4" stroke-width="1.75"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.5 4.5l1.5 1.5M18 18l1.5 1.5M4.5 19.5l1.5-1.5M18 5.5l1.5-1.5" stroke-width="1.75" stroke-linecap="round"/>',
  moon: '<path d="M12 3.5a6 6 0 0 0 0 12A6 6 0 0 1 12 3.5z" stroke-width="1.75"/>',
  cloud: '<path d="M18 11a5 5 0 0 0-9-4 4.5 4.5 0 0 0-4.5 4.5 5 5 0 0 0 10 0z" stroke-width="1.75"/>',
  wifi: '<path d="M5 13.5a10 10 0 0 1 14 0" stroke-width="1.75"/><path d="M8.5 13.5a6 6 0 0 1 7 0" stroke-width="1.75"/><line x1="12" y1="15.5" x2="12.01" y2="15.5" stroke-width="1.75" stroke-linecap="round"/>',
  bluetooth: '<path d="M8 4.5L16 12l-8 7.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4.5L8 12l8 7.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  battery: '<rect x="2" y="6" width="15" height="12" rx="2" stroke-width="1.75"/><path d="M17 10.5h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2" stroke-width="1.75"/><rect x="4" y="8.5" width="8" height="7" fill="currentColor" stroke="none"/>',
  volume: '<path d="M5 9v6h2a3 3 0 0 1 0 6h0" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9v6" stroke-width="1.75"/><path d="M13 13a5 5 0 0 1 0-8" stroke-width="1.75"/><path d="M16 9a8 8 0 0 1 0 12" stroke-width="1.75"/>',
  volumeOff: '<path d="M5 9v6h2a3 3 0 0 1 0 6h0" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9v6" stroke-width="1.75"/><line x1="11" y1="5" x2="19" y2="19" stroke-width="1.75" stroke-linecap="round"/>',
  volume1: '<path d="M5 9v6h2a3 3 0 0 1 0 6h0" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9v6" stroke-width="1.75"/><path d="M13 13a5 5 0 0 1 0-8" stroke-width="1.75"/>',
  volume2: '<path d="M5 9v6h2a3 3 0 0 1 0 6h0" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9v6" stroke-width="1.75"/><path d="M13 13a5 5 0 0 1 0-8" stroke-width="1.75"/><path d="M16 9a8 8 0 0 1 0 12" stroke-width="1.75"/>',
  mic: '<path d="M12 3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19v3" stroke-width="1.75" stroke-linecap="round"/><path d="M8 19h8" stroke-width="1.75" stroke-linecap="round"/>',
  micOff: '<path d="M12 3a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 19v3" stroke-width="1.75" stroke-linecap="round"/><path d="M8 19h8" stroke-width="1.75" stroke-linecap="round"/><line x1="4" y1="4" x2="20" y2="20" stroke-width="1.75" stroke-linecap="round"/>',
  power: '<path d="M12 4.5v10M12 4.5a7 7 0 1 0 0 14" stroke-width="1.75" stroke-linecap="round"/>',
  loader: '<path d="M12 3.5v4M12 16.5v4M4.5 12h4M15.5 12h4" stroke-width="1.75" stroke-linecap="round"/>',
  spinner: '<circle cx="12" cy="12" r="9" stroke-width="2.5" stroke-dasharray="56" stroke-dashoffset="28" stroke-linecap="round"/>',
};

export const PURITY_STANDARDS = [
  { karat: '24K', fineness: '999', goldPercent: 99.9, alloyPercent: 0.1, commonUse: 'Investment/Coins', hallmark: '999' },
  { karat: '22K', fineness: '916', goldPercent: 91.6, alloyPercent: 8.4, commonUse: 'High-end Jewellery', hallmark: '916' },
  { karat: '21K', fineness: '875', goldPercent: 87.5, alloyPercent: 12.5, commonUse: 'Middle East Jewellery', hallmark: '875' },
  { karat: '20K', fineness: '833', goldPercent: 83.3, alloyPercent: 16.7, commonUse: 'Traditional Jewellery', hallmark: '833' },
  { karat: '18K', fineness: '750', goldPercent: 75.0, alloyPercent: 25.0, commonUse: 'Fine Jewellery', hallmark: '750' },
  { karat: '14K', fineness: '585', goldPercent: 58.5, alloyPercent: 41.5, commonUse: 'Commercial Jewellery', hallmark: '585' },
  { karat: '12K', fineness: '500', goldPercent: 50.0, alloyPercent: 50.0, commonUse: 'Fashion Jewellery', hallmark: '500' },
  { karat: '9K', fineness: '375', goldPercent: 37.5, alloyPercent: 62.5, commonUse: 'Budget Jewellery', hallmark: '375' },
];

export const GEMSTONE_TYPES = [
  { name: 'Diamond', mineral: 'Carbon', hardness: 10, colorRange: 'Colorless to fancy colors', rarity: 'Rare', commonCuts: ['Round', 'Princess', 'Cushion', 'Emerald', 'Oval'], birthstoneMonth: 'April' },
  { name: 'Ruby', mineral: 'Corundum', hardness: 9, colorRange: 'Red', rarity: 'Rare', commonCuts: ['Oval', 'Cushion', 'Round', 'Emerald'], birthstoneMonth: 'July' },
  { name: 'Sapphire', mineral: 'Corundum', hardness: 9, colorRange: 'Blue, Pink, Yellow, etc.', rarity: 'Rare', commonCuts: ['Oval', 'Cushion', 'Round', 'Emerald'], birthstoneMonth: 'September' },
  { name: 'Emerald', mineral: 'Beryl', hardness: 7.5, colorRange: 'Green', rarity: 'Rare', commonCuts: ['Emerald', 'Oval', 'Round', 'Pear'], birthstoneMonth: 'May' },
  { name: 'Cubic Zirconia', mineral: 'Zirconium Dioxide', hardness: 8.5, colorRange: 'Colorless, various', rarity: 'Common (synthetic)', commonCuts: ['Round', 'Princess', 'Cushion', 'Oval'], birthstoneMonth: '' },
  { name: 'Coral', mineral: 'Calcium Carbonate', hardness: 3.5, colorRange: 'Red, Pink, White', rarity: 'Uncommon', commonCuts: ['Cabochon', 'Beads', 'Carved'], birthstoneMonth: '' },
  { name: 'Pearl', mineral: 'Calcium Carbonate', hardness: 2.5, colorRange: 'White, Cream, Black, Gold', rarity: 'Uncommon', commonCuts: ['Round', 'Button', 'Drop', 'Baroque'], birthstoneMonth: 'June' },
  { name: 'Navaratna', mineral: 'Various', hardness: 'Various', colorRange: 'Nine colors', rarity: 'Traditional set', commonCuts: ['Cabochon', 'Faceted'], birthstoneMonth: '' },
];

export const GEMSTONE_CUTS = [
  { name: 'Round Brilliant', facets: 57, shape: 'Round', brilliance: 'Maximum', bestFor: ['Diamond', 'Moissanite', 'CZ'], description: 'Classic cut with maximum fire and brilliance' },
  { name: 'Princess', facets: 57, shape: 'Square', brilliance: 'High', bestFor: ['Diamond', 'CZ'], description: 'Modern square cut with sharp corners' },
  { name: 'Cushion', facets: 58, shape: 'Square/Rounded', brilliance: 'High', bestFor: ['Diamond', 'Colored Stones'], description: 'Pillow-shaped with rounded corners' },
  { name: 'Emerald', facets: 57, shape: 'Rectangular', brilliance: 'Moderate', bestFor: ['Emerald', 'Aquamarine', 'Morganite'], description: 'Step cut with long facets, shows clarity' },
  { name: 'Oval', facets: 57, shape: 'Oval', brilliance: 'High', bestFor: ['Diamond', 'Ruby', 'Sapphire'], description: 'Elongated round, appears larger than round' },
  { name: 'Pear', facets: 58, shape: 'Teardrop', brilliance: 'High', bestFor: ['Diamond', 'Colored Stones'], description: 'Combination of round and marquise' },
  { name: 'Marquise', facets: 57, shape: 'Navette', brilliance: 'High', bestFor: ['Diamond'], description: 'Football-shaped, maximizes carat weight' },
  { name: 'Cabochon', facets: 0, shape: 'Dome', brilliance: 'None (polished)', bestFor: ['Opal', 'Turquoise', 'Coral', 'Pearl', 'Star Stones'], description: 'Smooth domed top, no facets' },
];

export const GEMSTONE_CLARITY = [
  { grade: 'Flawless (FL)', abbreviation: 'FL', description: 'No inclusions or blemishes visible under 10x magnification', visibility: 'None' },
  { grade: 'Internally Flawless (IF)', abbreviation: 'IF', description: 'No inclusions, only minor blemishes visible under 10x', visibility: 'None' },
  { grade: 'Very Very Slightly Included (VVS1/VVS2)', abbreviation: 'VVS', description: 'Minute inclusions difficult to see under 10x', visibility: 'Very Difficult' },
  { grade: 'Very Slightly Included (VS1/VS2)', abbreviation: 'VS', description: 'Minor inclusions visible under 10x', visibility: 'Difficult' },
  { grade: 'Slightly Included (SI1/SI2)', abbreviation: 'SI', description: 'Noticeable inclusions under 10x', visibility: 'Easy' },
  { grade: 'Included (I1/I2/I3)', abbreviation: 'I', description: 'Obvious inclusions visible to naked eye', visibility: 'Obvious' },
];

export const GEMSTONE_COLORS = [
  { grade: 'D-F (Colorless)', range: 'D, E, F', description: 'Absolutely colorless, highest value', valueImpact: 'Highest' },
  { grade: 'G-J (Near Colorless)', range: 'G, H, I, J', description: 'Slight color detectable by expert', valueImpact: 'High' },
  { grade: 'K-M (Faint Color)', range: 'K, L, M', description: 'Noticeable warm tint', valueImpact: 'Moderate' },
  { grade: 'N-R (Very Light Color)', range: 'N-R', description: 'Light yellow/brown tint', valueImpact: 'Lower' },
  { grade: 'S-Z (Light Color)', range: 'S-Z', description: 'Obvious color', valueImpact: 'Lowest' },
];

export const NEPALI_UNITS = [
  { name: 'Tola', symbol: 'तोल', grams: 11.664, grains: 180, tolaEquivalent: '1', useCase: 'Gold/Silver trading standard' },
  { name: 'Suki', symbol: 'सुकी', grams: 2.916, grains: 45, tolaEquivalent: '1/4', useCase: 'Small gold transactions' },
  { name: 'Aana', symbol: 'आना', grams: 0.729, grains: 11.25, tolaEquivalent: '1/16', useCase: 'Very small quantities' },
  { name: 'Lal', symbol: 'लाल', grams: 0.11664, grains: 1.8, tolaEquivalent: '1/100', useCase: 'Tiny measurements' },
];

export const EXPENSE_CATEGORIES = ['Rent','Utilities','Salaries','Marketing','Transport','Insurance','Maintenance','Professional Fees','Office Supplies','Taxes','Licenses','Bank Charges','Other'];
export const EXPENSE_STATUSES = ['paid','pending','overdue','cancelled'];

export const INCOME_CATEGORIES = ['Sales','Services','Interest','Rental','Commission','Other'];
export const TAX_TYPES = ['VAT','GST','Service Tax','Excise','Customs','TDS','TCS','Other'];

export const _PAGE_TITLES = {
  dashboard:['Dashboard','Overview'],
  inventory:['Inventory','Stock register'],
  pos:['Point of Sale','Billing counter'],
  metals:['Metal Management','Balances & issue'],
  exchange:['Old Gold Exchange','Assessment register'],
  karigar:['Karigar & Jobs','Jobs & karigars'],
  production:['Production Stages','Job pipeline'],
  reports:['Reports & Analytics','Financial reports'],
  accounting:['Accounting','Ledger, journals and trial balance'],
  tax:['Tax & Compliance','VAT, TDS registers and returns'],
  knowledge:['Knowledge Center','Catalogue & reference'],
  suppliers:['Suppliers','Vendors & payables'],
  expenses:['Expenses','Business expenses'],
  settings:['Settings','Workspace setup']
};