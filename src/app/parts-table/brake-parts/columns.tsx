"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import Link from 'next/link';
export type Part = {
  id: string
  part_Name: string
  part_Type: "BBK" | "Rotors" | "Pads" | "Rotor/Pad Kits"
  manufacturer: string
  price: number
  link: string
}

export const columns: ColumnDef<Part>[] = [
  {
    accessorKey: "part_Name",
    header: "Part Name",
  },
  {
    accessorKey: "part_Type",
    header: "Part Type",
  },
  {
    accessorKey: "manufacturer",
    header: "Manufacturer",
  },
  {
    accessorKey: "price",
    header: () => <div>Price</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
 
      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)
 
      return <div>{formatted}</div>
    },
  },
    {
      accessorKey: "link",
      header: "Buy Here",
      cell: ({ row }) => {
      const link = row.getValue("link")
      return <Link href ={link} className={buttonVariants({ variant: "customblue" })}>Click here to Purchase</Link>

      
      },
    },
]
