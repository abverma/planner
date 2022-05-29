const addBtn = document.getElementById('addBtn')
const selectBtn = document.getElementById('selectBtn')
const deleteBtn = document.getElementById('deleteBtn')
const taskList = document.getElementById('taskList')
const newTask = document.getElementById('newTask')
const dailyNote = document.getElementById('dailyNote')
const selectedDate = document.getElementById('selectedDate')
const errorSpan = document.getElementById('errorSpan')
const errorSection = document.getElementById('errorSection')
const totalSpan = document.getElementById('total')
const frequentHeader = document.getElementById('frequentHeader')
const lastTask = document.getElementById('lastTask')
const weeklyAvg = document.getElementById('weeklyAvg')
const monthlyAvg = document.getElementById('monthlyAvg')
const currentTasks = []
let totalDailyScore = 0
let selectedDateValue = formatDate(new Date().toISOString())
let checkedCount = 0

selectedDate.value = selectedDateValue

addBtn.addEventListener('click', (e) => {
	e.preventDefault()
	if (newTask.value) {
		addNewTask(newTask.value)
	}
})

deleteBtn.addEventListener('click', (e) => {
	e.preventDefault()
	idsToDelete = []
	if (taskList.hasChildNodes()) {
		taskList.childNodes.forEach((li) => {
			if (li.hasChildNodes()) {
                const div = li.childNodes[0]
				const checkboxKey = Object.keys(div.childNodes).find((key) => {
					const child = div.childNodes[key]
					return child.tagName === 'INPUT' && child.type === 'checkbox'
				})
				if (div.childNodes[checkboxKey].checked) {
					idsToDelete.push(li.getAttribute('mongo_id'))
				}
			}
		})
	}
	const confirmDelete = confirm('Are you sure that you want to delete selected tasks?')
	console.log(confirmDelete)
	if (confirmDelete) {
		deleteTasks(idsToDelete)
		getTasksForSelectedDate()
	}
})

selectBtn.addEventListener('click', (e) => {
	e.preventDefault()
	if (taskList.hasChildNodes()) {
		taskList.childNodes.forEach((li) => {
			if (li.hasChildNodes()) {
				const checkboxKey = Object.keys(li.childNodes).find((key) => {
					const child = li.childNodes[key]
					return child.tagName === 'INPUT'
				})
				li.childNodes[checkboxKey].checked = true
				deleteBtn.disabled = false
			}
		})
	}
})

newTask.addEventListener('keydown', (e) => {
	if (newTask.value && e.code == 'Enter' && e.key == 'Enter') {
		e.preventDefault()
		console.log(e.target.value)
		addNewTask(e.target.value)
		return false
	}
})

dailyNote.addEventListener('keydown', (e) => {
	if (dailyNote.value && e.code == 'Enter' && e.key == 'Enter') {
		e.preventDefault()
		console.log(e.target.value)
		upsertNote(e.target.value)
		return false
	}
})

selectedDate.addEventListener('change', (e) => {
	selectedDateValue = e.target.value
	getTasksForSelectedDate()
	getNoteForSelectedDate()
})

const addNewTask = async (task) => {
	errorSpan.innerHTML = ''
	errorSection.style.display = 'none'
	try {
		await createTask(task)
	} catch (e) {
		errorSection.style.display = 'block'
		errorSpan.innerHTML = e
	}
	newTask.value = ''
}

const populateList = (tasks) => {
	getStats()
	taskList.innerHTML = ''
	totalDailyScore = 0
	checkedCount = 0
	selectBtn.disabled = true
	deleteBtn.disabled = true
	tasks.forEach((element) => {
		if (element.name || element.subject) {
			const name = element.name || element.subject
			const score = element.score || ''
			const lI = document.createElement('li')
            lI.setAttribute('mongo_id', element._id)
			lI.setAttribute('class', 'list-group-item d-flex justify-content-between')

            const div = document.createElement('div')

			const checkbox = document.createElement('input')
			checkbox.setAttribute('type', 'checkbox')
			checkbox.setAttribute('class', 'form-check-input me-2')
			checkbox.addEventListener('change', (e) => {
				if (e.target.checked) {
					checkedCount++
				} else {
					checkedCount--
				}
				if (checkedCount) {
					deleteBtn.disabled = false
				} else {
					deleteBtn.disabled = true
				}
			})
			div.appendChild(checkbox)

			const subjectSpan = document.createElement('span')
			subjectSpan.innerHTML = element.subject
			div.appendChild(subjectSpan)
            lI.appendChild(div)

            const badge = document.createElement('span')
            badge.innerHTML = element.score
            badge.setAttribute('class', 'badge bg-primary rounded-pill')
			lI.appendChild(badge)
			
			taskList.appendChild(lI)
			totalDailyScore += parseInt(score)
		}
	})
	if (tasks.length) {
		selectBtn.disabled = false
	}
	totalSpan.innerHTML = 'Total: ' + totalDailyScore
}

const populateFrequentTask = (tasks) => {
	console.log(tasks)
	frequentHeader.innerHTML = ''
	Object.keys(tasks).forEach((task) => {
		const div = document.createElement('div')
		div.setAttribute('class', 'col-auto mb-2')
		const btn = document.createElement('button')
		btn.innerHTML = task
		btn.value = task
		btn.setAttribute('class', 'btn btn-sm btn-outline-dark form-control')
		btn.setAttribute('type', 'button')
		btn.addEventListener('click', (e) => {
            e.preventDefault()
			addNewTask(e.target.value)
            return false
		})
		div.appendChild(btn)
		frequentHeader.appendChild(div)
	})
}

const getTasksForSelectedDate = () => {
	fetch('/tasks?date=' + selectedDateValue)
		.then((resp) => {
			return resp.json()
		})
		.then((tasks) => {
			populateList(tasks)
		})
		.catch((e) => {
			console.log(e)
		})
}

const getNoteForSelectedDate = () => {
	dailyNote.value = null
	fetch('/note?date=' + selectedDateValue)
		.then((resp) => {
			return resp.json()
		})
		.then((note) => {
			dailyNote.value = note.note 
		})
		.catch((e) => {
			console.log(e)
		})
}

const createTask = async (task) => {
	try {
		const resp = await fetch('/task', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
			},
			body: JSON.stringify({
				subject: task,
				date: selectedDateValue,
			}),
		})
		if (resp.ok) {
			console.log('Task added')
			getTasksForSelectedDate()
		} else {
			console.log(resp.body)
			const result = await resp.json()
            throw result.error
		}
	} catch (e) {
		console.log(e)
        if (e.validationError) {
            throw e.error
        }
	}
}

const upsertNote = async (note) => {
	try {
		const resp = await fetch('/note', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
			},
			body: JSON.stringify({
				note,
				date: selectedDateValue,
			}),
		})
		if (resp.ok) {
			console.log('Note updated')
		} else {
			console.log(resp.body)
			const result = await resp.json()
            throw result.error
		}
	} catch (e) {
		console.log(e)
        if (e.validationError) {
            throw e.error
        }
	}
}

const getFrequentTasks = () => {
	fetch('/frequestTasks')
		.then((resp) => {
			return resp.json()
		})
		.then((tasks) => {
			populateFrequentTask(tasks)
		})
		.catch((e) => {
			console.log(e)
		})
}

const getStats = () => {
	fetch('/getStats')
		.then((resp) => {
			return resp.json()
		})
		.then((stat) => {
			const lastTaskStat = stat.lastTask
			lastTask.innerHTML = lastTaskStat.date ? formatDate(lastTaskStat.date) : ''

			const weeklyAggregate = stat.weeklyAggr
			if (weeklyAggregate && weeklyAggregate.length) {
				const avg = weeklyAggregate[0].averageScore ? parseFloat(weeklyAggregate[0].averageScore).toFixed(2) : ''
				weeklyAvg.innerHTML = avg
			}

			const monthlyAggregate = stat.monthlyAggr
			if (monthlyAggregate && monthlyAggregate.length) {
				const avg = monthlyAggregate[0].averageScore ? parseFloat(monthlyAggregate[0].averageScore).toFixed(2) : ''
				monthlyAvg.innerHTML = avg
			}
		})
		.catch((e) => {
			console.log(e)
		})
}

const deleteTasks = async (idsToDelete) => {
	const resp = await fetch('/tasks', {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json;charset=utf-8',
		},
		body: JSON.stringify(idsToDelete),
	})
	if (resp.ok) {
		console.log('Task deleted')
	} else {
		console.log(resp.body)
		const result = await resp.json()
		throw result.error
	}
}

function formatDate(date) {
	if (typeof date === 'string') {
		return date.split('T')[0]
	} else {
		return date
	}
}

getTasksForSelectedDate()
getNoteForSelectedDate()
getFrequentTasks()
