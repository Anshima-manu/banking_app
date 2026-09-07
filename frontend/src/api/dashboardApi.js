import client from "./client";


export async function getDashboardSummary() {
  const response = await client.get(
    "/dashboard/summary"
  );

  return response.data;
}