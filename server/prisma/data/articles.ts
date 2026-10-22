export interface ArticleSeed {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  season: string | null;
  readMinutes: number;
}

export const ARTICLES: ArticleSeed[] = [
  {
    slug: 'ball-bonitet-nima',
    title: 'Ball bonitet nima va u hosilga qanday ta’sir qiladi?',
    excerpt: 'Yeringizning sifat bahosini bilish — to‘g‘ri ekin tanlashning birinchi qadami.',
    category: 'Tuproq',
    season: null,
    readMinutes: 4,
    body: `Ball bonitet — yerning tabiiy unumdorligini 100 ballik shkalada baholovchi ko‘rsatkich. U tuproq turi, chirindi miqdori, sho‘rlanish darajasi, mexanik tarkib va boshqa omillar asosida aniqlanadi.

Taxminiy guruhlar:
• 70 ball va undan yuqori — yuqori sifatli yerlar
• 50–70 ball — o‘rtachadan yaxshi yerlar
• 40–50 ball — o‘rtacha yerlar
• 40 balldan past — past sifatli yerlar

Yeringizning ball bonitetini yer kadastri hujjatlaridan yoki tuman yer resurslari bo‘limidan bilib olishingiz mumkin.

Past bonitetli yerlarda talabchan ekinlar (piyoz, kartoshka, paxta) o‘rniga kam talabchan ekinlarni (no‘xat, mosh, kunjut, oshqovoq) tanlash va go‘ng, sideratlar bilan unumdorlikni oshirish tavsiya etiladi.`,
  },
  {
    slug: 'takroriy-ekinlar',
    title: 'Bug‘doydan keyin nima ekish mumkin?',
    excerpt: 'Iyun oyida bo‘shagan yerdan yana bir hosil olish yo‘llari.',
    category: 'Ekish',
    season: 'Yoz',
    readMinutes: 5,
    body: `Bug‘doy iyun oyida yig‘ib olingach, yer kuzgacha bo‘sh qolmasligi kerak. Takroriy ekinlar qo‘shimcha daromad beradi va tuproqni yaxshilaydi.

Mos ekinlar:
• Mosh — 90 kunda pishadi, tuproqni azot bilan boyitadi
• Makkajo‘xori (don yoki silos uchun)
• Loviya
• Kartoshka (iyul ekishi)
• Kunjut

Muhim: bug‘doy yig‘ilgach, imkon qadar tez (5–7 kun ichida) ekish kerak. Somonni daladan chiqarib, yerni yengil haydash yoki disklash, keyin darhol ekib sug‘orish tavsiya etiladi.`,
  },
  {
    slug: 'suvni-tejash',
    title: 'Suvni tejab sug‘orish usullari',
    excerpt: 'Suv tanqisligi sharoitida hosilni saqlab qolish uchun amaliy maslahatlar.',
    category: 'Sug‘orish',
    season: 'Yoz',
    readMinutes: 4,
    body: `Suv tanqisligi O‘zbekiston dehqonchiligining asosiy muammolaridan biri. Suvni tejash usullari:

• Tomchilatib sug‘orish — suvni 30–50 % gacha tejaydi, ayniqsa sabzavot va bog‘larda samarali
• Egatlarni bir oraladan sug‘orish
• Lazerli tekislash — suv dala bo‘ylab bir tekis tarqaladi
• Kechqurun yoki erta tongda sug‘orish — bug‘lanish kamayadi
• Mulchalash — tuproq namligini saqlaydi

Ob-havo prognozini kuzatib, yomg‘ir kutilayotgan kunlarda sug‘orishni kechiktiring. Agromaslahat shaxsiy kabinetida bu haqda avtomatik signal beradi.`,
  },
  {
    slug: 'kuzgi-shudgor',
    title: 'Kuzgi shudgor nega muhim?',
    excerpt: 'Kelgusi yil hosili kuzda boshlanadi.',
    category: 'Agrotexnika',
    season: 'Kuz',
    readMinutes: 3,
    body: `Kuzgi shudgor — kelgusi mavsum hosilining asosi. U:

• Tuproqdagi zararkunandalarning qishlovchi bosqichlarini (masalan, ko‘sak qurti g‘umbaklarini) yo‘q qiladi
• Begona o‘tlarni kamaytiradi
• Qishki yog‘in suvini tuproqda to‘playdi
• O‘g‘itlarni tuproqqa aralashtiradi

Paxta maydonlarida shudgor 30–35 sm chuqurlikda, fosforli va kaliyli o‘g‘itlarning asosiy qismi bilan birga o‘tkaziladi.`,
  },
];
