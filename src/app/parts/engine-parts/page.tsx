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
import {button,buttonVariants} from "@/components/ui/button"
import Link from "next/link"
import Image from 'next/image'

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
           <div className="flex items-start">
             <Image
            src="/CPP-Letter.png"
            width={160}
            height={80}
            alt="RKM"
            />
        </div>
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
                <BreadcrumbPage>Engine Parts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-1 items-end justify-end gap-4 p-4">
          <Link href ="/login" className={"items-end",buttonVariants({ variant: "customblue" })}>Log in!</Link>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
            <h1>This is the engine parts page</h1>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
