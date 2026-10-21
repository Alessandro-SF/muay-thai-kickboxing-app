import { Hand, Zap, GraduationCap, Target, Ghost, Footprints, Swords, Shield, HeartPulse, Trophy, Dumbbell } from 'lucide-react';

const ICONS = { Hand, Zap, GraduationCap, Target, Ghost, Footprints, Swords, Shield, HeartPulse, Trophy };

export default function CategoryIcon({ name, ...props }) {
  const Icon = ICONS[name] || Dumbbell;
  return <Icon {...props} />;
}
