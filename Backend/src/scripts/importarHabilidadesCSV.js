import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

import { conectarDB, desconectarDB } from '../config/db.js';
import Habilidad from '../modules/skills/skills.model.js';

async function importarDesdeCSV() {
    try {
        await conectarDB();

        const filePath = path.resolve('scripts/habilidades.csv');
        const habilidades = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.nombre && row.nombre.trim() !== '') {
                        habilidades.push({
                            nombre: row.nombre.trim().toLowerCase(),
                            fuente: row.fuente ? row.fuente.trim() : 'desconocida',
                        });
                    }
                })
                .on('end', () => {
                    console.log(`Archivo CSV leído. ${habilidades.length} habilidades encontradas.`);
                    resolve();
                })
                .on('error', reject);
        });

        for (const hab of habilidades) {
            const existe = await Habilidad.findOne({ nombre: hab.nombre });
            if (!existe) {
                try {
                    await Habilidad.create(hab);
                    console.log(`✔️ Habilidad guardada: ${hab.nombre} - Fuente: ${hab.fuentee}`);
                } catch (err) {
                    console.error(`❌ Error al guardar ${hab.nombre}:`, err.message);
                }
            }
        }

        await desconectarDB();
        console.log('✅ Importación desde CSV finalizada');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

importarDesdeCSV();
