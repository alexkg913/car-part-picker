"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfig, app } from "@/lib/firebase/firebase"
import { initializeApp } from 'firebase/app';

if (typeof window !== 'undefined') {
    initializeApp(firebaseConfig);
}

interface Part {
    id: string;
    name: string;
    price: number;
}

interface Category {
    name: string;
    value: string;
    parts: Part[];
}

const categories: Category[] = [
    {
        name: 'Cold Air Intake',
        value: 'cold-air-intake',
        parts: [
            { id: 'kn-cold-air-intake', name: 'K&N Cold Air Intake', price: 300 },
            { id: 'aem-cold-air-intake', name: 'AEM Cold Air Intake', price: 250 },
            { id: 'injen-cold-air-intake', name: 'Injen Cold Air Intake', price: 280 },
        ],
    },
    {
        name: 'Downpipe',
        value: 'downpipe',
        parts: [
            { id: 'mbrp-downpipe', name: 'MBRP Downpipe', price: 400 },
            { id: 'awe-downpipe', name: 'AWE Tuning Downpipe', price: 500 },
            { id: 'cts-downpipe', name: 'CTS Turbo Downpipe', price: 450 },
        ],
    },
    {
        name: 'Spark Plugs',
        value: 'spark-plugs',
        parts: [
            { id: 'ngk-spark-plugs', name: 'NGK Spark Plugs', price: 100 },
            { id: 'bosch-spark-plugs', name: 'Bosch Spark Plugs', price: 120 },
            { id: 'denso-spark-plugs', name: 'Denso Spark Plugs', price: 110 },
        ],
    },
    {
        name: 'Brake Pads',
        value: 'brake-pads',
        parts: [
            { id: 'brembo-brake-pads', name: 'Brembo Brake Pads', price: 150 },
            { id: 'hawk-brake-pads', name: 'Hawk Performance Brake Pads', price: 170 },
            { id: 'eibach-brake-pads', name: 'Eibach Brake Pads', price: 160 },
        ],
    },
    {
        name: 'Brake Rotors',
        value: 'brake-rotors',
        parts: [
            { id: 'brembo-brake-rotors', name: 'Brembo Brake Rotors', price: 200 },
            { id: 'dba-brake-rotors', name: 'DBA Brake Rotors', price: 220 },
            { id: 'powerstop-brake-rotors', name: 'PowerStop Brake Rotors', price: 210 },
        ],
    },
    {
        name: 'Turbocharger',
        value: 'turbocharger',
        parts: [
            { id: 'garrett-turbocharger', name: 'Garrett Turbocharger', price: 1000 },
            { id: 'precision-turbocharger', name: 'Precision Turbocharger', price: 1200 },
            { id: 'borgwarner-turbocharger', name: 'BorgWarner Turbocharger', price: 1100 },
        ],
    },
];

const AutomotiveBuildConfigurator = () => {
    const [selectedParts, setSelectedParts] = useState<{ [key: string]: Part }>({});
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null); // State to hold user object
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup the listener
    }, []);

    useEffect(() => {
        const newTotalPrice = Object.values(selectedParts).reduce((sum, part) => sum + part.price, 0);
        setTotalPrice(newTotalPrice);
    }, [selectedParts]);

    const handlePartSelect = (part: Part) => {
        setSelectedParts((prevSelectedParts) => {
            if (prevSelectedParts[part.id]) {
                const { [part.id]: removed, ...rest } = prevSelectedParts;
                return rest;
            } else {
                return { ...prevSelectedParts, [part.id]: part };
            }
        });
    };

    const handleCategorySelect = (categoryValue: string) => {
        setActiveCategory(categoryValue);
    };

    const clearAllParts = () => {
        setSelectedParts({});
        setActiveCategory(null); // Reset to no active category
    };



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
                                    Builder
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Configurator</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex flex-1 items-end justify-end gap-4 p-4">
                        {loading ? (
                            <div>Loading...</div> // Or a spinner, or null
                        ) : user ? null : ( //  Hide the login button if user is logged in
                            <Link href="/login" className={"items-end", buttonVariants({ variant: "customblue" })}>Log in!</Link>
                        )}
                    </div>
                </header>
                <div className="font-inter min-h-screen">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8">
                        <h1 className="text-3xl font-semibold text-blue mb-6 text-center">
                            CarPartPicker Build Configurator
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                            {/* Category Selection */}
                            <div className="category-selection flex flex-col space-y-2 md:space-y-3 lg:space-y-4">
                                {categories.map((category) => (
                                    <Button
                                        key={category.value}
                                        variant="ghost"
                                        className={cn(
                                            "px-4 py-2 rounded-md text-white bg-blue hover:bg-blue2 transition duration-300 ease-in-out font-medium text-sm md:text-base lg:text-lg",
                                            activeCategory === category.value && "bg-blue2"
                                        )}
                                        onClick={() => handleCategorySelect(category.value)}
                                    >
                                        {category.name}
                                    </Button>
                                ))}
                            </div>

                            {/* Part Selection */}
                            <div className="part-selection col-span-2 md:col-span-2 lg:col-span-3">
                                {categories.map((category) => (
                                    <div
                                        key={category.value}
                                        id={category.value}
                                        className={cn(
                                            "part-list bg-blue2 rounded-md shadow-md p-4 md:p-6 lg:p-8 space-y-3 md:space-y-4 lg:space-y-5",
                                            activeCategory === category.value ? "block" : "hidden"
                                        )}
                                    >
                                        <h2 className="text-xl font-semibold text-blue-500 mb-4 md:mb-5 lg:mb-6">
                                            {category.name}
                                        </h2>
                                        <ul className="space-y-2 md:space-y-3 lg:space-y-4">
                                            {category.parts.map((part) => (
                                                <li
                                                    key={part.id}
                                                    className={cn(
                                                        "part-item px-4 py-2 rounded-md text-white hover:bg-blue transition duration-300 ease-in-out cursor-pointer text-sm md:text-base lg:text-lg",
                                                        selectedParts[part.id] && "bg-blue text-white"
                                                    )}
                                                    onClick={() => handlePartSelect(part)}
                                                    data-part={part.id}
                                                >
                                                    {part.name}
                                                    <span className="part-price float-right font-medium text-white">
                                                        ${part.price.toFixed(2)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            {/* Selected Parts and Summary */}
                            <div className="selected-parts col-span-1 md:col-span-3 lg:col-span-1 bg-blue2 rounded-md shadow-md p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6">
                                <h2 className="text-xl font-semibold text-white mb-4 md:mb-5 lg:mb-6">
                                    Selected Parts
                                </h2>
                                <ul id="selected-parts-list" className="space-y-2 md:space-y-3 lg:space-y-4">
                                    {Object.keys(selectedParts).length === 0 ? (
                                        <li className="text-white text-sm md:text-base lg:text-lg">No parts selected</li>
                                    ) : (
                                        Object.entries(selectedParts).map(([partId, part]) => (
                                            <li
                                                key={partId}
                                                className="flex justify-between items-center text-sm md:text-base lg:text-lg text-white"
                                            >
                                                {part.name}
                                                <div className='flex items-center gap-2'>
                                                    <span className="font-medium text-white">
                                                        ${part.price.toFixed(2)}
                                                    </span>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedParts((prev: { [key: string]: Part }) => {
                                                                const { [partId]: removed, ...rest } = prev;
                                                                return rest;
                                                            });
                                                        }}
                                                        className="text-xs md:text-sm lg:text-base"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                                <div className="summary-section border-t border-gray-700 pt-4 md:pt-5 lg:pt-6">
                                    <h3 className="text-lg font-semibold text-white">Total Price</h3>
                                    <p id="total-price" className="text-xl font-bold text-blue">
                                        ${totalPrice.toFixed(2)}
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out text-sm md:text-base lg:text-lg"
                                        onClick={clearAllParts}
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>


    );
};

export default AutomotiveBuildConfigurator;
