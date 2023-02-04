import React from 'react'

export default class AnalyticsPage extends React.Component {
	constructor(props) {
		super(props)
	}

	async componentDidMount() {
		const ctx = document.getElementById('myChart')
		const categories = await this.fetchCategories()
		const fetchedData = await this.fetchAnalytics()

        const viewData = Array(categories.length).fill(0)
        categories.map(x => x.category).forEach((cat, idx) => {
            const data = fetchedData.find(x => x._id == cat)
            if (data) {
                viewData[idx] = data.count
            }
        })

        console.log(viewData)

		new Chart(ctx, {
			type: 'bar',
			data: {

				labels: categories.map(x => x.category),
				datasets: [
					{
						label: 'Last Month Trends',
                        data: viewData,
						backgroundColor: [
							'rgba(255, 99, 132, 0.2)',
							'rgba(255, 159, 64, 0.2)',
							'rgba(255, 205, 86, 0.2)',
							'rgba(75, 192, 192, 0.2)',
							'rgba(54, 162, 235, 0.2)',
							'rgba(153, 102, 255, 0.2)',
							'rgba(201, 203, 207, 0.2)',
						],
						borderColor: ['rgb(255, 99, 132)', 'rgb(255, 159, 64)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)', 'rgb(201, 203, 207)'],
						borderWidth: 1,
					},
				],
			},
			options: {
				scales: {
					y: {
						beginAtZero: true,
					},
				},
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 20
                            }
                        }
                    }
                },
                layout: {
                    padding: 20
                }
			},
		})
	}

	async fetchCategories() {
		try {
			const resp = await fetch('/categories')
			return resp.json()
		} catch (e) {
			console.log(e)
		}
	}

    async fetchAnalytics() {
		try {
			const resp = await fetch('/analytics')
			return resp.json()
		} catch (e) {
			console.log(e)
		}
	}

	render() {
		return (
			<div>
				<canvas id='myChart' style={{position: 'relative', height: '40vh', width: '60vw'}}></canvas>
			</div>
		)
	}
}
