// src/utils/scraperScript.js
export const CLC_SCRAPER_SCRIPT = `(async function() {
    // 1. Inicializar o recuperar el estado
    let estado = JSON.parse(localStorage.getItem('clc_scraper_state')) || { activo: true, datos: [] };
    
    // 2. Crear el botón flotante visual para saber cuántos van
    const btnRespaldo = document.createElement('button');
    btnRespaldo.innerHTML = '📥 COPIANDO: ' + estado.datos.length;
    btnRespaldo.style = 'position:fixed;top:10px;right:10px;z-index:9999;padding:15px;background:#ff5722;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;box-shadow:0 4px 6px rgba(0,0,0,0.3);';
    document.body.appendChild(btnRespaldo);

    const copiarAlPortapapeles = (texto) => {
      const el = document.createElement('textarea');
      el.value = texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    };

    // Al hacer clic manual en el botón naranja se copia lo que lleve
    btnRespaldo.onclick = () => {
      const json = JSON.stringify(estado.datos, null, 2);
      copiarAlPortapapeles(json);
      alert('Copiados ' + estado.datos.length + ' productos al portapapeles.');
    };

    const extraerYPasar = async () => {
      console.log("📦 Extrayendo productos...");
      const columnas = document.querySelectorAll('.productSearchColumn');
      
      columnas.forEach(col => {
        const titulo = col.querySelector('.productSearchTitle strong')?.innerText.trim();
        const precioText = col.querySelector('.productSearchPrice')?.innerText;
        const enlace = col.querySelector('a')?.href || '';
        
        if (titulo && precioText) {
          // Limpieza de precio para QBO
          const precio = parseFloat(precioText.replace('B/.', '').replace(/\\s/g, '').trim()) || 0;
          
          // Extracción de SKU limpia
          const skuMatch = enlace.match(/(\\d{10,13})/);
          const sku = skuMatch ? skuMatch[1] : enlace.split('-').pop();
          
          if (!estado.datos.some(p => p.sku === sku)) {
            estado.datos.push({ 
                nombre: titulo, 
                sku: sku, 
                precio_venta: precio 
            });
          }
        }
      });

      // Guardar progreso en el navegador
      localStorage.setItem('clc_scraper_state', JSON.stringify(estado));
      btnRespaldo.innerHTML = '📥 COPIAR ' + estado.datos.length + ' PRODUCTOS';

      // Lógica de Navegación (Buscar el botón de la página siguiente)
      const botonActual = document.querySelector('.currentPage');
      const numActual = botonActual ? parseInt(botonActual.innerText) : 1;
      const siguiente = numActual + 1;
      const botones = Array.from(document.querySelectorAll('.switchPage'));
      const btnSiguiente = botones.find(b => b.innerText.trim() === siguiente.toString());

      if (btnSiguiente) {
        console.log('➡️ Moviendo a página ' + siguiente + '...');
        btnSiguiente.click();
      } else {
        console.log('🏁 Fin de la lista.');
        finalizar();
      }
    };

    const finalizar = () => {
      const json = JSON.stringify(estado.datos, null, 2);
      copiarAlPortapapeles(json);
      localStorage.removeItem('clc_scraper_state');
      btnRespaldo.style.background = '#4caf50';
      btnRespaldo.innerHTML = '✅ TODO COPIADO';
      alert('¡TERMINADO! ' + estado.datos.length + ' productos copiados. Pégalos en tu App.');
    };

    // Observador para detectar cuando la página cambia y volver a extraer
    const paginador = document.getElementById('searchResultsPaging');
    if (paginador) {
        const target = paginador.parentNode;
        const observer = new MutationObserver(async () => {
          observer.disconnect();
          await new Promise(r => setTimeout(r, 2500)); // Espera a que carguen las fotos/precios
          await extraerYPasar();
          observer.observe(target, { childList: true, subtree: true });
        });
        observer.observe(target, { childList: true, subtree: true });
    }

    // Primera ejecución
    await extraerYPasar();
})();`;