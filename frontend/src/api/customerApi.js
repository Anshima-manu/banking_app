/**
 * API functions for customer and address management.
 */

import client from "./client";


/**
 * Search customers using optional filters.
 */
export async function searchCustomers(
  params = {},
  page = 1,
  pageSize = 10,
) {
  const response = await client.get("/customers", {
    params: {
      ...params,
      page,
      page_size: pageSize,
    },
  });

  return response.data;
}


/**
 * Return one customer by ID.
 */
export async function getCustomer(customerId) {
  const response = await client.get(
    `/customers/${customerId}`,
  );

  return response.data;
}


/**
 * Create a new customer.
 */
export async function createCustomer(data) {
  const response = await client.post(
    "/customers",
    data,
  );

  return response.data;
}


/**
 * Update selected customer fields.
 */
export async function updateCustomer(
  customerId,
  data,
) {
  const response = await client.patch(
    `/customers/${customerId}`,
    data,
  );

  return response.data;
}


/**
 * Return all addresses belonging to a customer.
 */
export async function getCustomerAddresses(customerId) {
  const response = await client.get(
    `/customers/${customerId}/addresses`,
  );

  return response.data;
}


/**
 * Add an address to a customer.
 */
export async function createCustomerAddress(
  customerId,
  data,
) {
  const response = await client.post(
    `/customers/${customerId}/addresses`,
    data,
  );

  return response.data;
}


/**
 * Update an existing customer address.
 */
export async function updateCustomerAddress(
  customerId,
  addressId,
  data,
) {
  const response = await client.patch(
    `/customers/${customerId}/addresses/${addressId}`,
    data,
  );

  return response.data;
}


/**
 * Delete an address belonging to a customer.
 */
export async function deleteCustomerAddress(
  customerId,
  addressId,
) {
  await client.delete(
    `/customers/${customerId}/addresses/${addressId}`,
  );
}

export async function getCustomerTransactions(customerId) {
  const response = await client.get(
    `/customers/${customerId}/transactions`
  );

  return response.data;
}