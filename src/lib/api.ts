import axios from 'axios'

const API_BASE_URL = 'https://codzigo-backend.vercel.app/api'

export interface Plant {
  _id: string
  name: string
  type: string
  weeklyWaterNeed: number
  expectedHumidity: number
  location: string
  latitude: number
  longitude: number
}

export interface PlantHealth {
  plant: string
  totalPrecipitation: number
  avgHumidity: number
  waterStatus: string
  humidityStatus: string
  expectedWater: number
  expectedHumidity: number
  dateRange: {
    start: string
    end: string
  }
}

export const api = {
  plants: {
    getAll: async () => {
      const response = await axios.get<Plant[]>(`${API_BASE_URL}/plants`)
      return response.data
    },
    getById: async (id: string) => {
      const response = await axios.get<Plant>(`${API_BASE_URL}/plants/${id}`)
      return response.data
    },
    create: async (plant: Omit<Plant, '_id'>) => {
      const response = await axios.post<Plant>(`${API_BASE_URL}/plants`, plant)
      return response.data
    },
    update: async (id: string, plant: Partial<Plant>) => {
      const response = await axios.put<Plant>(`${API_BASE_URL}/plants/${id}`, plant)
      return response.data
    },
    delete: async (id: string) => {
      await axios.delete(`${API_BASE_URL}/plants/${id}`)
    },
    checkHealth: async (id: string, startDate: string, endDate: string) => {
      const response = await axios.get<PlantHealth>(
        `${API_BASE_URL}/plants/${id}/health?start=${startDate}&end=${endDate}`
      )
      return response.data
    }
  }
} 