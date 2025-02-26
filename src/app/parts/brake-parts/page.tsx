import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ModeToggle"
import { Part, columns } from "@/app/parts-table/brake-parts/columns"
import { DataTable } from "@/app/parts-table/brake-parts/data-table"
import {button,buttonVariants} from "@/components/ui/button"
import Link from "next/link"

async function getData(): Promise<Part[]> {
  return [
    {
     id: "1",
     part_Name: "RacingLine Big Brake Kit",
     part_Type: "BBK",
     manufacturer: "RacingLine",
     price: 3684.03,
     link: "https://www.urotuning.com/products/racingline-big-brake-stage-3-kit-for-vw-audi-mqb-355mm-vwr650001?currency=USD&variant=14412923142199&stkn=334b6bf4d9c9&utm_content=&utm_term=&ran=oBX&gad_source=1",
    },
     {
      id: "2",
     part_Name: "EBC YellowStuff Brake Pads",
     part_Type: "Pads",
     manufacturer: "EBC",
     price: 172.17,
     link: "https://www.ecstuning.com/b-ebc-parts/front-yellowstuff-performance-brake-pad-set/dp42127r~ebc/?gad_source=1",
   },
    
  ]
}

export default async function Home() {
  const data = await getData()
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Parts
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Brake Parts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-1 items-end justify-end gap-4 p-4">
          <Link href ="/login" className={"items-end",buttonVariants({ variant: "customblue" })}>Log in!</Link>
          </div>
        </header>
         <div className="container mx-auto py-10">
            <DataTable columns={columns} data={data} />
    </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
