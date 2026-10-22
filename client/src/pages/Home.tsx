import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Bot, Camera, ClipboardList, Sprout, Wheat } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const HeroScene = lazy(() => import('../components/HeroScene'));

const FEATURES = [
  { to: '/maslahat', icon: Sprout, title: 'AI agro maslahat', text: 'Maydon, ball bonitet, suv va hududni kiriting — qaysi ekin mosligini bilib oling.' },
  { to: '/ekinlar', icon: Wheat, title: 'Ekinlar qo‘llanmasi', text: 'Gektaridan hosil, ekish va sug‘orish muddatlari, o‘g‘it me’yorlari, agrotadbirlar.' },
  { to: '/narxlar', icon: BarChart3, title: 'Bozor narxlari', text: 'Toshkent, Guliston, Nukus va boshqa bozorlardagi bugungi narxlar.' },
  { to: '/kasalliklar/tashxis', icon: Camera, title: 'Rasm orqali tashxis', text: 'Barg rasmini yuklang — AI kasallikni aniqlab, nima qilishni aytadi.' },
  { to: '/kabinet', icon: ClipboardList, title: 'Shaxsiy kabinet', text: 'AI signallari, xarajat va hosil hisobi, mavsum yakunida sof foyda.' },
  { to: '/agroai', icon: Bot, title: 'AgroAI suhbat', text: 'Istalgan agronomik savolga o‘zbek tilida javob oling.' },
];

const STEPS = [
  ['1', 'Yeringizni kiriting', 'Viloyat, tuman, gektar, ball bonitet va suv bilan ta’minlanganlik.'],
  ['2', 'Tavsiya oling', 'Tizim mos ekinlarni baholaydi, AI esa izoh va maslahat beradi.'],
  ['3', 'Kabinetda kuzating', 'Ekkan ekiningizni qo‘shing — sug‘orish, o‘g‘itlash va himoya bo‘yicha signallar keladi.'],
  ['4', 'Natijani hisoblang', 'Xarajat va hosilni yozib boring, mavsum oxirida sof foydani ko‘ring.'],
];

export function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-forest-950 to-forest-900 text-cream">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-90 sm:h-[70%]">
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-56 sm:pt-24 sm:pb-72">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-4 text-xs font-bold tracking-[0.2em] text-wheat uppercase">agromaslahat.uz · agromaslahat.ai</p>
            <h1 className="max-w-3xl text-4xl leading-[1.05] font-bold sm:text-6xl">Yeringizga nima ekishni sun’iy intellekt aytadi</h1>
            <p className="mt-5 max-w-xl text-lg text-forest-100">O‘zbekiston fermerlari uchun agro maslahat platformasi: ekin tanlash, parvarish signallari, kasallik tashxisi va mavsum hisoboti — bir joyda.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/maslahat" className="inline-flex items-center gap-2 rounded-xl bg-wheat px-5 py-3 font-semibold text-ink hover:brightness-95">
                Maslahat olish <ArrowRight className="size-4" />
              </Link>
              <Link to={user ? '/kabinet' : '/royxatdan-otish'} className="rounded-xl border border-forest-100/40 px-5 py-3 font-semibold text-cream hover:bg-forest-800">
                {user ? 'Kabinetga o‘tish' : 'Bepul ro‘yxatdan o‘tish'}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="mb-2 text-xs font-bold tracking-[0.18em] text-wheat-dark uppercase">Platforma bo‘limlari</p>
        <h2 className="mb-8 text-3xl font-bold">Fermerga kerak bo‘lgan hamma narsa</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.to} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={f.to} className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-paper p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                <span className="grid size-12 place-items-center rounded-xl bg-forest-100 text-forest-700">
                  <f.icon className="size-6" />
                </span>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="text-muted">{f.text}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-forest-700">
                  Ochish <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-forest-100">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-3xl font-bold">Qanday ishlaydi?</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="rounded-2xl bg-paper p-6">
                <p className="font-display text-4xl font-bold text-forest-700">{n}</p>
                <h3 className="mt-3 text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
