import { listingService } from "../services/api";

export async function getListingById(id) {
  try {
    const listing = await listingService.getListingById(id);
    return listing;
  } catch (error) {
    console.error("Failed to fetch listing:", error);
    return null;
  }
}