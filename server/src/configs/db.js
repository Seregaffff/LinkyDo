const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const connect = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log('📡 Connection string:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('✅ MongoDB connected successfully!');
        console.log('📊 Database name:', mongoose.connection.name);
        
        return mongoose.connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:');
        console.error('Error message:', error.message);
        console.error('Please check:');
        console.error('1. Is MongoDB running? Run "net start MongoDB" as admin');
        console.error('2. Is the connection string correct in .env file?');
        console.error('3. Try using MongoDB Atlas instead');
        
        // Не выбрасываем ошибку, чтобы сервер запустился
        console.log('⚠️ Server will continue without database (some features will not work)');
        return null;
    }
};

module.exports = connect;