const CACHE = "byc-descartables-v3-pwa-1";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* INSTALACIÓN */
self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())

  );

});


/* ACTIVACIÓN */
self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))

        );

      })
      .then(() => self.clients.claim())

  );

});


/* ACTUALIZACIÓN AUTOMÁTICA */
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  /*
    Para index.html y la página principal:
    SIEMPRE intentamos obtener la versión nueva
    desde GitHub.
  */

  if (
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/byc-descartables/")
  ) {

    event.respondWith(

      fetch(event.request, {
        cache: "no-store"
      })
      .then(response => {

        const copia = response.clone();

        caches.open(CACHE)
          .then(cache => {
            cache.put(event.request, copia);
          });

        return response;

      })
      .catch(() => {

        return caches.match(event.request);

      })

    );

    return;
  }


  /*
    Para los demás archivos:
    primero usamos caché y, si no existe,
    buscamos en Internet.
  */

  event.respondWith(

    caches.match(event.request)
      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then(response => {

            if (!response || response.status !== 200) {
              return response;
            }

            const copia = response.clone();

            caches.open(CACHE)
              .then(cache => {
                cache.put(event.request, copia);
              });

            return response;

          })
          .catch(() => cached);

      })

  );

});