import React from 'react'
import HomePage from './pages/HomePage/home'

export default class App extends React.Component {
	constructor(props) {
		super(props)
	}

	render() {
		return (
			<div>
				<header className='container-fluid text-center text-md-start border-bottom'>
					<h3 className='display-4'>Pro-Track</h3>
				</header>
				<HomePage />
			</div>
		)
	}
}
