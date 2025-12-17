import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import type { JobApplicationsStats } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

interface JobSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: JobApplicationsStats;
}

export const JobSummaryModal: React.FC<JobSummaryModalProps> = ({ isOpen, onClose, stats }) => {
    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'block' }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h3>Applications Summary</h3>
                <p className="summary-subtitle">Applications grouped by current status</p>

                <div className="summary-chart-wrapper">
                    <div style={{ height: '320px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                        <Pie
                            data={{
                                labels: stats.status_summary.map(s => `${s.label} (${s.count})`),
                                datasets: [{
                                    data: stats.status_summary.map(s => s.count),
                                    backgroundColor: stats.status_summary.map(s => {
                                        const colors: Record<string, string> = {
                                            'Preparing Application': '#9c27b0',
                                            'Applied': '#6c757d',
                                            'In Progress': '#2196F3',
                                            'Negative': '#dc3545',
                                            'Offer': '#28a745'
                                        };
                                        return colors[s.label] || '#95a5a6';
                                    }),
                                    borderWidth: 1,
                                    borderColor: '#fff'
                                }]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    },
                                    title: {
                                        display: true,
                                        text: `Total Applications: ${stats.status_summary.reduce((acc, curr) => acc + curr.count, 0)}`,
                                        font: {
                                            size: 16
                                        },
                                        padding: {
                                            top: 10,
                                            bottom: 20
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                const value = context.parsed;
                                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                                const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
                                                const labelStr = context.label || '';
                                                const cleanLabel = labelStr.split(' (')[0];
                                                return `${cleanLabel}: ${value} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="summary-chart-wrapper" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <div style={{ height: '250px' }}>
                        <Bar
                            data={{
                                labels: stats.daily_stats.map(s => s.date),
                                datasets: [
                                    {
                                        label: 'Previous Total',
                                        data: stats.daily_stats.map((_, index, array) => {
                                            // Calculate sum of all counts up to this index (exclusive)
                                            let sum = 0;
                                            for (let i = 0; i < index; i++) {
                                                sum += array[i].count;
                                            }
                                            return sum;
                                        }),
                                        backgroundColor: '#cfd8dc',
                                        barPercentage: 0.6,
                                        stack: 'combined'
                                    },
                                    {
                                        label: 'New Applications',
                                        data: stats.daily_stats.map(s => s.count),
                                        backgroundColor: '#667eea',
                                        borderRadius: { topLeft: 4, topRight: 4 },
                                        barPercentage: 0.6,
                                        stack: 'combined'
                                    }
                                ]
                            }}
                            options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                scales: {
                                    y: {
                                        stacked: true,
                                        beginAtZero: true,
                                        ticks: {
                                            stepSize: 1,
                                        },
                                        grid: {
                                            color: '#f0f0f0'
                                        }
                                    },
                                    x: {
                                        stacked: true,
                                        grid: {
                                            display: false
                                        }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'bottom',
                                        labels: {
                                            boxWidth: 12,
                                            usePointStyle: true
                                        }
                                    },
                                    title: {
                                        display: true,
                                        text: 'Applications Growth',
                                        padding: {
                                            bottom: 15
                                        },
                                        font: {
                                            size: 14,
                                            weight: 'bold'
                                        }
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                        backgroundColor: '#2c3e50',
                                        padding: 10,
                                        callbacks: {
                                            footer: function (tooltipItems) {
                                                let total = 0;
                                                tooltipItems.forEach(function (tooltipItem) {
                                                    total += tooltipItem.parsed.y ?? 0;
                                                });
                                                return 'Total: ' + total;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
