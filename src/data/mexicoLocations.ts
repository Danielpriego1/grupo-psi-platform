// Estados de México con municipios y códigos postales representativos
export interface Municipality {
  name: string;
  postalCodes: string[];
}

export interface MexicoState {
  name: string;
  municipalities: Municipality[];
  coords: [number, number]; // lat, lng for map centering
}

export const mexicoStates: MexicoState[] = [
  {
    name: "Tabasco",
    coords: [17.9869, -92.9303],
    municipalities: [
      { name: "Centro (Villahermosa)", postalCodes: ["86000", "86010", "86020", "86030", "86040", "86050", "86060", "86070", "86080"] },
      { name: "Cárdenas", postalCodes: ["86500", "86510", "86520"] },
      { name: "Comalcalco", postalCodes: ["86300", "86310", "86320"] },
      { name: "Cunduacán", postalCodes: ["86690", "86691"] },
      { name: "Huimanguillo", postalCodes: ["86400", "86410"] },
      { name: "Jalapa", postalCodes: ["86850", "86851"] },
      { name: "Jalpa de Méndez", postalCodes: ["86200", "86210"] },
      { name: "Macuspana", postalCodes: ["86700", "86710"] },
      { name: "Nacajuca", postalCodes: ["86220", "86230", "86233", "86235", "86236", "86237", "86238", "86240", "86243", "86244", "86245", "86246", "86247"] },
      { name: "Paraíso", postalCodes: ["86600", "86610"] },
      { name: "Tacotalpa", postalCodes: ["86800", "86810"] },
      { name: "Teapa", postalCodes: ["86800", "86801"] },
      { name: "Tenosique", postalCodes: ["86900", "86910"] },
    ],
  },
  {
    name: "Campeche",
    coords: [19.8301, -90.5349],
    municipalities: [
      { name: "Campeche", postalCodes: ["24000", "24010", "24020"] },
      { name: "Carmen", postalCodes: ["24100", "24110"] },
      { name: "Champotón", postalCodes: ["24400", "24410"] },
    ],
  },
  {
    name: "Chiapas",
    coords: [16.7569, -93.1292],
    municipalities: [
      { name: "Tuxtla Gutiérrez", postalCodes: ["29000", "29010", "29020"] },
      { name: "San Cristóbal de las Casas", postalCodes: ["29200", "29210"] },
      { name: "Tapachula", postalCodes: ["30700", "30710"] },
      { name: "Comitán de Domínguez", postalCodes: ["30000", "30010"] },
    ],
  },
  {
    name: "Veracruz",
    coords: [19.1738, -96.1342],
    municipalities: [
      { name: "Veracruz", postalCodes: ["91700", "91710", "91720"] },
      { name: "Xalapa", postalCodes: ["91000", "91010", "91020"] },
      { name: "Coatzacoalcos", postalCodes: ["96400", "96410"] },
      { name: "Minatitlán", postalCodes: ["96700", "96710"] },
      { name: "Córdoba", postalCodes: ["94500", "94510"] },
    ],
  },
  {
    name: "Oaxaca",
    coords: [17.0732, -96.7266],
    municipalities: [
      { name: "Oaxaca de Juárez", postalCodes: ["68000", "68010", "68020"] },
      { name: "Salina Cruz", postalCodes: ["70600", "70610"] },
      { name: "Juchitán de Zaragoza", postalCodes: ["70000", "70010"] },
    ],
  },
  {
    name: "Ciudad de México",
    coords: [19.4326, -99.1332],
    municipalities: [
      { name: "Cuauhtémoc", postalCodes: ["06000", "06010", "06020", "06030", "06040", "06050"] },
      { name: "Miguel Hidalgo", postalCodes: ["11000", "11510", "11520"] },
      { name: "Benito Juárez", postalCodes: ["03100", "03200", "03300"] },
      { name: "Álvaro Obregón", postalCodes: ["01000", "01010", "01020"] },
      { name: "Coyoacán", postalCodes: ["04000", "04010", "04020"] },
      { name: "Tlalpan", postalCodes: ["14000", "14010", "14020"] },
    ],
  },
  {
    name: "Estado de México",
    coords: [19.2938, -99.6568],
    municipalities: [
      { name: "Toluca", postalCodes: ["50000", "50010", "50020"] },
      { name: "Naucalpan", postalCodes: ["53000", "53010"] },
      { name: "Ecatepec", postalCodes: ["55000", "55010"] },
      { name: "Tlalnepantla", postalCodes: ["54000", "54010"] },
    ],
  },
  {
    name: "Puebla",
    coords: [19.0414, -98.2063],
    municipalities: [
      { name: "Puebla", postalCodes: ["72000", "72010", "72020"] },
      { name: "Tehuacán", postalCodes: ["75700", "75710"] },
      { name: "San Martín Texmelucan", postalCodes: ["74000", "74010"] },
    ],
  },
  {
    name: "Yucatán",
    coords: [20.9674, -89.5926],
    municipalities: [
      { name: "Mérida", postalCodes: ["97000", "97010", "97020"] },
      { name: "Valladolid", postalCodes: ["97780", "97781"] },
      { name: "Progreso", postalCodes: ["97320", "97321"] },
    ],
  },
  {
    name: "Quintana Roo",
    coords: [21.1619, -86.8515],
    municipalities: [
      { name: "Benito Juárez (Cancún)", postalCodes: ["77500", "77510", "77520"] },
      { name: "Solidaridad (Playa del Carmen)", postalCodes: ["77710", "77711"] },
      { name: "Othón P. Blanco (Chetumal)", postalCodes: ["77000", "77010"] },
    ],
  },
  {
    name: "Jalisco",
    coords: [20.6597, -103.3496],
    municipalities: [
      { name: "Guadalajara", postalCodes: ["44100", "44110", "44120"] },
      { name: "Zapopan", postalCodes: ["45010", "45020", "45030"] },
      { name: "Tlaquepaque", postalCodes: ["45500", "45510"] },
      { name: "Puerto Vallarta", postalCodes: ["48300", "48310"] },
    ],
  },
  {
    name: "Nuevo León",
    coords: [25.6866, -100.3161],
    municipalities: [
      { name: "Monterrey", postalCodes: ["64000", "64010", "64020"] },
      { name: "San Pedro Garza García", postalCodes: ["66200", "66210"] },
      { name: "San Nicolás de los Garza", postalCodes: ["66400", "66410"] },
      { name: "Guadalupe", postalCodes: ["67100", "67110"] },
    ],
  },
];
