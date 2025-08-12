// // scripts/importarHabilidadesDevto.js
// import fetch from 'node-fetch';
// import { conectarDB, desconectarDB } from '../config/db.js';
// import Habilidad from '../modules/skills/skills.model.js';

// const API_URL = 'https://dev.to/api/articles?per_page=30';

// async function importarTagsDesdeDevTo() {
//   try {
//     await conectarDB();

//     const res = await fetch(API_URL);
//     const articulos = await res.json();

//     const tagsSet = new Set();
//     articulos.forEach(article => {
//       article.tag_list.forEach(tag => tagsSet.add(tag.trim().toLowerCase()));
//     });

//     const tagsArray = Array.from(tagsSet);
//     console.log(`Tags únicos encontrados: ${tagsArray.length}`);

//     for (const tag of tagsArray) {
//       const yaExiste = await Habilidad.findOne({ nombre: tag });
//       if (!yaExiste) {
//         await Habilidad.create({ nombre: tag });
//         console.log(`✔️ Habilidad guardada: ${tag}`);
//       }
//     }

//     await desconectarDB();
//     console.log('✅ Importación finalizada');
//   } catch (error) {
//     console.error('❌ Error:', error);
//   }
// }

// importarTagsDesdeDevTo();
