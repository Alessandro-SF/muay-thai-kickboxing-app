import { Link } from 'react-router-dom';

export default function NotFound({ message = "We couldn't find that page." }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold">{message}</h1>
      <p className="mt-2 text-white/60">Head back and pick a workout.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn btn-secondary">Home</Link>
        <Link to="/workouts" className="btn btn-primary">Workouts</Link>
      </div>
    </div>
  );
}
