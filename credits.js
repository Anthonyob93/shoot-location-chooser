// Licence records checked against the original Wikimedia Commons file pages, 16 September 2026.
export const photoCredits = {
  glynllifon: { author: 'Eric Jones', title: 'The main drive towards the front of Plas Glynllifon house', file: 'The_main_drive_towards_the_front_of_Plas_Glynllifon_house_-_geograph.org.uk_-_788653.jpg', licence: 'CC BY-SA 2.0' },
  criccieth: { author: 'James@hopgrove', title: 'Criccieth beach', file: 'Criccieth_beach.JPG', licence: 'Public domain' },
  marian: { author: 'steve evans', title: 'South beach to Gimblet rock, Pwllheli', file: 'South_beach_to_Gimblet_rock,_Pwllheli_-_geograph.org.uk_-_5049472.jpg', licence: 'CC BY-SA 2.0' },
  dinas: { author: 'Ijanderson977', title: 'Dinas Dinlle 01 977', file: 'Dinas_Dinlle_01_977.PNG', licence: 'Public domain' },
  caernarfon: { author: 'Herbert Ortner', title: 'Caernarfon Castle 1994', file: 'Caernarfon_Castle_1994.jpg', licence: 'CC BY 4.0' },
  llyn: { author: 'Peter Bond', title: 'Llyn Mair', file: 'Llyn_Mair_-_geograph.org.uk_-_4140426.jpg', licence: 'CC BY-SA 2.0' },
  newborough: { author: 'Hogyn Lleol', title: 'Ynys Llanddwyn from Newborough Beach - low tide', file: 'Ynys_Llanddwyn_from_Newborough_Beach_-_low_tide.jpg', licence: 'CC BY-SA 4.0' },
  beddgelert: { author: 'Andrew Stawarz', title: 'Beddgelert stone bridge', file: 'Beddgelert_stone_bridge.jpg', licence: 'CC BY-SA 2.0' },
  craflwyn: { author: 'David Medcalf', title: 'A waterfall in Craflwyn grounds', file: 'A_waterfall_in_Craflwyn_grounds_-_geograph.org.uk_-_7810438.jpg', licence: 'CC BY-SA 2.0' }
};
export const licenceUrls = {
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/'
};
export const photoSource = credit => 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(credit.file);
