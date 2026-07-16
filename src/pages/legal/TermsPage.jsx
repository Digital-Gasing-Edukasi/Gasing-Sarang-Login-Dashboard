import { LegalLayout, Section } from "@/pages/legal/LegalLayout";

// Ketentuan Layanan — URL: register/id/TOS
// Sumber: docs/Syarat-dan-Ketentuan-Sarang-Gasing-v.01.md
export function TermsPage({ onNavigate }) {
  return (
    <LegalLayout
      title="Syarat dan Ketentuan Penggunaan"
      updatedAt="10 Juli 2026"
      onNavigate={onNavigate}
    >
      <p>
        Selamat datang di Sarang Gasing (<strong>&ldquo;Platform&rdquo;</strong>,{" "}
        <strong>&ldquo;Kami&rdquo;</strong>), sebuah platform komunitas daring
        bagi para guru dan tenaga pendidik di Indonesia untuk berbagi materi
        ajar, berdiskusi, berjejaring, dan mengembangkan profesionalisme
        keguruan.
      </p>
      <p>
        Dokumen Syarat dan Ketentuan ini (<strong>&ldquo;S&amp;K&rdquo;</strong>)
        merupakan perjanjian yang sah secara hukum antara Anda (
        <strong>&ldquo;Pengguna&rdquo;</strong>) dengan Yayasan Teknologi
        Indonesia Jaya, yang berkedudukan di One Pacific Place Lt.15, Jl. Jend.
        Sudirman Kav.52-53, Senayan, Kebayoran Baru, Jakarta 12190, selaku
        penyelenggara sistem elektronik Platform Sarang Gasing.
      </p>
      <p>
        Dengan mengakses, mendaftar, dan/atau menggunakan Platform ini, Anda
        menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh
        seluruh ketentuan dalam dokumen ini, termasuk Kebijakan Privasi yang
        merupakan satu kesatuan yang tidak terpisahkan dari S&amp;K ini.
        Persetujuan ini merupakan kesepakatan yang sah sebagaimana dimaksud dalam
        Pasal 1320 Kitab Undang-Undang Hukum Perdata (
        <strong>&ldquo;KUH Perdata&rdquo;</strong>) mengenai syarat sahnya
        perjanjian. Jika Anda tidak menyetujui salah satu atau seluruh ketentuan
        ini, Anda tidak diperkenankan menggunakan Platform.
      </p>

      <Section heading="Pasal 1 — Definisi">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Platform</strong> adalah situs web, aplikasi, dan/atau
            layanan elektronik Sarang Gasing beserta seluruh fitur di dalamnya.
          </li>
          <li>
            <strong>Pengguna</strong> adalah setiap orang yang mengakses,
            mendaftar, dan/atau menggunakan Platform, baik sebagai anggota
            terdaftar maupun pengunjung.
          </li>
          <li>
            <strong>Akun</strong> adalah representasi digital Pengguna pada
            Platform yang dibuat melalui proses pendaftaran.
          </li>
          <li>
            <strong>Konten Pengguna</strong> adalah segala bentuk informasi,
            data, tulisan, gambar, video, dokumen, materi ajar, komentar, atau
            bahan lain apa pun yang diunggah, diposting, dibagikan, atau
            dikirimkan oleh Pengguna melalui Platform.
          </li>
          <li>
            <strong>Data Pribadi</strong> memiliki pengertian sebagaimana diatur
            dalam Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data
            Pribadi (<strong>&ldquo;UU PDP&rdquo;</strong>), yaitu data tentang
            orang perseorangan yang teridentifikasi atau dapat diidentifikasi
            secara tersendiri atau dikombinasi dengan informasi lainnya.
          </li>
          <li>
            <strong>Sistem Elektronik</strong> dan{" "}
            <strong>Transaksi Elektronik</strong> memiliki pengertian
            sebagaimana diatur dalam Undang-Undang Nomor 11 Tahun 2008 tentang
            Informasi dan Transaksi Elektronik sebagaimana telah diubah dengan
            Undang-Undang Nomor 19 Tahun 2016 (
            <strong>&ldquo;UU ITE&rdquo;</strong>).
          </li>
        </ul>
      </Section>

      <Section heading="Pasal 2 — Penerimaan Syarat dan Ketentuan">
        <p>
          2.1. Penggunaan Platform tunduk pada S&amp;K ini, Kebijakan Privasi,
          serta pedoman komunitas dan kebijakan tambahan lain yang Kami terbitkan
          dari waktu ke waktu (<strong>&ldquo;Kebijakan Tambahan&rdquo;</strong>),
          yang seluruhnya menjadi bagian yang mengikat dari S&amp;K ini.
        </p>
        <p>
          2.2. Apabila terdapat pertentangan antara S&amp;K ini dan Kebijakan
          Tambahan, maka S&amp;K ini yang berlaku, kecuali dinyatakan lain secara
          tegas.
        </p>
      </Section>

      <Section heading="Pasal 3 — Kelayakan Pengguna">
        <p>
          3.1. Platform ini ditujukan bagi guru, calon guru, tenaga pendidik,
          dan pemerhati dunia pendidikan yang berusia paling rendah 18 (delapan
          belas) tahun atau telah menikah, serta cakap secara hukum untuk membuat
          perikatan sebagaimana dimaksud dalam KUH Perdata.
        </p>
        <p>
          3.2. Pengguna yang mendaftar dengan status sebagai &ldquo;Guru
          Terverifikasi&rdquo; wajib memberikan data dan/atau dokumen pendukung
          status keprofesian (KTP, data sebagai peserta pelatihan Gasing) yang
          benar dan sah. Pengelola berhak melakukan proses verifikasi dan menolak
          atau mencabut status tersebut apabila ditemukan ketidaksesuaian.
        </p>
        <p>
          3.3. Pengguna menjamin bahwa seluruh informasi yang diberikan pada saat
          pendaftaran adalah benar, akurat, terkini, dan lengkap, serta bersedia
          memperbaikinya apabila terjadi perubahan.
        </p>
      </Section>

      <Section heading="Pasal 4 — Akun Pengguna">
        <p>
          4.1. Untuk menggunakan fitur tertentu, Pengguna wajib membuat Akun
          dengan mendaftarkan alamat surel dan/atau nomor telepon yang valid.
        </p>
        <p>
          4.2. Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi
          (password) dan seluruh aktivitas yang terjadi melalui Akunnya. Pengguna
          wajib segera memberi tahu Pengelola apabila mengetahui atau mencurigai
          adanya penggunaan Akun tanpa izin.
        </p>
        <p>
          4.3. Satu Pengguna hanya diperkenankan memiliki 1 (satu) Akun, kecuali
          mendapat izin tertulis dari Pengelola. Pengelola berhak menonaktifkan
          akun ganda (duplikat) yang terindikasi disalahgunakan.
        </p>
        <p>
          4.4. Pengelola tidak bertanggung jawab atas kerugian yang timbul akibat
          kelalaian Pengguna dalam menjaga kerahasiaan data akses Akunnya.
        </p>
      </Section>

      <Section heading="Pasal 5 — Deskripsi Layanan">
        <p>
          5.1. Sarang Gasing menyediakan fitur-fitur, antara lain namun tidak
          terbatas pada: forum diskusi, berbagi dan mengunduh materi/perangkat
          ajar, kelas atau pelatihan daring, ruang tanya-jawab, direktori
          komunitas guru, serta fitur lain yang dapat ditambahkan atau diubah
          dari waktu ke waktu.
        </p>
        <p>
          5.2. Pengelola berhak untuk mengubah, menambah, mengurangi, atau
          menghentikan sebagian maupun seluruh fitur Platform sewaktu-waktu
          dengan atau tanpa pemberitahuan sebelumnya, sepanjang tidak mengurangi
          hak Pengguna yang telah timbul dan dilindungi oleh hukum.
        </p>
        <p>
          5.3. Platform ini disediakan sebagaimana adanya (
          <strong>&ldquo;as is&rdquo;</strong>) dan sebagaimana tersedia (
          <strong>&ldquo;as available&rdquo;</strong>). Pengelola berupaya
          menjaga ketersediaan layanan namun tidak menjamin Platform akan selalu
          bebas dari gangguan, kesalahan, atau bebas dari virus/malware.
        </p>
      </Section>

      <Section heading="Pasal 6 — Kode Etik dan Perilaku Pengguna">
        <p>
          Sebagai komunitas profesional pendidik, Pengguna wajib menjunjung
          tinggi etika dan menjaga suasana yang saling menghormati. Dalam
          menggunakan Platform, Pengguna wajib untuk:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            6.1. Berkomunikasi secara sopan, konstruktif, dan menghormati
            perbedaan pendapat, latar belakang, suku, agama, ras, dan
            antargolongan (SARA);
          </li>
          <li>
            6.2. Tidak menyebarkan berita bohong (hoaks), fitnah, pencemaran nama
            baik, ujaran kebencian, atau konten yang bersifat SARA, sebagaimana
            diatur dan dilarang dalam UU ITE serta Kitab Undang-Undang Hukum
            Pidana (<strong>&ldquo;KUHP&rdquo;</strong>);
          </li>
          <li>
            6.3. Tidak melakukan perundungan (bullying), pelecehan, intimidasi,
            atau ancaman terhadap Pengguna lain, tenaga pendidik, peserta didik,
            atau pihak mana pun;
          </li>
          <li>
            6.4. Menghormati hak kekayaan intelektual pihak lain dalam mengunggah
            atau membagikan materi ajar dan konten apa pun;
          </li>
          <li>
            6.5. Tidak menyalahgunakan Platform untuk kepentingan politik
            praktis, promosi produk/jasa komersial tanpa izin tertulis dari
            Pengelola, skema piramida, perjudian, atau kegiatan yang melanggar
            hukum;
          </li>
          <li>
            6.6. Tidak mengunggah konten yang mengandung pornografi, kekerasan
            eksplisit, atau materi yang tidak pantas, khususnya mengingat sifat
            Platform yang berkaitan dengan dunia pendidikan dan anak.
          </li>
        </ul>
      </Section>

      <Section heading="Pasal 7 — Konten Pengguna">
        <p>
          7.1. <strong>Kepemilikan.</strong> Pengguna tetap memegang hak kekayaan
          intelektual atas Konten Pengguna yang diunggahnya, sepanjang Konten
          tersebut merupakan karya asli Pengguna atau Pengguna memiliki hak/izin
          yang sah untuk membagikannya.
        </p>
        <p>
          7.2. <strong>Lisensi kepada Pengelola.</strong> Dengan mengunggah
          Konten Pengguna ke Platform, Pengguna memberikan lisensi non-eksklusif,
          dapat dialihkan kepada afiliasi Pengelola untuk kepentingan
          operasional, bebas royalti, dan berlaku secara global kepada Pengelola
          untuk menyimpan, menampilkan, memperbanyak, mendistribusikan, dan
          mempromosikan Konten tersebut semata-mata dalam rangka penyelenggaraan
          dan pengembangan Platform.
        </p>
        <p>
          7.3. <strong>Tanggung Jawab Konten.</strong> Pengguna bertanggung jawab
          penuh secara pribadi atas Konten Pengguna yang diunggahnya, termasuk
          konsekuensi hukum yang mungkin timbul. Pengelola tidak memverifikasi
          kebenaran, keakuratan, atau legalitas setiap Konten Pengguna dan tidak
          bertanggung jawab atasnya, sebagaimana prinsip pembebasan tanggung
          jawab penyelenggara sistem elektronik atas konten pihak ketiga
          sepanjang diatur dalam peraturan perundang-undangan yang berlaku.
        </p>
        <p>
          7.4. Pengelola berhak, namun tidak berkewajiban, untuk meninjau,
          menyunting, menolak, atau menghapus Konten Pengguna yang dinilai
          melanggar S&amp;K ini atau peraturan perundang-undangan yang berlaku.
        </p>
      </Section>

      <Section heading="Pasal 8 — Hak Kekayaan Intelektual">
        <p>
          8.1. Nama &ldquo;Sarang Gasing&rdquo;, logo, tampilan antarmuka (user
          interface), basis data, kode program, dan seluruh elemen Platform
          selain Konten Pengguna merupakan hak kekayaan intelektual Pengelola
          yang dilindungi berdasarkan Undang-Undang Nomor 28 Tahun 2014 tentang
          Hak Cipta dan peraturan perundang-undangan terkait kekayaan intelektual
          lainnya.
        </p>
        <p>
          8.2. Pengguna dilarang menyalin, memodifikasi, mendistribusikan, atau
          menggunakan elemen sebagaimana dimaksud pada ayat (1) untuk tujuan
          komersial tanpa izin tertulis dari Pengelola.
        </p>
        <p>
          8.3. Apabila Pengguna menemukan Konten pada Platform yang diduga
          melanggar hak cipta atau hak kekayaan intelektual pihak lain, Pengguna
          dapat menyampaikan laporan (notice and takedown) kepada Pengelola
          melalui kontak sebagaimana diatur pada Pasal 20.
        </p>
      </Section>

      <Section heading="Pasal 9 — Privasi dan Perlindungan Data Pribadi">
        <p>
          9.1. Pengelola menghormati privasi Pengguna dan berkomitmen melindungi
          Data Pribadi Pengguna sesuai dengan UU PDP, UU ITE, dan Peraturan
          Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan
          Transaksi Elektronik (<strong>&ldquo;PP PSTE&rdquo;</strong>).
        </p>
        <p>
          9.2. Pengumpulan, penggunaan, penyimpanan, dan pengungkapan Data
          Pribadi Pengguna diatur lebih lanjut dalam Kebijakan Privasi Sarang
          Gasing, yang wajib dibaca dan dipahami oleh Pengguna sebagai satu
          kesatuan dengan S&amp;K ini.
        </p>
        <p>
          9.3. Pengelola memproses Data Pribadi berdasarkan persetujuan yang sah
          dari Pengguna sebagaimana dimaksud dalam UU PDP, dan Pengguna berhak
          untuk mengakses, memperbaiki, menghapus, serta menarik persetujuan atas
          pemrosesan Data Pribadinya sesuai mekanisme yang diatur dalam Kebijakan
          Privasi.
        </p>
        <p>
          9.4. Pengelola menerapkan langkah teknis dan organisasi yang wajar
          untuk melindungi Data Pribadi dari akses tidak sah, kebocoran, atau
          penyalahgunaan, namun Pengguna memahami bahwa tidak ada sistem
          elektronik yang sepenuhnya bebas dari risiko keamanan.
        </p>
      </Section>

      <Section heading="Pasal 10 — Larangan Penggunaan">
        <p>Pengguna dilarang untuk:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            10.1. Menggunakan Platform untuk tujuan yang melanggar hukum,
            termasuk namun tidak terbatas pada pelanggaran ketentuan UU ITE, UU
            Hak Cipta, dan KUHP;
          </li>
          <li>
            10.2. Melakukan peretasan, penyebaran malware, virus, atau upaya lain
            yang dapat mengganggu, merusak, atau melumpuhkan Sistem Elektronik
            Platform, sebagaimana dilarang dalam Pasal 30 dan Pasal 33 UU ITE;
          </li>
          <li>
            10.3. Melakukan scraping, crawling, atau ekstraksi data secara
            otomatis tanpa izin tertulis dari Pengelola;
          </li>
          <li>
            10.4. Menyamar sebagai pihak lain (impersonation) atau memberikan
            informasi identitas palsu;
          </li>
          <li>
            10.5. Melakukan spamming, penipuan (fraud), atau aktivitas phishing
            terhadap Pengguna lain;
          </li>
          <li>
            10.6. Mengunggah Konten yang melanggar hak kekayaan intelektual,
            privasi, atau hak pihak ketiga lainnya;
          </li>
          <li>
            10.7. Menggunakan Platform untuk merekrut, mempromosikan, atau
            melakukan kegiatan yang dapat membahayakan keselamatan peserta
            didik/anak.
          </li>
        </ul>
      </Section>

      <Section heading="Pasal 11 — Moderasi, Pelaporan, dan Penghapusan Konten">
        <p>
          11.1. Pengelola berhak melakukan moderasi terhadap seluruh Konten
          Pengguna, termasuk menghapus, menyembunyikan, atau membatasi visibilitas
          Konten yang melanggar S&amp;K ini, Kebijakan Tambahan, atau peraturan
          perundang-undangan yang berlaku, baik atas inisiatif sendiri, laporan
          Pengguna lain, maupun perintah instansi yang berwenang.
        </p>
        <p>
          11.2. Pengguna dapat melaporkan Konten atau perilaku yang dianggap
          melanggar melalui fitur pelaporan pada Platform atau kontak yang
          tercantum pada Pasal 20.
        </p>
        <p>
          11.3. Pengelola akan menindaklanjuti laporan sesuai kebijakan internal
          dan, apabila relevan, sesuai kewajiban penyelenggara sistem elektronik
          dalam menangani konten yang dilarang sebagaimana diatur dalam peraturan
          perundang-undangan tentang informasi dan transaksi elektronik.
        </p>
      </Section>

      <Section heading="Pasal 12 — Penangguhan dan Pengakhiran Akun">
        <p>
          12.1. Pengelola berhak menangguhkan sementara atau mengakhiri
          (menonaktifkan/menghapus) Akun Pengguna, dengan atau tanpa pemberitahuan
          terlebih dahulu, apabila Pengguna terbukti atau patut diduga melanggar
          S&amp;K ini, Kebijakan Tambahan, atau peraturan perundang-undangan yang
          berlaku.
        </p>
        <p>
          12.2. Pengguna dapat mengajukan penghapusan Akunnya sendiri
          sewaktu-waktu melalui pengaturan Akun atau dengan menghubungi Pengelola.
        </p>
        <p>
          12.3. Penangguhan atau pengakhiran Akun tidak menghapuskan kewajiban
          Pengguna yang telah timbul sebelum tanggal penangguhan/pengakhiran
          tersebut.
        </p>
        <p>
          12.4. Ketentuan mengenai kepemilikan Konten, batasan tanggung jawab, dan
          penyelesaian sengketa tetap berlaku meskipun Akun Pengguna telah
          diakhiri.
        </p>
      </Section>

      <Section heading="Pasal 13 — Tautan dan Layanan Pihak Ketiga">
        <p>
          13.1. Platform dapat memuat tautan menuju situs web atau layanan pihak
          ketiga yang tidak dimiliki atau dikendalikan oleh Pengelola.
        </p>
        <p>
          13.2. Pengelola tidak bertanggung jawab atas konten, kebijakan privasi,
          atau praktik dari situs/layanan pihak ketiga tersebut. Pengguna
          disarankan untuk membaca S&amp;K dan kebijakan privasi masing-masing
          pihak ketiga sebelum berinteraksi dengannya.
        </p>
      </Section>

      <Section heading="Pasal 14 — Batasan Tanggung Jawab">
        <p>
          14.1. Sepanjang diizinkan oleh peraturan perundang-undangan yang
          berlaku, Pengelola tidak bertanggung jawab atas kerugian tidak
          langsung, kerugian khusus, kerugian akibat kehilangan data, kehilangan
          kesempatan, atau kerugian konsekuensial lain yang timbul dari
          penggunaan atau ketidakmampuan menggunakan Platform.
        </p>
        <p>
          14.2. Pengelola tidak bertanggung jawab atas kerugian yang timbul
          akibat: (a) kesalahan atau kelalaian Pengguna; (b) gangguan koneksi
          internet atau perangkat Pengguna; (c) tindakan pihak ketiga di luar
          kendali wajar Pengelola; atau (d) keadaan kahar (force majeure)
          sebagaimana diatur pada Pasal 16.
        </p>
        <p>
          14.3. Ketentuan pembatasan tanggung jawab ini tidak mengurangi hak
          Pengguna yang dilindungi secara wajib (mandatory rights) berdasarkan
          peraturan perundang-undangan yang berlaku di Indonesia, termasuk namun
          tidak terbatas pada Undang-Undang Nomor 8 Tahun 1999 tentang
          Perlindungan Konsumen sepanjang relevan.
        </p>
      </Section>

      <Section heading="Pasal 15 — Ganti Rugi">
        <p>
          Pengguna setuju untuk membebaskan dan mengganti kerugian Pengelola,
          afiliasi, karyawan, dan perwakilannya dari segala tuntutan, kerugian,
          biaya (termasuk biaya hukum yang wajar) yang timbul akibat: (a)
          pelanggaran Pengguna terhadap S&amp;K ini; (b) Konten Pengguna yang
          diunggah; atau (c) pelanggaran Pengguna terhadap hak pihak ketiga atau
          peraturan perundang-undangan yang berlaku.
        </p>
      </Section>

      <Section heading="Pasal 16 — Keadaan Kahar (Force Majeure)">
        <p>
          Pengelola dibebaskan dari tanggung jawab atas keterlambatan atau
          kegagalan pelaksanaan kewajiban berdasarkan S&amp;K ini yang disebabkan
          oleh keadaan di luar kendali wajar Pengelola, termasuk namun tidak
          terbatas pada bencana alam, wabah, kebijakan pemerintah, gangguan
          infrastruktur telekomunikasi/internet nasional, kerusuhan, atau perang.
        </p>
      </Section>

      <Section heading="Pasal 17 — Perubahan Syarat dan Ketentuan">
        <p>
          17.1. Pengelola berhak untuk meninjau dan mengubah S&amp;K ini
          sewaktu-waktu sesuai kebutuhan operasional maupun perkembangan peraturan
          perundang-undangan.
        </p>
        <p>
          17.2. Dengan tetap menggunakan Platform setelah perubahan berlaku
          efektif, Pengguna dianggap telah menyetujui perubahan tersebut.
        </p>
      </Section>

      <Section heading="Pasal 18 — Hukum yang Berlaku dan Penyelesaian Sengketa">
        <p>
          18.1. S&amp;K ini dibuat, ditafsirkan, dan tunduk pada hukum Negara
          Republik Indonesia.
        </p>
        <p>
          18.2. Apabila timbul perselisihan sehubungan dengan S&amp;K ini, para
          pihak sepakat untuk terlebih dahulu mengupayakan penyelesaian secara
          musyawarah untuk mufakat.
        </p>
        <p>
          18.3. Apabila musyawarah tidak mencapai kesepakatan dalam waktu 30 hari
          kalender, maka para pihak sepakat untuk menyelesaikan perselisihan
          tersebut melalui Pengadilan Negeri Jakarta Selatan, tanpa mengurangi
          hak Pengelola untuk mengajukan upaya hukum di yurisdiksi lain apabila
          diperlukan.
        </p>
      </Section>

      <Section heading="Pasal 19 — Lain-lain">
        <p>
          19.1. <strong>Keterpisahan.</strong> Apabila salah satu ketentuan dalam
          S&amp;K ini dinyatakan tidak sah atau tidak dapat dilaksanakan oleh
          badan peradilan yang berwenang, ketentuan lainnya tetap berlaku penuh.
        </p>
        <p>
          19.2. <strong>Pengesampingan.</strong> Kegagalan Pengelola untuk
          melaksanakan suatu hak berdasarkan S&amp;K ini tidak dapat dianggap
          sebagai pengesampingan atas hak tersebut.
        </p>
        <p>
          19.3. <strong>Pengalihan.</strong> Pengguna tidak dapat mengalihkan hak
          dan kewajibannya berdasarkan S&amp;K ini kepada pihak lain tanpa
          persetujuan tertulis dari Pengelola. Pengelola dapat mengalihkan hak dan
          kewajibannya kepada afiliasi atau pihak lain sehubungan dengan
          restrukturisasi bisnis, dengan pemberitahuan kepada Pengguna.
        </p>
        <p>
          19.4. <strong>Bahasa.</strong> S&amp;K ini disusun dalam Bahasa
          Indonesia sesuai dengan Undang-Undang Nomor 24 Tahun 2009 tentang
          Bendera, Bahasa, dan Lambang Negara, serta Peraturan Presiden Nomor 63
          Tahun 2019. Apabila tersedia versi dalam bahasa lain, maka versi Bahasa
          Indonesia yang berlaku dalam hal terjadi perbedaan penafsiran.
        </p>
        <p>
          19.5. <strong>Keseluruhan Perjanjian.</strong> S&amp;K ini serta
          Kebijakan Privasi dan Kebijakan Tambahan merupakan keseluruhan
          kesepakatan antara Pengguna dan Pengelola sehubungan dengan penggunaan
          Platform.
        </p>
      </Section>

      <Section heading="Pasal 20 — Kontak">
        <p>
          Apabila terdapat pertanyaan, atau ingin mengirimkan komentar terkait
          S&amp;K ini, Pengguna dapat menghubungi customer support kami{" "}
          <a
            href="mailto:admin@gasingacademy.org"
            className="underline font-medium text-[#0033EC] hover:text-[#0033EC]/80"
          >
            admin@gasingacademy.org
          </a>
          , atau kirim surat kepada kami di:
        </p>
        <p>
          Alamat: One Pacific Place Lt.15, Jl. Jend. Sudirman Kav.52-53, Senayan,
          Kebayoran Baru, Jakarta 12190.
        </p>
      </Section>
    </LegalLayout>
  );
}
