export type PlaceType = 'region' | 'district' | 'city'

export interface CzechPlace {
  name:   string
  type:   PlaceType
  lat:    number
  lng:    number
  radius: number  // km — used for map coverage circle
}

// Regions (14 krajů) — radius ~50 km
const REGIONS: CzechPlace[] = [
  { name: 'Hlavní město Praha',    type: 'region', lat: 50.0755, lng: 14.4378, radius: 15 },
  { name: 'Středočeský kraj',      type: 'region', lat: 49.97,   lng: 14.65,   radius: 55 },
  { name: 'Jihočeský kraj',        type: 'region', lat: 49.05,   lng: 14.40,   radius: 60 },
  { name: 'Plzeňský kraj',         type: 'region', lat: 49.73,   lng: 13.35,   radius: 55 },
  { name: 'Karlovarský kraj',      type: 'region', lat: 50.22,   lng: 12.87,   radius: 40 },
  { name: 'Ústecký kraj',          type: 'region', lat: 50.62,   lng: 13.85,   radius: 45 },
  { name: 'Liberecký kraj',        type: 'region', lat: 50.73,   lng: 15.05,   radius: 35 },
  { name: 'Královéhradecký kraj',  type: 'region', lat: 50.37,   lng: 15.83,   radius: 45 },
  { name: 'Pardubický kraj',       type: 'region', lat: 49.93,   lng: 15.97,   radius: 45 },
  { name: 'Kraj Vysočina',         type: 'region', lat: 49.53,   lng: 15.57,   radius: 55 },
  { name: 'Jihomoravský kraj',     type: 'region', lat: 49.10,   lng: 16.65,   radius: 50 },
  { name: 'Olomoucký kraj',        type: 'region', lat: 49.65,   lng: 17.10,   radius: 45 },
  { name: 'Zlínský kraj',          type: 'region', lat: 49.22,   lng: 17.68,   radius: 38 },
  { name: 'Moravskoslezský kraj',  type: 'region', lat: 49.73,   lng: 18.20,   radius: 42 },
]

// Districts (77 okresů) — radius ~18 km
const DISTRICTS: CzechPlace[] = [
  // Praha
  { name: 'Okres Praha',            type: 'district', lat: 50.0755, lng: 14.4378, radius: 14 },
  // Středočeský kraj
  { name: 'Okres Benešov',          type: 'district', lat: 49.78,   lng: 14.69,   radius: 18 },
  { name: 'Okres Beroun',           type: 'district', lat: 49.96,   lng: 14.07,   radius: 17 },
  { name: 'Okres Kladno',           type: 'district', lat: 50.14,   lng: 14.10,   radius: 16 },
  { name: 'Okres Kolín',            type: 'district', lat: 50.03,   lng: 15.10,   radius: 18 },
  { name: 'Okres Kutná Hora',       type: 'district', lat: 49.95,   lng: 15.27,   radius: 18 },
  { name: 'Okres Mělník',           type: 'district', lat: 50.35,   lng: 14.47,   radius: 16 },
  { name: 'Okres Mladá Boleslav',   type: 'district', lat: 50.42,   lng: 14.91,   radius: 18 },
  { name: 'Okres Nymburk',          type: 'district', lat: 50.18,   lng: 15.04,   radius: 17 },
  { name: 'Okres Praha-východ',     type: 'district', lat: 50.05,   lng: 14.72,   radius: 16 },
  { name: 'Okres Praha-západ',      type: 'district', lat: 49.97,   lng: 14.22,   radius: 15 },
  { name: 'Okres Příbram',          type: 'district', lat: 49.69,   lng: 14.01,   radius: 20 },
  { name: 'Okres Rakovník',         type: 'district', lat: 50.10,   lng: 13.73,   radius: 19 },
  // Jihočeský kraj
  { name: 'Okres České Budějovice', type: 'district', lat: 48.97,   lng: 14.48,   radius: 20 },
  { name: 'Okres Český Krumlov',    type: 'district', lat: 48.81,   lng: 14.32,   radius: 20 },
  { name: 'Okres Jindřichův Hradec',type: 'district', lat: 49.14,   lng: 15.00,   radius: 24 },
  { name: 'Okres Písek',            type: 'district', lat: 49.31,   lng: 14.15,   radius: 18 },
  { name: 'Okres Prachatice',       type: 'district', lat: 49.01,   lng: 13.99,   radius: 19 },
  { name: 'Okres Strakonice',       type: 'district', lat: 49.26,   lng: 13.90,   radius: 19 },
  { name: 'Okres Tábor',            type: 'district', lat: 49.41,   lng: 14.66,   radius: 20 },
  // Plzeňský kraj
  { name: 'Okres Domažlice',        type: 'district', lat: 49.44,   lng: 12.93,   radius: 20 },
  { name: 'Okres Klatovy',          type: 'district', lat: 49.40,   lng: 13.30,   radius: 23 },
  { name: 'Okres Plzeň-město',      type: 'district', lat: 49.74,   lng: 13.38,   radius: 10 },
  { name: 'Okres Plzeň-jih',        type: 'district', lat: 49.56,   lng: 13.36,   radius: 18 },
  { name: 'Okres Plzeň-sever',      type: 'district', lat: 49.87,   lng: 13.22,   radius: 19 },
  { name: 'Okres Rokycany',         type: 'district', lat: 49.74,   lng: 13.59,   radius: 15 },
  { name: 'Okres Tachov',           type: 'district', lat: 49.80,   lng: 12.63,   radius: 22 },
  // Karlovarský kraj
  { name: 'Okres Cheb',             type: 'district', lat: 50.08,   lng: 12.37,   radius: 18 },
  { name: 'Okres Karlovy Vary',     type: 'district', lat: 50.23,   lng: 12.87,   radius: 17 },
  { name: 'Okres Sokolov',          type: 'district', lat: 50.18,   lng: 12.64,   radius: 16 },
  // Ústecký kraj
  { name: 'Okres Děčín',            type: 'district', lat: 50.77,   lng: 14.21,   radius: 18 },
  { name: 'Okres Chomutov',         type: 'district', lat: 50.46,   lng: 13.42,   radius: 17 },
  { name: 'Okres Litoměřice',       type: 'district', lat: 50.54,   lng: 14.13,   radius: 19 },
  { name: 'Okres Louny',            type: 'district', lat: 50.35,   lng: 13.80,   radius: 18 },
  { name: 'Okres Most',             type: 'district', lat: 50.50,   lng: 13.64,   radius: 14 },
  { name: 'Okres Teplice',          type: 'district', lat: 50.64,   lng: 13.83,   radius: 13 },
  { name: 'Okres Ústí nad Labem',   type: 'district', lat: 50.66,   lng: 14.03,   radius: 13 },
  // Liberecký kraj
  { name: 'Okres Česká Lípa',       type: 'district', lat: 50.69,   lng: 14.54,   radius: 18 },
  { name: 'Okres Jablonec nad Nisou',type:'district', lat: 50.72,   lng: 15.17,   radius: 13 },
  { name: 'Okres Liberec',          type: 'district', lat: 50.77,   lng: 15.06,   radius: 15 },
  { name: 'Okres Semily',           type: 'district', lat: 50.61,   lng: 15.33,   radius: 17 },
  // Královéhradecký kraj
  { name: 'Okres Hradec Králové',   type: 'district', lat: 50.21,   lng: 15.83,   radius: 18 },
  { name: 'Okres Jičín',            type: 'district', lat: 50.44,   lng: 15.36,   radius: 18 },
  { name: 'Okres Náchod',           type: 'district', lat: 50.42,   lng: 16.16,   radius: 17 },
  { name: 'Okres Rychnov nad Kněžnou',type:'district',lat: 50.16,   lng: 16.27,   radius: 19 },
  { name: 'Okres Trutnov',          type: 'district', lat: 50.56,   lng: 15.91,   radius: 18 },
  // Pardubický kraj
  { name: 'Okres Chrudim',          type: 'district', lat: 49.95,   lng: 15.79,   radius: 18 },
  { name: 'Okres Pardubice',        type: 'district', lat: 50.04,   lng: 15.77,   radius: 16 },
  { name: 'Okres Svitavy',          type: 'district', lat: 49.76,   lng: 16.47,   radius: 20 },
  { name: 'Okres Ústí nad Orlicí',  type: 'district', lat: 49.97,   lng: 16.40,   radius: 20 },
  // Kraj Vysočina
  { name: 'Okres Havlíčkův Brod',   type: 'district', lat: 49.61,   lng: 15.58,   radius: 20 },
  { name: 'Okres Jihlava',          type: 'district', lat: 49.40,   lng: 15.59,   radius: 19 },
  { name: 'Okres Pelhřimov',        type: 'district', lat: 49.43,   lng: 15.22,   radius: 20 },
  { name: 'Okres Třebíč',           type: 'district', lat: 49.21,   lng: 15.88,   radius: 21 },
  { name: 'Okres Žďár nad Sázavou', type: 'district', lat: 49.56,   lng: 15.94,   radius: 23 },
  // Jihomoravský kraj
  { name: 'Okres Blansko',          type: 'district', lat: 49.36,   lng: 16.64,   radius: 17 },
  { name: 'Okres Brno-město',       type: 'district', lat: 49.20,   lng: 16.62,   radius: 12 },
  { name: 'Okres Brno-venkov',      type: 'district', lat: 49.08,   lng: 16.50,   radius: 22 },
  { name: 'Okres Břeclav',          type: 'district', lat: 48.76,   lng: 16.88,   radius: 18 },
  { name: 'Okres Hodonín',          type: 'district', lat: 48.85,   lng: 17.13,   radius: 19 },
  { name: 'Okres Vyškov',           type: 'district', lat: 49.28,   lng: 17.00,   radius: 17 },
  { name: 'Okres Znojmo',           type: 'district', lat: 48.86,   lng: 16.05,   radius: 22 },
  // Olomoucký kraj
  { name: 'Okres Jeseník',          type: 'district', lat: 50.23,   lng: 17.21,   radius: 17 },
  { name: 'Okres Olomouc',          type: 'district', lat: 49.59,   lng: 17.25,   radius: 19 },
  { name: 'Okres Prostějov',        type: 'district', lat: 49.47,   lng: 17.11,   radius: 15 },
  { name: 'Okres Přerov',           type: 'district', lat: 49.46,   lng: 17.45,   radius: 16 },
  { name: 'Okres Šumperk',          type: 'district', lat: 49.97,   lng: 16.97,   radius: 20 },
  // Zlínský kraj
  { name: 'Okres Kroměříž',         type: 'district', lat: 49.30,   lng: 17.39,   radius: 15 },
  { name: 'Okres Uherské Hradiště', type: 'district', lat: 49.07,   lng: 17.46,   radius: 16 },
  { name: 'Okres Vsetín',           type: 'district', lat: 49.34,   lng: 18.00,   radius: 18 },
  { name: 'Okres Zlín',             type: 'district', lat: 49.22,   lng: 17.66,   radius: 15 },
  // Moravskoslezský kraj
  { name: 'Okres Bruntál',          type: 'district', lat: 49.99,   lng: 17.46,   radius: 22 },
  { name: 'Okres Frýdek-Místek',    type: 'district', lat: 49.68,   lng: 18.37,   radius: 17 },
  { name: 'Okres Karviná',          type: 'district', lat: 49.85,   lng: 18.54,   radius: 13 },
  { name: 'Okres Nový Jičín',       type: 'district', lat: 49.59,   lng: 18.01,   radius: 16 },
  { name: 'Okres Opava',            type: 'district', lat: 49.94,   lng: 17.90,   radius: 18 },
  { name: 'Okres Ostrava-město',    type: 'district', lat: 49.83,   lng: 18.29,   radius: 12 },
]

// Major cities — radius ~7 km
const CITIES: CzechPlace[] = [
  { name: 'Praha',              type: 'city', lat: 50.0755, lng: 14.4378, radius: 12 },
  { name: 'Brno',               type: 'city', lat: 49.1951, lng: 16.6068, radius: 10 },
  { name: 'Ostrava',            type: 'city', lat: 49.8209, lng: 18.2625, radius: 9  },
  { name: 'Plzeň',              type: 'city', lat: 49.7384, lng: 13.3736, radius: 9  },
  { name: 'Liberec',            type: 'city', lat: 50.7663, lng: 15.0543, radius: 7  },
  { name: 'Olomouc',            type: 'city', lat: 49.5938, lng: 17.2509, radius: 7  },
  { name: 'Ústí nad Labem',     type: 'city', lat: 50.6607, lng: 14.0323, radius: 7  },
  { name: 'České Budějovice',   type: 'city', lat: 48.9745, lng: 14.4744, radius: 7  },
  { name: 'Hradec Králové',     type: 'city', lat: 50.2092, lng: 15.8328, radius: 7  },
  { name: 'Pardubice',          type: 'city', lat: 50.0343, lng: 15.7812, radius: 7  },
  { name: 'Zlín',               type: 'city', lat: 49.2245, lng: 17.6621, radius: 6  },
  { name: 'Havířov',            type: 'city', lat: 49.7798, lng: 18.4308, radius: 5  },
  { name: 'Kladno',             type: 'city', lat: 50.1435, lng: 14.1008, radius: 6  },
  { name: 'Most',               type: 'city', lat: 50.5035, lng: 13.6358, radius: 5  },
  { name: 'Opava',              type: 'city', lat: 49.9387, lng: 17.9034, radius: 6  },
  { name: 'Frýdek-Místek',      type: 'city', lat: 49.6834, lng: 18.3669, radius: 6  },
  { name: 'Karviná',            type: 'city', lat: 49.8530, lng: 18.5428, radius: 5  },
  { name: 'Jihlava',            type: 'city', lat: 49.3961, lng: 15.5912, radius: 6  },
  { name: 'Teplice',            type: 'city', lat: 50.6404, lng: 13.8254, radius: 5  },
  { name: 'Děčín',              type: 'city', lat: 50.7741, lng: 14.2137, radius: 6  },
  { name: 'Chomutov',           type: 'city', lat: 50.4608, lng: 13.4179, radius: 6  },
  { name: 'Přerov',             type: 'city', lat: 49.4560, lng: 17.4508, radius: 5  },
  { name: 'Jablonec nad Nisou', type: 'city', lat: 50.7244, lng: 15.1706, radius: 5  },
  { name: 'Mladá Boleslav',     type: 'city', lat: 50.4147, lng: 14.9061, radius: 6  },
  { name: 'Prostějov',          type: 'city', lat: 49.4722, lng: 17.1075, radius: 6  },
  { name: 'Česká Lípa',         type: 'city', lat: 50.6862, lng: 14.5376, radius: 5  },
  { name: 'Třebíč',             type: 'city', lat: 49.2145, lng: 15.8800, radius: 6  },
  { name: 'Znojmo',             type: 'city', lat: 48.8561, lng: 16.0486, radius: 6  },
  { name: 'Příbram',            type: 'city', lat: 49.6944, lng: 14.0081, radius: 6  },
  { name: 'Cheb',               type: 'city', lat: 50.0793, lng: 12.3718, radius: 5  },
  { name: 'Karlovy Vary',       type: 'city', lat: 50.2329, lng: 12.8716, radius: 6  },
  { name: 'Tábor',              type: 'city', lat: 49.4147, lng: 14.6539, radius: 6  },
  { name: 'Trutnov',            type: 'city', lat: 50.5607, lng: 15.9128, radius: 6  },
  { name: 'Kolín',              type: 'city', lat: 50.0285, lng: 15.2003, radius: 5  },
  { name: 'Šumperk',            type: 'city', lat: 49.9647, lng: 16.9718, radius: 5  },
  { name: 'Náchod',             type: 'city', lat: 50.4148, lng: 16.1651, radius: 5  },
  { name: 'Beroun',             type: 'city', lat: 49.9635, lng: 14.0716, radius: 5  },
  { name: 'Kutná Hora',         type: 'city', lat: 49.9482, lng: 15.2680, radius: 5  },
  { name: 'Hodonín',            type: 'city', lat: 48.8535, lng: 17.1299, radius: 5  },
  { name: 'Kroměříž',           type: 'city', lat: 49.2975, lng: 17.3917, radius: 5  },
  { name: 'Uherské Hradiště',   type: 'city', lat: 49.0736, lng: 17.4597, radius: 5  },
  { name: 'Břeclav',            type: 'city', lat: 48.7580, lng: 16.8826, radius: 5  },
  { name: 'Blansko',            type: 'city', lat: 49.3628, lng: 16.6475, radius: 5  },
  { name: 'Strakonice',         type: 'city', lat: 49.2598, lng: 13.9042, radius: 5  },
  { name: 'Sokolov',            type: 'city', lat: 50.1821, lng: 12.6432, radius: 5  },
  { name: 'Písek',              type: 'city', lat: 49.3086, lng: 14.1478, radius: 5  },
  { name: 'Vsetín',             type: 'city', lat: 49.3393, lng: 17.9956, radius: 5  },
  { name: 'Havlíčkův Brod',     type: 'city', lat: 49.6077, lng: 15.5808, radius: 5  },
  { name: 'Pelhřimov',          type: 'city', lat: 49.4314, lng: 15.2231, radius: 5  },
  { name: 'Vyškov',             type: 'city', lat: 49.2788, lng: 16.9986, radius: 5  },
  { name: 'Klatovy',            type: 'city', lat: 49.3955, lng: 13.2953, radius: 5  },
  { name: 'Rychnov nad Kněžnou',type: 'city', lat: 50.1614, lng: 16.2694, radius: 5  },
  { name: 'Benešov',            type: 'city', lat: 49.7816, lng: 14.6880, radius: 5  },
  { name: 'Nymburk',            type: 'city', lat: 50.1857, lng: 15.0424, radius: 5  },
  { name: 'Mělník',             type: 'city', lat: 50.3509, lng: 14.4738, radius: 5  },
  { name: 'Rakovník',           type: 'city', lat: 50.1062, lng: 13.7356, radius: 5  },
  { name: 'Jičín',              type: 'city', lat: 50.4362, lng: 15.3594, radius: 5  },
  { name: 'Chrudim',            type: 'city', lat: 49.9519, lng: 15.7963, radius: 5  },
  { name: 'Svitavy',            type: 'city', lat: 49.7568, lng: 16.4695, radius: 5  },
  { name: 'Ústí nad Orlicí',    type: 'city', lat: 49.9739, lng: 16.3948, radius: 5  },
  { name: 'Žďár nad Sázavou',   type: 'city', lat: 49.5636, lng: 15.9396, radius: 5  },
  { name: 'Jeseník',            type: 'city', lat: 50.2293, lng: 17.2083, radius: 5  },
  { name: 'Bruntál',            type: 'city', lat: 49.9887, lng: 17.4638, radius: 5  },
  { name: 'Nový Jičín',         type: 'city', lat: 49.5944, lng: 18.0144, radius: 5  },
  { name: 'Jindřichův Hradec',  type: 'city', lat: 49.1443, lng: 15.0031, radius: 5  },
  { name: 'Prachatice',         type: 'city', lat: 49.0126, lng: 13.9979, radius: 4  },
  { name: 'Český Krumlov',      type: 'city', lat: 48.8127, lng: 14.3175, radius: 4  },
  { name: 'Domažlice',          type: 'city', lat: 49.4405, lng: 12.9306, radius: 4  },
  { name: 'Rokycany',           type: 'city', lat: 49.7434, lng: 13.5905, radius: 4  },
  { name: 'Tachov',             type: 'city', lat: 49.7996, lng: 12.6368, radius: 4  },
  { name: 'Litoměřice',         type: 'city', lat: 50.5376, lng: 14.1313, radius: 5  },
  { name: 'Louny',              type: 'city', lat: 50.3534, lng: 13.8016, radius: 5  },
  { name: 'Semily',             type: 'city', lat: 50.6069, lng: 15.3336, radius: 4  },
  { name: 'Neratovice',         type: 'city', lat: 50.2619, lng: 14.5175, radius: 4  },
  { name: 'Čelákovice',         type: 'city', lat: 50.1602, lng: 14.7464, radius: 4  },
  { name: 'Brandýs nad Labem',  type: 'city', lat: 50.1871, lng: 14.6638, radius: 4  },
  { name: 'Říčany',             type: 'city', lat: 49.9936, lng: 14.6547, radius: 4  },
  { name: 'Černošice',          type: 'city', lat: 49.9561, lng: 14.3250, radius: 4  },
  { name: 'Roztoky',            type: 'city', lat: 50.1567, lng: 14.3944, radius: 3  },
  { name: 'Čáslav',             type: 'city', lat: 49.9114, lng: 15.3892, radius: 4  },
  { name: 'Přelouč',            type: 'city', lat: 50.0378, lng: 15.5647, radius: 4  },
  { name: 'Litomyšl',           type: 'city', lat: 49.8696, lng: 16.3131, radius: 4  },
  { name: 'Polička',            type: 'city', lat: 49.7145, lng: 16.2665, radius: 4  },
  { name: 'Telč',               type: 'city', lat: 49.1841, lng: 15.4536, radius: 3  },
  { name: 'Mor. Budějovice',    type: 'city', lat: 49.0544, lng: 15.8063, radius: 3  },
  { name: 'Mikulov',            type: 'city', lat: 48.8080, lng: 16.6381, radius: 4  },
  { name: 'Bučovice',           type: 'city', lat: 49.1464, lng: 17.0044, radius: 3  },
  { name: 'Hustopeče',          type: 'city', lat: 48.9403, lng: 16.7338, radius: 4  },
  { name: 'Veselí nad Moravou', type: 'city', lat: 48.9521, lng: 17.3762, radius: 4  },
  { name: 'Kyjov',              type: 'city', lat: 49.0099, lng: 17.1233, radius: 4  },
  { name: 'Hlučín',             type: 'city', lat: 49.8985, lng: 18.1923, radius: 4  },
  { name: 'Kopřivnice',         type: 'city', lat: 49.6051, lng: 18.1449, radius: 4  },
  { name: 'Rožnov pod Radhoštěm',type:'city', lat: 49.4578, lng: 18.1431, radius: 4  },
  { name: 'Valašské Meziříčí',  type: 'city', lat: 49.4712, lng: 17.9699, radius: 5  },
  { name: 'Uherský Brod',       type: 'city', lat: 49.0245, lng: 17.6476, radius: 4  },
  { name: 'Luhačovice',         type: 'city', lat: 49.0997, lng: 17.7569, radius: 3  },
  { name: 'Boskovice',          type: 'city', lat: 49.4882, lng: 16.6625, radius: 4  },
  { name: 'Kuřim',              type: 'city', lat: 49.2977, lng: 16.5361, radius: 4  },
  { name: 'Tišnov',             type: 'city', lat: 49.3484, lng: 16.4235, radius: 4  },
  { name: 'Rosice',             type: 'city', lat: 49.1784, lng: 16.3917, radius: 3  },
  { name: 'Slavkov u Brna',     type: 'city', lat: 49.1533, lng: 16.8735, radius: 4  },
  { name: 'Bílovec',            type: 'city', lat: 49.7567, lng: 17.8777, radius: 4  },
]

// Combined list — regions first, then districts, then cities
export const ALL_CZECH_PLACES: CzechPlace[] = [
  ...REGIONS,
  ...DISTRICTS,
  ...CITIES,
]

/** Search places by query string, max results limited */
export function searchCzechPlaces(query: string, limit = 10): CzechPlace[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return ALL_CZECH_PLACES.filter(p => {
    const name = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return name.includes(q)
  }).slice(0, limit)
}

/** Look up a single place by exact name (case-insensitive) */
export function findCzechPlace(name: string): CzechPlace | undefined {
  const n = name.toLowerCase()
  return ALL_CZECH_PLACES.find(p => p.name.toLowerCase() === n)
}
