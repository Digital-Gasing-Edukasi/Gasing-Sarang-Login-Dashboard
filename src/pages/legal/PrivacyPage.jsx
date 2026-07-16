import { LegalLayout, Section } from "@/pages/legal/LegalLayout";

// Kebijakan Privasi — URL: register/id/privacy
// Sumber: docs/Kebijakan-Privasi-Sarang-Gasing-v.01.md
export function PrivacyPage({ onNavigate }) {
  return (
    <LegalLayout
      title="Kebijakan Privasi"
      updatedAt="10 Juli 2026"
      onNavigate={onNavigate}
    >
      <p>
        Yayasan Teknologi Indonesia Jaya (
        <strong>&ldquo;Pengelola&rdquo;</strong>,{" "}
        <strong>&ldquo;Kami&rdquo;</strong>), selaku pengendali data pribadi
        (data controller) atas platform komunitas guru Sarang Gasing (
        <strong>&ldquo;Platform&rdquo;</strong>), berkomitmen untuk melindungi
        privasi dan Data Pribadi setiap Pengguna sesuai dengan Undang-Undang
        Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (
        <strong>&ldquo;UU PDP&rdquo;</strong>), Undang-Undang Nomor 11 Tahun 2008
        tentang Informasi dan Transaksi Elektronik sebagaimana diubah dengan
        Undang-Undang Nomor 19 Tahun 2016 (
        <strong>&ldquo;UU ITE&rdquo;</strong>), dan Peraturan Pemerintah Nomor 71
        Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik (
        <strong>&ldquo;PP PSTE&rdquo;</strong>).
      </p>
      <p>
        Kebijakan Privasi ini menjelaskan bagaimana Kami mengumpulkan,
        menggunakan, menyimpan, membagikan, dan melindungi Data Pribadi Pengguna,
        serta hak-hak yang dimiliki Pengguna atas Data Pribadinya. Dokumen ini
        merupakan satu kesatuan yang tidak terpisahkan dari Syarat dan Ketentuan
        Penggunaan Platform Sarang Gasing.
      </p>
      <p>
        Dengan menggunakan Platform, Pengguna menyatakan telah membaca dan
        memahami Kebijakan Privasi ini serta memberikan persetujuan atas
        pemrosesan Data Pribadinya sebagaimana diuraikan di bawah, sepanjang
        persetujuan tersebut merupakan dasar pemrosesan yang berlaku sesuai Pasal
        20 UU PDP.
      </p>

      <Section heading="Pasal 1 — Definisi">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Data Pribadi</strong> adalah data tentang orang perseorangan
            yang teridentifikasi atau dapat diidentifikasi secara tersendiri atau
            dikombinasi dengan informasi lainnya baik secara langsung maupun tidak
            langsung melalui sistem elektronik atau nonelektronik, sebagaimana
            dimaksud dalam Pasal 1 angka 1 UU PDP.
          </li>
          <li>
            <strong>Data Pribadi Umum</strong> meliputi antara lain nama lengkap,
            jenis kelamin, kewarganegaraan, agama, dan/atau data pribadi yang
            dikombinasikan untuk mengidentifikasi seseorang, sebagaimana dimaksud
            dalam Pasal 4 ayat (2) UU PDP.
          </li>
          <li>
            <strong>Data Pribadi Spesifik</strong> meliputi antara lain data
            kesehatan, data biometrik, data genetika, catatan kejahatan, data
            anak, dan/atau data keuangan pribadi, sebagaimana dimaksud dalam Pasal
            4 ayat (1) UU PDP.
          </li>
          <li>
            <strong>Pemrosesan Data Pribadi</strong> adalah kegiatan yang meliputi
            perolehan, pengumpulan, pengolahan, penganalisisan, penyimpanan,
            perbaikan, pembaruan, penampilan, pengumuman, transfer, penyebarluasan,
            pengungkapan, dan/atau penghapusan Data Pribadi.
          </li>
          <li>
            <strong>Pengendali Data Pribadi</strong> adalah setiap orang, badan
            publik, dan organisasi internasional yang bertindak sendiri-sendiri
            atau bersama-sama dalam menentukan tujuan dan melakukan kendali
            Pemrosesan Data Pribadi — dalam hal ini adalah Pengelola.
          </li>
          <li>
            <strong>Subjek Data Pribadi</strong> adalah orang perseorangan yang
            datanya diproses, yaitu Pengguna Platform.
          </li>
        </ul>
      </Section>

      <Section heading="Pasal 2 — Data Pribadi yang Dikumpulkan">
        <p>
          Kami dapat mengumpulkan kategori Data Pribadi berikut, sesuai prinsip
          keterbatasan tujuan (purpose limitation) dan minimalisasi data
          sebagaimana diatur dalam Pasal 16 UU PDP:
        </p>
        <p className="font-semibold">2.1. Data yang diberikan langsung oleh Pengguna:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Nama lengkap, alamat surel, nomor telepon, dan kata sandi pada saat
            pendaftaran Akun;
          </li>
          <li>
            Foto profil, biografi singkat, dan informasi profesi (nama
            sekolah/instansi, mata pelajaran jenjang mengajar);
          </li>
          <li>
            Dokumen pendukung verifikasi status guru (KTP, data sebagai peserta
            pelatihan Gasing) bagi Pengguna yang mengajukan status &ldquo;Guru
            Terverifikasi&rdquo;;
          </li>
          <li>
            Konten yang diunggah secara sukarela (materi ajar, tulisan, komentar,
            pesan pada forum/grup diskusi);
          </li>
          <li>
            Data yang disampaikan saat menghubungi layanan pelanggan atau mengisi
            survei/formulir pada Platform.
          </li>
        </ul>
        <p className="font-semibold">2.2. Data yang dikumpulkan secara otomatis:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Alamat IP, jenis perangkat, sistem operasi, jenis peramban (browser);</li>
          <li>
            Data log aktivitas (waktu akses, halaman yang dikunjungi, fitur yang
            digunakan);
          </li>
          <li>Data lokasi umum (berdasarkan alamat IP), sepanjang diizinkan oleh Pengguna;</li>
          <li>
            Data yang dikumpulkan melalui cookie dan teknologi pelacakan sejenis
            sebagaimana diatur pada Pasal 4.
          </li>
        </ul>
        <p className="font-semibold">2.3. Data dari pihak ketiga:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Data yang diperoleh apabila Pengguna mendaftar/masuk (login)
            menggunakan akun pihak ketiga, sesuai izin yang diberikan Pengguna
            pada saat proses tersebut.
          </li>
        </ul>
        <p>
          2.4. Kami tidak secara sengaja mengumpulkan Data Pribadi Spesifik
          sebagaimana dimaksud Pasal 4 ayat (1) UU PDP, kecuali data tersebut
          relevan dan diperlukan untuk tujuan verifikasi status keprofesian dan
          diberikan secara sukarela oleh Pengguna dengan persetujuan eksplisit.
        </p>
      </Section>

      <Section heading="Pasal 3 — Tujuan dan Dasar Pemrosesan Data Pribadi">
        <p>3.1. Kami memproses Data Pribadi Pengguna untuk tujuan berikut:</p>
        <ul className="list-[lower-alpha] pl-5 space-y-2">
          <li>Menyediakan, mengelola, dan memelihara Akun serta fitur Platform;</li>
          <li>Melakukan verifikasi status keprofesian sebagai guru/tenaga pendidik;</li>
          <li>Memfasilitasi interaksi antar-Pengguna dalam forum dan komunitas;</li>
          <li>
            Mengirimkan pemberitahuan, informasi layanan, dan (dengan persetujuan
            terpisah) konten pemasaran/promosi;
          </li>
          <li>Meningkatkan kualitas, keamanan, dan pengembangan fitur Platform;</li>
          <li>
            Mencegah, mendeteksi, dan menangani penipuan, penyalahgunaan, atau
            pelanggaran terhadap Syarat dan Ketentuan;
          </li>
          <li>
            Memenuhi kewajiban hukum dan permintaan resmi dari instansi yang
            berwenang sesuai peraturan perundang-undangan yang berlaku.
          </li>
        </ul>
        <p>
          3.2. Pemrosesan Data Pribadi dilaksanakan berdasarkan satu atau lebih
          dasar pemrosesan sebagaimana diatur dalam Pasal 20 ayat (2) UU PDP,
          yaitu:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Persetujuan eksplisit</strong> dari Subjek Data Pribadi;
          </li>
          <li>
            <strong>Pemenuhan kewajiban perjanjian</strong>, yaitu pelaksanaan
            Syarat dan Ketentuan Penggunaan Platform;
          </li>
          <li>
            <strong>Pemenuhan kewajiban hukum</strong> Pengelola sesuai peraturan
            perundang-undangan;
          </li>
          <li>
            <strong>Kepentingan sah (legitimate interest)</strong> Pengelola,
            khususnya untuk keamanan sistem dan pencegahan penyalahgunaan,
            sepanjang tidak bertentangan dengan kepentingan dan hak fundamental
            Subjek Data Pribadi.
          </li>
        </ul>
      </Section>

      <Section heading="Pasal 4 — Penggunaan Cookie dan Teknologi Pelacakan">
        <p>
          4.1. Platform menggunakan cookie, local storage, dan teknologi sejenis
          untuk mengenali Pengguna, menjaga sesi login, mengingat preferensi,
          serta menganalisis pola penggunaan Platform guna peningkatan layanan.
        </p>
        <p>
          4.2. Pengguna dapat mengatur atau menonaktifkan cookie melalui
          pengaturan peramban (browser), namun penonaktifan cookie tertentu dapat
          mempengaruhi fungsi dan pengalaman penggunaan Platform.
        </p>
        <p>
          4.3. Kami dapat menggunakan alat analitik pihak ketiga yang juga
          menempatkan cookie untuk kepentingan analisis statistik penggunaan
          Platform secara agregat.
        </p>
      </Section>

      <Section heading="Pasal 5 — Pengungkapan dan Pembagian Data Pribadi">
        <p>
          5.1. Kami tidak menjual, menyewakan, atau memperdagangkan Data Pribadi
          Pengguna kepada pihak mana pun.
        </p>
        <p>5.2. Kami dapat membagikan Data Pribadi kepada pihak ketiga dalam hal berikut:</p>
        <ul className="list-[lower-alpha] pl-5 space-y-2">
          <li>
            <strong>Kepada Pengguna lain</strong>, sebatas data yang secara
            sengaja ditampilkan oleh Pengguna pada profil publik atau Konten
            Pengguna (termasuk dan tidak terbatas pada nama, foto profil, materi
            yang dibagikan);
          </li>
          <li>
            <strong>Kepada penyedia layanan pihak ketiga (pemroses data)</strong>{" "}
            yang membantu operasional Platform, seperti penyedia layanan
            hosting/cloud, layanan analitik, dan layanan pengiriman notifikasi,
            yang terikat kewajiban kerahasiaan dan hanya memproses data sesuai
            instruksi Kami;
          </li>
          <li>
            <strong>Kepada instansi pemerintah atau aparat penegak hukum</strong>,
            apabila diwajibkan berdasarkan peraturan perundang-undangan, proses
            hukum yang sah, atau perintah pengadilan;
          </li>
          <li>
            <strong>Dalam rangka transaksi korporasi</strong>, seperti merger,
            akuisisi, atau penjualan aset, dengan tetap memberikan pemberitahuan
            kepada Pengguna dan menjaga tingkat perlindungan yang setara.
          </li>
        </ul>
        <p>
          5.3. Setiap pembagian Data Pribadi kepada pihak ketiga dilakukan dengan
          memperhatikan prinsip kerahasiaan dan keamanan sebagaimana diatur dalam
          Pasal 35 dan Pasal 36 UU PDP.
        </p>
      </Section>

      <Section heading="Pasal 6 — Transfer Data Pribadi ke Luar Wilayah Indonesia">
        <p>
          6.1. Dalam hal penyedia layanan pihak ketiga sebagaimana dimaksud Pasal
          5 berlokasi atau memproses data di luar wilayah Negara Republik
          Indonesia, Kami akan memastikan pemenuhan persyaratan transfer data
          pribadi lintas batas negara sebagaimana diatur dalam Pasal 56 UU PDP,
          yaitu memastikan negara tujuan memiliki tingkat perlindungan data
          pribadi yang setara atau lebih tinggi, atau melalui mekanisme
          kontraktual yang memadai (binding corporate rules atau perjanjian
          pemrosesan data yang sesuai).
        </p>
        <p>
          6.2. Apabila persyaratan pada ayat (1) tidak dapat dipenuhi, Kami akan
          memastikan adanya persetujuan eksplisit dari Subjek Data Pribadi
          terlebih dahulu sebelum transfer dilakukan.
        </p>
      </Section>

      <Section heading="Pasal 7 — Penyimpanan dan Jangka Waktu Retensi Data">
        <p>
          7.1. Kami menyimpan Data Pribadi Pengguna selama Akun Pengguna aktif dan
          sepanjang diperlukan untuk mencapai tujuan pemrosesan sebagaimana
          diuraikan dalam Kebijakan ini.
        </p>
        <p>
          7.2. Setelah Akun dihapus atau tujuan pemrosesan telah tercapai, Kami
          akan menghapus atau memusnahkan Data Pribadi sesuai dengan Pasal 16 ayat
          (3) UU PDP, kecuali:
        </p>
        <ul className="list-[lower-alpha] pl-5 space-y-2">
          <li>
            Data tersebut wajib disimpan lebih lama untuk memenuhi kewajiban
            hukum, akuntansi, atau audit sesuai peraturan perundang-undangan yang
            berlaku; atau
          </li>
          <li>
            Diperlukan untuk penyelesaian sengketa, penegakan Syarat dan
            Ketentuan, atau kepentingan sah lain yang lebih diutamakan.
          </li>
        </ul>
        <p>
          7.3. Data yang telah dianonimkan (tidak lagi dapat diidentifikasi) dapat
          disimpan untuk kepentingan statistik dan pengembangan layanan tanpa
          batas waktu tertentu.
        </p>
      </Section>

      <Section heading="Pasal 8 — Keamanan Data Pribadi">
        <p>
          8.1. Kami menerapkan langkah teknis dan organisasi yang wajar untuk
          melindungi Data Pribadi dari kehilangan, penyalahgunaan, akses tanpa
          izin, pengungkapan, perubahan, atau perusakan, sebagaimana diamanatkan
          Pasal 35 UU PDP, termasuk namun tidak terbatas pada enkripsi data,
          pembatasan akses berbasis peran (role-based access control), dan
          pemantauan keamanan sistem secara berkala.
        </p>
        <p>
          8.2. Meskipun demikian, Pengguna memahami bahwa tidak ada metode
          transmisi melalui internet atau penyimpanan elektronik yang sepenuhnya
          aman, sehingga Kami tidak dapat menjamin keamanan mutlak atas Data
          Pribadi.
        </p>
        <p>
          8.3. Pengguna turut bertanggung jawab menjaga keamanan Data Pribadinya
          dengan tidak membagikan kata sandi Akun kepada pihak lain dan segera
          melaporkan apabila mencurigai adanya akses tidak sah terhadap Akunnya.
        </p>
      </Section>

      <Section heading="Pasal 9 — Hak-hak Subjek Data Pribadi">
        <p>
          Sesuai dengan Pasal 5 sampai dengan Pasal 15 UU PDP, Pengguna selaku
          Subjek Data Pribadi memiliki hak-hak berikut:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            9.1. <strong>Hak untuk mendapatkan informasi</strong> mengenai
            kejelasan identitas, dasar kepentingan hukum, tujuan permintaan dan
            penggunaan Data Pribadi, serta akuntabilitas Pengelola;
          </li>
          <li>
            9.2. <strong>Hak untuk mengakses dan memperoleh salinan</strong> Data
            Pribadinya;
          </li>
          <li>
            9.3. <strong>Hak untuk melengkapi, memperbarui, dan/atau memperbaiki</strong>{" "}
            kesalahan dan/atau ketidakakuratan Data Pribadinya;
          </li>
          <li>
            9.4.{" "}
            <strong>
              Hak untuk mengakhiri pemrosesan, menghapus, dan/atau memusnahkan
            </strong>{" "}
            Data Pribadinya, kecuali Data Pribadi tersebut masih diperlukan untuk
            kepentingan hukum yang sah;
          </li>
          <li>
            9.5. <strong>Hak untuk menarik kembali persetujuan</strong> yang telah
            diberikan atas pemrosesan Data Pribadinya;
          </li>
          <li>
            9.6. <strong>Hak untuk mengajukan keberatan</strong> atas tindakan
            pengambilan keputusan yang hanya berdasarkan pada pemrosesan otomatis,
            termasuk pembuatan profil (profiling), yang menimbulkan akibat hukum
            atau berdampak signifikan bagi Subjek Data Pribadi;
          </li>
          <li>
            9.7. <strong>Hak untuk menunda atau membatasi</strong> pemrosesan Data
            Pribadi secara proporsional;
          </li>
          <li>
            9.8. <strong>Hak untuk menggugat dan menerima ganti rugi</strong> atas
            pelanggaran pemrosesan Data Pribadinya sesuai peraturan
            perundang-undangan;
          </li>
          <li>
            9.9.{" "}
            <strong>
              Hak untuk memperoleh dan/atau menggunakan Data Pribadinya dalam
              format yang sesuai
            </strong>{" "}
            (portabilitas data), sepanjang secara teknis dimungkinkan.
          </li>
        </ul>
        <p>
          Pengguna dapat menggunakan hak-hak tersebut melalui pengaturan Akun pada
          Platform atau dengan menghubungi Kami melalui kontak pada Pasal 14. Kami
          akan menindaklanjuti permintaan Pengguna dalam jangka waktu yang wajar
          sesuai peraturan perundang-undangan yang berlaku.
        </p>
      </Section>

      <Section heading="Pasal 10 — Pemberitahuan Kegagalan Perlindungan Data Pribadi">
        <p>
          10.1. Dalam hal terjadi kegagalan perlindungan Data Pribadi (kebocoran
          data), Kami akan menyampaikan pemberitahuan tertulis kepada Subjek Data
          Pribadi yang terdampak paling lambat 3x24 (tiga kali dua puluh empat)
          jam sejak diketahuinya kegagalan tersebut, sebagaimana diwajibkan oleh
          Pasal 46 UU PDP.
        </p>
        <p>
          10.2. Pemberitahuan akan memuat Data Pribadi yang bocor, waktu dan
          perkiraan waktu kegagalan perlindungan data, serta upaya penanganan dan
          pemulihan yang telah dan akan dilakukan oleh Kami.
        </p>
        <p>
          10.3. Kami juga akan melaporkan insiden kegagalan perlindungan Data
          Pribadi kepada Lembaga Perlindungan Data Pribadi sesuai mekanisme dan
          jangka waktu yang diatur dalam peraturan pelaksana UU PDP.
        </p>
      </Section>

      <Section heading="Pasal 11 — Perubahan Kebijakan Privasi">
        <p>
          11.1. Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu
          untuk menyesuaikan dengan perkembangan layanan maupun peraturan
          perundang-undangan.
        </p>
        <p>
          11.2. Perubahan material akan diinformasikan melalui Platform dan/atau
          surel kepada Pengguna sebelum berlaku efektif. Penggunaan Platform yang
          berkelanjutan setelah perubahan berlaku dianggap sebagai persetujuan
          Pengguna atas perubahan tersebut.
        </p>
      </Section>

      <Section heading="Pasal 12 — Hukum yang Berlaku">
        <p>
          Kebijakan Privasi ini disusun berdasarkan dan tunduk pada hukum Negara
          Republik Indonesia, termasuk namun tidak terbatas pada UU PDP, UU ITE,
          dan PP PSTE beserta peraturan pelaksananya.
        </p>
      </Section>

      <Section heading="Pasal 13 — Kontak">
        <p>
          Apabila terdapat pertanyaan, atau ingin mengirimkan komentar terkait
          Kebijakan Privasi ini, Pengguna dapat menghubungi customer support kami{" "}
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
