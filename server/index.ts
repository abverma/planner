import express from 'express'
import { json, urlencoded } from 'body-parser'
import mongoose from 'mongoose'
import moment from 'moment'
import path from 'path'
import TaskRouter  from './routes/task'
import debug from 'debug'
import passport from 'passport'
import session from 'express-session'
import flash from 'express-flash'
import { engine }  from 'express-handlebars'
import configurePassport from './passport'

const log = debug('app')
const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '192.168.1.2:27017'
const DB = process.env.DB || 'planner'
const DBLINK: string = `mongodb://${HOST}/${DB}`


configurePassport(passport, mongoose)
app.use(urlencoded({ extended: false }))
app.use(json())
app.engine('handlebars', engine())
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'handlebars')
app.use((req, res, next) => {
    log(req.method + ' ' + req.path)
    next()
})
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}))
app.use(passport.authenticate('session'))
app.use(flash())
app.use((req, res, next) => {
    log('user logged in: %s', req.isAuthenticated())
    if (process.env.NODE_ENV === 'development') {
        next()
    } else if (!req.isAuthenticated() && req.path !== '/login') {
        res.redirect('/login')
    } else {
        log('skipping login')
        next()
    }
})
app.use(express.static(path.join(__dirname, '../client/dist/style/')))
app.use(express.static(path.join(__dirname, '../client/dist/')))
app.use('/', TaskRouter(mongoose, passport))

app.listen(PORT, async () => {
    log('Server listening at', PORT)
    try {
        log('Connecting to database ', DBLINK)
        await mongoose.connect(DBLINK)
        log('Connected to database')
    }
    catch(e) {
        log('Could not connect to database')
        log(e)
    }
})