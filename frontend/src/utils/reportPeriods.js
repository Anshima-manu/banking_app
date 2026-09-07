function formatDateForInput(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function subtractMonths(date, months) {
  const result = new Date(date);

  result.setMonth(
    result.getMonth() - months
  );

  return result;
}


function subtractYears(date, years) {
  const result = new Date(date);

  result.setFullYear(
    result.getFullYear() - years
  );

  return result;
}


export const reportPeriodOptions = [
  {
    value: "LAST_MONTH",
    label: "Last Month",
  },
  {
    value: "LAST_3_MONTHS",
    label: "Last 3 Months",
  },
  {
    value: "LAST_6_MONTHS",
    label: "Last 6 Months",
  },
  {
    value: "LAST_YEAR",
    label: "Last Year",
  },
  {
    value: "CUSTOM",
    label: "Custom Range",
  },
];

export function getReportPeriodDates(period) {
  const endDate = new Date();

  let startDate;

  switch (period) {
    case "LAST_MONTH":
      startDate = subtractMonths(
        endDate,
        1
      );
      break;

    case "LAST_3_MONTHS":
      startDate = subtractMonths(
        endDate,
        3
      );
      break;

    case "LAST_6_MONTHS":
      startDate = subtractMonths(
        endDate,
        6
      );
      break;

    case "LAST_YEAR":
      startDate = subtractYears(
        endDate,
        1
      );
      break;

    default:
      return {
        startDate: "",
        endDate: "",
      };
  }

  return {
    startDate:
      formatDateForInput(startDate),

    endDate:
      formatDateForInput(endDate),
  };
}