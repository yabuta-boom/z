import { Car } from '../types';

export interface FleetCar {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vin: string;
  transmission: string;
  fuelType: string;
  mileage: number;
  seats: number;
  condition: string;
  insuranceStatus: string;
  registrationStatus: string;
  type: string;
  pricePerDay: number;
  location: string;
  description: string;
  gpsCode: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'active' | 'inactive';
  images: string[];
  documents: { photos: string[] };
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

const FLEET_KEY = 'zoe_host_fleet';
const INIT_KEY = 'zoe_fleet_initialized';

const SAMPLE_CARS: FleetCar[] = [
  {
    id: 'sample-car-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    plateNumber: 'AA-12345',
    vin: 'JTDBE32KX30012345',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    mileage: 15000,
    seats: 5,
    condition: 'Excellent',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'Sedan',
    pricePerDay: 4500,
    location: 'Bole, Addis Ababa',
    description: 'Well-maintained Toyota Camry with leather seats, sunroof, and advanced safety features. Perfect for business trips and city driving.',
    gpsCode: 'GPS-TOY-CAM-001',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['camry-front.jpg', 'camry-back.jpg', 'camry-interior.jpg', 'camry-side.jpg'] },
    createdAt: '2024-01-15T10:00:00Z',
    approvedAt: '2024-01-15T10:05:00Z',
  },
  {
    id: 'sample-car-2',
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    year: 2024,
    plateNumber: 'AA-67890',
    vin: 'JTEBU3FJX5K067890',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    mileage: 8000,
    seats: 7,
    condition: 'Excellent',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: '4x4',
    pricePerDay: 12000,
    location: 'CMC, Addis Ababa',
    description: 'Brand new Land Cruiser Prado with full off-road package, GPS navigation, and premium sound system. Ideal for long-distance and rough terrain.',
    gpsCode: 'GPS-LC-PRADO-002',
    status: 'active',
    images: ['https://images.turo.com/media/vehicle/images/KbXRKhxYQVG2yXhpWTzQ6A.1200x630.jpg'],
    documents: { photos: ['prado-front.jpg', 'prado-back.jpg', 'prado-interior.jpg', 'prado-side.jpg'] },
    createdAt: '2024-03-01T08:00:00Z',
    approvedAt: '2024-03-01T08:05:00Z',
  },
  {
    id: 'sample-car-3',
    make: 'Hyundai',
    model: 'Elantra',
    year: 2022,
    plateNumber: 'AA-24680',
    vin: 'KMHDH4AE7GU246800',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    mileage: 35000,
    seats: 5,
    condition: 'Good',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'Sedan',
    pricePerDay: 3500,
    location: 'Kazanchis, Addis Ababa',
    description: 'Fuel-efficient Hyundai Elantra with Apple CarPlay, backup camera, and excellent fuel economy. Great for daily commuting.',
    gpsCode: 'GPS-HYN-ELAN-003',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['elantra-front.jpg', 'elantra-back.jpg', 'elantra-interior.jpg', 'elantra-side.jpg'] },
    createdAt: '2024-06-20T09:00:00Z',
    approvedAt: '2024-06-20T09:05:00Z',
  },
  {
    id: 'sample-car-4',
    make: 'BMW',
    model: 'X5',
    year: 2023,
    plateNumber: 'AA-13579',
    vin: '5UXCR4C05KLL13579',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    mileage: 12000,
    seats: 5,
    condition: 'Excellent',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'Luxury',
    pricePerDay: 15000,
    location: 'Bole, Addis Ababa',
    description: 'Luxury BMW X5 with M Sport package, panoramic sunroof, heated seats, and premium Harman Kardon sound system. Top-tier comfort.',
    gpsCode: 'GPS-BMW-X5-004',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['bmw-front.jpg', 'bmw-back.jpg', 'bmw-interior.jpg', 'bmw-side.jpg'] },
    createdAt: '2024-02-10T11:00:00Z',
    approvedAt: '2024-02-10T11:05:00Z',
  },
  {
    id: 'sample-car-5',
    make: 'Nissan',
    model: 'Navara',
    year: 2023,
    plateNumber: 'AA-97531',
    vin: 'VSKCVND40UO975310',
    transmission: 'Manual',
    fuelType: 'Diesel',
    mileage: 25000,
    seats: 5,
    condition: 'Good',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'Trucks',
    pricePerDay: 6000,
    location: 'Megenagna, Addis Ababa',
    description: 'Rugged Nissan Navara pickup with cargo bed liner, 4x4 capability, and towing package. Perfect for construction and cargo transport.',
    gpsCode: 'GPS-NIS-NAV-005',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['navara-front.jpg', 'navara-back.jpg', 'navara-interior.jpg', 'navara-side.jpg'] },
    createdAt: '2024-04-05T07:00:00Z',
    approvedAt: '2024-04-05T07:05:00Z',
  },
  {
    id: 'sample-car-6',
    make: 'Mercedes-Benz',
    model: 'E-Class',
    year: 2024,
    plateNumber: 'AA-86420',
    vin: 'WDDZF4JB3RA864200',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    mileage: 5000,
    seats: 5,
    condition: 'Excellent',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'Luxury',
    pricePerDay: 18000,
    location: 'Sarbet, Addis Ababa',
    description: 'Brand new Mercedes E-Class with ambient lighting, massaging seats, and MBUX infotainment. The ultimate executive ride.',
    gpsCode: 'GPS-MERC-E-006',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['merc-front.jpg', 'merc-back.jpg', 'merc-interior.jpg', 'merc-side.jpg'] },
    createdAt: '2024-07-01T14:00:00Z',
    approvedAt: '2024-07-01T14:05:00Z',
  },
  {
    id: 'sample-car-7',
    make: 'Mercedes-Benz',
    model: 'GLE Coupe',
    year: 2024,
    plateNumber: 'AA-77889',
    vin: 'W1NF4JEB5RA778890',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    mileage: 3000,
    seats: 5,
    condition: 'Excellent',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'Luxury',
    pricePerDay: 20000,
    location: 'CMC, Addis Ababa',
    description: 'Premium Mercedes GLE Coupe with AMG package, luxury interior, and performance drive.',
    gpsCode: 'GPS-MERC-GLE-007',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1606220945770-b5b6b2c55bf2?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['gle-front.jpg', 'gle-back.jpg'] },
    createdAt: '2024-07-15T10:00:00Z',
    approvedAt: '2024-07-15T10:05:00Z',
  },
  {
    id: 'sample-car-pending-1',
    make: 'Toyota',
    model: 'Hilux',
    year: 2023,
    plateNumber: 'AA-11223',
    vin: 'JTEBU5FJX5K112230',
    transmission: 'Manual',
    fuelType: 'Diesel',
    mileage: 12000,
    seats: 5,
    condition: 'Excellent',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'Trucks',
    pricePerDay: 7000,
    location: 'Megenagna, Addis Ababa',
    description: 'Heavy-duty Toyota Hilux 4x4 with canopy, perfect for cargo and off-road use.',
    gpsCode: 'GPS-TOY-HILUX-P1',
    status: 'pending_approval',
    images: ['https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['hilux-front.jpg', 'hilux-back.jpg'] },
    createdAt: '2026-05-09T08:00:00Z',
  },
  {
    id: 'sample-car-pending-2',
    make: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    plateNumber: 'AA-44556',
    vin: 'KM8J5CA49RU445560',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    mileage: 5000,
    seats: 5,
    condition: 'Excellent',
    insuranceStatus: 'Active',
    registrationStatus: 'Up to Date',
    type: 'SUV',
    pricePerDay: 5500,
    location: 'Bole, Addis Ababa',
    description: 'Sleek Hyundai Tucson with panoramic sunroof and modern safety features.',
    gpsCode: 'GPS-HYN-TUCSON-P2',
    status: 'pending_approval',
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'],
    documents: { photos: ['tucson-front.jpg', 'tucson-back.jpg'] },
    createdAt: '2026-05-09T09:00:00Z',
  },
];

export function getFleet(): FleetCar[] {
  try { return JSON.parse(localStorage.getItem(FLEET_KEY) || '[]'); }
  catch { return []; }
}

export function saveFleet(cars: FleetCar[]) {
  localStorage.setItem(FLEET_KEY, JSON.stringify(cars));
}

export function initSampleFleet() {
  const existing = getFleet();
  if (existing.length === 0) {
    saveFleet(SAMPLE_CARS);
    localStorage.setItem(INIT_KEY, 'true');
  } else {
    if (!localStorage.getItem(INIT_KEY)) {
      localStorage.setItem(INIT_KEY, 'true');
    }
    // Remove old pending GLE Coupe (moved to active fleet as sample-car-7)
    let cleaned = existing;
    const oldPending = cleaned.find(c => c.id === 'sample-car-pending-3');
    if (oldPending) {
      cleaned = cleaned.filter(c => c.id !== 'sample-car-pending-3');
    }
    // Ensure pending sample cars exist
    const hasPending = cleaned.some(c => c.id.startsWith('sample-car-pending-'));
    if (!hasPending) {
      const pendingCars = SAMPLE_CARS.filter(c => c.status === 'pending_approval');
      cleaned = [...cleaned, ...pendingCars];
    }
    saveFleet(cleaned);
  }
}

export function getApprovedFleetCars(): FleetCar[] {
  return getFleet().filter(c => c.status === 'approved' || c.status === 'active');
}

export function fleetToCarCard(fc: FleetCar): Car {
  const loc = fc.location.split(',');
  return {
    id: fc.id,
    make: fc.make,
    model: fc.model,
    year: fc.year,
    type: (fc.type || 'Sedan') as Car['type'],
    pricePerDay: fc.pricePerDay,
    images: fc.images,
    location: { address: fc.location, city: loc[0]?.trim() || fc.location },
    features: [],
    availability: fc.status === 'active',
    hostId: 'host',
    description: fc.description,
    transmission: (fc.transmission || 'Automatic') as 'Automatic' | 'Manual',
    fuelType: (fc.fuelType || 'Petrol') as 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid',
    seats: fc.seats || 5,
    rating: 0,
    reviewCount: 0,
  };
}

export { SAMPLE_CARS };

export interface ActiveRental {
  id: string;
  carId: string;
  carMake: string;
  carModel: string;
  carYear: number;
  carPlate: string;
  carImage: string;
  carColor: string;
  carType: string;
  renterName: string;
  renterPhone: string;
  renterEmail: string;
  renterPhoto: string;
  renterAddress: string;
  nationalId: string;
  nationalIdPhoto: string;
  driverLicense: string;
  driverLicensePhoto: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'active' | 'completed' | 'overdue';
  gpsCode: string;
  gpsLat: number;
  gpsLng: number;
  gpsLocation: string;
  gpsLastPing: string;
  gpsBattery: number;
  gpsSpeed: number;
  issuePhotos: string[];
  rentalAgreement: string;
  notes: string;
}

const RENTALS_KEY = 'zoe_active_rentals';
const RENTALS_INIT_KEY = 'zoe_rentals_initialized';

const SAMPLE_RENTALS: ActiveRental[] = [
  {
    id: 'rental-1',
    carId: 'sample-car-1',
    carMake: 'Toyota',
    carModel: 'Camry',
    carYear: 2023,
    carPlate: 'AA-12345',
    carImage: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
    carColor: 'Midnight Black',
    carType: 'Sedan',
    renterName: 'Abebe Kebede',
    renterPhone: '+251911123456',
    renterEmail: 'abebe.kebede@gmail.com',
    renterPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    renterAddress: 'Bole, Addis Ababa',
    nationalId: 'FD-1234-5678',
    nationalIdPhoto: 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
    driverLicense: 'DL-ETH-98765',
    driverLicensePhoto: 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
    startDate: '2026-05-01T09:00:00Z',
    endDate: '2026-05-05T18:00:00Z',
    totalAmount: 18000,
    status: 'active',
    gpsCode: 'GPS-TOY-CAM-001',
    gpsLat: 9.0227,
    gpsLng: 38.7468,
    gpsLocation: 'Bole Road, Addis Ababa',
    gpsLastPing: '2 minutes ago',
    gpsBattery: 85,
    gpsSpeed: 45,
    issuePhotos: [
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
    ],
    rentalAgreement: 'RENTAL-AGREEMENT-001.pdf',
    notes: 'Customer requested extra cleaning before pickup. Car delivered with full tank.',
  },
  {
    id: 'rental-2',
    carId: 'sample-car-4',
    carMake: 'BMW',
    carModel: 'X5',
    carYear: 2023,
    carPlate: 'AA-13579',
    carImage: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800',
    carColor: 'Alpine White',
    carType: 'Luxury SUV',
    renterName: 'Sara Tekle',
    renterPhone: '+251922987654',
    renterEmail: 'sara.tekle@gmail.com',
    renterPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    renterAddress: 'CMC, Addis Ababa',
    nationalId: 'FD-8765-4321',
    nationalIdPhoto: 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
    driverLicense: 'DL-ETH-54321',
    driverLicensePhoto: 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
    startDate: '2026-05-03T10:00:00Z',
    endDate: '2026-05-07T10:00:00Z',
    totalAmount: 60000,
    status: 'active',
    gpsCode: 'GPS-BMW-X5-004',
    gpsLat: 9.0245,
    gpsLng: 38.7577,
    gpsLocation: 'CMC Area, Addis Ababa',
    gpsLastPing: '5 minutes ago',
    gpsBattery: 72,
    gpsSpeed: 0,
    issuePhotos: [],
    rentalAgreement: 'RENTAL-AGREEMENT-002.pdf',
    notes: 'VIP customer. Include baby seat and phone charger.',
  },
  {
    id: 'rental-3',
    carId: 'sample-car-6',
    carMake: 'Mercedes-Benz',
    carModel: 'E-Class',
    carYear: 2024,
    carPlate: 'AA-86420',
    carImage: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=80&w=800',
    carColor: 'Obsidian Black',
    carType: 'Luxury Sedan',
    renterName: 'Dawit Hailu',
    renterPhone: '+251933456789',
    renterEmail: 'dawit.hailu@gmail.com',
    renterPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    renterAddress: 'Sarbet, Addis Ababa',
    nationalId: 'FD-2468-1357',
    nationalIdPhoto: 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
    driverLicense: 'DL-ETH-24680',
    driverLicensePhoto: 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
    startDate: '2026-05-02T14:00:00Z',
    endDate: '2026-05-06T14:00:00Z',
    totalAmount: 72000,
    status: 'active',
    gpsCode: 'GPS-MERC-E-006',
    gpsLat: 8.9773,
    gpsLng: 38.8021,
    gpsLocation: 'Bole International Airport',
    gpsLastPing: '1 minute ago',
    gpsBattery: 91,
    gpsSpeed: 0,
    issuePhotos: [
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
    ],
    rentalAgreement: 'RENTAL-AGREEMENT-003.pdf',
    notes: 'Airport pickup arranged. Returning customer - preferred status.',
  },
];

export function getActiveRentals(): ActiveRental[] {
  try { return JSON.parse(localStorage.getItem(RENTALS_KEY) || '[]'); }
  catch { return []; }
}

export function initSampleRentals() {
  if (localStorage.getItem(RENTALS_INIT_KEY)) return;
  const existing = getActiveRentals();
  if (existing.length === 0) {
    localStorage.setItem(RENTALS_KEY, JSON.stringify(SAMPLE_RENTALS));
    localStorage.setItem(RENTALS_INIT_KEY, 'true');
  }
}

// ─── Rental Request (pre-payment approval) ───────────
export interface RentalRequest {
  id: string;
  renterName: string;
  renterPhone: string;
  renterEmail: string;
  renterPhoto: string;
  renterAddress: string;
  age: string;
  familyNumber: string;
  relation: string;
  familyName: string;
  purpose: string;
  nationalId: string;
  nationalIdPhotoFront: string;
  nationalIdPhotoBack: string;
  driverLicense: string;
  driverLicensePhotoFront: string;
  driverLicensePhotoBack: string;
  carId: string;
  carMake: string;
  carModel: string;
  carPlate: string;
  carImage: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentMethod: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const RENTAL_REQ_KEY = 'zoe_rental_requests';
const RENTAL_REQ_INIT_KEY = 'zoe_rental_req_initialized';

const SAMPLE_RENTAL_REQUESTS: RentalRequest[] = [
  {
    id: 'req-1',
    renterName: 'Meron Alemu',
    renterPhone: '+251911555777',
    renterEmail: 'meron.alemu@gmail.com',
    renterPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    renterAddress: 'Bole, Addis Ababa',
    age: '32',
    familyNumber: '+251911222333',
    relation: 'Spouse',
    familyName: 'Biruk Alemu',
    purpose: 'Family road trip to Lalibela for Easter celebration',
    nationalId: 'FD-1122-3344',
    nationalIdPhotoFront: 'https://www.ethiotelecom.et/wp-content/uploads/2024/04/IMG_9415.jpg',
    nationalIdPhotoBack: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_edMhrpxTKfWyiyMSGyl-kjPEldLqsS7KAw&s',
    driverLicense: 'DL-ETH-77665',
    driverLicensePhotoFront: 'https://tagmefy.com/media/data/28/e8/28e80c82-e2b3-443d-b99a-8f01532d99e2.jpg.610x430_q85_background-%23ffffff_crop_upscale.jpg',
    driverLicensePhotoBack: 'https://www.rentadriveruganda.com/wp-content/uploads/2022/06/driver-license-back.png',
    carId: 'sample-car-2',
    carMake: 'Toyota',
    carModel: 'Land Cruiser Prado',
    carPlate: 'AA-67890',
    carImage: 'https://images.turo.com/media/vehicle/images/KbXRKhxYQVG2yXhpWTzQ6A.1200x630.jpg',
    startDate: '2026-05-20T09:00:00Z',
    endDate: '2026-05-25T18:00:00Z',
    totalAmount: 60000,
    paymentMethod: 'm-pesa',
    notes: 'Planning a family trip to Bahir Dar. Need the Prado for long-distance comfort.',
    status: 'pending',
    createdAt: '2026-05-08T14:30:00Z',
  },
  {
    id: 'req-2',
    renterName: 'Yonas Tadesse',
    renterPhone: '+251922334411',
    renterEmail: 'yonas.tadesse@gmail.com',
    renterPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    renterAddress: 'Piassa, Addis Ababa',
    age: '45',
    familyNumber: '+251922555666',
    relation: 'Brother',
    familyName: 'Mekonnen Tadesse',
    purpose: 'Construction material transport for ongoing building project',
    nationalId: 'FD-5566-7788',
    nationalIdPhotoFront: 'https://www.ethiotelecom.et/wp-content/uploads/2024/04/IMG_9415.jpg',
    nationalIdPhotoBack: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_edMhrpxTKfWyiyMSGyl-kjPEldLqsS7KAw&s',
    driverLicense: 'DL-ETH-44332',
    driverLicensePhotoFront: 'https://tagmefy.com/media/data/28/e8/28e80c82-e2b3-443d-b99a-8f01532d99e2.jpg.610x430_q85_background-%23ffffff_crop_upscale.jpg',
    driverLicensePhotoBack: 'https://www.rentadriveruganda.com/wp-content/uploads/2022/06/driver-license-back.png',
    carId: 'sample-car-5',
    carMake: 'Nissan',
    carModel: 'Navara',
    carPlate: 'AA-97531',
    carImage: 'https://images.unsplash.com/photo-1586191582151-f73872dfd183?auto=format&fit=crop&q=80&w=800',
    startDate: '2026-05-22T08:00:00Z',
    endDate: '2026-05-28T17:00:00Z',
    totalAmount: 36000,
    paymentMethod: 'cash',
    notes: 'Need the pickup for construction material transport. Will have a helper riding along.',
    status: 'pending',
    createdAt: '2026-05-08T16:15:00Z',
  },
];

export function getRentalRequests(): RentalRequest[] {
  try { return JSON.parse(localStorage.getItem(RENTAL_REQ_KEY) || '[]'); }
  catch { return []; }
}

export function saveRentalRequests(requests: RentalRequest[]) {
  localStorage.setItem(RENTAL_REQ_KEY, JSON.stringify(requests));
}

export function initSampleRentalRequests() {
  const existing = getRentalRequests();
  if (existing.length === 0) {
    saveRentalRequests(SAMPLE_RENTAL_REQUESTS);
  } else if (!('age' in existing[0])) {
    // Migrate old-format data to new sample data
    saveRentalRequests(SAMPLE_RENTAL_REQUESTS);
  }
}

// ─── Return Request (post-return approval) ───────────
export interface ReturnRequest {
  id: string;
  rentalId: string;
  carId: string;
  carMake: string;
  carModel: string;
  carPlate: string;
  carImage: string;
  currentPhotos: string[];
  conditionReport: {
    exterior: string;
    interior: string;
    tires: string;
    lights: string;
    wipers: string;
  };
  damageCheck: {
    hasDamage: boolean;
    description: string;
    estimatedCost: number;
  };
  fuelStatus: string;
  returnTime: string;
  returnLocation: string;
  mileageAtReturn: number;
  status: 'pending' | 'approved' | 'disputed';
  createdAt: string;
}

const RETURN_REQ_KEY = 'zoe_return_requests';
const RETURN_REQ_INIT_KEY = 'zoe_return_req_initialized';

const SAMPLE_RETURN_REQUESTS: ReturnRequest[] = [
  {
    id: 'return-1',
    rentalId: 'rental-1',
    carId: 'sample-car-1',
    carMake: 'Toyota',
    carModel: 'Camry',
    carPlate: 'AA-12345',
    carImage: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
    currentPhotos: [
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
    ],
    conditionReport: {
      exterior: 'Minor scratch on rear bumper. Overall good condition.',
      interior: 'Clean interior, no stains or damage.',
      tires: 'Tire pressure low on front left. Tread depth acceptable.',
      lights: 'All lights functional.',
      wipers: 'Wipers need replacement - leaving streaks.',
    },
    damageCheck: {
      hasDamage: true,
      description: 'Small scratch (~5cm) on rear bumper, passenger side.',
      estimatedCost: 1500,
    },
    fuelStatus: '3/4',
    returnTime: '2026-05-08T17:30:00Z',
    returnLocation: 'Bole, Addis Ababa (host location)',
    mileageAtReturn: 15320,
    status: 'pending',
    createdAt: '2026-05-08T17:35:00Z',
  },
  {
    id: 'return-2',
    rentalId: 'rental-3',
    carId: 'sample-car-6',
    carMake: 'Mercedes-Benz',
    carModel: 'E-Class',
    carPlate: 'AA-86420',
    carImage: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=80&w=800',
    currentPhotos: [
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
    ],
    conditionReport: {
      exterior: 'Excellent condition. No visible damage.',
      interior: 'Perfect condition, detailed and sanitized.',
      tires: 'All tires in excellent condition.',
      lights: 'All lights functional.',
      wipers: 'Working properly.',
    },
    damageCheck: {
      hasDamage: false,
      description: '',
      estimatedCost: 0,
    },
    fuelStatus: 'Full',
    returnTime: '2026-05-07T14:00:00Z',
    returnLocation: 'Sarbet, Addis Ababa',
    mileageAtReturn: 5340,
    status: 'pending',
    createdAt: '2026-05-07T14:10:00Z',
  },
  {
    id: 'return-3',
    rentalId: 'rental-2',
    carId: 'sample-car-3',
    carMake: 'Hyundai',
    carModel: 'Elantra',
    carPlate: 'AA-24680',
    carImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800',
    currentPhotos: [
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400',
    ],
    conditionReport: {
      exterior: 'Light scuff marks on passenger door. Minor wear consistent with city driving.',
      interior: 'Clean interior, light dust on dashboard.',
      tires: 'Front tires showing normal wear. Rear tires in good condition.',
      lights: 'All lights functional.',
      wipers: 'Working properly.',
    },
    damageCheck: {
      hasDamage: true,
      description: 'Light scuff marks on passenger side door panel (~10cm).',
      estimatedCost: 800,
    },
    fuelStatus: '1/2',
    returnTime: '2026-05-06T12:30:00Z',
    returnLocation: 'Kazanchis, Addis Ababa',
    mileageAtReturn: 36200,
    status: 'pending',
    createdAt: '2026-05-06T12:45:00Z',
  },
];

export function getReturnRequests(): ReturnRequest[] {
  try { return JSON.parse(localStorage.getItem(RETURN_REQ_KEY) || '[]'); }
  catch { return []; }
}

export function saveReturnRequests(requests: ReturnRequest[]) {
  localStorage.setItem(RETURN_REQ_KEY, JSON.stringify(requests));
}

export function initSampleReturnRequests() {
  const existing = getReturnRequests();
  if (existing.length === 0) {
    saveReturnRequests(SAMPLE_RETURN_REQUESTS);
  } else if (existing.filter(r => r.status === 'pending').length < 3) {
    // Ensure we have 3 pending return samples
    saveReturnRequests(SAMPLE_RETURN_REQUESTS);
  }
}
