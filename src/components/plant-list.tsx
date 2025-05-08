"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { PlantCard } from '@/components/plant-card'
import { api } from '@/lib/api'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import React from 'react'

function PlantCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlantList() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [newPlant, setNewPlant] = useState({
    name: '',
    type: '',
    weeklyWaterNeed: 0,
    expectedHumidity: 0,
    location: '',
    latitude: 0,
    longitude: 0
  })

  const { data: plants, isLoading } = useQuery({
    queryKey: ['plants'],
    queryFn: api.plants.getAll
  })

  const locations = React.useMemo(() => {
    if (!plants) return []
    const uniqueLocations = new Set(plants.map(plant => plant.location))
    return Array.from(uniqueLocations).filter(Boolean)
  }, [plants])

  const filteredPlants = plants?.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = selectedLocation === 'all' || plant.location === selectedLocation
    
    switch (selectedFilter) {
      case 'low-water':
        return matchesSearch && matchesLocation && plant.weeklyWaterNeed < 2
      case 'medium-water':
        return matchesSearch && matchesLocation && plant.weeklyWaterNeed >= 2 && plant.weeklyWaterNeed < 4
      case 'high-water':
        return matchesSearch && matchesLocation && plant.weeklyWaterNeed >= 4
      case 'low-humidity':
        return matchesSearch && matchesLocation && plant.expectedHumidity < 50
      case 'medium-humidity':
        return matchesSearch && matchesLocation && plant.expectedHumidity >= 50 && plant.expectedHumidity < 70
      case 'high-humidity':
        return matchesSearch && matchesLocation && plant.expectedHumidity >= 70
      case 'all':
      default:
        return matchesSearch && matchesLocation
    }
  }) || []

  const handleAdd = async () => {
    try {
      await api.plants.create(newPlant)
      toast.success("Bitki başarıyla eklendi")
      setIsAdding(false)
      setNewPlant({
        name: '',
        type: '',
        weeklyWaterNeed: 0,
        expectedHumidity: 0,
        location: '',
        latitude: 0,
        longitude: 0
      })
      queryClient.invalidateQueries({ queryKey: ['plants'] })
    } catch (error) {
      toast.error("Bitki eklenirken bir hata oluştu")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.plants.delete(id)
      toast.success("Bitki başarıyla silindi")
      queryClient.invalidateQueries({ queryKey: ['plants'] })
    } catch (error) {
      toast.error("Bitki silinirken bir hata oluştu")
    }
  }

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['plants'] })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PlantCardSkeleton />
        <PlantCardSkeleton />
        <PlantCardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Bitki adına göre ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Bölge seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Bölgeler</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Bitkiler</SelectItem>
              <SelectItem value="low-water">Düşük Su İhtiyacı Olanlar</SelectItem>
              <SelectItem value="medium-water">Orta Su İhtiyacı Olanlar</SelectItem>
              <SelectItem value="high-water">Yüksek Su İhtiyacı Olanlar</SelectItem>
              <SelectItem value="low-humidity">Düşük Nem İhtiyacı Olanlar</SelectItem>
              <SelectItem value="medium-humidity">Orta Nem İhtiyacı Olanlar</SelectItem>
              <SelectItem value="high-humidity">Yüksek Nem İhtiyacı Olanlar</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Bitki Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Bitki Ekle</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Bitki Adı</Label>
                  <Input
                    id="name"
                    value={newPlant.name}
                    onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Bitki Türü</Label>
                  <Input
                    id="type"
                    value={newPlant.type}
                    onChange={(e) => setNewPlant({ ...newPlant, type: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="waterNeed">Haftalık Su İhtiyacı (L)</Label>
                  <Input
                    id="waterNeed"
                    type="number"
                    value={newPlant.weeklyWaterNeed}
                    onChange={(e) => setNewPlant({ ...newPlant, weeklyWaterNeed: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="humidity">Beklenen Nem (%)</Label>
                  <Input
                    id="humidity"
                    type="number"
                    value={newPlant.expectedHumidity}
                    onChange={(e) => setNewPlant({ ...newPlant, expectedHumidity: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Konum</Label>
                  <Input
                    id="location"
                    value={newPlant.location}
                    onChange={(e) => setNewPlant({ ...newPlant, location: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Enlem</Label>
                    <Input
                      id="latitude"
                      type="number"
                      value={newPlant.latitude}
                      onChange={(e) => setNewPlant({ ...newPlant, latitude: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Boylam</Label>
                    <Input
                      id="longitude"
                      type="number"
                      value={newPlant.longitude}
                      onChange={(e) => setNewPlant({ ...newPlant, longitude: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  İptal
                </Button>
                <Button onClick={handleAdd}>
                  Ekle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlants.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Bitki Bulunamadı</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Arama kriterlerinize uygun bitki bulunamadı. Lütfen farklı bir arama yapın veya filtreyi değiştirin.
            </p>
          </div>
        ) : (
          filteredPlants.map((plant) => (
            <PlantCard
              key={plant._id}
              plant={plant}
              onDelete={() => handleDelete(plant._id)}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>
    </div>
  )
} 