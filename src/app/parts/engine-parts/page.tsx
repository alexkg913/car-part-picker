"use client"
import React, { useState, useEffect } from 'react';
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
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import Image from 'next/image'
import { auth } from "@/lib/firebase/firebase";
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

if (typeof window !== 'undefined') {
    initializeApp(firebaseConfig);
}

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
                        <Link href="/" className = "flex items-start">
                          <Image
                          src="/CPP-Letter.png"
                          width={160}
                          height={80}
                          alt="RKM"
                          />
                        </Link>
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
                        {loading ? (
                            <div>Loading...</div>
                        ) : user ? null : (
                            <Link href="/login" className={"items-end", buttonVariants({ variant: "customblue" })}>Log in!</Link>
                        )}
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <h1>This is the engine parts page</h1>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
