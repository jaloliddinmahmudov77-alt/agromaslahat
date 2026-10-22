import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui';
import { Home } from './pages/Home';

const Advice = lazy(() => import('./pages/Advice'));
const Crops = lazy(() => import('./pages/Crops'));
const CropDetail = lazy(() => import('./pages/CropDetail'));
const Diseases = lazy(() => import('./pages/Diseases'));
const DiseaseDetail = lazy(() => import('./pages/DiseaseDetail'));
const Diagnose = lazy(() => import('./pages/Diagnose'));
const Prices = lazy(() => import('./pages/Prices'));
const AgroAI = lazy(() => import('./pages/AgroAI'));
const Articles = lazy(() => import('./pages/Articles'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Cabinet = lazy(() => import('./farm/Cabinet'));
const PlantingDetail = lazy(() => import('./farm/PlantingDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

export function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="maslahat" element={<Advice />} />
          <Route path="ekinlar" element={<Crops />} />
          <Route path="ekinlar/:slug" element={<CropDetail />} />
          <Route path="kasalliklar" element={<Diseases />} />
          <Route path="kasalliklar/tashxis" element={<Diagnose />} />
          <Route path="kasalliklar/:slug" element={<DiseaseDetail />} />
          <Route path="narxlar" element={<Prices />} />
          <Route path="agroai" element={<AgroAI />} />
          <Route path="maqolalar" element={<Articles />} />
          <Route path="maqolalar/:slug" element={<ArticleDetail />} />
          <Route path="kirish" element={<Login />} />
          <Route path="royxatdan-otish" element={<Register />} />
          <Route path="kabinet" element={<Cabinet />} />
          <Route path="kabinet/ekin/:id" element={<PlantingDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
