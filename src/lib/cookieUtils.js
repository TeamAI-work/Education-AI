export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const setCookie = (name, value, days = 365) => {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${d.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/`;
};

export const getDailyLettersCount = () => {
  const today = new Date().toLocaleDateString('sv-SE');
  try {
    const cookieVal = getCookie('daily_letters_done');
    if (cookieVal) {
      const parsed = JSON.parse(decodeURIComponent(cookieVal));
      if (parsed.date === today) {
        return parsed.count || 0;
      }
    }
  } catch (e) {
    console.error('Error parsing daily letters cookie:', e);
  }
  return 0;
};

export const incrementDailyLetters = (letter) => {
  const today = new Date().toLocaleDateString('sv-SE');
  let data = { date: today, count: 0, letters: [] };
  try {
    const cookieVal = getCookie('daily_letters_done');
    if (cookieVal) {
      const parsed = JSON.parse(decodeURIComponent(cookieVal));
      if (parsed.date === today) {
        data = parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing daily letters cookie for increment:', e);
  }

  if (!data.letters) {
    data.letters = [];
  }
  if (!data.letters.includes(letter)) {
    data.letters.push(letter);
  }
  data.count = (data.count || 0) + 1;
  setCookie('daily_letters_done', encodeURIComponent(JSON.stringify(data)), 365);
};
