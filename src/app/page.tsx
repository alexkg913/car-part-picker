"use client"
import { AppSidebar } from "@/components/app-sidebar"
import Image from 'next/image'
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
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"


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
            src="/CPP.svg"
            width={240}
            height={120}
            alt="RKM"
            />
        </div>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
                  Home
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-1 items-end justify-end gap-4 p-4">
          <Link href ="/login" className={"items-end",buttonVariants({ variant: "customblue" })}>Log in!</Link>
          </div>
        </header>
        <div className="flex flex-1 gap-4 p-4 items-center justify-center">
             <Image
            src="/CPP.svg"
            width={1280}
            height={720}
            alt="RKM"
            />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
