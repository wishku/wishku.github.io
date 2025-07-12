const firebaseConfig = {
    apiKey: "AIzaSyBBlD6l-OAG5fbEcyChB-KzvSKcrw-65h4",
    authDomain: "wishku-784b4.firebaseapp.com",
    projectId: "wishku-784b4",
    storageBucket: "wishku-784b4.firebasestorage.app",
    messagingSenderId: "387618996538",
    appId: "1:387618996538:web:5937189ff015bfa961d003",
    measurementId: "G-611VLNG94F",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const uid = decodeURIComponent(window.location.hash.substring(1));
let isPublicView = false;

if (!uid.match(/^([a-f0-9]{32})$/i)) {
    isPublicView = true;
}

const modalDownloadAccessEl = document.getElementById('modalDownloadAccess');
const modalDownloadAccess = new bootstrap.Modal(modalDownloadAccessEl);

const registerCard = document.getElementById("cardRegister");
const registerSection = document.getElementById("registerSection");
const wishlistSection = document.getElementById("wishlistSection");
const containerCard = document.getElementById("cardUserList");
const container = document.getElementById("userList");

let is_access_downloaded = false;

if (!uid) {
    showLoading();
    registerSection.style.display = "block";
    registerCard.style.display = "block";
    containerCard.style.display = "block";
    container.querySelector("#loadingSpinner").style.display = "block";
    document.getElementById("loadingSpinner").style.display = "none";

    db.ref("users").once("value").then(snapshot => {
        hideLoading();
        const data = snapshot.val();
        if (data) {
            container.innerHTML = '<h4 class="fw-bold">Wishlist Publik:</h4>';

            const row = document.createElement("div");
            row.className = "row g-2";

            Object.entries(data).forEach(([key, user]) => {
                const col = document.createElement("div");
                col.className = "col-md-6";

                const card = document.createElement("div");
                card.className = "card h-100";
                card.style.cursor = 'pointer';
                card.onclick = () => {
                    window.location.href = `./#${encodeURIComponent(user.name)}`;
                    setTimeout(() => location.reload(), 100);
                };

                card.innerHTML = `
            <div class="card-body">
              <h5 class="card-title"><i class="fa fa-user"></i> ${user.name}</h5>
              <p class="card-text small"><i class="fa fa-heart text-danger"></i> ${user.wishlist ? Object.keys(user.wishlist).length : 0} Wishlist</p>
            </div>
          `;

                col.appendChild(card);
                row.appendChild(col);
            });

            container.appendChild(row);
        }
    });
} else {
    const pathToCheck = isPublicView ? `users` : `users/${uid}`;
    const query = isPublicView
        ? db.ref("users").orderByChild("name").equalTo(uid).once('value')
        : db.ref(pathToCheck).once('value');

    query.then(userSnap => {
        if (!userSnap.exists()) {
            hideLoading();
            wishlistSection.style.display = "none";
            document.getElementById("loadingSpinner").style.display = "none";
            document.getElementById("notfoundSection").style.display = "block";
            return;
        }

        const actualUid = isPublicView ? Object.keys(userSnap.val())[0] : uid;
        hideLoading();
        wishlistSection.style.display = "block";
        document.getElementById("loadingSpinner").style.display = "none";

        // Sembunyikan form jika public view
        if (isPublicView) {
            document.getElementById("wishlistFormSection").style.display = "none";
        }

        // 🔹 Ambil data pengguna dan tampilkan
        db.ref(`users/${actualUid}`).once('value').then(userSnap => {
            if (userSnap.exists()) {
                const user = userSnap.val();
                document.getElementById("nameUser").innerText = user.name || "-";
                document.getElementById("noHpUser").innerText = user.no_hp || "-";
                document.getElementById("addressUser").innerText = user.alamat || "-";
            }
        });

        // 🔹 Ambil daftar wishlist
        db.ref(`users/${actualUid}/wishlist`).on('value', (snapshot) => {
            const list = document.getElementById("wishlistList");
            const data = snapshot.val();
            list.innerHTML = `
                <div class="p-5 position-relative">
                    <div class="position-absolute top-50 start-50 translate-middle" style="color: #aaa;">
                        <div style="font-size: 30px; text-align: center;">
                            <i class="fa-solid fa-heart-circle-xmark"></i>
                        </div>
                        <p>Wishlist Empty!</p>
                    </div>
                </div>
            `
            if (data) {
                list.innerHTML = '';
                Object.entries(data).forEach(([key, item]) => {
                    const li = document.createElement("li");
                    li.style.listStyleType = "none";
                    li.innerHTML = `
                    <a href="${item.link}" target="_blank" class="wishlist-item text-decoration-none" style="color: #143D62">
                        <p class="m-0">${item.nama}</p>
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  `;
                    if (!isPublicView) {
                        li.innerHTML = `
                           <div class="wishlist-item">
                                <p class="m-0">${item.nama}</p>
                                <div>
                                    <a href="${item.link}" target="_blank" class="text-decoration-none me-3">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                    </a>
                                </div>
                           </div>
                        `;

                        const btn = document.createElement("button");
                        btn.className = "btn btn-sm btn-danger";
                        btn.innerHTML = '<i class="fa fa-trash"></i>';
                        btn.onclick = () => {
                            db.ref(`users/${actualUid}/wishlist/${key}`).remove();
                        };
                        li.children[0].children[1].appendChild(btn);
                    }
                    list.appendChild(li);
                });
            }
        });

        // 🔹 Tambah wishlist baru
        document.getElementById("wishlistForm")?.addEventListener("submit", (e) => {
            e.preventDefault();
            showLoadingScreen();

            const nama = document.getElementById("itemName").value;
            const link = document.getElementById("marketLink").value;
            db.ref(`users/${actualUid}/wishlist`).push({ nama, link });
            document.getElementById("itemName").value = '';
            document.getElementById("marketLink").value = '';
            hideLoadingScreen();
        });
    });

}

document.getElementById("registerForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showLoadingScreen();
    const newUIDSection = document.getElementById("newUID");

    const name = document.getElementById("name").value.trim();
    const no_hp = document.getElementById("no_hp").value.trim();
    const alamat = document.getElementById("alamat").value.trim();

    if (!name || !no_hp || !alamat) {
        alert("Semua field wajib diisi!");
        return;
    }

    db.ref("users").orderByChild("name").equalTo(name).once("value").then(snapshot => {
        if (snapshot.exists()) {
            alert("Nama sudah terpakai, silakan gunakan nama lain!");
            hideLoadingScreen();
            return;
        }

        const newUid = self.crypto.randomUUID().replace(/-/g, "");
        const ref = db.ref("users/" + newUid);

        ref.set({ name, no_hp, alamat })
            .then(() => {
                newUIDSection.value = newUid;
                modalDownloadAccess.show();
            });
    });
});

document.getElementById("downloadAccess")?.addEventListener("click", (e) => {
    const uid = document.getElementById("newUID").value;
    const textContent = `Access WishKu Editor

WishKu ID : ${uid}
URL : ${window.location.origin}/#${uid}
    `;

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `wishku-${uid}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    document.getElementById("toWishKuEditor").style.display = "inline-block";
    is_access_downloaded = true;
})

document.getElementById("toWishKuEditor")?.addEventListener("click", (e) => {
    const uid = document.getElementById("newUID").value;
    window.location.href = `./#${uid}`;
    setTimeout(() => location.reload(), 100);
})

modalDownloadAccessEl.addEventListener('shown.bs.modal', () => {
    window.onbeforeunload = function () {
        if (!is_access_downloaded) {
            return "Perubahan belum disimpan. Yakin ingin meninggalkan halaman?";
        }
    };
});

modalDownloadAccessEl.addEventListener('hidden.bs.modal', () => {
    window.onbeforeunload = null;
});

document.getElementById("year").textContent = new Date().getFullYear();