import { router } from "expo-router";

const generateRandomString = (length = 15) => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const isNullOrEmpty = (value) => value === undefined || value === "" || value === null || Number.isNaN(value);

const getFileExtension = (fileName) => fileName?.substr(fileName?.lastIndexOf(".") + 1)?.toLowerCase();

const isImageExtension = (extension) => ["jpg", "jpeg", "png"].includes(extension?.toLowerCase());

const isJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
};

const truncateToTwoDecimals = (num) => {
  return Math.floor(num * 100) / 100;
};

const formatPhoneNumber = (value) => {
  if (!value || value === "(___) ___ __ __") return "";

  // Giriş değerinden tüm rakam dışındaki karakterleri kaldır
  const phoneNumber = value.replace(/[^\d]/g, "");

  // Telefon numarasının uzunluğunu kontrol etmek için
  const phoneNumberLength = phoneNumber.length;

  // Telefon numarasının uzunluğuna göre biçimlendirme yap
  if (phoneNumberLength < 4) {
    return phoneNumber;
  } else if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else if (phoneNumberLength < 9) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 8)} ${phoneNumber.slice(8)}`;
  }
};

const putMoneyDot = (value) => {
  if (isNullOrEmpty(value)) return value;
  return value?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// İsim soyisim baş harflerini alan fonksiyon
const getInitials = (nameSurname) => {
  if (!nameSurname) return "";

  const trimmedName = nameSurname.trim();
  const nameParts = trimmedName.split(/\s+/).filter((part) => part.length > 0);

  if (nameParts.length === 1) {
    // Tek kelime ise sadece ilk harf
    return nameParts[0][0]?.toUpperCase() || "";
  } else if (nameParts.length >= 2) {
    // Birden fazla kelime ise ilk iki kelimenin ilk harfleri
    const firstInitial = nameParts[0][0]?.toUpperCase() || "";
    const secondInitial = nameParts[1][0]?.toUpperCase() || "";
    return firstInitial + secondInitial;
  }

  return "";
};

const regex = /\B(?=(\d{3})+(?!\d))/g;
const getPriceFormat = (value) => {
  // string çevirme ve null durumunu ele alma
  const stringValue = String(value);
  if (!stringValue || stringValue === "null") {
    return "0";
  }
  if (!stringValue.includes(".")) {
    const formattedIntegerPart = stringValue.replace(regex, ".");
    return `${formattedIntegerPart}`;
  }
  // decimal kısmı gelmeme durumunda
  const [integerPart, decimalPart] = stringValue?.replace(".", ",")?.split(",");
  const formattedIntegerPart = integerPart.replace(regex, ".");

  if (decimalPart === "00") {
    const full = `${formattedIntegerPart}`;
    return full;
  }
  if (decimalPart.length === 1) {
    const full = `${formattedIntegerPart},${decimalPart}0`;
    return full;
  }
  if (decimalPart.length >= 2) {
    const distance = decimalPart.slice(0, 2);
    const full = `${formattedIntegerPart},${distance}`;
    return full;
  }
  const full = `${formattedIntegerPart},${decimalPart}`;
  return full;
};

export default {
  generateRandomString,
  isNullOrEmpty,
  getFileExtension,
  isJSON,
  truncateToTwoDecimals,
  formatPhoneNumber,
  isImageExtension,
  putMoneyDot,
  getInitials,
  getPriceFormat,
};
