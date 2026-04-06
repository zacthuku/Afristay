import listings from "../data/listings";

export function getListingById(id) {
  return listings.find((item) => item.id === Number(id));
}