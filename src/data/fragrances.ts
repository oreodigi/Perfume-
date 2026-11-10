export type Fragrance = {
  slug: string;
  number: string;
  name: string;
  subtitle: string;
  category: string;
  color: string;
  glow: string;
  notes: [string, string, string];
  ingredients: [string, string, string, string, string, string];
  story: string;
  texture: string;
};

/** Editorial demo catalog; replace in one place when the actual brand is defined. */
export const fragrances: Fragrance[] = [
  {
    slug: "rouge-ecorce", number: "01", name: "Rouge Écorce", subtitle: "The art of becoming", category: "Floral • Woody", color: "#852f33", glow: "#c79c8f", notes: ["Black plum", "Damask rose", "Oakmoss"],
    ingredients: ["Black Plum", "Rose Absolute", "Clove Bud", "Cedarwood", "Oakmoss", "Amber Resin"],
    story: "A late afternoon in a walled garden. The warmth of the stone, the shadow of the tree, and a scent that stays after the light is gone.", texture: "warm shadow",
  },
  {
    slug: "fig-ritual", number: "02", name: "Fig Ritual", subtitle: "Green, then golden", category: "Green • Amber", color: "#687245", glow: "#b7b88e", notes: ["Fig leaf", "Iris", "Sandalwood"],
    ingredients: ["Fig Leaf", "Green Tea", "Orris", "Coconut Milk", "Sandalwood", "Musk"],
    story: "An orchard at first light, where the green of a torn leaf meets the sweetness of fruit beneath the sun.", texture: "green light",
  },
  {
    slug: "sable-noir", number: "03", name: "Sable Noir", subtitle: "After the last light", category: "Leather • Resin", color: "#4a3432", glow: "#a08a73", notes: ["Saffron", "Suede", "Labdanum"],
    ingredients: ["Saffron", "Pink Pepper", "Suede", "Cypriol", "Labdanum", "Smoked Vanilla"],
    story: "The hush after a crowded room empties. Smoke, worn leather and something quietly unforgettable.", texture: "dark velvet",
  },
  {
    slug: "peau-de-lune", number: "04", name: "Peau de Lune", subtitle: "Skin, remembered", category: "Soft • Musky", color: "#b18d79", glow: "#e3c2ae", notes: ["Ambrette", "Iris", "White musk"],
    ingredients: ["Ambrette", "Rice Powder", "Iris", "Violet", "White Musk", "Cashmere Wood"],
    story: "The familiar scent of a favourite shirt, warmed by a body and folded into memory.", texture: "soft linen",
  },
  {
    slug: "terre-vive", number: "05", name: "Terre Vive", subtitle: "A little closer to earth", category: "Earthy • Woody", color: "#766343", glow: "#bda980", notes: ["Vetiver", "Cypress", "Patchouli"],
    ingredients: ["Bergamot", "Cypress", "Vetiver", "Wet Stone", "Patchouli", "Guaiac Wood"],
    story: "Rain on warm earth, crushed stems and the calm that arrives when you finally step outside.", texture: "mineral earth",
  },
  {
    slug: "fleur-ombre", number: "06", name: "Fleur d’Ombre", subtitle: "Flowers after dark", category: "White Floral", color: "#8e745e", glow: "#f0ddbb", notes: ["Neroli", "Gardenia", "Benzoin"],
    ingredients: ["Neroli", "Gardenia", "Jasmine", "Ylang Ylang", "Benzoin", "Sandalwood"],
    story: "White flowers open into the night, and the air slowly fills with their luminous, honeyed trail.", texture: "night blossom",
  },
  {
    slug: "cendre-doree", number: "07", name: "Cendre Dorée", subtitle: "The golden hour, bottled", category: "Spiced • Amber", color: "#a46b3f", glow: "#d4a779", notes: ["Cardamom", "Incense", "Amber"],
    ingredients: ["Cardamom", "Cinnamon", "Frankincense", "Amber", "Tonka", "Dry Woods"],
    story: "The last ember in the hearth, surrounded by the sweetness of spice and polished wood.", texture: "golden ember",
  },
  {
    slug: "brume-saline", number: "08", name: "Brume Saline", subtitle: "Between sea and sky", category: "Marine • Mineral", color: "#6f8d8a", glow: "#bed4c9", notes: ["Sea salt", "Juniper", "Driftwood"],
    ingredients: ["Sea Salt", "Juniper", "Mineral Accord", "Sage", "Driftwood", "White Amber"],
    story: "A breath of sea air on sun-bleached stone; cool, open and quietly boundless.", texture: "sea mist",
  },
  {
    slug: "nuit-safran", number: "09", name: "Nuit Safran", subtitle: "A beautiful disturbance", category: "Spice • Floral", color: "#984e46", glow: "#dfac91", notes: ["Saffron", "Black tea", "Rose"],
    ingredients: ["Saffron", "Black Tea", "Rose", "Raspberry", "Oud", "Amberwood"],
    story: "A city at midnight. Warm air, dark tea, a sudden bloom of rose, and nowhere else you need to be.", texture: "city dusk",
  },
  {
    slug: "bois-secret", number: "10", name: "Bois Secret", subtitle: "Where silence takes shape", category: "Woody • Aromatic", color: "#53614a", glow: "#9aaf8e", notes: ["Black pepper", "Hinoki", "Cedar"],
    ingredients: ["Black Pepper", "Petitgrain", "Hinoki", "Cedarwood", "Frankincense", "Soft Musk"],
    story: "Deep in the forest, the air is cool and the trees carry their own ancient language.", texture: "forest shade",
  },
];
