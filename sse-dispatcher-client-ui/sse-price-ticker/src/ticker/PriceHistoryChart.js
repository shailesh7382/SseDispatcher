// PriceHistoryChart.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PriceHistoryChart = ({ data }) => {
    const barData = {
        labels: data.map((entry, index) => `Tick ${index + 1}`),
        datasets: [
            {
                label: 'Bid Prices',
                data: data.map((entry) => entry.bid),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                barThickness: 10,
            },
            {
                label: 'Ask Prices',
                data: data.map((entry) => entry.ask),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                barThickness: 10,
            },
        ],
    };

    const options = {
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
                beginAtZero: false,
            },
        },
    };

    return <Bar data={barData} options={options} />;
};

export default PriceHistoryChart;