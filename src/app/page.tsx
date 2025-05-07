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
import { getUsers } from "@/utils/users"
import { useEffect } from "react";
import {firebaseConfig, db, app,auth} from "@/lib/firebase/firebase"
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { onAuthStateChanged, User} from "firebase/auth"

await setDoc(doc(db, "brake-parts", "part1"),{
  name:"RacingLine Big Brake Kit",
  type:"BBK",
  manufacturer:"RacingLine",
  price: 3684.03,
  link: "https://www.urotuning.com/products/racingline-big-brake-stage-3-kit-for-vw-audi-mqb-355mm-vwr650001?currency=USD&variant=14412923142199&stkn=334b6bf4d9c9&utm_content=&utm_term=&ran=oBX&gad_source=1",
});



export default function Home() {
  const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
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
                  Home
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-1 items-end justify-end gap-4 p-4">
          <div className="flex flex-1 items-end justify-end gap-4 p-4">
                        {loading ? (
                            <div>Loading...</div>
                        ) : user ? null : (
                            <Link href="/login" className={"items-end", buttonVariants({ variant: "customblue" })}>Log in!</Link>
                        )}
                    </div>
          </div>
        </header>
        <div className="flex flex-1 gap-4 p-4 items-center justify-center">
             <Image
            src="/CPP-Letter.png"
            width={1280}
            height={720}
            alt="RKM"
            />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
