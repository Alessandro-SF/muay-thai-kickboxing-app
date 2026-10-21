import { Link } from 'react-router-dom';
import { Headphones, Smartphone, Volume2, MessageSquare, Bluetooth, ShieldCheck, Clock, Dumbbell, Info, Play } from 'lucide-react';
import { PhonePanel } from '../components/CallCoach';
import { COACH } from '../config';

const STEPS = [
  { icon: Dumbbell, title: 'Gear up', text: 'Wrap your hands, clear some space, and grab gloves or a bag if you have them.' },
  { icon: Smartphone, title: 'Call Thai Coach', text: `Dial ${COACH.phoneDisplay}. On your phone, just tap the call button.` },
  { icon: MessageSquare, title: 'Tell the coach your goals', text: 'Mention your experience, your stance and what you want to train today.' },
  { icon: Headphones, title: 'Train in real time', text: 'Follow the combinations and guidance as your AI coach talks you through the session.' },
];

const IDEAS = [
  '"I\'m a beginner — can you teach me a basic Muay Thai stance?"',
  '"Give me three rounds of kickboxing combinations."',
  '"I have a heavy bag. Let\'s work on body kicks."',
  '"Push me through a conditioning round."',
];

const TIPS = [
  { icon: Volume2, text: 'Use speakerphone or earbuds so your hands stay free.' },
  { icon: Bluetooth, text: 'Bluetooth earbuds or a speaker make the coach easier to hear over the bag.' },
  { icon: Clock, text: 'Speak clearly and pause briefly so the coach can respond.' },
  { icon: ShieldCheck, text: 'Warm up first and train within your limits.' },
];

export default function AICoach() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" />
        <div className="container-page relative grid gap-10 py-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="eyebrow">{COACH.name}</p>
            <h1 className="heading-xl mt-4">
              Your Personal Muay Thai Coach. <span className="text-gradient">One Call Away.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Experience real-time Muay Thai and Kickboxing training with your own AI-powered coach. Get combinations, guidance, and personalized practice
              whenever you're ready to train.
            </p>
          </div>
          <div className="animate-pop">
            <PhonePanel />
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <p className="eyebrow">How it works</p>
        <h2 className="heading-lg mt-2">Train with your AI coach</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="flex items-center justify-between">
                <s.icon className="h-6 w-6 text-brand-400" aria-hidden="true" />
                <span className="font-display text-3xl font-bold text-white/10">0{i + 1}</span>
              </div>
              <p className="mt-4 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-white/60">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page grid gap-5 py-10 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-display text-xl font-bold tracking-wide uppercase">Ideas for your call</h3>
          <p className="mt-1 text-sm text-white/55">Not sure what to say? Try starting with something like:</p>
          <ul className="mt-4 grid gap-2">
            {IDEAS.map((idea) => (
              <li key={idea} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/80">{idea}</li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h3 className="font-display text-xl font-bold tracking-wide uppercase">Tips for a great session</h3>
          <ul className="mt-4 grid gap-3">
            {TIPS.map((tip) => (
              <li key={tip.text} className="flex gap-3 text-sm text-white/75">
                <tip.icon className="mt-0.5 h-5 w-5 shrink-0 text-flame-400" aria-hidden="true" />
                {tip.text}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs leading-relaxed text-white/55">
            <p className="flex items-center gap-2 font-semibold text-white/75"><Info className="h-4 w-4" aria-hidden="true" /> Good to know</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>The coach is a phone service. Standard carrier calling rates and service restrictions may apply.</li>
              <li>You are talking with an AI, not a human trainer. It is not a substitute for a qualified instructor or medical advice.</li>
              <li>The call happens in your phone app — this website does not record or connect to your call.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Prefer to train without a call?</p>
            <p className="text-sm text-white/60">Follow a guided workout with spoken combinations and a round timer.</p>
          </div>
          <Link to="/workouts" className="btn btn-secondary shrink-0"><Play className="h-4 w-4" aria-hidden="true" /> Guided workouts</Link>
        </div>
      </section>
    </div>
  );
}
