// ALL content lives here. Components never hardcode strings, prices or paths.
// Prices in ₴, PER BARBER, taken from the current Strand booking system (Nov 2026).
// A barber missing from `prices` does not offer that service. `from: true` means "від N".
// hours: { open, close } per weekday, `null` = closed.

const day = { open: "10:00", close: "21:00" };

export const site = {
  name: "Strand",
  tagline: "Кожне пасмо має значення",
  city: "Житомир",
  address: "Велика Бердичівська, 49а, Житомир, 10008",
  addressShort: "Велика Бердичівська, 49а",
  postalCode: "10008",
  phone: "+380673112099",
  phoneDisplay: "+380 67 311 2099",
  geo: { lat: 50.2501429, lng: 28.6766117 },
  timezone: "Europe/Kyiv",
  hours: { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day },
  booking: { daysAhead: 14, slotMinutes: 60, minLeadMinutes: 60 },
  social: { instagram: null }, // TODO: client link
  images: {
    hero: "/images/hero.jpg", // 1600px wide, <= ~200 KB (webp is fine: rename file and change the path here)
    about: "/images/about.jpg",
    facade: "/images/facade.jpg",
    interior: ["/images/interior-1.jpg", "/images/interior-2.jpg", "/images/interior-3.jpg", "/images/interior-4.jpg"],
    logo: "/images/logo.svg",
    og: "/images/og.jpg" // 1200x630
  },
  seo: {
    title: "Strand Barbershop — барбершоп у Житомирі · Запис онлайн",
    description: "Чоловічі стрижки, борода та догляд у Житомирі. Велика Бердичівська, 49а. Працюємо щодня з 10:00 до 21:00. Запишіться онлайн."
  },
  amenities: ["Безкоштовний Wi-Fi", "Громадська парковка", "Кондиціонер", "Безкоштовні напої", "Кавоварка", "Підходить для дітей", "Доступно для людей з інвалідністю"],
  about: [
    "STRAND Barbershop — простір чоловічого стилю, де бездоганний сервіс поєднується з майстерністю та увагою до деталей.",
    "Назва походить від англійського strand — «пасмо волосся». Це символ професіоналізму, точності та поваги до кожної деталі: з одного пасма починається новий образ, а з майстерності барбера — впевненість у собі.",
    "Ми дбаємо про комфортну атмосферу, стерильність інструментів і професійну косметику від перевірених світових брендів. Кожен візит — це персональний підхід і консультація."
  ],
  services: [
    { id: "haircut", name: "Стрижка", durationMin: 60, description: "Класична чоловіча стрижка: верх опрацьовується ножицями, боки та потилиця — машинкою. Точність, акуратність і сучасний вигляд.",
      prices: { "oleh-dok": 900, "liubov-zainchkovska": 1000, "liliia-pavlenko": 800, "daryna-badio": 650, "roman-mykhailovskyi": 400, "dmytro-puhach": 400 } },
    { id: "scissors", name: "Стрижка ножицями", durationMin: 60, description: "Повне виконання стрижки виключно ножицями, без використання машинки.",
      prices: { "oleh-dok": 1000, "liubov-zainchkovska": 1300 } },
    { id: "clipper", name: "Коротка стрижка під насадку", durationMin: 60, description: "Стрижка машинкою з однією або кількома насадками. Для тих, хто цінує практичність, акуратність і мінімум догляду.",
      prices: { "oleh-dok": 800, "liubov-zainchkovska": 900, "liliia-pavlenko": 700, "daryna-badio": 600, "roman-mykhailovskyi": 350, "dmytro-puhach": 350 } },
    { id: "beard", name: "Стрижка бороди", durationMin: 60, description: "Моделювання бороди з урахуванням рис обличчя: розпарювання гарячими рушниками, підрівнювання довжини, гоління лезом для чітких контурів.",
      prices: { "oleh-dok": 800, "liubov-zainchkovska": 900, "liliia-pavlenko": 700, "daryna-badio": 600, "roman-mykhailovskyi": 350, "dmytro-puhach": 350 } },
    { id: "kids", name: "Дитяча стрижка", durationMin: 60, note: "Для дітей від 5 до 12 років", description: "Стильна та акуратна стрижка для наймолодших клієнтів.",
      prices: { "oleh-dok": 800, "liubov-zainchkovska": 1000, "liliia-pavlenko": 700, "daryna-badio": 600, "roman-mykhailovskyi": 350, "dmytro-puhach": 350 } },
    { id: "gray-head", name: "Камуфляж сивини голови", durationMin: 60, description: "Делікатне тонування, яке природно маскує сивину без ефекту фарбованого волосся.",
      prices: { "oleh-dok": 600, "liubov-zainchkovska": 600, "liliia-pavlenko": 600, "daryna-badio": 600 } },
    { id: "gray-beard", name: "Камуфляж сивини бороди", durationMin: 60, description: "Професійне тонування, що м'яко приховує сивину бороди.",
      prices: { "oleh-dok": 550, "liubov-zainchkovska": 550, "liliia-pavlenko": 550, "daryna-badio": 550 } },
    { id: "perm", name: "Біозавивка", durationMin: 120, from: true, note: "Обов'язкова попередня консультація", description: "Сучасна процедура зі створення природних локонів, хвиль або додаткового об'єму.",
      prices: { "liubov-zainchkovska": 3000, "liliia-pavlenko": 3000 } },
    { id: "face-care", name: "Догляд за обличчям Mr.Scrubber", durationMin: 60, description: "Комплексна процедура для очищення, зволоження та відновлення шкіри.",
      prices: { "oleh-dok": 600, "liubov-zainchkovska": 600, "liliia-pavlenko": 600, "daryna-badio": 600 } },
    { id: "scalp-care", name: "Догляд за шкірою голови Nevitaly", durationMin: 15, description: "Професійний догляд для глибокого очищення, відновлення та оздоровлення шкіри голови.",
      prices: { "oleh-dok": 350, "liubov-zainchkovska": 350, "liliia-pavlenko": 350, "daryna-badio": 350, "dmytro-puhach": 350 } },
    { id: "scalp-peeling", name: "Пілінг шкіри голови Luxina", durationMin: 15, description: "Професійна процедура глибокого очищення шкіри голови.",
      prices: { "oleh-dok": 150, "liubov-zainchkovska": 150, "liliia-pavlenko": 150, "daryna-badio": 150, "dmytro-puhach": 150 } },
    { id: "styling", name: "Укладання волосся", durationMin: 15, description: "Професійне укладання з використанням преміальних стайлінгових засобів.",
      prices: { "oleh-dok": 150, "liubov-zainchkovska": 150, "liliia-pavlenko": 150, "daryna-badio": 150 } }
  ],
  team: [
    { slug: "oleh-dok", name: "Олег Док", role: "Барбер", junior: false, rating: 5.0, instagram: null },
    { slug: "liubov-zainchkovska", name: "Люба Зайнчковська", role: "Барбер", junior: false, rating: 5.0, instagram: null },
    { slug: "liliia-pavlenko", name: "Лілія Павленко", role: "Барбер", junior: false, rating: 5.0, instagram: null },
    { slug: "daryna-badio", name: "Дарина Бадьо", role: "Барбер", junior: false, rating: 5.0, instagram: null },
    { slug: "roman-mykhailovskyi", name: "Роман Михайловський", role: "Молодший барбер", junior: true, rating: null, instagram: null },
    { slug: "dmytro-puhach", name: "Дмитро Пугач", role: "Молодший барбер", junior: true, rating: null, instagram: null }
  ],
  works: [], // TODO: [{ src: "/images/works/work-01.jpg", alt: "Чоловіча стрижка, Strand" }]
  reviews: [
    { name: "Анонімно", date: "2026-09-05", text: "Дуже атмосферно і професійно" },
    { name: "Сергій", date: "2026-08-23", text: "Майстер свого діла" }
  ],
  rating: { value: 5.0, count: 5 },

  // ---- UI copy (every visible string that is not business data) ----
  // Need a new string later? Add it here first, then use it in the component.
  ui: {
    nav: [
      { id: "about", label: "Про нас" },
      { id: "team", label: "Команда" },
      { id: "services", label: "Послуги" },
      { id: "works", label: "Роботи" },
      { id: "reviews", label: "Відгуки" },
      { id: "contacts", label: "Контакти" }
    ],
    cta: {
      book: "Записатись",
      call: "Подзвонити",
      route: "Маршрут",
      bookWithBarber: "Записатись до майстра",
      moreWorks: "Більше робіт в Instagram",
      menu: "Меню",
      close: "Закрити"
    },
    status: { open: "Зараз відчинено", closed: "Зараз зачинено" },
    hero: { subline: "Барбершоп у Житомирі" }, // component appends " · " + site.addressShort
    sections: { about: "Про нас", services: "Послуги", team: "Команда", works: "Роботи", reviews: "Відгуки", booking: "Запис онлайн", contacts: "Контакти" },
    services: { priceNote: "Ціна залежить від майстра", from: "від", duration: "Тривалість", price: "Ціна" },
    units: { min: "хв", hour: "год", currency: "₴" },
    team: { prices: "Ціни майстра", rating: "Рейтинг" },
    works: { prev: "Попереднє фото", next: "Наступне фото" },
    brand: { sub: "Barbershop" },
    reviews: { verified: ["перевірений відгук", "перевірені відгуки", "перевірених відгуків"] },
    contacts: {
      address: "Адреса",
      phone: "Телефон",
      hours: "Графік роботи",
      today: "Сьогодні",
      closed: "Вихідний",
      days: { mon: "Понеділок", tue: "Вівторок", wed: "Середа", thu: "Четвер", fri: "П'ятниця", sat: "Субота", sun: "Неділя" }
    },
    form: {
      title: "Запис онлайн",
      subtitle: "Залиште заявку — ми зателефонуємо для підтвердження",
      fields: { name: "Ім'я", phone: "Телефон", barber: "Майстер", service: "Послуга", date: "Дата", time: "Час", comment: "Коментар (необов'язково)" },
      placeholders: { name: "Ваше ім'я", phone: "+380 XX XXX XX XX", service: "Оберіть послугу", comment: "Побажання до стрижки" },
      anyBarber: "Будь-який майстер",
      priceLabel: "Вартість",
      submit: "Записатись",
      sending: "Надсилаємо…",
      consent: "Натискаючи «Записатись», ви погоджуєтесь на обробку персональних даних для запису.",
      serviceReset: "Цей майстер не виконує обрану послугу — оберіть іншу.",
      errors: {
        nameRequired: "Вкажіть ім'я",
        nameShort: "Ім'я має містити щонайменше 2 літери",
        phoneRequired: "Вкажіть номер телефону",
        phoneInvalid: "Введіть номер у форматі +380 XX XXX XX XX",
        barberRequired: "Оберіть майстра",
        serviceRequired: "Оберіть послугу",
        dateRequired: "Оберіть дату",
        timeRequired: "Оберіть час"
      },
      slots: {
        loading: "Перевіряємо вільний час…",
        pickService: "Оберіть майстра та послугу, щоб побачити вільний час",
        none: "На цей день вільного часу немає — оберіть іншу дату або майстра.",
        taken: "Цей час щойно зайняли. Список оновлено — оберіть інший.",
        loadFailed: "Не вдалося перевірити вільний час. Ви можете надіслати заявку — ми підтвердимо її по телефону."
      },
      success: "Дякуємо! Ми зателефонуємо для підтвердження",
      errorText: "Не вдалося надіслати заявку. Зателефонуйте нам:"
    }
  }
};
