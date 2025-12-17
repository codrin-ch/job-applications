import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/update_last_visited': 'http://localhost:8000',
      '/add_job_board': 'http://localhost:8000',
      '/add_job': 'http://localhost:8000',
      '/add_step': 'http://localhost:8000',
      '/update_job_field': 'http://localhost:8000',
      '/add_work_experience': 'http://localhost:8000',
      '/add_work_achievement': 'http://localhost:8000',
      '/update_work_achievement': 'http://localhost:8000',
      '/add_research_data': 'http://localhost:8000',
      '/update_research_data': 'http://localhost:8000',
    }
  }
})
