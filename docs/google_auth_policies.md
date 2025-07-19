# Google Authentication Policies

Cicero Dashboard menyediakan fitur login melalui Google. Untuk memenuhi persyaratan Google, dua halaman informasi disertakan:

- **Terms of Service** – tersedia di `/terms-of-service`. Halaman ini menjelaskan ketentuan penggunaan layanan ketika pengguna masuk memakai akun Google.
- **Privacy Policy** – tersedia di `/privacy-policy`. Menjabarkan jenis data Google yang diterima (nama, email, ID) dan cara kami memprosesnya.

Selain halaman tersebut, Google mensyaratkan adanya keterangan singkat mengenai aplikasi yang menggunakan autentikasi Google. Di bawah ini adalah ringkasan fungsi Cicero Dashboard.
## Deskripsi Singkat Aplikasi

Cicero Dashboard adalah aplikasi web untuk memantau statistik akun Instagram dan TikTok. Pengguna masuk dengan akun Google guna mengakses laporan analitik yang berasal dari backend Cicero_V2. Data Google yang diperoleh hanya dipakai untuk memverifikasi identitas dan tidak dibagikan ke pihak ketiga.

Kedua halaman berada di direktori `cicero-dashboard/app`. Apabila diperlukan perubahan, sunting `terms-of-service/page.jsx` atau `privacy-policy/page.jsx`.


