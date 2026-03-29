export const toBenNum = (num: number | string): string => {
  const benDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => benDigits[parseInt(d)]);
};

export const toEngNum = (str: string): string => {
  const benDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (d) => benDigits.indexOf(d).toString());
};
