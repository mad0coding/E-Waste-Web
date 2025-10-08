// src/data/locations.ts

export interface EWasteBin {
  id: string;
  name: string;
  address: string;
  type: string;
  hours: string;
  phone?: string;
  lat: number;
  lng: number;
  acceptedClasses: string[];
}

export const eWasteBins: EWasteBin[] = [
  {
    id: '1',
    name: 'Officeworks Bourke St',
    address: 'Shop 1 & 2/461 Bourke St, Melbourne VIC 3000',
    type: 'Drop-off Point',
    hours: 'Monday to Friday, 08:00-19:00. Saturday to Sunday, 09:00-17:00.',
    phone: '0396914500',
    lat: -37.815306,
    lng: 144.960139,
    acceptedClasses: ['Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television']
  },
  {
    id: '2',
    name: 'Officeworks Russell St',
    address: 'QV Centre, Russell St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Friday, 08:00-19:00. Saturday to Sunday, 09:00-17:00.',
    phone: '0386656400',
    lat: -37.810103,
    lng: 144.966703,
    acceptedClasses: ['Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television']
  },
  {
    id: '3',
    name: 'JB Hi-Fi - Elizabeth St',
    address: '239 Elizabeth St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Wednesday, 09:00-19:00. Thursday to Friday, 09:00-21:00. Saturday, 09:00-18:00. Sunday, 10:00-18:00.',
    phone: '0396426100',
    lat: -37.812921,
    lng: 144.962437,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'PCB']
  },
  {
    id: '4',
    name: 'JB Hi-Fi Melbourne Central',
    address: 'Melbourne Central, Shop 101B, L01 Building/211 La Trobe St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Wednesday, 09:00-19:00. Thursday to Friday, 09:00-21:00. Saturday, 09:00-18:00. Sunday, 10:00-18:00.',
    phone: '0399063500',
    lat: -37.810114,
    lng: 144.962476,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'PCB']
  },
  {
    id: '5',
    name: 'JB Hi-Fi City - Bourke Street',
    address: '206 Bourke St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Wednesday, 09:00-19:00. Thursday to Friday, 09:00-21:00. Saturday, 09:00-18:00. Sunday, 10:00-18:00.',
    phone: '0386564200',
    lat: -37.812970,
    lng: 144.966990,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'PCB']
  },
  {
    id: '6',
    name: 'Coles Spencer St',
    address: '201 Spencer St, Docklands VIC 3008',
    type: 'Battery Recycling',
    hours: '06:00-23:00',
    phone: '0370075300',
    lat: -37.815068,
    lng: 144.952152,
    acceptedClasses: ['Battery']
  },
  {
    id: '7',
    name: 'Coles',
    address: '211 La Trobe St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: 'Monday to Friday, 06:00-23:00. Saturday to Sunday, 07:00-23:00.',
    phone: '0396635245',
    lat: -37.809947,
    lng: 144.963386,
    acceptedClasses: ['Battery']
  },
  {
    id: '8',
    name: 'Coles Central Melbourne CBD',
    address: 'Elizabeth St &, Flinders St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: 'Monday to Friday, 06:00-23:00. Saturday to Sunday, 07:00-23:00.',
    phone: '0396529200',
    lat: -37.817768,
    lng: 144.964869,
    acceptedClasses: ['Battery']
  },
  {
    id: '9',
    name: 'BIG W Queen Victoria Village',
    address: 'Corner of Swanston Street and, Lonsdale St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: 'Monday to Saturday, 08:00-22:00. Sunday, 09:00-22:00.',
    phone: '1300411875',
    lat: -37.811391,
    lng: 144.964777,
    acceptedClasses: ['Battery']
  },
  {
    id: '10',
    name: 'ALDI',
    address: '501 Swanston St, Melbourne VIC 3000',
    type: 'Battery Recycling',
    hours: '08:30-21:00',
    phone: '132534',
    lat: -37.807526,
    lng: 144.962272,
    acceptedClasses: ['Battery']
  },
  {
    id: '11',
    name: 'Rubbish Removal Melbourne',
    address: 'The Commons, Suite 94/3 Albert Coates Ln, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Monday to Friday, 06:00-21:00. Saturday to Sunday, 08:00-18:00.',
    phone: '0483960892',
    lat: -37.810932,
    lng: 144.964597,
    acceptedClasses: ['Battery', 'Camera', 'Keyboard', 'Laptop', 'Microwaves', 'Mobile', 'Mouse', 'Player', 'Printer', 'Smartwatch', 'Television', 'Washing machine']
  },
  {
    id: '12',
    name: '1300 Rubbish Removal',
    address: 'Level 570/24 Little Bourke St, Melbourne VIC 3000',
    type: 'Full Service Center',
    hours: 'Open 24 hours',
    phone: '1300782247',
    lat: -37.810620,
    lng: 144.971542,
    acceptedClasses: ['Microwaves', 'Printer', 'Television', 'Washing machine']
  }
];