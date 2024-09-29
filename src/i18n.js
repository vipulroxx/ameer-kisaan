// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Language resources
const resources = {
  en: {
    translation: {
      "welcome": "Welcome to the Farming App",
      "selectCrop": "Select Crop",
      "weather": "Weather Updates"
    }
  },
  hi: {
    translation: {
      "welcome": "कृषि ऐप में आपका स्वागत है",
      "selectCrop": "फसल का चयन करें",
      "weather": "मौसम अपडेट"
    }
  },
  ta: {
    translation: {
      "welcome": "விவசாய பயன்பாட்டிற்கு வரவேற்கிறோம்",
      "selectCrop": "பயிர்களைத் தேர்ந்தெடு",
      "weather": "வானிலை மேம்படுத்தல்கள்"
    }
  }
};

i18n
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
