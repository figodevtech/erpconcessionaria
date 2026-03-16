import Image from "next/image"
import Link from "next/link"
import { MapPin, Fuel, Gauge, Calendar, Star, CreditCardIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Vehicle } from "./vehicle-list-client"
import { formatMileage, formatPrice } from "@/lib/vehicles"

interface VehicleCardProps {
  vehicle: Vehicle
  priority?: boolean
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Em venda": return "bg-blue-500/10 text-blue-500"
    case "Vendido": return "bg-green-500/10 text-green-500"
    case "Rascunho": return "bg-orange-500/10 text-orange-500"
    case "Pagamento": return "bg-yellow-500/10 text-yellow-500"
    default: return "bg-gray-500/10 text-gray-500"
  }
}

export function VehicleCard({ vehicle, priority }: VehicleCardProps) {
  return (
    <Card className="group pt-0 overflow-hidden border-border bg-card transition-all hover:shadow-lg h-full hover:cursor-pointer">
      <div className="relative aspect-16/10 overflow-hidden">
        <Image
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.version}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
        />
        {vehicle.isNew && (
          <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">
            Novo
          </Badge>
        )}
        <div className="absolute right-3 top-3">
          <Badge
            variant="secondary"
            className="bg-card/90 text-card-foreground backdrop-blur-sm"
          >
            {vehicle.sellerType === "dealership"
              ? "Concessionaria"
              : vehicle.sellerType === "store"
                ? "Loja"
                : "Particular"}
          </Badge>
        </div>
        {vehicle.featured && (
          <div className="absolute left-3 top-3">
            <Badge
              variant="secondary"
              className="bg-pink-800/70 backdrop-blur-sm text-white"
            >
              <Star className="h-3.5 w-3.5 shrink-0" /> Destaque
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-end mb-2 -mt-2"><Badge variant="outline" className={`font-normal border-transparent ${getStatusColor(vehicle.status || '')}`}>
          {vehicle.status || "Indefinido"}
        </Badge></div>
        <div className="mb-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {vehicle.brand}
          </p>
          <h3 className="font-mono text-base font-bold text-card-foreground">
            {vehicle.model}{" "}
            <span className="font-sans text-sm font-normal text-muted-foreground">
              {vehicle.version}
            </span>
          </h3>
        </div>

        <p className="mb-3 font-mono text-xl font-bold">
          {formatPrice(vehicle.price)}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CreditCardIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">
              {vehicle.plate}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">
              {vehicle.year}/{vehicle.year_model}
            </span>
          </div>
          {vehicle.mileage && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Gauge className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{formatMileage(vehicle.mileage)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Fuel className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">{vehicle.fuel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">
              {vehicle.city} - {vehicle.state}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
