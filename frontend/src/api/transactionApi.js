/**
 * API functions for account financial transactions.
 */

import client from "./client";


/**
 * Return the transaction history of an account.
 */
export async function getTransactions(accountId) {
  const response = await client.get(
    `/accounts/${accountId}/transactions`,
  );

  return response.data;
}


/**
 * Deposit funds into an active Savings account.
 */
export async function depositFunds(
  accountId,
  data,
) {
  const response = await client.post(
    `/accounts/${accountId}/deposit`,
    data,
  );
  console.log(response.data)

  return response.data;
}


/**
 * Withdraw funds from an active Savings account.
 */
export async function withdrawFunds(
  accountId,
  data,
) {
  const response = await client.post(
    `/accounts/${accountId}/withdraw`,
    data,
  );

  console.log(response.data)

  return response.data;
}

export async function searchTransactionAccounts(
  search,
  page = 1,
  pageSize = 10,
) {
  const response = await client.get("/transactions/search", {
    params: {
      search,
      page,
      page_size: pageSize,
    },
  });

  return response.data;
}
