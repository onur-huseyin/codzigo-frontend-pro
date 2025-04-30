"use client"

import { PlantList } from '@/components/plant-list'
import { ModeToggle } from '@/components/mode-toggle'

export default function Home() {
  return (
    <main className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-primary text-[#22C55E]">Plant Care Dashboard</h1>
        <ModeToggle />
      </div>
      <PlantList />
    </main>
  )
}
