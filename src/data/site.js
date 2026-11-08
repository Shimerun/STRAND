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
  booking: {
    daysAhead: 30, slotMinutes: 60, minLeadMinutes: 60, // must match DAYS_AHEAD, SLOT_MIN, MIN_LEAD_MIN in Code.gs
    maxBlocks: 4, // longest visit in slots; must match MAX_BLOCKS in integrations/google-sheets/Code.gs
    // Services offered as extras to the main one in the booking form (ids from `services`, in display order).
    addons: ["scalp-peeling", "face-care", "gray-beard", "gray-head", "kids", "beard"]
  },
  social: { instagram: "https://www.instagram.com/strand_barbershop/" },
  images: {
    hero: "/images/hero.webp", // TODO: 680px wide now; a 1600px-wide photo (<= ~200 KB) looks sharp on desktop
    about: "/images/about.webp",
    facade: "/images/facade.webp",
    interior: ["/images/interior-1.webp", "/images/interior-2.webp", "/images/interior-3.webp", "/images/interior-4.webp"],
    logo: null, // TODO: a transparent SVG/PNG; LOGO.webp is an opaque square, so the text wordmark stays
    og: "/images/hero.webp", // TODO: a 1200x630 JPG previews best in messengers and Facebook
    // Booking form thumbnails by service id: per barber slug and/or `all`.
    // A barber without an own photo gets `all`, then another barber's photo of the same service.
    services: {
      haircut: {
        "oleh-dok": "/images/services/haircut-oleh-dok.webp", "liubov-zainchkovska": "/images/services/haircut-liubov-zainchkovska.webp",
        "liliia-pavlenko": "/images/services/haircut-liliia-pavlenko.webp", "daryna-badio": "/images/services/haircut-daryna-badio.webp"
      },
      scissors: { "oleh-dok": "/images/services/scissors-oleh-dok.webp", "liubov-zainchkovska": "/images/services/scissors-liubov-zainchkovska.webp" },
      clipper: {
        "oleh-dok": "/images/services/clipper-oleh-dok.webp", "liubov-zainchkovska": "/images/services/clipper-liubov-zainchkovska.webp",
        "daryna-badio": "/images/services/clipper-daryna-badio.webp"
      },
      beard: {
        all: "/images/services/beard.webp",
        "oleh-dok": "/images/services/beard-oleh-dok.webp", "liubov-zainchkovska": "/images/services/beard-liubov-zainchkovska.webp",
        "liliia-pavlenko": "/images/services/beard-liliia-pavlenko.webp", "daryna-badio": "/images/services/beard-daryna-badio.webp"
      },
      kids: {
        all: "/images/services/kids.webp",
        "oleh-dok": "/images/services/kids-oleh-dok.webp", "liubov-zainchkovska": "/images/services/kids-liubov-zainchkovska.webp",
        "daryna-badio": "/images/services/kids-daryna-badio.webp"
      },
      "gray-head": { all: "/images/services/gray-head.webp" },
      "gray-beard": { all: "/images/services/gray-beard.webp" },
      perm: { all: "/images/services/perm.webp" },
      "face-care": { all: "/images/services/face-care.webp" },
      "scalp-peeling": { all: "/images/services/scalp-peeling.webp" },
      styling: { all: "/images/services/styling.webp" }
      // TODO: "scalp-care" (Nevitaly) has no photo yet
    },
    favicon: "/images/logo.webp"
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
    { slug: "oleh-dok", name: "Олег Док", role: "Барбер", junior: false, rating: 5.0, instagram: "https://www.instagram.com/olegdok_/" },
    { slug: "liubov-zainchkovska", name: "Люба Зайнчковська", role: "Барбер", junior: false, rating: 5.0, instagram: "https://www.instagram.com/luybka_barber/" },
    { slug: "liliia-pavlenko", name: "Лілія Павленко", role: "Барбер", junior: false, rating: 5.0, instagram: "https://www.instagram.com/pavlenko_lilya_/" },
    { slug: "daryna-badio", name: "Дарина Бадьо", role: "Барбер", junior: false, rating: 5.0, instagram: "https://www.instagram.com/darina.bado/" },
    { slug: "roman-mykhailovskyi", name: "Роман Михайловський", role: "Молодший барбер", junior: true, rating: null, instagram: "https://www.instagram.com/rmn_mkhlvski/" },
    { slug: "dmytro-puhach", name: "Дмитро Пугач", role: "Молодший барбер", junior: true, rating: null, instagram: "https://www.instagram.com/puhach.dm/" }
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
    alt: { hero: "Барбершоп Strand у Житомирі", about: "Майстер Strand за роботою" }, // barber photos use the barber's name
    sections: { about: "Про нас", services: "Послуги", team: "Команда", works: "Роботи", reviews: "Відгуки", booking: "Запис онлайн", contacts: "Контакти" },
    services: { priceNote: "Ціна залежить від майстра", from: "від", duration: "Тривалість", price: "Ціна" },
    units: { min: "хв", hour: "год", currency: "₴" },
    team: { prices: "Ціни майстра", rating: "Рейтинг" },
    works: { prev: "Попереднє фото", next: "Наступне фото" },
    brand: { sub: "Barbershop" },
    reviews: {
      verified: ["перевірений відгук", "перевірені відгуки", "перевірених відгуків"],
      count: ["відгук", "відгуки", "відгуків"],
      onGoogle: "у Google",
      googleMaps: "Google Maps", // Google's attribution: keep as is, never translate
      order: "Відгуки з Google Maps, впорядковані за релевантністю. Google не перевіряє відгуки, але видаляє неправдиві.",
      open: "Відкрити в Google Maps",
      translated: "Перекладено Google",
      ratingOf: "Оцінка"
    },
    contacts: {
      address: "Адреса",
      phone: "Телефон",
      hours: "Графік роботи",
      today: "Сьогодні",
      map: "Strand на карті Google",
      closed: "Вихідний",
      days: { mon: "Понеділок", tue: "Вівторок", wed: "Середа", thu: "Четвер", fri: "П'ятниця", sat: "Субота", sun: "Неділя" }
    },
    form: {
      title: "Запис онлайн",
      subtitle: "Залиште заявку — ми зателефонуємо для підтвердження",
      fields: { name: "Ім'я", phone: "Телефон", barber: "Майстер", service: "Послуга", addons: "Додаткові послуги", date: "Дата", time: "Час", comment: "Коментар (необов'язково)" },
      addonsFull: "Решта послуг не вміщається в один запис — напишіть про них у коментарі.",
      addonsAdd: "+ Додати послугу",
      addonsHide: "Згорнути",
      addonsChosen: "Обрано:",
      steps: { choice: "Майстер і послуга", when: "Дата і час", contacts: "Ваші контакти" },
      calendar: { prev: "Попередній місяць", next: "Наступний місяць" },
      summary: { title: "Ваш запис", barber: "Майстер", services: "Послуги", when: "Дата і час", duration: "Тривалість", total: "Разом", empty: "—" },
      ticket: { title: "Ваш талон", stub: "Контроль" },
      placeholders: { name: "Ваше ім'я", phone: "+380 XX XXX XX XX", barber: "Оберіть майстра", service: "Оберіть послугу", comment: "Побажання до стрижки" },
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
