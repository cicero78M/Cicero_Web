export const normalizeFormattedNumber = (raw) => {
  if (typeof raw !== "string") {
    return raw;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return trimmed;
  }

  const sign = trimmed.startsWith("-") ? "-" : "";
  const numericPortion = trimmed.replace(/[^0-9.,-]/g, "");
  const digitsOnly = numericPortion.replace(/[^0-9.,]/g, "");

  if (!digitsOnly) {
    const direct = Number(trimmed);
    if (Number.isFinite(direct)) {
      return direct;
    }
    return trimmed;
  }

  const thousandStyleDot = /^-?\d{1,3}(\.\d{3})+$/;
  const thousandStyleComma = /^-?\d{1,3}(,\d{3})+$/;

  const lastComma = digitsOnly.lastIndexOf(",");
  const lastDot = digitsOnly.lastIndexOf(".");
  let decimalSeparator = null;

  if (lastComma !== -1 && lastDot !== -1) {
    decimalSeparator = lastComma > lastDot ? "," : ".";
  } else if (lastComma !== -1) {
    if (!thousandStyleComma.test(digitsOnly)) {
      decimalSeparator = ",";
    }
  } else if (lastDot !== -1) {
    if (!thousandStyleDot.test(digitsOnly)) {
      decimalSeparator = ".";
    }
  }

  let integerPart = digitsOnly;
  let fractionalPart = "";

  if (decimalSeparator) {
    const segments = digitsOnly.split(decimalSeparator);
    integerPart = segments.shift() ?? "";
    fractionalPart = segments.join("");
  }

  integerPart = integerPart.replace(/[.,]/g, "");
  fractionalPart = fractionalPart.replace(/[.,]/g, "");

  if (!integerPart) {
    integerPart = "0";
  }

  const normalized = sign + integerPart + (fractionalPart ? `.${fractionalPart}` : "");
  return normalized;
};

export const normalizeNumericInput = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = normalizeFormattedNumber(value);
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const normalized = normalizeFormattedNumber(value);
  const coerced = Number(normalized);
  return Number.isFinite(coerced) ? coerced : 0;
};

export const calculateRatePerDay = (total, days, options = {}) => {
  const numericTotal = normalizeNumericInput(total);
  const numericDays = normalizeNumericInput(days);

  if (!Number.isFinite(numericTotal) || numericTotal === 0) {
    return 0;
  }

  if (!Number.isFinite(numericDays) || numericDays <= 0) {
    return 0;
  }

  const rate = numericTotal / numericDays;

  if (typeof options.precision === "number" && Number.isFinite(options.precision)) {
    const precision = Math.max(0, Math.floor(options.precision));
    const factor = 10 ** precision;
    return Math.round(rate * factor) / factor;
  }

  return rate;
};

export default normalizeNumericInput;
