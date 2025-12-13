export interface ISpecification {
  maxPower: string;
  fuelEconomy: string;
  maxSpeed: string;
  zeroToSixty: string;
}

export interface IFeature {
  model: string;
  capacity: string;
  color: string;
  fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric";
  gearType: "Manual" | "Automatic";
  images: string[];
}

export interface ICar {
  carName: string;
  specification: ISpecification;
  features: IFeature;
  createdAt?: Date;
  updatedAt?: Date;
}
