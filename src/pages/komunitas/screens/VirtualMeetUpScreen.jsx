import { Link } from "react-router-dom";
import { Video, Users, Tv } from "lucide-react";
import { meetupUpcoming, meetupPast } from "../data";
import { headerVirtualBg, headerVirtualElements, thumbAngka } from "../assets";

// /komunitas/virtual-meet-up — header pink + maskot, meet-up akan datang & sebelumnya.
export default function VirtualMeetUpScreen() {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <div
        className="relative h-28 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${headerVirtualBg})`,
          mask: "radial-gradient(120% 40px at bottom, transparent 98%, black 100%)",
        }}
      >
        <img src={headerVirtualElements} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <h1 className="relative pt-6 text-center text-xl font-extrabold text-white">Virtual Meet-Up</h1>
      </div>

      {/* Akan Datang */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2">
          <Video size={18} className="text-orange-500" />
          <h2 className="font-bold text-slate-800">Meet-up Akan Datang</h2>
        </div>

        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {meetupUpcoming.map((m) => (
            <div key={m.id} className="min-w-[85%] overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex">
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Video size={13} /> <span className="line-clamp-1">{m.speakers}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-extrabold leading-tight text-slate-800">
                    {m.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium text-slate-700">{m.date}</p>
                  <p className="text-sm text-slate-500">{m.time}</p>
                  <button className="mt-3 w-full rounded-full bg-blue-600 py-2.5 text-sm font-bold text-white">
                    Daftar
                  </button>
                </div>
                <div
                  className="relative w-24 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbAngka})` }}
                >
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">
                    <Users size={11} /> {m.attendees}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* Sebelumnya */}
      <div className="mt-4 bg-slate-100 px-5 py-5">
        <div className="flex items-center gap-2">
          <Tv size={18} className="text-orange-500" />
          <h2 className="font-bold text-slate-800">Meet-up Sebelumnya</h2>
        </div>
        <div className="mt-3 blur-[5px] pointer-events-none select-none opacity-90">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {meetupPast.map((m) => (
              <div key={m.id} className="min-w-[80%] overflow-hidden rounded-2xl bg-white shadow-sm">
                <div
                  className="relative flex h-28 items-center justify-center bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbAngka})` }}
                >
                  <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                    {m.tag}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-bold text-slate-700">{m.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{m.speakers} · {m.date}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="h-2 w-2 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Overlay CTA gabung (fake login-gate) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-1/2 flex items-end justify-center bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent pb-6">
        <div className="pointer-events-auto text-center">
          <p className="text-sm font-medium text-slate-600">
            Ayo bergabung dalam komunitas Sarang Gasing
          </p>
          <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
        </div>
      </div>
    </div>
  );
}
