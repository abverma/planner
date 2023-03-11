import React from 'react'
import MajorTaskPanel from '../fragments/majorTaskPanel'

export default class HomePage extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			selectedDate: this.formatDate(new Date().toISOString()),
			tasks: [],
			selectState: [],
			task: '',
			dailyNote: '',
			originalDailyNote: '',
			taskCheckedCount: 0,
			frequentTasks: [],
		}
	}
	async componentDidMount() {
		this.getTasksForSelectedDate()
		this.getNoteForSelectedDate()
		this.getFrequentTasks()
	}

	async addNewTask() {
		errorSpan.innerHTML = ''
		errorSection.style.display = 'none'
		try {
			await this.createTask({
				subject: this.state.task,
				date: this.state.selectedDate,
			})

			await this.getTasksForSelectedDate()
			this.setState({
				task: '',
			})
		} catch (e) {
			errorSection.style.display = 'block'
			errorSpan.innerHTML = e
		}
	}

	async createTask(task) {
		try {
			const resp = await fetch('/task', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json;charset=utf-8',
				},
				body: JSON.stringify(task),
			})
			if (resp.ok) {
				console.log('Task added')
			} else {
				console.log(resp.body)
				const result = await resp.json()
				throw result.error
			}
		} catch (e) {
			console.log(e)
			if (e.validationError) {
				const score = prompt('Score not found for task. Assign score.')
				if (score) {
					task.score = score
					task.category = 'misc'
					await this.createTask(task)
				}
			}
		}
	}

	async deleteTasks(idsToDelete) {
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

	getFrequentTasks() {
		fetch('/frequestTasks')
			.then((resp) => {
				return resp.json()
			})
			.then((tasks) => {
				this.setState({
					frequentTasks: tasks,
				})
			})
			.catch((e) => {
				console.log(e)
			})
	}

	getNoteForSelectedDate() {
		const me = this
		fetch('/note?date=' + this.state.selectedDate)
			.then((resp) => {
				return resp.json()
			})
			.then((resp) => {
				this.setState((state) => ({
					dailyNote: resp?.note || '',
					originalDailyNote: resp?.note || '',
				}))
		})
			.catch((e) => {
				console.log(e)
			})
	}

	getTasksForSelectedDate() {
		return fetch('/tasks?date=' + this.state.selectedDate)
			.then((resp) => {
				return resp.json()
			})
			.then(async (data) => {
				const selectState = {}

				data.forEach((x) => {
					selectState[x._id] = false
				})

				await this.setState({
					tasks: data,
					selectState,
					taskCheckedCount: 0,
				})

				await this.getStats()
			})
			.catch((e) => {
				console.log(e)
			})
	}

	getStats() {
		fetch('/getStats')
			.then((resp) => {
				return resp.json()
			})
			.then((stat) => {
				const lastTaskStat = stat.lastTask
				lastTask.innerHTML = lastTaskStat.date ? this.formatDate(lastTaskStat.date) : ''

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

	async handleAddBtnClick(e) {
		e.preventDefault()
		if (this.state.task) {
			this.addNewTask()
		}
	}

	handleSaveNoteBtnClick(e) {
		e.preventDefault()
		this.upsertNote(dailyNote.value)
		return false
	}

	async handleDeleteBtnClick(e) {
		e.preventDefault()
		let newTaskList = []
		const selectedTasks = []
		if (this.state.tasks.length) {
			newTaskList = this.state.tasks.slice(0)
			Object.keys(this.state.selectState).forEach((x) => {
				if (this.state.selectState[x]) {
					newTaskList = newTaskList.filter((y) => y._id !== x)
					selectedTasks.push(x)
				}
			})
		}
		const confirmDelete = confirm('Are you sure that you want to delete selected tasks?')
		if (confirmDelete) {
			await this.setState((state) => ({
				tasks: newTaskList,
			}))
			this.deleteTasks(selectedTasks)
			this.getTasksForSelectedDate()
		}
	}

	handleKeyDown(e) {
		if (this.state.task && e.code == 'Enter' && e.key == 'Enter') {
			e.preventDefault()
			this.addNewTask()
			return false
		}
	}

	async handleNoteKeydown(e) {
		if (dailyNote.value && e.code == 'Enter' && e.key == 'Enter') {
			e.preventDefault()
			this.upsertNote(e.target.value)
			return false
		}
	}

	async handleNoteBtnOnChange(e) {
		this.setState({
			dailyNote: e.target.value,
		})
	}

	async handleOnDateChange(e) {
		const me = this
		e.preventDefault()
		console.log('selected date: ', e.target.value)
		await this.setState((state) => ({
			selectedDate: me.formatDate(e.target.value),
		}))
		this.getTasksForSelectedDate()
		this.getNoteForSelectedDate()
	}

	async handleOnCheck(e, _id) {
		let selectStateClone = Object.assign({}, this.state.selectState)
		selectStateClone[_id] = e.target.checked
		this.setState((state) => ({
			selectState: selectStateClone,
		}))
		if (e.target.checked) {
			await this.setState((state) => ({
				taskCheckedCount: state.taskCheckedCount + 1,
			}))
		} else {
			await this.setState((state) => ({
				taskCheckedCount: state.taskCheckedCount - 1,
			}))
		}
		console.log(this.state.taskCheckedCount)
	}

	async handlePillClick (e, task) {
		e.preventDefault()
		await this.setState({
			task: task
		})
		this.addNewTask()
	}

	async handleSelectAllBtnClick(e) {
		e.preventDefault()
		const selectStateCopy = this.state.selectState
		Object.keys(selectStateCopy).forEach((x) => {
			selectStateCopy[x] = true
		})
		await this.setState((state) => ({
			selectState: selectStateCopy,
			taskCheckedCount: state.tasks.length,
		}))
		console.log(this.state.taskCheckedCount)
	}

	handleTaskChange(e) {
		this.setState({
			task: e.target.value,
		})
	}

	formatDate(date) {
		if (typeof date === 'string') {
			return date.split('T')[0]
		} else {
			return date
		}
	}

	async upsertNote(note) {
		try {
			const resp = await fetch('/note', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json;charset=utf-8',
				},
				body: JSON.stringify({
					note,
					date: this.state.selectedDate,
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

	render() {
		return (
			<div className='container-fluid mb-md-3'>
				<div className='row'>
					<div className='col-md-8 col-12'>
						<div className='row'>
							<MajorTaskPanel />
							<form className='col-12'>
								<div className='row align-items-center justify-content-md-start justify-content-between bg-light pt-2 mb-2'>
									<h5 className='col-2 col-md-2'>Today's Tasks</h5>
									<h5 className='col-4' id='total'>
										Total: {this.state.tasks.reduce((p, c) => p + c.score, 0)}
									</h5>
								</div>
								<div className='row mb-4'>
									<div className='input-group'>
										<span className='input-group-text' htmlFor='selectedDate'>
											Select Date
										</span>
										<input id='selectedDate' type='date' placeholder='Select Date' value={this.state.selectedDate} onChange={(e) => this.handleOnDateChange(e)} className='form-control'></input>
									</div>
								</div>
								<div className='row mb-3 row-cols-sm-3 align-items-center'>
									<div className='col-sm-12 col-md-6 mb-2'>
										<input
											id='newTask'
											type='text'
											placeholder='Enter task'
											className='form-control'
											value={this.state.task}
											onChange={(e) => this.handleTaskChange(e)}
											onKeyDown={(e) => this.handleKeyDown(e)}
										></input>
									</div>
									<div className='col-4 col-md-2 mb-2'>
										<button id='addBtn' className='btn btn-sm btn-primary form-control' type='button' onClick={(e) => this.handleAddBtnClick(e)}>
											Add
										</button>
									</div>
									<div className='col-4 col-md-2 mb-2'>
										<button id='selectBtn' disabled={!this.state.tasks.length} className='btn btn-sm btn-primary form-control' type='button' onClick={(e) => this.handleSelectAllBtnClick(e)}>
											Select All
										</button>
									</div>
									<div className='col-4 col-md-2 mb-2'>
										<button id='deleteBtn' disabled={!this.state.taskCheckedCount} className='btn btn-sm btn-primary form-control' type='button' onClick={(e) => this.handleDeleteBtnClick(e)}>
											Delete
										</button>
									</div>
								</div>
								<div className='row mb-3' id='errorSection'>
									<span className='col text-danger' id='errorSpan'></span>
								</div>
								<div className='row mb-3 justify-content-md-start justify-content-center' id='frequentHeader'>
									{this.state.frequentTasks.map((x, idx) => {
										return (
											<div key={idx} className='col-auto mb-2'>
												<button className='btn btn-sm btn-outline-dark form-control' type='button' onClick={(e) => this.handlePillClick(e, x.subject)}>
													{x.subject}
												</button>
											</div>
										)
									})}
								</div>
								<div className='row mb-3'>
									<div className='col-12'>
										<ul id='taskList' className='col list-group'>
											{this.state.tasks.map((x) => {
												return (
													<li mongo_id={x._id} key={x._id} className='list-group-item d-flex justify-content-between'>
														<div>
															<input type='checkbox' className='form-check-input me-2' checked={this.state.selectState[x._id]} onChange={(e) => this.handleOnCheck(e, x._id)}></input>
															<span>{x.subject}</span>
														</div>
														<span className='badge bg-primary rounded-pill'>{x.score}</span>
													</li>
												)
											})}
										</ul>
									</div>
								</div>
								<div className='row'>
									<div className='col-12 input-group'>
										<span className='input-group-text'>Day's Note</span>
										<textarea
											id='dailyNote'
											type='textarea'
											className='form-control'
											value={this.state.dailyNote}
											onKeyDown={(e) => this.handleNoteKeydown(e)}
											onChange={(e) => this.handleNoteBtnOnChange(e)}
										></textarea>
										<button
											className='btn btn-sm btn-primary'
											type='button'
											id='addNoteBtn'
											disabled={this.state.dailyNote == this.state.originalDailyNote}
											onClick={(e) => this.handleSaveNoteBtnClick(e)}
										>
											Save
										</button>
									</div>
								</div>
							</form>
						</div>
					</div>

					<div className='stats col-12 col-md-4 mt-2 mt-md-0'>
						<div className='row bg-light pt-2'>
							<h5 className='col'>Stats</h5>
						</div>
						<ul>
							<li>
								<b className='me-2'>Last Entry:</b>
								<span id='lastTask'></span>
							</li>
							<li>
								<b className='me-2'>Weekly Avg Score:</b>
								<span id='weeklyAvg'></span>
							</li>
							<li>
								<b className='me-2'>Monthly Avg Score:</b>
								<span id='monthlyAvg'></span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		)
	}
}
