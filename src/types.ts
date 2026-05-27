export type UserRole = 'renter' | 'host' | 'admin' | 'corporate_renter';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePic?: string;
  phoneNumber?: string;
  nationalId?: string; // Fayda ID
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'blocked';
  phoneVerified?: boolean;
  verificationData?: {
    idFront?: string;
    idBack?: string;
    licenseFront?: string;
    licenseBack?: string;
    selfie?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    idNumber?: string;
    fullName?: string;
    expiryDate?: string;
  };
  createdAt: string;
}

export interface HostInfo {
  id: string;
  name: string;
  profilePic: string;
  joinedDate: string;
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  type: 'Sedan' | 'SUV' | 'Luxury' | 'Economy' | '4x4' | 'Trucks' | 'Construction' | 'Vans' | 'Motorcycles' | 'WithDriver' | 'WithoutDriver' | 'Sports' | 'Electric';
  pricePerDay: number;
  features: string[];
  images: string[];
  location: {
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    mapUrl?: string;
  };
  availability: boolean;
  hostId: string;
  host?: HostInfo;
  description: string;
  transmission: 'Automatic' | 'Manual';
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
  seats: number;
  engine?: string;
  mileage?: number;
  rating?: number;
  reviewCount?: number;
  requirements?: string[];
  pickupLocation?: string;
  returnLocation?: string;
  isAirportAvailable?: boolean;
  isMonthlyAvailable?: boolean;
  isNearby?: boolean;
  isDelivered?: boolean;
  isCityCenter?: boolean;
}

export interface Booking {
  id: string;
  carId: string;
  userId: string;
  hostId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
}

export interface Review {
  id: string;
  carId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CorporateProfile {
  id: string;
  userId: string;
  companyName: string;
  registrantPosition: string;
  renterFullName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  createdAt: string;
}

export interface CorporateDocument {
  id: string;
  type: 'legal_papers' | 'trade_license' | 'tin_certificate' | 'qualification_doc';
  fileName: string;
  fileData: string;
  uploadedAt: string;
}

export interface CorporateBookingRequest {
  id: string;
  userId: string;
  corporateProfileId: string;
  carId: string;
  carMake: string;
  carModel: string;
  carPlate: string;
  carImage: string;
  companyName: string;
  bookingDepartment: string;
  registrantPosition: string;
  renterFullName: string;
  renterAge: string;
  renterAddress: string;
  companyEmail: string;
  companyPhone: string;
  renterPhone?: string;
  rentalPurpose?: string;
  operatingArea?: string;
  phoneVerified: boolean;
  nationalIdVerified: boolean;
  nationalIdFront: string;
  nationalIdBack: string;
  driverLicenseFront: string;
  driverLicenseBack: string;
  livenessPhoto: string;
  documents: CorporateDocument[];
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  paymentMethod?: string;
  insuranceAmount?: number;
  status: 'pending_approval' | 'host_accepted' | 'bank_hold_active' | 'payment_completed' | 'rejected' | 'expired';
  createdAt: string;
  hostAcceptedAt?: string;
  bankHoldApprovedAt?: string;
  paymentCompletedAt?: string;
}
