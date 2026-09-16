export const INCLUDED_MILES = 20;
export const RATE_PER_MILE = 0.75;

export function parseMileage(input) {
  const value = String(input).trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
    throw new Error('Enter a distance in miles, using zero or a positive number.');
  }
  const miles = Number(value);
  if (!Number.isFinite(miles) || miles > 10000) {
    throw new Error('Enter a driving distance between 0 and 10,000 miles.');
  }
  return miles;
}

// The allowance is measured on the outward drive. Charge only the excess,
// doubled for the photographer's return journey.
export function travelCharge(milesOneWay) {
  if (!Number.isFinite(milesOneWay) || milesOneWay < 0) {
    throw new Error('Driving distance must be a non-negative number.');
  }
  const excess = Math.max(0, milesOneWay - INCLUDED_MILES);
  return Math.round((excess * 2 * RATE_PER_MILE + Number.EPSILON) * 100) / 100;
}
