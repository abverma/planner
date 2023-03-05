import express from 'express'
import moment from 'moment'
import mongoose from 'mongoose'
import path from 'path'
import passport from 'passport'
import { TaskCategoriesModel, 
    TaskModel, 
    CategoryScoreModel, 
    NoteModel, 
    MajorTaskModel
} from '../models/models'

let db: mongoose.Mongoose
let Task:any
let MajorTask: any

export default function (mongooose: mongoose.Mongoose, passport: passport.PassportStatic) {
    db = mongoose
    Task = TaskModel(db)
    MajorTask = MajorTaskModel(db)
    const router = express.Router()

    router.get('/tasks', async (req, res) => {
        const filter: any = req.query
        const limit = filter.limit
        delete filter['limit']
        if (filter['date']) {
            const selectedDate = new Date(filter['date'])
            const startDate = new Date()
            const endDate = new Date()

            startDate.setDate(selectedDate.getDate() - 1)
            endDate.setDate(selectedDate.getDate() + 1)
    
            filter['date'] = {
                $gt: startDate,
                $lt: endDate
            }
        }
        try {
            const result = await getTasks(filter, limit)
            res.send(result)
        }
        catch (e) {
            console.log(e)
        }
    })

    router.get('/searchTasks', async (req, res) => {
        debugger;
        const filter: any = req.query
        const limit = filter.limit
        delete filter['limit']
        try {
            const result = await searchTasks(filter.search, limit)
            res.send(result)
        }
        catch (e) {
            console.log(e)
        }
    })

    router.get('/majorTasks', async (req, res) => {
        const filter = req.query
        try {
            const result = await MajorTask.find(filter)
            res.send(result)
        }
        catch (e) {
            console.log(e)
        }
    })

    router.post('/majorTask', async (req, res) => {
        const task = req.body
        task.status = 'pending'
        task.creation_date = new Date()
        try {
            const newTask = new MajorTask(task)
            const result = await newTask.save()
            res.send(result)
        }
        catch (e) {
            console.log(e)
        }
    })

    router.get('/note', async (req, res) => {
        const filter: any = req.query
        if (filter['date']) {
            const selectedDate = new Date(filter['date'])
    
            filter['date'] = {
                $gte: moment(selectedDate).startOf('day').format(),
                $lt: moment(selectedDate).endOf('day').format()
            }
        }
        try {
            const result = await getNote(filter)
            res.send(result ? result : {})
        }
        catch (e) {
            console.log(e)
        }
    })

    router.post('/task', async (req, res) => {
        const task = req.body
        try {
            const result = await addTask(task)
            if (result) {
                res.send(result)
            }
        } 
        catch(e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.put('/note', async (req, res) => {
        const note = req.body
        try {
            const result = await addNote(note)
            if (result) {
                res.send(result)
            }
        } 
        catch(e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.get('/frequestTasks', async (req, res) => {
        const filter: any = req.query
        const currentDate = new Date()
        const startDate = new Date()
        startDate.setDate(currentDate.getDate() - 7)
        const pipelines = [
            {
                $match: {
                    date: {
                        $gte: startDate,
                        $lte: currentDate
                    }
                }
            },
            {
                $group: {
                    _id: '$subject',
                    count: {
                        $sum: 1 
                    }
                }
            }, 
            {
                $addFields: {
                    subject: '$_id'
                }
            }, 
            {
                $unset: '_id'
            },
            {
                $sort: {
                    count: -1
                }
            },
            {
                $limit: 10
            }
        ]
    
        try {
            const result = await aggregate(pipelines)
            res.send(result)
        }
        catch (e) {
            console.log(e)
        }
    })

    router.delete('/tasks', async (req, res) => {
        const taskIds = req.body
        try {
            const result = await deleteMany({
                _id: {
                    $in: taskIds
                }
            })
            if (result) {
                res.send(result)
            }
        } 
        catch(e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.delete('/majorTasks', async (req, res) => {
        const taskIds = req.body
        try {
            const result = await MajorTask.deleteMany({
                _id: {
                    $in: taskIds
                }
            })
            if (result) {
                res.send(result)
            }
        } 
        catch(e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.put('/majorTasks', async (req, res) => {
        const {ids, status} = req.body
        try {
            const result = await MajorTask.updateMany({
                _id: {
                    $in: ids
                }
            }, {
                $set: {
                    status,
                    completion_date: new Date()
                }
            })

            const updatedRecs = await MajorTask.find({
                _id: {
                    $in: ids
                }
            })
            const temp = updatedRecs.map((x: any) => {
                return {
                    subject: x.subject,
                    score: x.score,
                    creation_date: new Date(),
                    date: new Date(),
                    category: 'misc'
                }
            })
            await Task.insertMany(temp)
            if (result) {
                res.send(result)
            }
        } 
        catch(e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.get('/getStats', async (req, res) => {
        try {
            const stat: any = {}
            const doc = await getTasks({}, 1)
            stat.lastTask = doc.length ? doc[0] : {}
    
            let startDate = new Date()
            startDate.setDate(startDate.getDate() - 7)
            const pipelines = [
                {
                    $match: {
                        date: {
                            $gte: startDate,
                        },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        total: {
                            $sum: '$score',
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        averageScore: {
                            $avg: '$total',
                        },
                    },
                },
            ]
            const weeklyAggr = await aggregate(pipelines)
            stat.weeklyAggr = weeklyAggr
    
            startDate.setDate(new Date().getDate() - 31)

            pipelines[0] = {
                '$match': {
                    date: {
                        $gte: startDate,
                    }
                }
            }
            const monthlyAggr = await aggregate(pipelines)
            stat.monthlyAggr = monthlyAggr
            res.send(stat)
        }
        catch (e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.get('/refactorData', (req, res) => {
        try {
            refactorData()
            res.send({
                status: 'in progress'
            })
        }
        catch (e) {
            console.log(e)
        }
    })

    router.get('/login', (req, res) => {
        res.render('login')
    })

    router.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'))
    })

    router.post('/login', passport.authenticate('local', { 
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))

    router.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    router.post('/taskCategories', async (req, res) => {
        try {
            const result = await addTaskCategories(req.body)
            res.send(result)
        }
        catch (e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.get('/taskCategories', async (req, res) => {
        try {
            const query: any = req.query
            const result = await getTaskCategories(query.subject)
            res.send(result)
        }
        catch (e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.get('/analytics', async (req, res) => {
        try {
            console.log(moment().subtract(30, 'days').format().split('T')[0])
            const pipelines = [
                {
                    $match: {
                        date: {
                            $gte: new Date(moment().subtract(30, 'days').format().split('T')[0])
                        }, 
                        $and: [
                            {
                                category: {
                                    $exists: true
                                }
                            }
                        ]
                    }
                }, 
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]
            const result = await aggregate(pipelines)
            res.send(result)
        }
        catch (e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    router.get('/categories', async (req, res) => {
        try {
            const categoryModel = CategoryScoreModel(db)
            res.send(await categoryModel.find({}).sort({category: 1}))
        }
        catch (e) {
            console.log(e)
            res.status(500).send({ error: e })
        }

    })
    
    router.post('/categories', async (req, res) => {
        try {
            const newCategories = req.body
            const categoryModel = CategoryScoreModel(db)
            const result = await categoryModel.insertMany(newCategories)
            res.send(result)
        }
        catch (e) {
            console.log(e)
            res.status(500).send({ error: e })
        }
    })

    return router
}

const sanitizeSubject = (subject: string): any => {
    const r = /\d+/
    let multiplier = 1
    const match = subject.match(r)
    let returnSubject = subject.slice()
    if (match) {
        multiplier *= match[0] ? parseInt(match[0]) : 1
        if (multiplier != 1) {
            returnSubject = returnSubject.replace(multiplier + '', '').replace(' x ', '')
        }
    } 
    return {
        subject: returnSubject,
        multiplier
    }
}

const prepareFrequentTaskMap = (result: any) => {
    const taskMap : { [name: string]: number} = {}

    result.forEach((task: any) => {
        if (taskMap[task.subject]) {
            taskMap[task.subject]++
        } else {
            taskMap[task.subject] = 1
        }
    })
    let highestCount = 1
    for (const key in taskMap) {
        if (taskMap[key] > highestCount) {
            highestCount = taskMap[key]
        }
    }
    const frequestTasks: { [name: string]: number}= {}
    for (let i = highestCount; i > 0 && Object.keys(frequestTasks).length < 7; i--) {
        for (const key in taskMap) {
            if (taskMap[key] === i) {
                frequestTasks[key] = i
            }
        }
    }
    console.log(JSON.stringify(frequestTasks))
    return frequestTasks
}

const addTask = async (task: any) => {
    try {
        if (!task.subject) {
            return Promise.reject({
                validationError: true,
                error: 'Subject not found'
            })
        }
        let score = 0
        task.subject = task.subject.trim()
        const {subject, multiplier } = sanitizeSubject(task.subject)
        const taskCategoriesModel = TaskCategoriesModel(db)
        const categoryScoreModel = CategoryScoreModel(db)
        let categoryDoc = await taskCategoriesModel.findOne({
            subject: subject
        })
        if (!categoryDoc) {
            categoryDoc = await taskCategoriesModel.findOne({
                subject: subject.toLowerCase()
            })
        }
        if (!task.score) {
            const scores = await categoryScoreModel.find({})
            if (!scores.length) {
                return Promise.reject({
                    validationError: true,
                    error: 'Scores not found'
                })
            }
            if (scores.length && categoryDoc) {
                const categoryScore = scores.find(x => categoryDoc && x.category.toLowerCase() == categoryDoc.get('category').toLowerCase())
                if (categoryScore) {
                    score = categoryScore.score
                }
            }
            if (!score) {
                return Promise.reject({
                    validationError: true,
                    error: 'Score not found for ' + task.subject
                })
            }
            task.score = score * multiplier
        }
        
        task.creation_date = new Date()
        if (!task.category) {
            task.category = categoryDoc?.category
        }
        const newTask = new Task(task)
        return newTask.save()
    } 
    catch (e) {
        console.log(e)
        return Promise.reject({
            error: e
        })
    }
}

const getTasks = async (query: object, limit?: number, skip = 0) => {
    return limit ? Task.find(query).sort([['_id', -1]]).skip(skip).limit(limit) : Task.find(query).sort([['_id', -1]]).skip(skip)
}

const searchTasks = async (search: string, limit?: number, skip = 0) => {
    const query = {
        $or: [{
            subject: { $regex: search, $options: 'i' }
        }, {
            category: { $regex: search, $options: 'i' }
        }]
    }
    
    return limit ? Task.find(query).sort([['_id', -1]]).skip(skip).limit(limit) : Task.find(query).sort([['_id', -1]]).skip(skip)
}

const getNote = async (query: object, limit?: number, skip = 0) => {
    const Note = NoteModel(db)
    return Note.findOne(query)
}

const deleteMany = async (query: object) => {
    return Task.deleteMany(query)
}

const aggregate = async (pipelines: object[]) => {
    return Task.aggregate(pipelines)
}

const refactorData = async () => {
    let skip = 0
    const count = await Task.count({})
    const taskCategoriesModel = TaskCategoriesModel(db)
    const taskCategories = await taskCategoriesModel.find({})
    let remaining = count
    for (let i = 0; i < count && remaining > 0; i++, skip++) {
        let task = await Task.find({
            'category': { 
                $exists: false 
            }
        }).skip(skip).limit(1)
        remaining = task.length
        if (remaining) {
            const x = task[0]
            const sanitizedSubject = sanitizeSubject(x.get('subject')).subject
            console.log(x.subject)
            // console.log(x.score)
            const match = taskCategories.find((t: any) => {
                if (x.subject) {
                    return t.subject.toLowerCase() == sanitizedSubject.toLowerCase()
                }
                return false
            })
            if (match) {
                x.category = match.category
                console.log('updating all ', x.subject, ' with category ', x.category)
                console.log(JSON.stringify(x))
                await Task.updateMany({
                    subject: x.subject
                }, {
                    $set: {
                        category: x.category
                    }
                })
            } else {
                console.log('category not found')
            }
        }
    }
}

const addNote = async (note: any) => {
    note.creation_date = new Date()
    const Note = NoteModel(db)
    return Note.updateOne({
        date: new Date(note.date).toISOString().split('T')[0]
    },{
        $set: {
            note: note.note,
            date: new Date(note.date).toISOString().split('T')[0],
            creation_date: new Date()
        }
    }, {
        upsert: true
    })
}

const addTaskCategories = (taskCategories: any) => {
    const taskCategoriesModel = TaskCategoriesModel(db)
    return taskCategoriesModel.insertMany(taskCategories)
}

const getTaskCategories = (search: string) => {
    const taskCategoriesModel = TaskCategoriesModel(db)
    return taskCategoriesModel.find({
        $or: [{
            subject: { $regex: search, $options: 'i' }
        }, {
            category: { $regex: search, $options: 'i' }
        }]
    })
}