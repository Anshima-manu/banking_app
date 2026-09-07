/**
 * API functions for administrator authentication.
 */

import client from "./client";


/**
 * Authenticate an administrator and return the access token.
 */
export async function loginAdmin(credentials) {
  const response = await client.post(
    "/auth/login",
    credentials,
  );

  return response.data;
}


/**
 * Return the currently authenticated administrator.
 */
export async function getCurrentAdmin() {
  const response = await client.get(
    "/auth/me",
  );

  return response.data;
}
