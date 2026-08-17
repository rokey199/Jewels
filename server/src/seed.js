import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import db, { now, setSetting } from './db.js'
import { generateImage, generateCategoryImage, writeImage } from './generate-images.js'

const id = (p) => p

const ACCENTS = {
  á: 'a', à: 'a', â: 'a', ä: 'a', ã: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', ö: 'o', õ: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ñ: 'n', ç: 'c', œ: 'oe', æ: 'ae',
}

function slugify(s) {
  return s
    .toLowerCase()
    .split('')
    .map((c) => ACCENTS[c] || c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const CATEGORIES = [
  {
    name: 'Necklaces',
    slug: 'necklaces',
    description:
      'Signature necklaces and pendants crafted to rest beautifully at the neckline — from delicate chains to statement pieces that hold their own.',
    featured: 1,
    displayOrder: 1,
    type: 'normal',
    kind: 'necklace',
  },
  {
    name: 'Rings',
    slug: 'rings',
    description:
      'Bands of character and stones of intent. Engagement rings, stacking bands and sculptural statement rings for every hand.',
    featured: 1,
    displayOrder: 2,
    type: 'normal',
    kind: 'ring',
  },
  {
    name: 'Earrings',
    slug: 'earrings',
    description:
      'Drop earrings and studs that frame the face with quiet brilliance — engineered to move lightly and catch the light.',
    featured: 1,
    displayOrder: 3,
    type: 'normal',
    kind: 'earrings',
  },
  {
    name: 'Bracelets',
    slug: 'bracelets',
    description:
      'Bangles and bracelets designed to be worn alone or layered. Comfortable, considered and unmistakably ours.',
    featured: 1,
    displayOrder: 4,
    type: 'normal',
    kind: 'bracelet',
  },
  {
    name: 'Bespoke & Custom',
    slug: 'bespoke-custom',
    description:
      'One-of-one commissions designed around you. Share your story and our ateliers will bring a personal piece to life.',
    featured: 1,
    displayOrder: 5,
    type: 'display',
    kind: 'pendant',
  },
]

const KINDS = { necklaces: 'necklace', rings: 'ring', earrings: 'earrings', bracelets: 'bracelet' }

function variation(name, options) {
  return { name, options }
}

const PRODUCTS = [
  {
    title: 'Aurélie Diamond Pendant',
    category: 'necklaces',
    price: 4850,
    mrp: 5400,
    sku: 'MD-NP-001',
    stock: 8,
    availability: 'in_stock',
    featured: 1,
    metal: 'gold',
    gem: 'diamond',
    tags: ['diamond', 'gold', 'signature'],
    shortDescription:
      'A single pear-cut diamond suspended from a whisper-light chain. The signature Aurélie pendant is the piece our clients return to most.',
    description:
      'The Aurélie Diamond Pendant is our most-loved piece. A precisely set pear-cut diamond catches light from every angle, suspended from an 18-karat gold chain crafted to feel like nothing at all. Designed in our atelier and finished by hand, it is the pendant we give when only considered, timeless design will do.\n\nEach stone is selected for its cut and clarity, and every clasp is triple-tested for a lifetime of everyday wear.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: '18k Rose Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 900, inStock: true },
      ]),
      variation('Chain Length', [
        { value: '16"', priceDelta: 0, inStock: true },
        { value: '18"', priceDelta: 0, inStock: true },
        { value: '20"', priceDelta: 120, inStock: false },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: '0.8 ct pear-cut diamond, G VS1' },
      { label: 'Metal', value: '18k yellow gold (option of rose gold / platinum)' },
      { label: 'Chain', value: '0.9mm trace chain, 16"–20"' },
      { label: 'Clasp', value: 'Lobster clasp, triple-tested' },
      { label: 'Origin', value: 'Handcrafted in our atelier' },
    ],
  },
  {
    title: 'Camille Emerald Drop',
    category: 'necklaces',
    price: 6200,
    mrp: 6900,
    sku: 'MD-NP-002',
    stock: 0,
    availability: 'made_to_order',
    featured: 1,
    metal: 'gold',
    gem: 'emerald',
    tags: ['emerald', 'gold', 'statement'],
    shortDescription:
      'A deep Colombian emerald in an oval halo, designed to move as you do. Made to order in six weeks.',
    description:
      'The Camille Emerald Drop is our study in green. A richly saturated emerald sits within a halo of pavé diamonds, framed in warm 18-karat gold. Each piece is made to order, allowing our gemologists to hand-select the stone for your exact piece.\n\nMade to order in approximately six weeks, with our atelier team available throughout to confirm every detail.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 1100, inStock: true },
      ]),
      variation('Chain Length', [
        { value: '18"', priceDelta: 0, inStock: true },
        { value: '20"', priceDelta: 120, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: '1.2 ct Colombian emerald, VVS' },
      { label: 'Accent', value: 'Pavé-set diamonds, 0.4 ct total' },
      { label: 'Metal', value: '18k gold / platinum' },
      { label: 'Lead time', value: 'Made to order, ~6 weeks' },
    ],
  },
  {
    title: 'Léa Sapphire Collar',
    category: 'necklaces',
    price: 7800,
    mrp: 8200,
    sku: 'MD-NP-003',
    stock: 4,
    availability: 'in_stock',
    featured: 0,
    metal: 'platinum',
    gem: 'sapphire',
    tags: ['sapphire', 'platinum', 'evening'],
    shortDescription:
      'A sculpted collar of platinum and deep sapphire, engineered to sit perfectly at the base of the neck.',
    description:
      'The Léa Sapphire Collar is an evening piece with engineering at its heart. A sculpted platinum collar is set with a line of Ceylon sapphires that follow the curve of the neck. Designed with a hidden hinge so it moves effortlessly with you.\n\nDelivered in our signature jewellery box, with appraisal certificate.',
    variations: [
      variation('Finish', [
        { value: 'Polished', priceDelta: 0, inStock: true },
        { value: 'Brushed', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Ceylon sapphires, 2.1 ct total' },
      { label: 'Metal', value: 'Platinum 950' },
      { label: 'Design', value: 'Sculpted collar with hidden hinge' },
    ],
  },
  {
    title: 'Rosalie Pearl Strand',
    category: 'necklaces',
    price: 3400,
    mrp: 3700,
    sku: 'MD-NP-004',
    stock: 6,
    availability: 'in_stock',
    featured: 0,
    metal: 'platinum',
    gem: 'pearl',
    tags: ['pearl', 'classic'],
    shortDescription:
      'South Sea pearls graduated into a supple strand, finished with a discreet diamond clasp.',
    description:
      'The Rosalie Pearl Strand is a modern classic. South Sea pearls are hand-graded and strung on silk, graduated in size and finished with a diamond-set clasp that lets you wear it at any length.\n\nA piece that moves effortlessly from day to evening.',
    variations: [
      variation('Length', [
        { value: '32" opera', priceDelta: 0, inStock: true },
        { value: '16" princess', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'South Sea pearls, 8–11mm' },
      { label: 'Clasp', value: 'Diamond-set, 0.1 ct' },
      { label: 'Strung', value: 'Silk, knotted between pearls' },
    ],
  },
  {
    title: 'Emmeline Pave Ring',
    category: 'rings',
    price: 2900,
    mrp: 3200,
    sku: 'MD-RG-001',
    stock: 12,
    availability: 'in_stock',
    featured: 1,
    metal: 'gold',
    gem: 'diamond',
    tags: ['diamond', 'gold', 'signature'],
    shortDescription:
      'A band of pavé-set diamonds in warm gold — the ring our clients buy for themselves.',
    description:
      'The Emmeline Pavé Ring is a band of continuous brilliance. Diamonds are pavé-set by hand along a sculpted 18-karat gold band, cut so the stones follow the curve of your finger with no sharp edges.\n\nAvailable in a range of sizes, and ready to be engraved on the inside.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: '18k Rose Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 800, inStock: true },
      ]),
      variation('Size', [
        { value: '5', priceDelta: 0, inStock: true },
        { value: '6', priceDelta: 0, inStock: true },
        { value: '7', priceDelta: 0, inStock: true },
        { value: '8', priceDelta: 0, inStock: false },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Pavé diamonds, 0.5 ct total' },
      { label: 'Metal', value: '18k gold / platinum' },
      { label: 'Band', value: '3mm sculpted' },
      { label: 'Personalisation', value: 'Engraving available' },
    ],
  },
  {
    title: 'Solène Solitaire',
    category: 'rings',
    price: 8900,
    mrp: 9400,
    sku: 'MD-RG-002',
    stock: 0,
    availability: 'made_to_order',
    featured: 1,
    metal: 'platinum',
    gem: 'diamond',
    tags: ['diamond', 'platinum', 'engagement'],
    shortDescription:
      'A 1.0 ct brilliant-cut diamond on a slender platinum band. Made to order, with a stone you approve first.',
    description:
      'The Solène Solitaire is our engagement benchmark. A 1.0 ct brilliant-cut diamond sits in a four-prong platinum setting designed to hold the stone high and let light pass fully through.\n\nEvery Solène is made to order. We work with you on the stone first — cut, clarity and carat — and our gemologists source options within your brief.',
    variations: [
      variation('Stone', [
        { value: '1.0 ct G VS1', priceDelta: 0, inStock: true },
        { value: '1.2 ct G VS1', priceDelta: 1800, inStock: true },
        { value: '1.5 ct F VS1', priceDelta: 4200, inStock: true },
      ]),
      variation('Size', [
        { value: '5', priceDelta: 0, inStock: true },
        { value: '6', priceDelta: 0, inStock: true },
        { value: '7', priceDelta: 0, inStock: true },
        { value: 'Custom sizing', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: '1.0 ct brilliant-cut, G VS1' },
      { label: 'Setting', value: 'Four-prong platinum' },
      { label: 'Band', value: '2.2mm knife-edge' },
      { label: 'Certification', value: 'GIA certificate included' },
    ],
  },
  {
    title: 'Isabelle Halo Ring',
    category: 'rings',
    price: 5200,
    mrp: 5600,
    sku: 'MD-RG-003',
    stock: 5,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'diamond',
    tags: ['diamond', 'gold', 'engagement'],
    shortDescription:
      'A centre stone lifted by a halo of diamonds — maximum brilliance, beautifully proportioned.',
    description:
      'The Isabelle Halo Ring pairs a round centre diamond with a halo of smaller stones that lift and amplify its brilliance. A delicate setting keeps the piece light on the hand.\n\nAvailable in a full range of sizes, or made to your exact stone specification.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 900, inStock: true },
      ]),
      variation('Size', [
        { value: '5', priceDelta: 0, inStock: true },
        { value: '6', priceDelta: 0, inStock: true },
        { value: '7', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: '0.7 ct centre, 0.35 ct halo' },
      { label: 'Metal', value: '18k gold / platinum' },
      { label: 'Certification', value: 'GIA certificate included' },
    ],
  },
  {
    title: 'Margaux Onyx Band',
    category: 'rings',
    price: 1850,
    mrp: 2050,
    sku: 'MD-RG-004',
    stock: 9,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'onyx',
    tags: ['onyx', 'gold', 'men'],
    shortDescription:
      'A flush-set onyx band with a quiet, architectural character.',
    description:
      'The Margaux Onyx Band is for the person who wants their jewellery quiet but present. A flush-set square of black onyx sits within a sculpted 18-karat gold band with a soft satin finish.\n\nWears beautifully alone or stacked.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 750, inStock: true },
      ]),
      variation('Size', [
        { value: '6', priceDelta: 0, inStock: true },
        { value: '7', priceDelta: 0, inStock: true },
        { value: '8', priceDelta: 0, inStock: true },
        { value: '9', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Square-cut black onyx' },
      { label: 'Metal', value: '18k gold / platinum' },
      { label: 'Finish', value: 'Satin' },
    ],
  },
  {
    title: 'Colette Ruby Stack',
    category: 'rings',
    price: 2350,
    mrp: 2600,
    sku: 'MD-RG-005',
    stock: 7,
    availability: 'in_stock',
    featured: 0,
    metal: 'rose',
    gem: 'ruby',
    tags: ['ruby', 'rose gold', 'stacking'],
    shortDescription:
      'Three stacking bands, one in flush-set rubies — designed to be worn together or apart.',
    description:
      'The Colette Ruby Stack is a set of three bands: a plain rose-gold band, a twisted band, and a band of flush-set rubies. Engineered to sit comfortably together, each is finished to be worn alone.\n\nMix, match and layer — the stack was made to be rearranged.',
    variations: [
      variation('Metal', [
        { value: '18k Rose Gold', priceDelta: 0, inStock: true },
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
      ]),
      variation('Size', [
        { value: '5', priceDelta: 0, inStock: true },
        { value: '6', priceDelta: 0, inStock: true },
        { value: '7', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Flush-set rubies, 0.3 ct total' },
      { label: 'Metal', value: '18k rose gold' },
      { label: 'Set', value: 'Three stacking bands' },
    ],
  },
  {
    title: 'Odette Pearl Drop',
    category: 'earrings',
    price: 2750,
    mrp: 3000,
    sku: 'MD-ER-001',
    stock: 10,
    availability: 'in_stock',
    featured: 1,
    metal: 'gold',
    gem: 'pearl',
    tags: ['pearl', 'gold', 'classic'],
    shortDescription:
      'South Sea pearls in slender gold frames — the drop earring that goes with everything.',
    description:
      'The Odette Pearl Drop is a study in restraint. A South Sea pearl sits in a slender gold frame, finished with a diamond-set post. Light, balanced and comfortable from morning to evening.\n\nHand-finished in our atelier and delivered in our signature box.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: '18k Rose Gold', priceDelta: 0, inStock: true },
      ]),
      variation('Pearl', [
        { value: 'White South Sea', priceDelta: 0, inStock: true },
        { value: 'Golden South Sea', priceDelta: 300, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: '10mm South Sea pearls' },
      { label: 'Metal', value: '18k gold' },
      { label: 'Setting', value: 'Diamond-set posts, 0.08 ct total' },
    ],
  },
  {
    title: 'Vivienne Diamond Studs',
    category: 'earrings',
    price: 3400,
    mrp: 3700,
    sku: 'MD-ER-002',
    stock: 11,
    availability: 'in_stock',
    featured: 1,
    metal: 'gold',
    gem: 'diamond',
    tags: ['diamond', 'gold', 'everyday'],
    shortDescription:
      'Classic four-prong studs in a bright white brilliant cut — the everyday essential.',
    description:
      'The Vivienne Diamond Studs are the earring we would all wear daily. Bright white diamonds in classic four-prong settings, with secure screw-back posts. Selected for brilliance and cut.\n\nAvailable in three carat sizes, each certified and appraised.',
    variations: [
      variation('Carat', [
        { value: '0.5 ct pair', priceDelta: 0, inStock: true },
        { value: '0.75 ct pair', priceDelta: 1200, inStock: true },
        { value: '1.0 ct pair', priceDelta: 2400, inStock: true },
      ]),
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 700, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Brilliant-cut diamonds' },
      { label: 'Setting', value: 'Four-prong, screw-back' },
      { label: 'Metal', value: '18k gold / platinum' },
      { label: 'Certification', value: 'Included' },
    ],
  },
  {
    title: 'Elodie Sapphire Drops',
    category: 'earrings',
    price: 4600,
    mrp: 5000,
    sku: 'MD-ER-003',
    stock: 0,
    availability: 'made_to_order',
    featured: 0,
    metal: 'platinum',
    gem: 'sapphire',
    tags: ['sapphire', 'platinum', 'evening'],
    shortDescription:
      'Suspended Ceylon sapphires in platinum — made to order for the evening that calls for it.',
    description:
      'The Elodie Sapphire Drops are our most requested evening earring. Two Ceylon sapphires are suspended in slim platinum frames that let the stones move freely. Made to order so each pair can be matched to your exact brief.\n\nLead time approximately five weeks.',
    variations: [
      variation('Stone', [
        { value: 'Ceylon blue sapphire', priceDelta: 0, inStock: true },
        { value: 'Padparadscha sapphire', priceDelta: 1600, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: '2.0 ct each, Ceylon sapphire' },
      { label: 'Metal', value: 'Platinum 950' },
      { label: 'Lead time', value: 'Made to order, ~5 weeks' },
    ],
  },
  {
    title: 'Florence Ruby Hoops',
    category: 'earrings',
    price: 3200,
    mrp: 3500,
    sku: 'MD-ER-004',
    stock: 6,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'ruby',
    tags: ['ruby', 'gold', 'statement'],
    shortDescription:
      'A modern take on the hoop — a sweep of pavé rubies set in warm gold.',
    description:
      'The Florence Ruby Hoops rework a familiar silhouette. Rubies are pavé-set along a sweeping 18-karat gold hoop, engineered to keep their shape and move lightly as you turn your head.\n\nA statement piece that still feels like you.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: '18k Rose Gold', priceDelta: 0, inStock: true },
      ]),
      variation('Diameter', [
        { value: '28mm', priceDelta: 0, inStock: true },
        { value: '34mm', priceDelta: 250, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Pavé rubies, 0.8 ct total' },
      { label: 'Metal', value: '18k gold' },
      { label: 'Closure', value: 'Lever back' },
    ],
  },
  {
    title: 'Gabrielle Emerald Drops',
    category: 'earrings',
    price: 4100,
    mrp: 4500,
    sku: 'MD-ER-005',
    stock: 5,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'emerald',
    tags: ['emerald', 'gold', 'signature'],
    shortDescription:
      'Emerald drops with a diamond cap — our atelier favourite for the occasion you cannot repeat.',
    description:
      'The Gabrielle Emerald Drops are cut and set to be worn at the occasion you will remember. Pear-shaped emeralds hang beneath diamond-set caps on slim gold frames. Each pair is individually hand-finished.\n\nWe recommend reserving by phone for major dates.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 850, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Pear-shaped emeralds, 1.4 ct each' },
      { label: 'Accent', value: 'Diamond-set caps' },
      { label: 'Metal', value: '18k gold / platinum' },
    ],
  },
  {
    title: 'Céleste Tennis Bracelet',
    category: 'bracelets',
    price: 6900,
    mrp: 7400,
    sku: 'MD-BR-001',
    stock: 4,
    availability: 'in_stock',
    featured: 1,
    metal: 'gold',
    gem: 'diamond',
    tags: ['diamond', 'gold', 'signature'],
    shortDescription:
      'A full line of brilliant-cut diamonds on a supple gold setting. The definitive tennis bracelet.',
    description:
      'The Céleste Tennis Bracelet is a full circle of brilliant-cut diamonds, each stone individually set on a flexible 18-karat gold base. Every stone is matched for colour and clarity, and the setting is reinforced for everyday strength.\n\nDelivered with appraisal and our lifetime maintenance promise.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 1400, inStock: true },
      ]),
      variation('Carat', [
        { value: '4.0 ct total', priceDelta: 0, inStock: true },
        { value: '5.0 ct total', priceDelta: 1500, inStock: true },
      ]),
      variation('Length', [
        { value: '7"', priceDelta: 0, inStock: true },
        { value: '7.5"', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Brilliant-cut diamonds' },
      { label: 'Setting', value: 'Fully flexible, reinforced' },
      { label: 'Metal', value: '18k gold / platinum' },
      { label: 'Maintenance', value: 'Lifetime setting checks' },
    ],
  },
  {
    title: 'Juliette Gold Bangle',
    category: 'bracelets',
    price: 2600,
    mrp: 2850,
    sku: 'MD-BR-002',
    stock: 8,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'diamond',
    tags: ['gold', 'classic'],
    shortDescription:
      'A sculpted 18k gold bangle with a single diamond accent. Meant to be worn every day.',
    description:
      'The Juliette Gold Bangle is a piece of everyday architecture. A sculpted 18-karat gold band, finished by hand, carries a single flush-set diamond at its face. Comfortable enough to never take off.\n\nAvailable in a range of inner diameters.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: '18k Rose Gold', priceDelta: 0, inStock: true },
      ]),
      variation('Diameter', [
        { value: '58mm', priceDelta: 0, inStock: true },
        { value: '62mm', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Flush-set diamond, 0.05 ct' },
      { label: 'Metal', value: '18k gold' },
      { label: 'Finish', value: 'Hand-finished' },
    ],
  },
  {
    title: 'Mathilde Gem Bracelet',
    category: 'bracelets',
    price: 3900,
    mrp: 4300,
    sku: 'MD-BR-003',
    stock: 0,
    availability: 'made_to_order',
    featured: 0,
    metal: 'gold',
    gem: 'sapphire',
    tags: ['sapphire', 'gold', 'colour'],
    shortDescription:
      'A line of mixed sapphires in warm gold — a bracelet of quiet colour. Made to order.',
    description:
      'The Mathilde Gem Bracelet is a line of graduated sapphires in warm 18-karat gold. Choose from classic blue, pink, or a personalised mix selected with our gemologists. Made to order in five weeks.\n\nEach stone is set by hand and the clasp is hidden for a seamless line.',
    variations: [
      variation('Stone', [
        { value: 'Blue sapphires', priceDelta: 0, inStock: true },
        { value: 'Pink sapphires', priceDelta: 0, inStock: true },
        { value: 'Mixed palette', priceDelta: 400, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Sapphires, 2.5 ct total' },
      { label: 'Metal', value: '18k gold' },
      { label: 'Lead time', value: 'Made to order, ~5 weeks' },
    ],
  },
  {
    title: 'Héloïse Pearl Bracelet',
    category: 'bracelets',
    price: 1950,
    mrp: 2150,
    sku: 'MD-BR-004',
    stock: 9,
    availability: 'in_stock',
    featured: 0,
    metal: 'platinum',
    gem: 'pearl',
    tags: ['pearl', 'classic'],
    shortDescription:
      'A single strand of baroque pearls with a diamond-set clasp.',
    description:
      'The Héloïse Pearl Bracelet is a single wrap of baroque South Sea pearls finished with a small diamond-set clasp. Quietly luxurious and easy to wear.\n\nStrung on silk with knots between each pearl.',
    variations: [
      variation('Clasp', [
        { value: 'Diamond-set', priceDelta: 0, inStock: true },
        { value: 'Plain gold', priceDelta: -200, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Baroque South Sea pearls, 9–11mm' },
      { label: 'Clasp', value: 'Diamond-set, 0.05 ct' },
      { label: 'Strung', value: 'Silk, knotted' },
    ],
  },
  {
    title: 'Inès Emerald Cuff',
    category: 'bracelets',
    price: 5600,
    mrp: 6100,
    sku: 'MD-BR-005',
    stock: 3,
    availability: 'in_stock',
    featured: 1,
    metal: 'gold',
    gem: 'emerald',
    tags: ['emerald', 'gold', 'statement'],
    shortDescription:
      'An open cuff set with a line of emeralds — a statement piece with real presence.',
    description:
      'The Inès Emerald Cuff is our boldest bracelet. An open 18-karat gold cuff is set with a line of emeralds that trace its curve. The open design fits most wrists comfortably and makes a considered statement.\n\nEach cuff is individually finished and hallmarked.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: 'Platinum', priceDelta: 1000, inStock: true },
      ]),
      variation('Finish', [
        { value: 'Polished', priceDelta: 0, inStock: true },
        { value: 'Satin', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Emeralds, 1.8 ct total' },
      { label: 'Metal', value: '18k gold / platinum' },
      { label: 'Design', value: 'Open cuff, one size (adjustable)' },
    ],
  },
  {
    title: 'Adeline Monogram Necklace',
    category: 'necklaces',
    price: 1750,
    mrp: 1950,
    sku: 'MD-NP-005',
    stock: 15,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'diamond',
    tags: ['gold', 'personalised'],
    shortDescription:
      'A hand-engraved pendant on a fine chain — the personalised piece we are known for.',
    description:
      'The Adeline Monogram Necklace is our most personal piece. Your initials are hand-engraved in our atelier on a small gold pendant, finished with a single micro-set diamond. On a fine chain that suits every neckline.\n\nComplimentary engraving, delivered in five working days.',
    variations: [
      variation('Metal', [
        { value: '18k Yellow Gold', priceDelta: 0, inStock: true },
        { value: '18k Rose Gold', priceDelta: 0, inStock: true },
      ]),
      variation('Chain Length', [
        { value: '16"', priceDelta: 0, inStock: true },
        { value: '18"', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Pendant', value: 'Hand-engraved, 14mm' },
      { label: 'Stone', value: 'Micro-set diamond, 0.02 ct' },
      { label: 'Metal', value: '18k gold' },
      { label: 'Lead time', value: '~5 working days' },
    ],
  },
  {
    title: 'Célia Signet Ring',
    category: 'rings',
    price: 1550,
    mrp: 1700,
    sku: 'MD-RG-006',
    stock: 6,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'onyx',
    tags: ['onyx', 'gold', 'signet'],
    shortDescription:
      'A classic signet with a carved onyx face — ready for your initials.',
    description:
      'The Célia Signet Ring is a modern take on the classic. A polished 18-karat gold signet carries a carved onyx face, ready to be engraved with your initials by our atelier engravers.\n\nComplimentary engraving on request.',
    variations: [
      variation('Size', [
        { value: '6', priceDelta: 0, inStock: true },
        { value: '7', priceDelta: 0, inStock: true },
        { value: '8', priceDelta: 0, inStock: true },
        { value: '9', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Carved onyx face' },
      { label: 'Metal', value: '18k gold' },
      { label: 'Engraving', value: 'Complimentary' },
    ],
  },
  {
    title: 'Océane Cufflinks',
    category: 'bespoke-custom',
    price: 1300,
    mrp: 1450,
    sku: 'MD-BC-001',
    stock: 8,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'onyx',
    tags: ['gold', 'menswear', 'bespoke'],
    shortDescription:
      'Sculpted gold cufflinks with black onyx faces — for the man who notices details.',
    description:
      'The Océane Cufflinks are sculpted 18-karat gold with black onyx faces, weighted for a confident drop and finished entirely by hand. Available in a satin or polished face.\n\nPair with a personalised monogram on request.',
    variations: [
      variation('Finish', [
        { value: 'Polished face', priceDelta: 0, inStock: true },
        { value: 'Satin face', priceDelta: 0, inStock: true },
      ]),
      variation('Monogram', [
        { value: 'Plain', priceDelta: 0, inStock: true },
        { value: 'Engraved monogram', priceDelta: 150, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Stone', value: 'Black onyx, 12mm' },
      { label: 'Metal', value: '18k gold' },
      { label: 'Closure', value: 'Lever-back, weighted' },
    ],
  },
  {
    title: 'Bespoke Commission',
    category: 'bespoke-custom',
    price: 5000,
    mrp: null,
    sku: 'MD-BC-002',
    stock: 0,
    availability: 'made_to_order',
    featured: 1,
    metal: 'gold',
    gem: 'diamond',
    tags: ['bespoke', 'custom', 'commission'],
    shortDescription:
      'A one-of-one commission designed around you. Share your story and our ateliers will bring it to life.',
    description:
      'A Bespoke Commission begins with a conversation. Tell our designers about the occasion, the person, and the story you want the piece to carry. From an initial sketch to hand-finished creation, the entire journey is yours to follow.\n\nCommissions begin at a design retainer, which is applied toward the final piece. Lead time is typically eight to twelve weeks.',
    variations: [
      variation('Piece', [
        { value: 'Engagement ring', priceDelta: 0, inStock: true },
        { value: 'Necklace', priceDelta: 0, inStock: true },
        { value: 'Earrings', priceDelta: 0, inStock: true },
        { value: 'Not sure yet', priceDelta: 0, inStock: true },
      ]),
    ],
    specifications: [
      { label: 'Process', value: 'Consultation → sketch → creation' },
      { label: 'Design retainer', value: 'Applied toward final piece' },
      { label: 'Lead time', value: '8–12 weeks' },
    ],
  },
  {
    title: 'Private Jewellery Consultation',
    category: 'bespoke-custom',
    price: 0,
    mrp: null,
    sku: 'MD-BC-003',
    stock: 999,
    availability: 'in_stock',
    featured: 0,
    metal: 'gold',
    gem: 'diamond',
    tags: ['consultation', 'private'],
    shortDescription:
      'A complimentary private consultation with our jewellery specialists — in atelier or by video.',
    description:
      'Book a complimentary private consultation with a Maison Dorée jewellery specialist. Discuss commissions, stones, sizing or simply discover the collection. Available in atelier or by video call.\n\nNo obligation. Every consultation ends with a clearer idea of what you want.',
    variations: [],
    specifications: [
      { label: 'Format', value: 'In atelier or video call' },
      { label: 'Duration', value: '45 minutes' },
      { label: 'Cost', value: 'Complimentary' },
    ],
  },
]

function parseJson(v) {
  if (v == null) return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

function rowToCategory(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    status: row.status,
    featured: !!row.featured,
    displayOrder: row.display_order,
    type: row.type,
    showroomSceneId: row.showroom_scene_id,
    showroomCamera: parseJson(row.showroom_camera),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    productCount: row.product_count ?? 0,
  }
}

function rowToProduct(row) {
  if (!row) return null
  const mrp = row.mrp != null ? row.mrp : null
  let discount = row.discount != null ? row.discount : null
  if (discount == null && mrp != null && mrp > row.price) {
    discount = Math.round(((mrp - row.price) / mrp) * 100)
  }
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    categoryId: row.category_id,
    price: row.price,
    mrp,
    discount,
    sku: row.sku,
    stock: row.stock,
    availability: row.availability,
    featured: !!row.featured,
    status: row.status,
    images: parseJson(row.images) ?? [],
    specifications: parseJson(row.specifications) ?? [],
    variations: parseJson(row.variations) ?? [],
    tags: parseJson(row.tags) ?? [],
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    showroomCategoryId: row.showroom_category_id,
    showroomSceneId: row.showroom_scene_id,
    displayOrder: row.display_order,
    popularity: row.popularity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category_name
      ? { id: row.category_id, name: row.category_name, slug: row.category_slug }
      : undefined,
  }
}

export { rowToCategory, rowToProduct, slugify }

export function seed({ force = false } = {}) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c

  const metalFor = (slug) => {
    const cat = CATEGORIES.find((c) => c.slug === slug)
    return cat ? cat.kind : 'pendant'
  }

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, slug, description, image, status, featured, display_order, type, showroom_scene_id, showroom_camera, created_at, updated_at)
    VALUES (@id, @name, @slug, @description, @image, @status, @featured, @displayOrder, @type, @showroomSceneId, @showroomCamera, @createdAt, @updatedAt)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name, description=excluded.description, image=excluded.image, status=excluded.status, featured=excluded.featured, display_order=excluded.display_order, type=excluded.type, updated_at=excluded.updated_at
  `)

  const insertProduct = db.prepare(`
    INSERT INTO products (id, title, slug, description, short_description, category_id, price, mrp, discount, sku, stock, availability, featured, status, images, specifications, variations, tags, seo_title, seo_description, showroom_category_id, showroom_scene_id, display_order, popularity, created_at, updated_at)
    VALUES (@id, @title, @slug, @description, @shortDescription, @categoryId, @price, @mrp, @discount, @sku, @stock, @availability, @featured, @status, @images, @specifications, @variations, @tags, @seoTitle, @seoDescription, @showroomCategoryId, @showroomSceneId, @displayOrder, @popularity, @createdAt, @updatedAt)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title, description=excluded.description, short_description=excluded.short_description, category_id=excluded.category_id, price=excluded.price, mrp=excluded.mrp, discount=excluded.discount, sku=excluded.sku, stock=excluded.stock, availability=excluded.availability, featured=excluded.featured, status=excluded.status, images=excluded.images, specifications=excluded.specifications, variations=excluded.variations, tags=excluded.tags, seo_title=excluded.seo_title, seo_description=excluded.seo_description, showroom_category_id=excluded.showroom_category_id, showroom_scene_id=excluded.showroom_scene_id, display_order=excluded.display_order, popularity=excluded.popularity, updated_at=excluded.updated_at
  `)

  const t = now()

  // Categories + images
  const categoryIds = {}
  for (const cat of CATEGORIES) {
    const cid = id(`cat-${slugify(cat.slug)}`)
    categoryIds[cat.slug] = cid
    const img = writeImage(`category-${cat.slug}.svg`, generateCategoryImage(cat.kind, 'gold', 'diamond', cat.name))
    insertCategory.run({
      id: cid,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: img,
      status: 'active',
      featured: cat.featured,
      displayOrder: cat.displayOrder,
      type: cat.type,
      showroomSceneId: null,
      showroomCamera: null,
      createdAt: t,
      updatedAt: t,
    })
  }

  // Products + images
  PRODUCTS.forEach((p, i) => {
    const pid = id(`prod-${slugify(p.title)}`)
    const images = []
    const combos = [
      { metal: p.metal, gem: p.gem },
      { metal: p.metal === 'platinum' ? 'platinum' : 'gold', gem: p.gem === 'diamond' ? 'sapphire' : 'diamond' },
      { metal: p.metal === 'gold' ? 'rose' : p.metal === 'rose' ? 'gold' : 'gold', gem: p.gem === 'ruby' ? 'pearl' : 'ruby' },
    ]
    const seen = new Set()
    for (const [idx, combo] of combos.entries()) {
      const key = `${combo.metal}-${combo.gem}`
      if (seen.has(key)) continue
      seen.add(key)
      const kind = metalFor(p.category)
      const filename = `${slugify(p.title)}-${idx + 1}.svg`
      const url = writeImage(filename, generateImage(kind, combo.metal, combo.gem))
      images.push(url)
    }

    const discount = p.mrp != null && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : null

    insertProduct.run({
      id: pid,
      title: p.title,
      slug: slugify(p.title),
      description: p.description,
      shortDescription: p.shortDescription,
      categoryId: categoryIds[p.category],
      price: p.price,
      mrp: p.mrp,
      discount,
      sku: p.sku,
      stock: p.stock,
      availability: p.availability,
      featured: p.featured,
      status: 'active',
      images: JSON.stringify(images),
      specifications: JSON.stringify(p.specifications),
      variations: JSON.stringify(p.variations),
      tags: JSON.stringify(p.tags),
      seoTitle: `${p.title} | Maison Dorée`,
      seoDescription: p.shortDescription,
      showroomCategoryId: null,
      showroomSceneId: null,
      displayOrder: i,
      popularity: 100 + (i % 5) * 17,
      createdAt: t,
      updatedAt: t,
    })
  })

  // Admin + demo customer
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, email, phone, password_hash, role, status, email_verified, address_line1, address_line2, city, state, postal_code, country, created_at, updated_at)
    VALUES (@id, @name, @email, @phone, @passwordHash, @role, @status, @emailVerified, @addressLine1, @addressLine2, @city, @state, @postalCode, @country, @createdAt, @updatedAt)
    ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=excluded.role, status=excluded.status, updated_at=excluded.updated_at
  `)
  const adminHash = bcrypt.hashSync('MaisonDoreeAdmin2026!', 10)
  insertCustomer.run({
    id: 'cus-admin',
    name: 'Maison Dorée Admin',
    email: 'admin@maisondoree.example',
    phone: '',
    passwordHash: adminHash,
    role: 'admin',
    status: 'active',
    emailVerified: 1,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    createdAt: t,
    updatedAt: t,
  })

  const customerHash = bcrypt.hashSync('demoCustomer123!', 10)
  insertCustomer.run({
    id: 'cus-demo',
    name: 'Elena Marchetti',
    email: 'elena@example.com',
    phone: '+1 555 012 3456',
    passwordHash: customerHash,
    role: 'customer',
    status: 'active',
    emailVerified: 1,
    addressLine1: '14 Rue de la Paix',
    addressLine2: 'Apt 3B',
    city: 'New York',
    state: 'NY',
    postalCode: '10005',
    country: 'United States',
    createdAt: t,
    updatedAt: t,
  })

  // Seeded customer reviews (APPROVED → public; verified purchases where noted)
  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO reviews (id, customer_id, product_id, order_id, rating, review_text, status, verified_purchase, created_at, updated_at)
    VALUES (@id, @customerId, @productId, @orderId, @rating, @reviewText, @status, @verifiedPurchase, @createdAt, @updatedAt)
  `)
  const SEED_REVIEWS = [
    ['aurelie-diamond-pendant', 5, 'Worn it every day for six months and it still catches light like the first day. The platinum chain upgrade was absolutely worth it.', true],
    ['aurelie-diamond-pendant', 5, 'Bought this as an engagement surprise — the packaging felt as considered as the piece itself.', false],
    ['celeste-tennis-bracelet', 5, 'The stones are beautifully set and the clasp feels secure. It is now my everyday piece.', true],
    ['celeste-tennis-bracelet', 4, 'Lovely bracelet and excellent service. Slightly longer than expected on my wrist.', false],
    ['celia-signet-ring', 5, 'A quietly confident ring. The engraving was done to perfection.', true],
    ['odette-pearl-drop', 5, 'The pearls have a wonderful lustre. Received so many compliments.', false],
    ['mathilde-gem-bracelet', 4, 'Delicate and elegant. It arrived beautifully presented.', true],
    ['adeline-monogram-necklace', 5, 'The detail on the monogram is exquisite — a small work of art.', false],
    ['isabelle-halo-ring', 5, 'Sized perfectly the first time. Very comfortable to wear daily.', true],
    ['solene-solitaire', 5, 'Classic, clean and exactly as pictured. Could not be happier.', true],
  ]
  const pidFor = (slug) => id(`prod-${slug}`)
  SEED_REVIEWS.forEach(([slug, rating, text, verified], ri) => {
    insertReview.run({
      id: `rev-${slugify(slug)}-${rating}-${ri}`,
      customerId: 'cus-demo',
      productId: pidFor(slug),
      orderId: null,
      rating,
      reviewText: text,
      status: 'APPROVED',
      verifiedPurchase: verified ? 1 : 0,
      createdAt: t,
      updatedAt: t,
    })
  })

  setSetting('SHOWROOM_3D_ENABLED', false)
  setSetting('SITE_NAME', 'Maison Dorée')
  setSetting('SITE_TAGLINE', 'Fine Jewellery, Considered')
  setSetting('SUPPORT_EMAIL', 'care@maisondoree.example')
  setSetting('SUPPORT_PHONE', '+1 212 555 0100')

  return { seeded: true, categories: CATEGORIES.length, products: PRODUCTS.length }
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  const result = seed()
  console.log('Seed complete:', result)
}
