import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Empty title="Sahifa topilmadi" icon={<span className="text-5xl">🌾</span>}>
        <p>Bunday sahifa yo‘q yoki ko‘chirilgan.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-forest-700 underline">
          Bosh sahifaga qaytish
        </Link>
      </Empty>
    </div>
  );
}
