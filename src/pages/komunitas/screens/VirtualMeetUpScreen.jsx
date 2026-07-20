import { useRef } from "react";
import { Link } from "react-router-dom";
import { Video, Users, Tv, ChevronLeft, ChevronRight } from "lucide-react";
import { meetupPast } from "../data";
import { headerVirtualBg, headerVirtualElements } from "../assets";
import thumbMeetup1 from "@/assets/guest/thumbnail/virtual-meetup-1.png";
import thumbMeetup2 from "@/assets/guest/thumbnail/virtual-meetup-2.png";
import thumbAngka from "@/assets/guest/thumbnail/angka-warna-warni.png";


// object desktop card — cocokin sama desain gambar (speakers + Clara Meidianan, badge 99+)
const meetupUpcoming = [
  {
    id: 1,
    image: thumbMeetup1,
    speakers: "John Huawei, Billeyeber, Ibnu Sina, Clara Meidianan, dkk",
    title: "Pengenalan Schwarzschild Radius",
    date: "21 Maret 2026",
    time: "17:00 - 18:00 WIB",
    attendees: "99+",
  },
  {
    id: 2,
    image: thumbMeetup2,
    speakers: "Siti Aisyah, dkk",
    title: "Strategi Mengajar Perkalian Cepat",
    date: "28 Maret 2026",
    time: "19:00 - 20:00 WIB",
    attendees: "42",
  },
];

// /komunitas/virtual-meet-up — header pink + maskot, meet-up akan datang & sebelumnya.
export default function VirtualMeetUpScreen() {
  const upcomingRef = useRef(null);
  const scroll = (dir) =>
    upcomingRef.current?.scrollBy({ left: dir * upcomingRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative flex flex-col h-screen overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible">
      <div
        className="relative h-28 min-h-[120px] overflow-hidden bg-cover bg-center lg:h-40 lg:rounded-3xl"
        style={{
          backgroundImage: `url(${headerVirtualBg})`,
          mask: "radial-gradient(120% 40px at bottom, transparent 98%, black 100%)",
        }}
      >
        <img src={headerVirtualElements} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <h1 className="relative pt-6 text-center text-xl font-extrabold text-white">Virtual Meet-Up</h1>
      </div>

      {/* ===== Mobile: Terkunci ===== */}
      <div className="lg:hidden relative">
        <div style={{ "--blur-start": "400px" }} className="blur-effect-mobile pb-20">
          {/* Akan Datang */}
          <div className="px-5 pt-5">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-orange-500" />
              <h2 className="font-bold text-slate-800">Meet-up Akan Datang</h2>
            </div>

            <div className="relative">
              <div
                className="mt-3 flex gap-3 overflow-x-auto pb-2"
              >
              {meetupUpcoming.map((m) => (
                <div key={m.id} className="w-[330px] h-[300px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
                  <img src={m.image} alt={m.title} className="h-full w-full object-cover" />
                </div>
              ))}
              </div>
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
            <div className="mt-3">
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
        </div>


        {/* Overlay CTA gabung */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex h-40 max-w-[480px] items-end justify-center bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pb-24">
          <div className="pointer-events-auto text-center">
            <p className="text-sm font-medium text-slate-600">
              Ayo bergabung dalam komunitas Sarang Gasing
            </p>
            <Link to="/register" className="text-sm font-bold text-[#0033EC]">
              Daftar
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Desktop: Tetap ===== */}
      <div className="hidden lg:block lg:-mx-6">
        {/* Akan Datang */}
        <div className="blur-effect-desktop">
          <div className="px-5 pt-5 lg:px-6">
            <div className="flex items-center gap-2">
              <Video size={18} className="text-orange-500" />
              <h2 className="font-bold text-slate-800">Meet-up Akan Datang</h2>
            </div>

            {/* Carousel + panah prev/next (panah tampil di desktop) */}
            <div className="relative">
              <button
                onClick={() => scroll(-1)}
                aria-label="Sebelumnya"
                className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-md hover:text-slate-800 lg:flex"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll(1)}
                aria-label="Berikutnya"
                className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-md hover:text-slate-800 lg:flex"
              >
                <ChevronRight size={20} />
              </button>

              <div
                ref={upcomingRef}
                className="mt-3 flex gap-3 overflow-x-auto pb-2 lg:gap-4 lg:scroll-smooth"
              >
              {meetupUpcoming.map((m) => (
                <div key={m.id} className="relative w-[330px] h-[300px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm lg:w-[866px] lg:h-[360px] lg:rounded-3xl">
                  <img src={m.image} alt={m.title} className="h-full w-full object-cover" />
                </div>
              ))}
              </div>
            </div>

            <div className="mt-2 flex justify-center gap-1.5 lg:hidden">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
            </div>
          </div>
        </div>

        {/* Sebelumnya */}
        <div className="mt-4 bg-slate-100 px-5 py-5 lg:px-6">
          <div className="flex items-center gap-2">
            <Tv size={18} className="text-orange-500" />
            <h2 className="font-bold text-slate-800">Meet-up Sebelumnya</h2>
          </div>
          <div className="blur-effect-desktop mt-3 opacity-90">
            <div className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible">
              {meetupPast.map((m) => (
                <div key={m.id} className="min-w-[80%] overflow-hidden rounded-2xl bg-white shadow-sm lg:min-w-0">
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
      </div>

      {/* Modal Daftar - melayang di tengah bawah */}
      <div className="hidden lg:block fixed bottom-8 left-1/2 z-40 w-11/12 max-w-sm -translate-x-1/2 rounded-2xl bg-white px-10 py-5 text-center shadow-2xl ring-1 ring-slate-200">
        <p className="text-sm font-medium text-slate-600">Ayo bergabung dalam komunitas Sarang Gasing</p>
        <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
      </div>
    </div>
  );
}
