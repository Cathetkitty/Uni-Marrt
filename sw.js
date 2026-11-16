
/* ==========================================
   UNIMART SERVICE WORKER
   COMPLETE OFFLINE SUPPORT
   HTML + CSS + JS + PRODUCT IMAGES
========================================== */

const CACHE_NAME = "unimart-offline-v8";


/* ==========================================
   APP FILES AND PRODUCT IMAGES
========================================== */

const APP_FILES = [

    // MAIN APP FILES
    "./",
    "./index.html",
    "./login.html",
    "./dashboard.html",
    "./style.css",
    "./script.js",

    // PRODUCT IMAGES
    "./image/Argentina Corned Beef.jpg",
    "./image/Ariel.JPG",
    "./image/Axion Dishwashing.jpg",
    "./image/BoyBawang.jpg",
    "./image/Chippy BBQ.jpg",
    "./image/Curls.png",
    "./image/Downy.jpg",
    "./image/FITA.png",
    "./image/HANSEL.png",
    "./image/Joy.jpg",
    "./image/Kopiko.jpg",
    "./image/Milo.jpg",
    "./image/Modess.jpg",
    "./image/Mountain Dew.jpg",
    "./image/Mr Muscle.jpg",
    "./image/Nestea.jpg",
    "./image/Nova.jpg",
    "./image/Palmolive.jpg",
    "./image/Pepsi.jpg",
    "./image/Sprite.jpg",
    "./image/Tide.jpg",

    // OTHER PRODUCTS
    "./image/brown.png",
    "./image/choco.png",
    "./image/closeup.png",
    "./image/colgate.jpg",
    "./image/cream.png",
    "./image/delmonte.png",
    "./image/denorado.png",
    "./image/ganador.png",
    "./image/headshoulders.jpg",
    "./image/hgardenia.png",
    "./image/hunts.jpg",
    "./image/jasmin.png",
    "./image/ligo.png",
    "./image/magic.png",
    "./image/mega-sardines.png",
    "./image/nivea.png",
    "./image/pantene.jpg",
    "./image/pepsodent.jpg",
    "./image/petroleum.jpg",
    "./image/piatos.png",
    "./image/pinoy.png",
    "./image/rexona.jpg",
    "./image/surf.png",
    "./image/toast.png",

    // DEFAULT IMAGE
    "./image/default.png"

];


/* ==========================================
   INSTALL SERVICE WORKER
   DOWNLOAD AND CACHE APP FILES
========================================== */

self.addEventListener("install", event => {

    event.waitUntil((async () => {

        const cache = await caches.open(CACHE_NAME);

        console.log("UNIMART: Starting offline installation...");

        const results = await Promise.allSettled(

            APP_FILES.map(async file => {

                const url = new URL(
                    file,
                    self.registration.scope
                ).href;

                const response = await fetch(url, {
                    cache: "reload"
                });

                if (!response.ok) {

                    throw new Error(
                        "HTTP " + response.status + ": " + file
                    );

                }

                await cache.put(
                    url,
                    response.clone()
                );

                console.log("CACHED SUCCESSFULLY:", file);

            })

        );

        let failed = 0;

        results.forEach((result, index) => {

            if (result.status === "rejected") {

                failed++;

                console.error(
                    "FAILED TO CACHE:",
                    APP_FILES[index],
                    result.reason
                );

            }

        });

        console.log(
            "UNIMART CACHE RESULT:",
            APP_FILES.length - failed,
            "successful;",
            failed,
            "failed."
        );

        await self.skipWaiting();

    })());

});


/* ==========================================
   ACTIVATE SERVICE WORKER
   DELETE OLD CACHE VERSIONS
========================================== */

self.addEventListener("activate", event => {

    event.waitUntil((async () => {

        const cacheNames = await caches.keys();

        await Promise.all(

            cacheNames.map(async cacheName => {

                if (
                    cacheName.startsWith("unimart-") &&
                    cacheName !== CACHE_NAME
                ) {

                    await caches.delete(cacheName);

                    console.log(
                        "OLD CACHE DELETED:",
                        cacheName
                    );

                }

            })

        );

        await self.clients.claim();

        console.log(
            "UNIMART SERVICE WORKER ACTIVATED!"
        );

    })());

});


/* ==========================================
   FETCH EVENT
   OFFLINE REQUEST HANDLER
========================================== */

self.addEventListener("fetch", event => {

    const request = event.request;

    // Only GET requests
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Ignore external websites
    if (url.origin !== self.location.origin) return;


    /* ======================================
       HTML PAGES
       NETWORK FIRST, CACHE FALLBACK
    ====================================== */

    if (request.mode === "navigate") {

        event.respondWith((async () => {

            try {

                const response = await fetch(request);

                if (response.ok) {

                    const cache = await caches.open(CACHE_NAME);

                    await cache.put(
                        request,
                        response.clone()
                    );

                }

                return response;

            } catch (error) {

                console.log(
                    "UNIMART OFFLINE: Loading cached page."
                );

                const cache = await caches.open(CACHE_NAME);

                const cachedPage = await cache.match(request);

                if (cachedPage) return cachedPage;

                // Dashboard fallback
                const dashboardURL = new URL(
                    "./dashboard.html",
                    self.registration.scope
                ).href;

                const dashboard = await cache.match(dashboardURL);

                if (dashboard) return dashboard;

                // Homepage fallback
                const homepageURL = new URL(
                    "./index.html",
                    self.registration.scope
                ).href;

                const homepage = await cache.match(homepageURL);

                if (homepage) return homepage;

                return new Response(
                    "UniMart page is not available offline. Please open it online first.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain"
                        }
                    }
                );

            }

        })());

        return;

    }


    /* ======================================
       PRODUCT IMAGES
       CACHE FIRST
    ====================================== */

    const isImage =
        /\.(png|jpe?g|webp|gif|svg|ico)$/i
        .test(url.pathname);

    if (isImage) {

        event.respondWith((async () => {

            const cache = await caches.open(CACHE_NAME);

            // Check cache first
            const cachedImage = await cache.match(request, {
                ignoreSearch: true
            });

            if (cachedImage) {

                console.log(
                    "IMAGE FROM OFFLINE CACHE:",
                    url.pathname
                );

                return cachedImage;

            }

            // If not cached, download from internet
            try {

                const response = await fetch(request);

                if (response.ok) {

                    await cache.put(
                        request,
                        response.clone()
                    );

                    console.log(
                        "IMAGE DOWNLOADED AND CACHED:",
                        url.pathname
                    );

                }

                return response;

            } catch (error) {

                console.error(
                    "IMAGE NOT AVAILABLE OFFLINE:",
                    url.pathname
                );

                return new Response(
                    "",
                    {
                        status: 404,
                        statusText: "Image not cached"
                    }
                );

            }

        })());

        return;

    }


    /* ======================================
       CSS, JAVASCRIPT AND STATIC FILES
       CACHE FIRST
    ====================================== */

    const isStatic =
        /\.(html|css|js|woff2?|ttf)$/i
        .test(url.pathname);

    if (isStatic) {

        event.respondWith((async () => {

            const cache = await caches.open(CACHE_NAME);

            const cachedFile = await cache.match(request);

            if (cachedFile) {

                return cachedFile;

            }

            try {

                const response = await fetch(request);

                if (response.ok) {

                    await cache.put(
                        request,
                        response.clone()
                    );

                }

                return response;

            } catch (error) {

                console.error(
                    "STATIC FILE NOT AVAILABLE:",
                    request.url
                );

                return new Response(
                    "File unavailable offline.",
                    {
                        status: 503
                    }
                );

            }

        })());

        return;

    }

});


/* ==========================================
   SERVICE WORKER READY
========================================== */

console.log(
    "UNIMART OFFLINE SERVICE WORKER LOADED!"
);




