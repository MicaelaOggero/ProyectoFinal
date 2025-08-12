import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Cargar variables desde el archivo .env

const MONGO_URI = process.env.MONGO_URI;

export async function conectarDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conexión a la base de datos establecida');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    process.exit(1); // Termina el proceso si la conexión falla
  }
}

export async function desconectarDB() {
  try {
    await mongoose.disconnect();
    console.log('🔌 Conexión a la base de datos cerrada');
  } catch (error) {
    console.error('❌ Error al desconectar la base de datos:', error.message);
  }
}
