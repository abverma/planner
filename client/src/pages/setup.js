import React from 'react'

export default class SetupPage extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			taskRows: [],
			dirty: false,
			saveSuccess: false,
		}
	}

	addRow(e) {
		const newRow = {
			subject: '',
			category: '',
		}
		this.setState((state) => ({
			taskRows: state.taskRows.concat(newRow),
            dirty: false
		}))
	}

    handleAlertClose(e) {
        this.setState((state) => ({
			saveSuccess: false
		}))
    }

	async handleCategoryOnChange(e, idx) {
		await this.updateTaskRows(e.target.value, 'category', idx)
		this.checkIsDirty()
	}

    async handleSubjectOnChange(e, idx) {
		await this.updateTaskRows(e.target.value, 'subject', idx)
		this.checkIsDirty()
	}

	checkIsDirty() {
		const isDirty = !this.state.taskRows.find((x) => x.subject == '' || x.category == '')
		if (isDirty) {
			this.setState((state) => ({
				dirty: isDirty,
			}))
		}
	}

	async updateTaskRows(value, prop, idx) {
		const tasks = structuredClone(this.state.taskRows)
		tasks[idx][prop] = value
		await this.setState((state) => ({
			taskRows: tasks,
		}))
	}

	async save(e) {
		fetch('/taskCategories', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json;charset=utf-8',
			},
			body: JSON.stringify(this.state.taskRows),
		})
			.then((resp) => {
				this.setState((state) => ({
					taskRows: [],
					saveSuccess: true,
				}))
			})
			.catch((e) => {
				console.log(e)
			})
	}

	alert() {
		if (this.state.saveSuccess) {
			return (
				<div className='alert alert-success alert-dismissible' role='alert'>
					<div>Save successful!</div>
                    <button type='button' className='btn-close' onClick={(e) => this.handleAlertClose(e)}></button>
				</div>
			)
		}
	}

	render() {
		return (
			<div className='container-fluid mb-md-3'>
				<div className='row justify-content-center pt-5'>
					<div className='col col-md-6 col-12'>
						<div id='alertPlaceholder'>{this.alert()}</div>
						<div className='row border-bottom m-2'>
							<h5>Add new tasks</h5>
						</div>
						<div className='row justify-content-end m-2'>
							<div className='col-md-2 col-4'>
								<button type='button' className='btn btn-sm btn-primary form-control' onClick={(e) => this.addRow(e)}>
									Add
								</button>
							</div>
							<div className='col-md-2 col-4'>
								<button type='button' className='btn btn-sm btn-primary form-control' onClick={(e) => this.save(e)} disabled={!this.state.dirty}>
									Save
								</button>
							</div>
						</div>
						<div id='taskRow' className='mt-5'>
							{this.state.taskRows.map((x, idx) => {
								return (
									<div key={idx} className='row justify-content-between mx-2'>
										<div className='col-12 col-md-6 mb-2'>
											<input type='text' className='form-control' value={x.subject} placeholder='Enter new task' onChange={(e) => this.handleSubjectOnChange(e, idx)}></input>
										</div>
										<div className='col-12 col-md-6 mb-2'>
											<select className='form-select' aria-label='Default select example' value={x.category} onChange={(e) => this.handleCategoryOnChange(e, idx)}>
												<option defaultValue>Select category</option>
												<option value='baby-care'>Baby Care</option>
												<option value='cardio'>Cardio</option>
												<option value='chore'>Chore</option>
												<option value='cleaning'>Cleaning</option>
												<option value='health'>Health</option>
												<option value='productivity'>Productivity</option>
												<option value='resistance-training'>Resistance Training</option>
											</select>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			</div>
		)
	}
}
