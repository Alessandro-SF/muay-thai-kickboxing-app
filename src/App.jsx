import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Workouts from './pages/Workouts';
import WorkoutDetail from './pages/WorkoutDetail';
import Player from './pages/Player';
import QuickTraining from './pages/QuickTraining';
import AICoach from './pages/AICoach';
import NotFound from './pages/NotFound';

// The progress dashboard pulls in the charting library, so load it on demand.
const Progress = lazy(() => import('./pages/Progress'));

function Loading() {
  return <div className="container-page py-24 text-center text-white/50">Loading…</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/play/:id" element={<Player />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="workouts/:id" element={<WorkoutDetail />} />
        <Route path="quick" element={<QuickTraining />} />
        <Route path="ai-coach" element={<AICoach />} />
        <Route
          path="progress"
          element={
            <Suspense fallback={<Loading />}>
              <Progress />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
