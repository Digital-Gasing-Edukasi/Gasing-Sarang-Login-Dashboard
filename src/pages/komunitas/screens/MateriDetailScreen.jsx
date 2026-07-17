import { useParams, Link } from "react-router-dom";
import { ChevronRight, Book } from "lucide-react";
import { materiList } from "../data";
import { charBlue } from "../assets";

export default function MateriDetailScreen() {
  const { slug } = useParams();
  const materi = materiList.find((m) => m.slug === slug) || materiList[0];

  // Dynamic text based on slug
  const subjectName = slug === "penjumlahan" ? "penjumlahan" 
                    : slug === "pengurangan" ? "pengurangan"
                    : slug === "pembagian" ? "pembagian"
                    : "perkalian";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 px-5 pt-6 pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm font-medium text-blue-600">
          <Link to="/komunitas/materi-gasing">Materi Gasing</Link>
          <ChevronRight size={14} className="mx-1" />
        </div>

        {/* Date */}
        <p className="mt-4 text-xs font-bold italic text-slate-800">Feb 23, 2026</p>

        {/* Title */}
        <h1 className="mt-3 text-3xl font-extrabold text-slate-800">{materi.title}</h1>

        {/* Author */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-cyan-100">
            <img src={charBlue} alt="Admin" className="h-10 w-10 object-cover" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Admin GASING</h2>
            <p className="flex items-center gap-1 text-sm font-bold text-blue-600">
              <Book size={14} /> Guru
            </p>
          </div>
        </div>

        {/* Banner */}
        <div className="mt-6 flex justify-center rounded-xl bg-slate-50 px-2 py-6">
          <img src={materi.element} alt={materi.title} className="h-32 w-auto object-contain" />
        </div>

        {/* Content */}
        <div className="mt-6 text-[15px] leading-relaxed text-slate-700">
          <p>
            Pada pelajaran {subjectName} ini, siswa diharapkan mampu <strong>secara cepat menghitung berbagai jenis {subjectName}</strong> bilangan satu angka sampai bilangan tiga angka.
          </p>
          <p className="mt-4">
            <strong>Siswa diharapkan bisa mencongak</strong> {subjectName} bilangan dua angka dengan bilangan dua angka.
          </p>
        </div>

        {/* Abstract Box */}
        <div className="mt-8 border-l-2 border-slate-200 bg-slate-50 p-4">
          <p className="italic text-slate-500">[!abstract]</p>
        </div>
      </div>

    </div>
  );
}
