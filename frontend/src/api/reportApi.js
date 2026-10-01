import client from "./client";

export async function getAccountReport(
  accountId,
  {
    startDate,
    endDate,
    transactionType = "ALL",
  },
) {
  const params = buildReportParams({
    startDate,
    endDate,
    transactionType,
  });

  const response = await client.get(
    `/reports/accounts/${accountId}`,
    { params },
  );

  return response.data;
}

export async function searchReportAccounts(search) {
  const response = await client.get(
    "/reports/accounts/search",
    {
      params: {
        search,
      },
    }
  );

  return response.data;
}

export async function getCustomerCombinedReport(
  customerId,
  options,
) {
  const response = await client.get(
    `/reports/customers/${customerId}`,
    {
      params: buildReportParams(options),
    },
  );

  return response.data;
}

function buildReportParams({
  startDate,
  endDate,
  transactionType = "ALL",
}) {
  const params = {
    start_date: startDate,
    end_date: endDate,
  };

  if (transactionType !== "ALL") {
    params.transaction_type = transactionType;
  }

  return params;
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
}

export async function downloadAccountReportPdf(
  accountId,
  {
    startDate,
    endDate,
    transactionType = "",
  },
) {
  const params = buildReportParams({
    startDate,
    endDate,
    transactionType,
  });

  const response = await client.get(
    `/reports/accounts/${accountId}/pdf`,
    {
      params,
      responseType: "blob",
    }
  );

  const filename =
    `account_report_${accountId}_${startDate}_${endDate}.pdf`;

  downloadBlob(response.data, filename);
}

export async function downloadCustomerReportPdf(
  customerId,
  {
    startDate,
    endDate,
    transactionType = "",
  },
) {
  const params = buildReportParams({
    startDate,
    endDate,
    transactionType,
  });

  const response = await client.get(
    `/reports/customers/${customerId}/pdf`,
    {
      params,
      responseType: "blob",
    }
  );

  const filename =
    `customer_report_${customerId}_${startDate}_${endDate}.pdf`;

  downloadBlob(response.data, filename);
}