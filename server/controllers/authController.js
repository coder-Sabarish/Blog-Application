const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const db = require('../db');


exports.signup = async (req, res) => {
    const client = await db.connect();
    try{
        if(req.body.userType === 'admin' || req.body.userType === 'moderator'){
            return res.status(401).json({
                status:'error',
                message: 'You cant create admin and moderator.'
            });
        }
        const userCreated = new Date();
        const lastLogin = new Date();
        const password = await bcrypt.hash(req.body.password,12);
        const newUser = await client.query(`insert into "User" ("userName", "profilePic","firstName","lastName","emailAddress","password","userType","userCreatedDate","lastLogin") values($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [req.body.userName,req.body.profilePic,req.body.firstName, req.body.lastName, req.body.emailAddress,password,req.body.userType,userCreated,lastLogin]);
        const token = jwt.sign({userName: req.body.userName}, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
        res.status(201).json({
            status: 'success',
            token,
            data: newUser.rows,
        });
    } catch(err){
        res.status(400).json({
            status:'error',
            message: err
        });
    }
};

exports.login = async (req, res) => {
    const { userName, password} = req.body;
    if(!userName || !password){
        return res.status(400).json({
            status:'error',
            message: 'Please provide email & password!'
        });
    }
    const client = await db.connect();
    try{
        const user = await client.query(`select * from "User" where "userName" = $1`, [userName]);
        // user = user.rows;
        if(user.rows.length == 0){
            return res.status(400).json({
                status:'error',
                message: 'No User found with that name'
            });
        }

        if( !await bcrypt.compare(password,user.rows[0].password)) {
            return res.status(401).json({
                status:'error',
                message: 'Incorrect password or username'
            });
        }
        
        const token = jwt.sign({userName}, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
        res.status(201).json({
            status: 'success',
            token,
            data: {
                user:user.rows
            },
        });
    } catch(err) {
        res.status(400).json({
            status:'error',
            message: err
        });
    }
};

exports.protect = async (req, res, next) => {
    try{
        let token;
        const client = await db.connect();
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({
                status:'error',
                message: 'You are not logged in! Please log in to get access'
            });
        }

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const user = await client.query(`select * from "User" where "userName" = $1`, [decoded.userName]);

        if(!user){
            return res.status(401).json({
                status:'error',
                message: 'The token belonging to this user no longer exists'
            });
        }
        
        req.user = user.rows[0];
        next();
        
    } catch(err) {
        console.log(err);
        res.status(400).json({
            status:'error',
            message: err
        });
    }
    

}

exports.restrictTo = 
    (...roles) => 
    (req, res, next) => {
        
        next();
    }