"use client"
import React, { useState, useEffect, useMemo } from 'react';
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
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import Image from 'next/image'
import { Part, columns } from "@/components/parts-table/columns"
import { DataTable } from "@/components/parts-table/data-table"
import { auth, db } from "@/lib/firebase/firebase";
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

if (typeof window !== 'undefined') {
    initializeApp(firebaseConfig);
}

interface PartDocumentData extends DocumentData {
    part_Name: string;
    part_Type: string;
    manufacturer: string;
    price: number;
    link?: string;
}

type SortableKeys = 'part_Name' | 'price';

interface SortConfig {
    key: SortableKeys | null;
    direction: 'asc' | 'desc' | null;
}

export default function Home() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [partsData, setPartsData] = useState<Part[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchParts = async () => {
            if (!db) {
                setError("Firestore database is not initialized.");
                setDataLoading(false);
                return;
            }
            try {
                setDataLoading(true);
                setError(null);
                const partsCollectionRef = collection(db, "brake-parts");
                const querySnapshot = await getDocs(partsCollectionRef);

                const fetchedParts: Part[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data() as PartDocumentData;
                    return {
                        id: doc.id,
                        part_Name: data.name,
                        manufacturer: data.manufacturer,
                        price: data.price,
                        link: data.url || "#",
                    };
                });

                setPartsData(fetchedParts);
            } catch (err) {
                console.error("Error fetching parts from Firestore:", err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(`Failed to fetch parts: ${errorMessage}. Please try again later.`);
            } finally {
                setDataLoading(false);
            }
        };

        fetchParts();
    }, [db]);

    const sortedPartsData = useMemo(() => {
        if (!partsData) return [];
        let sortableItems = [...partsData];
        if (sortConfig.key !== null && sortConfig.direction !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key!] < b[sortConfig.key!]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key!] > b[sortConfig.key!]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [partsData, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key) {
            if (key === 'price') { 
                direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
            } else {
                 direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            }
        } else {
            direction = key === 'price' ? 'desc' : 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableKeys) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };


    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-start">
                        <Link href="/" className="flex items-start">
                            <Image
                                src="/CPP-Letter.png"
                                width={160}
                                height={80}
                                alt="RKM"
                                priority
                            />
                        </Link>
                    </div>
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                    <Link href="/">Home</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                     <Link href="/parts">Parts</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Brake Parts</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex flex-1 items-end justify-end gap-4 p-4">
                        {authLoading ? (
                            <div>Loading user...</div>
                        ) : user ? null : (
                            <Link href="/login" className={buttonVariants({ variant: "customblue" })}>Log in!</Link>
                        )}
                    </div>
                </header>

                <div className="container mx-auto py-10">
                    <div className="mb-4 flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => requestSort('part_Name')}
                        >
                            Sort by Name{getSortIndicator('part_Name')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => requestSort('price')}
                        >
                            Sort by Price{getSortIndicator('price')}
                        </Button>
                        {sortConfig.key && (
                            <Button
                                variant="ghost"
                                onClick={() => setSortConfig({ key: null, direction: null })}
                            >
                                Clear Sort
                            </Button>
                        )}
                    </div>

                    {dataLoading && <p className="text-center">Loading parts data...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    {!dataLoading && !error && (
                        <DataTable columns={columns} data={sortedPartsData} />
                    )}
                    {!dataLoading && !error && sortedPartsData.length === 0 && partsData.length > 0 && (
                        <p className="text-center">No results for current sort.</p>
                    )}
                    {!dataLoading && !error && partsData.length === 0 && (
                        <p className="text-center">No brake parts found.</p>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
