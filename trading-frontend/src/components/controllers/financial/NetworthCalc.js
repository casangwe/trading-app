export const calculateInitialNetworth = (financialData) => {
  if (!financialData || financialData.length === 0) return 0;

  const sortedData = [...financialData].sort(
    (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
  );

  return Number(sortedData[0].networth);
};

export const calculatePreviousNetworth = (financialData) => {
  if (!financialData || financialData.length < 2)
    return calculateInitialNetworth(financialData);

  const sortedData = [...financialData].sort(
    (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
  );

  return Number(sortedData[sortedData.length - 2].networth);
};

export const calculateCurrentNetworth = (financialData) => {
  if (!financialData || financialData.length === 0) return 0;

  const sortedData = [...financialData].sort(
    (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
  );

  return Number(sortedData[sortedData.length - 1].networth);
};

export const calculateNetworthDifference = (
  previousNetworth,
  currentNetworth
) => {
  return currentNetworth - previousNetworth;
};

export const calculateNetworthPercentChange = (
  previousNetworth,
  currentNetworth
) => {
  if (previousNetworth === 0) return 0;
  return ((currentNetworth - previousNetworth) / previousNetworth) * 100;
};
