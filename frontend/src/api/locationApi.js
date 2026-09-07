/**
 * API functions for postal-code based location lookup.
 */

import client from "./client";


/**
 * Fetch city, state, and country details for a postal code.
 */
export async function getLocationByPostalCode(postalCode) {
  const response = await client.get(
    `/locations/postal-code/${postalCode}`,
  );

  return response.data;
}