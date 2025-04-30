"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Droplet, Thermometer, MapPin, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { format, isValid } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'

type PlantCardProps = {
  plant: {
    _id: string
    name: string
    type: string
    weeklyWaterNeed: number
    expectedHumidity: number
    location: string
    latitude: number
    longitude: number
  }
  onDelete: () => void
  onUpdate: () => void
}

type PlantHealth = {
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

export function PlantCard({ plant, onDelete, onUpdate }: PlantCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlant, setEditedPlant] = useState(plant)

  const handleEdit = async () => {
    try {
      await api.plants.update(plant._id, editedPlant)
      toast.success("Bitki başarıyla güncellendi")
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      toast.error("Bitki güncellenirken bir hata oluştu")
    }
  }

  const { data: health, isLoading, error } = useQuery<PlantHealth>({
    queryKey: ['plant-health', plant._id],
    queryFn: async () => {
      if (!plant._id) {
        console.error('Plant ID is missing')
        throw new Error('Plant ID is required')
      }

      // Geçmiş tarihleri kullan
      const today = new Date()
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      console.log('Making health check request for plant:', plant._id)
      console.log('Date range:', {
        start: lastWeek.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      })

      try {
        const response = await api.plants.checkHealth(
          plant._id,
          lastWeek.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        )
        console.log('Health check response:', response)
        return response
      } catch (err) {
        console.error('Health check failed:', err)
        throw err
      }
    },
    enabled: !!plant._id,
    retry: false
  })

  console.log('Health data:', { health, isLoading, error })

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'yeterli':
        return 'bg-green-500'
      case 'yetersiz':
        return 'bg-yellow-500'
      case 'kritik':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'yeterli':
        return 'Sağlıklı'
      case 'yetersiz':
        return 'Dikkat'
      case 'kritik':
        return 'Kritik'
      default:
        return 'Bilinmiyor'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isValid(date)) {
        return format(date, 'dd.MM.yyyy')
      }
      return 'Tarih belirtilmemiş'
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Tarih belirtilmemiş'
    }
  }

  const getRecommendations = (health: PlantHealth) => {
    const recommendations = []
    
    if (health.waterStatus === 'Yetersiz') {
      recommendations.push(`Bitki ${health.totalPrecipitation.toFixed(2)}L su almış, beklenen: ${health.expectedWater}L`)
    }
    
    if (health.humidityStatus === 'Yetersiz') {
      recommendations.push(`Ortalama nem: %${health.avgHumidity.toFixed(1)}, beklenen: %${health.expectedHumidity}`)
    }

    return recommendations
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{plant.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plant.type}</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bitki Düzenle</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Bitki Adı</Label>
                      <Input
                        id="name"
                        value={editedPlant.name}
                        onChange={(e) => setEditedPlant({ ...editedPlant, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Bitki Türü</Label>
                      <Input
                        id="type"
                        value={editedPlant.type}
                        onChange={(e) => setEditedPlant({ ...editedPlant, type: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="waterNeed">Haftalık Su İhtiyacı (L)</Label>
                      <Input
                        id="waterNeed"
                        type="number"
                        value={editedPlant.weeklyWaterNeed}
                        onChange={(e) => setEditedPlant({ ...editedPlant, weeklyWaterNeed: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="humidity">Beklenen Nem (%)</Label>
                      <Input
                        id="humidity"
                        type="number"
                        value={editedPlant.expectedHumidity}
                        onChange={(e) => setEditedPlant({ ...editedPlant, expectedHumidity: Number(e.target.value) })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Konum</Label>
                      <Input
                        id="location"
                        value={editedPlant.location}
                        onChange={(e) => setEditedPlant({ ...editedPlant, location: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="latitude">Enlem</Label>
                        <Input
                          id="latitude"
                          type="number"
                          value={editedPlant.latitude}
                          onChange={(e) => setEditedPlant({ ...editedPlant, latitude: Number(e.target.value) })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="longitude">Boylam</Label>
                        <Input
                          id="longitude"
                          type="number"
                          value={editedPlant.longitude}
                          onChange={(e) => setEditedPlant({ ...editedPlant, longitude: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleEdit}>
                      Kaydet
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Haftalık Su İhtiyacı</p>
                <p className="text-2xl font-bold">{plant.weeklyWaterNeed}L</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Beklenen Nem</p>
                <p className="text-2xl font-bold">{plant.expectedHumidity}%</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">{plant.location}</p>
          </div>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              <div className="h-2 bg-muted rounded-full animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
            </div>
          ) : error ? (
            <div className="mt-4 text-sm text-destructive">
              Sağlık durumu yüklenirken bir hata oluştu: {error.message}
            </div>
          ) : health ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Bitki Sağlığı</p>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(health.waterStatus)} text-black`}
                >
                  {getStatusText(health.waterStatus)}
                </Badge>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStatusColor(health.waterStatus)}`}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Tarih Aralığı: {formatDate(health.dateRange.start)} - {formatDate(health.dateRange.end)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Toplam Yağış: {health.totalPrecipitation.toFixed(2)}L
                </p>
                <p className="text-sm text-muted-foreground">
                  Ortalama Nem: %{health.avgHumidity.toFixed(1)}
                </p>
                {getRecommendations(health).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {getRecommendations(health).map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  )
} 