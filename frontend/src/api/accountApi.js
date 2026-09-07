/**
 * API functions for customer bank account management.
 */

import client from "./client";


/**
 * Return all accounts belonging to a customer.
 */
export async function getCustomerAccounts(customerId) {
  const response = await client.get(
    `/customers/${customerId}/accounts`,
  );

  return response.data;
}


/**
 * Create a Savings or Loan account for a customer.
 */
export async function createAccount(
  customerId,
  data,
) {
  const response = await client.post(
    `/customers/${customerId}/accounts`,
    data,
  );

  return response.data;
}


/**
 * Return one account by its internal account ID.
 */
export async function getAccount(accountId) {
  const response = await client.get(
    `/accounts/${accountId}`,
  );

  return response.data;
}


/**
 * Change an account's operational status.
 */
export async function updateAccountStatus(
  accountId,
  accountStatus,
) {
  const response = await client.patch(
    `/accounts/${accountId}/status`,
    {
      account_status: accountStatus,
    },
  );

  return response.data;
}


/**
 * Return Savings-specific account information.
 */
export async function getSavingsProfile(accountId) {
  const response = await client.get(
    `/accounts/${accountId}/savings-profile`,
  );

  return response.data;
}


/**
 * Return Loan-specific account information.
 */
export async function getLoanProfile(accountId) {
  const response = await client.get(
    `/accounts/${accountId}/loan-profile`,
  );

  return response.data;
}

export async function getLoanInstallments(accountId) {
  const response = await client.get(
    `/accounts/${accountId}/installments`
  );

  return response.data;
}


export async function payLoanInstallment(
  accountId,
  installmentId,
  amount
) {
  const response = await client.post(
    `/accounts/${accountId}/installments/${installmentId}/pay`,
    {
      amount,
    }
  );

  return response.data;
}