const { User } = require('../models');
const { CustomException } = require('../utils');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, NODE_ENV } = process.env;
const saltRounds = 10;

const authRegister = async (request, response) => {
    console.log('📝 Register request received');
    console.log('Request body:', request.body);
    
    const { username, email, phone = '', password, image = '', isSeller = false, description = '' } = request.body;
    
    // Get IP for country detection (опционально)
    const list = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const ips = list ? list.split(',') : ['127.0.0.1'];
    let country = 'Unknown';
    
    try {
        // Проверка обязательных полей
        if (!username || !email || !password) {
            console.log('Missing required fields');
            return response.status(400).send({
                error: true,
                message: 'Username, email and password are required!'
            });
        }
        
        // Проверка существующего пользователя
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.log('User already exists:', email);
            return response.status(400).send({
                error: true,
                message: 'User with this email or username already exists!'
            });
        }
        
        // Хэширование пароля
        const hash = bcrypt.hashSync(password, saltRounds);
        
        // Попытка определить страну (опционально, не критично)
        try {
            const satelize = require('satelize');
            const result = await new Promise((resolve) => {
                satelize.satelize({ ip: ips[0] }, (error, payload) => {
                    if (payload && payload.country) {
                        resolve(payload.country.en || 'Unknown');
                    } else {
                        resolve('Unknown');
                    }
                });
            });
            country = result;
        } catch (err) {
            console.log('Country detection failed, using default');
        }
        
        // Создание пользователя
        const user = new User({
            username,
            email,
            password: hash,
            image: image || '',
            country: country,
            description: description || '',
            isSeller: isSeller === true || isSeller === 'true',
            phone: phone || ''
        });
        
        await user.save();
        console.log('✅ User created successfully:', user._id);
        
        // Создание JWT токена для автоматического входа после регистрации
        const token = jwt.sign({
            _id: user._id,
            isSeller: user.isSeller
        }, JWT_SECRET, { expiresIn: '7 days' });
        
        const { password: _, ...userData } = user._doc;
        
        const cookieConfig = {
            httpOnly: true,
            sameSite: NODE_ENV === 'production' ? 'none' : 'strict',
            secure: NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
            path: '/'
        };
        
        return response.cookie('accessToken', token, cookieConfig)
            .status(201)
            .send({
                error: false,
                message: 'User created successfully!',
                user: userData,
                token
            });
            
    } catch(error) {
        console.error('❌ Registration error:', error);
        
        if(error.message && error.message.includes('E11000')) {
            return response.status(400).send({
                error: true,
                message: 'Username or email already exists!'
            });
        }
        
        return response.status(500).send({
            error: true,
            message: error.message || 'Something went wrong during registration!'
        });
    }
};

const authLogin = async (request, response) => {
    console.log('🔐 Login request received');
    const { username, password } = request.body;
    
    if (!username || !password) {
        return response.status(400).send({
            error: true,
            message: 'Username and password are required!'
        });
    }
    
    try {
        const user = await User.findOne({ username });
        if(!user) {
            console.log('User not found:', username);
            return response.status(404).send({
                error: true,
                message: 'Check username or password!'
            });
        }
        
        const match = bcrypt.compareSync(password, user.password);
        if(match) {
            console.log('✅ Login successful:', username);
            const { password, ...data } = user._doc;
            
            const token = jwt.sign({
                _id: user._id,
                isSeller: user.isSeller
            }, JWT_SECRET, { expiresIn: '7 days' });
            
            const cookieConfig = {
                httpOnly: true,
                sameSite: NODE_ENV === 'production' ? 'none' : 'strict',
                secure: NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 * 1000,
                path: '/'
            };
            
            return response.cookie('accessToken', token, cookieConfig)
                .status(200)
                .send({
                    error: false,
                    message: 'Login successful!',
                    user: data,
                    token
                });
        }
        
        console.log('Invalid password for user:', username);
        return response.status(404).send({
            error: true,
            message: 'Check username or password!'
        });
        
    } catch(error) {
        console.error('Login error:', error);
        return response.status(500).send({
            error: true,
            message: error.message || 'Something went wrong during login!'
        });
    }
};

const authLogout = async (request, response) => {
    return response.clearCookie('accessToken', {
        sameSite: 'none',
        secure: true,
        path: '/'
    })
    .send({
        error: false,
        message: 'User has been logged out!'
    });
};

const authStatus = async (request, response) => {
    try {
        const user = await User.findOne({ _id: request.userID }).select('-password');
        
        if(!user) {
            return response.status(404).send({
                error: true,
                message: 'User not found!'
            });
        }
        
        return response.send({
            error: false,
            message: 'Success!',
            user
        });
    } catch(error) {
        return response.status(500).send({
            error: true,
            message: error.message || 'Something went wrong!'
        });
    }
};

module.exports = {
    authLogin,
    authLogout,
    authRegister,
    authStatus
};