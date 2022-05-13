import express from 'express'
import { json, urlencoded } from 'body-parser'
import mongoose from 'mongoose'
import moment from 'moment'
import path from 'path'
import { TaskRouter } from './routes'
import BaseModel from './baseModel'

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '192.168.1.28:27017'
const DB = process.env.DB || 'planner'
const DBLINK: string = `mongodb://${HOST}/${DB}`
let tasks: TaskRouter = new TaskRouter(new BaseModel(mongoose))

app.use(urlencoded({ extended: false }))
app.use(json())
app.use((req, res, next) => {
    console.log(req.method, req.path)
    next()
})
app.use(express.static(path.join(__dirname, '../public/style/')))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'))
})
app.get('/tasks', async (req, res) => {
    const filter: any = req.query
    if (filter['date']) {
        const selectedDate = new Date(filter['date'])

        filter['date'] = {
            $gte: moment(selectedDate).startOf('day').format(),
            $lt: moment(selectedDate).endOf('day').format()
        }
    }
    try {
        const result = await tasks.getTasks(filter)
        res.send(result)
    }
    catch (e) {
        console.log(e)
    }
})
app.post('/task', async (req, res) => {
    const task = req.body
    try {
        const result = await tasks.addTask(task)
        if (result) {
            res.send(result)
        }
    } 
    catch(e) {
        console.log(e)
        res.status(500).send({ error: e })
    }
})
app.get('/frequestTasks', async (req, res) => {
    const filter: any = req.query
    const maxDate = new Date().getDate()
    const minDate = maxDate - 7
    const limit = 10

    filter['date'] = {
        $gte:moment().subtract(7, 'days').format(),
        $lte:  moment().format()
    }

    try {
        const result = await tasks.getTasks(filter, limit)
        if (result.length) {
            const frequentTasks = prepareFrequentTaskMap(result)
            res.send(frequentTasks)
        } else {
            res.send({})
        }
    }
    catch (e) {
        console.log(e)
    }
})
app.delete('/tasks', async (req, res) => {
    const taskIds = req.body
    try {
        const result = await tasks.delete({
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
app.get('/getStats', async (req, res) => {
    try {
        const stat: any = {}
        const doc = await tasks.getTasks({}, 1)
        stat.lastTask = doc.length ? doc[0] : {}

        let startDate = moment().startOf('week').format().split('T')[0]
        const pipelines = [
            {
                $match: {
                    date: {
                        $gte: new Date(startDate),
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    score: {
                        $sum: '$score',
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    averageScore: {
                        $avg: '$score',
                    },
                },
            },
        ]
        const weeklyAggr = await tasks.aggregate(pipelines)
        stat.weeklyAggr = weeklyAggr

        startDate = moment().startOf('month').format().split('T')[0]
        pipelines[0] = {
            '$match': {
                date: {
                    $gte: new Date(startDate),
                }
            }
        }
        const monthlyAggr = await tasks.aggregate(pipelines)
        stat.monthlyAggr = monthlyAggr
        res.send(stat)
    }
    catch (e) {
        console.log(e)
        res.status(500).send({ error: e })
    }
})

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

app.listen(PORT, async () => {
    console.log('Server listening at', PORT)
    try {
        console.log('Connecting to database ', DBLINK)
        await mongoose.connect(DBLINK)
        console.log('Connected to database')
    }
    catch(e) {
        console.log('Could not connect to database')
        console.log(e)
    }
})