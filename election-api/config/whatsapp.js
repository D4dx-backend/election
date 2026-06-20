module.exports = {
  account: process.env.WHATSAPP_ACCOUNT || "your-whatsapp-account",
  secret: process.env.WHTSP_ACCESS_TOKEN || "your-whatsapp-secret",
  apiUrl:
    process.env.WHATSAPP_API_URL || "https://api.whatsapp.com/v1/messages",
  defaultCountryCode: "91", // Default country code for India
};
