import { CITY, MIN_PRICE, MAX_PRICE } from './config.js';

/**
 * Elke bron:
 *  - url:          zoekpagina (zo veel mogelijk al gefilterd en gesorteerd op nieuwste)
 *  - hrefPattern:  regex waarmee links naar een advertentie herkend worden
 *  - priceInUrl:   true als de zoek-URL zelf al op prijs filtert (advertenties zonder
 *                  leesbare prijs worden dan toch doorgelaten)
 */
export const SOURCES = [
  {
    name: 'Pararius',
    url: `https://www.pararius.nl/huurwoningen/${CITY}/appartement/${MIN_PRICE}-${MAX_PRICE}`,
    hrefPattern: `pararius\\.nl/appartement-te-huur/${CITY}/`,
    priceInUrl: true,
  },
  {
    name: 'Huurwoningen.nl',
    url: `https://www.huurwoningen.nl/in/${CITY}/?price=${MIN_PRICE}-${MAX_PRICE}&property_types=appartement&sort=published_at&direction=desc`,
    hrefPattern: `huurwoningen\\.nl/huren/${CITY}/[0-9a-f]{6,}/`,
    priceInUrl: true,
  },
  {
    name: 'Funda',
    url: `https://www.funda.nl/zoeken/huur?selected_area=["${CITY}"]&price="${MIN_PRICE}-${MAX_PRICE}"&object_type=["apartment"]&sort="date_down"`,
    hrefPattern: `funda\\.nl/detail/huur/${CITY}/appartement-`,
    priceInUrl: true,
  },
  {
    name: 'Kamernet',
    url: `https://kamernet.nl/huren/appartement-${CITY}`,
    hrefPattern: `kamernet\\.nl/huren/appartement-${CITY}/[^/]+/appartement-\\d+`,
    priceInUrl: false,
  },
  {
    name: '123Wonen',
    url: `https://www.123wonen.nl/huurwoningen/in/${CITY}/sort/newest`,
    hrefPattern: `123wonen\\.nl/huur/${CITY}/(appartement|bovenwoning|benedenwoning|penthouse)/`,
    priceInUrl: false,
  },
];
