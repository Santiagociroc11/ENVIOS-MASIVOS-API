import mongoose from 'mongoose';

const ebookSchema = new mongoose.Schema({}, { strict: false });
// Usar la colección correcta que contiene los datos reales
const Ebook = mongoose.model('Ebook', ebookSchema, 'bot-win+2');

export default Ebook;