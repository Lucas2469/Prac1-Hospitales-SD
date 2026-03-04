import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const wipeDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // drop the whole database
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Base de datos borrada exitosamente');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al borrar DB:', error);
        process.exit(1);
    }
};

wipeDB();
