"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
import Link from "next/link"
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseConfig } from "@/lib/firebase/firebase"
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";


let firebaseApp: FirebaseApp;
if (typeof window !== 'undefined') {
    if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApps()[0];
    }
}

let clientDb: Firestore | undefined;
if (typeof window !== 'undefined' && firebaseApp) {
    clientDb = getFirestore(firebaseApp);
}

interface Part {
    id: string;
    name: string;
    price: number;
    category: string;
    manufacturer: string;
    model_designator: string;
    url: string;
    compatible_turbos?: string[];
    compatible_transmissions?: string[];
}

interface DisplayCategory {
    name: string;
    value: string;
    parts: Part[];
}

const CATEGORY_DEFINITIONS: { name: string; value: string }[] = [
    { name: 'Intakes', value: 'intakes' },
    { name: 'Suspension Parts', value: 'suspension-parts' },
    { name: 'Brake Parts', value: 'brake-parts' },
    { name: 'Wheels', value: 'wheels' },
    { name: 'Tunes', value: 'tunes' },
    { name: 'Turbochargers', value: 'turbochargers' },
    { name: 'Engine Build Parts', value: 'engine-build-parts' },
    { name: 'Exhaust Systems', value: 'exhaust-systems' },
    { name: 'Downpipes', value: 'downpipes' },
    { name: 'Miscellaneous', value: 'miscellaneous' },
];

const CAR_VERSIONS = ['VW/Audi MQB AWD', 'VW/Audi MQB FWD'];
const TURBO_OPTIONS = ['All', 'IS20', 'IS38'];
const TRANSMISSION_OPTIONS = ['All', 'DQ250', 'DQ381'];

const isPartCompatible = (part: Part, currentSelectedCar: string): boolean => {
    const partDesignator = part.model_designator ? part.model_designator.toLowerCase().trim() : "";
    const lowerSelectedCar = currentSelectedCar.toLowerCase().trim();

    if (!partDesignator) {
        return true;
    }

    if (partDesignator === "vw mqb") {
        return true;
    }

    if (partDesignator === "vw mqb awd") {
        return lowerSelectedCar === "vw/audi mqb awd";
    }

    if (partDesignator === "vw mqb fwd") {
        return lowerSelectedCar === "vw/audi mqb fwd";
    }

    return false;
};


const AutomotiveBuildConfigurator = () => {
    const [selectedParts, setSelectedParts] = useState<{ [key: string]: Part }>({});
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [firestoreParts, setFirestoreParts] = useState<Part[]>([]);
    const [loadingParts, setLoadingParts] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isBuyNowPopupOpen, setIsBuyNowPopupOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<string>(CAR_VERSIONS[0]);
    // State for tune filters
    const [selectedTurbo, setSelectedTurbo] = useState<string>(TURBO_OPTIONS[0]); // Default to 'All'
    const [selectedTransmission, setSelectedTransmission] = useState<string>(TRANSMISSION_OPTIONS[0]); // Default to 'All'


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchParts = async () => {
        setLoadingParts(true);
        setFetchError(null);
        setFirestoreParts([]);

        if (!clientDb) {
            console.error("Firestore client is not initialized.");
            setLoadingParts(false);
            setFetchError("Database connection error. Please try again later.");
            return;
        }

        try {
            const allParts: Part[] = [];
            for (const categoryDef of CATEGORY_DEFINITIONS) {
                const collectionRef = collection(clientDb, categoryDef.value);
                const querySnapshot = await getDocs(collectionRef);
                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (
                        typeof data.name === 'string' &&
                        typeof data.price === 'number' &&
                        typeof data.category === 'string' &&
                        typeof data.manufacturer === 'string' &&
                        (typeof data.model_designator === 'string' || data.model_designator === null || typeof data.model_designator === 'undefined') &&
                        typeof data.url === 'string'
                    ) {
                        allParts.push({
                            id: doc.id,
                            name: data.name,
                            price: data.price,
                            category: data.category,
                            manufacturer: data.manufacturer,
                            model_designator: data.model_designator || "",
                            url: data.url,
                            // Attempt to read compatibility fields if they exist
                            compatible_turbos: Array.isArray(data.compatible_turbos) ? data.compatible_turbos : undefined,
                            compatible_transmissions: Array.isArray(data.compatible_transmissions) ? data.compatible_transmissions : undefined,
                        });
                    } else {
                        console.warn(`Skipping invalid part data from collection ${categoryDef.value} (doc ID: ${doc.id}):`, data);
                    }
                });
            }
            setFirestoreParts(allParts);
        } catch (error: any) {
            console.error('Error fetching parts from Firestore:', error);
            setFetchError(`Failed to load parts: ${error.message || 'Unknown error'}. Please check your connection and try again.`);
        } finally {
            setLoadingParts(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    useEffect(() => {
        const newTotalPrice = Object.values(selectedParts).reduce((sum, part) => sum + part.price, 0);
        setTotalPrice(newTotalPrice);
    }, [selectedParts]);

    useEffect(() => {
        setSelectedTurbo(TURBO_OPTIONS[0]);
        setSelectedTransmission(TRANSMISSION_OPTIONS[0]);
    }, [selectedCar]);


    const categorizedParts: DisplayCategory[] = useMemo(() => {
        const categoriesMap = new Map<string, { name: string; parts: Part[] }>();

        CATEGORY_DEFINITIONS.forEach(catDef => {
            categoriesMap.set(catDef.value, { name: catDef.name, parts: [] });
        });

        const filteredParts = firestoreParts.filter(part => isPartCompatible(part, selectedCar));

        filteredParts.forEach(part => {
            const categoryData = categoriesMap.get(part.category);
            if (categoryData) {
                categoryData.parts.push(part);
            } else {
                const miscCategory = categoriesMap.get('miscellaneous');
                if (miscCategory) {
                    miscCategory.parts.push(part);
                } else {
                    console.warn(`Part with unknown category "${part.category}" (ID: ${part.id}) and 'miscellaneous' category not defined.`);
                }
            }
        });

        const sortedCategories = Array.from(categoriesMap.entries())
            .map(([value, { name, parts }]) => ({
                name,
                value,
                parts,
            }))
            .filter(category => category.parts.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        sortedCategories.forEach(cat => {
            cat.parts.sort((a, b) => a.name.localeCompare(b.name));
        });

        return sortedCategories;
    }, [firestoreParts, selectedCar]);

    const selectedPartsByCategory: DisplayCategory[] = useMemo(() => {
        const categoriesMap = new Map<string, { name: string; parts: Part[] }>();
        CATEGORY_DEFINITIONS.forEach(catDef => {
            categoriesMap.set(catDef.value, { name: catDef.name, parts: [] });
        });

        Object.values(selectedParts).forEach(part => {
            const categoryData = categoriesMap.get(part.category);
            if (categoryData) {
                categoryData.parts.push(part);
            } else {
                const miscCategory = categoriesMap.get('miscellaneous');
                if (miscCategory) {
                    miscCategory.parts.push(part);
                } else {
                    console.warn(`Selected part (ID: ${part.id}) has unknown category "${part.category}" and 'miscellaneous' not defined.`);
                }
            }
        });

        return Array.from(categoriesMap.entries())
            .map(([value, { name, parts }]) => ({ name, value, parts }))
            .filter(category => category.parts.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedParts]);

    const handlePartSelect = (part: Part) => {
        setSelectedParts((prevSelectedParts) => {
            const partId = part.id;
            if (prevSelectedParts[partId]) {
                const { [partId]: removed, ...rest } = prevSelectedParts;
                return rest;
            } else {
                if (isPartCompatible(part, selectedCar)) {
                    return { ...prevSelectedParts, [partId]: part };
                } else {
                    console.warn(`Attempted to add incompatible part (safeguard): ${part.name} (${part.model_designator}) to ${selectedCar}`);
                    return prevSelectedParts;
                }
            }
        });
    };

    const handleIndividualBuyNow = (part: Part) => {
        if (part.url) {
            window.open(part.url, '_blank', 'noopener,noreferrer');
        } else {
            console.warn(`No URL available for part: ${part.name}`);
        }
    };

    const handleCategorySelect = (categoryValue: string) => {
        setActiveCategory(categoryValue);
        if (categoryValue !== 'tunes') {
             setSelectedTurbo(TURBO_OPTIONS[0]);
             setSelectedTransmission(TRANSMISSION_OPTIONS[0]);
        }
    };

    const clearAllParts = () => {
        setSelectedParts({});
        setActiveCategory(null);
        setSelectedTurbo(TURBO_OPTIONS[0]);
        setSelectedTransmission(TRANSMISSION_OPTIONS[0]);
    };

    const handleBuyNowClick = () => {
        console.log("Initiating purchase for selected parts:", selectedParts);
        setIsBuyNowPopupOpen(false);
        Object.values(selectedParts).forEach(part => {
            if(part.url) window.open(part.url, '_blank', 'noopener,noreferrer');
        });
    };

    const filterTunes = (parts: Part[]): Part[] => {
        return parts.filter(part => {
            const turboMatch = selectedTurbo === 'All' ||
                (part.compatible_turbos?.includes(selectedTurbo)) ||
                (!part.compatible_turbos && part.name.toLowerCase().includes(selectedTurbo.toLowerCase())); // Fallback to name check

            const transmissionMatch = selectedTransmission === 'All' ||
                (part.compatible_transmissions?.includes(selectedTransmission)) ||
                (!part.compatible_transmissions && part.name.toLowerCase().includes(selectedTransmission.toLowerCase())); // Fallback to name check

            return turboMatch && transmissionMatch;
        });
    };


    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-50">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-start">
                        <Link href="/" className="flex items-start">
                            <Image
                                src="/CPP-Letter.png"
                                width={160}
                                height={80}
                                alt="CarPartPicker Logo"
                                priority
                            />
                        </Link>
                    </div>
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild><Link href="/builder">Builder</Link></BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Configurator</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex flex-1 items-center justify-end gap-4 p-4">
                        <Select value={selectedCar} onValueChange={(value) => {
                            setSelectedCar(value);
                            setActiveCategory(null);
                            setSelectedParts({});
                        }}>
                            <SelectTrigger className="w-[220px] bg-background text-foreground">
                                <SelectValue placeholder="Select Car Version" />
                            </SelectTrigger>
                            <SelectContent>
                                {CAR_VERSIONS.map(version => (
                                    <SelectItem key={version} value={version}>
                                        {version}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {loadingAuth ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : user ? (
                            <div className="text-sm text-foreground"></div> // Placeholder for logged-in user info/button
                        ) : (
                            <Link href="/login" className={cn("items-end", buttonVariants({ variant: "customblue" }))}>Log in!</Link>
                        )}
                    </div>
                </header>

                <div className="font-inter min-h-[calc(100vh-4rem)] bg-background text-foreground">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8">
                        <h1 className="text-3xl font-semibold text-blue-500 mb-6 text-center">
                            CarPartPicker Build Configurator
                        </h1>

                        {fetchError && (
                            <div className="text-red-500 bg-red-100 border border-red-500 rounded-md p-4 mb-4 text-center text-lg">{fetchError}</div>
                        )}

                        {loadingParts ? (
                            <div className="text-center text-blue-500 text-xl py-10">Loading parts, please wait...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
                                <div className="category-selection md:col-span-3 flex flex-col space-y-2 md:space-y-3 lg:space-y-4">
                                    {categorizedParts.map((category) => (
                                        <Button
                                            key={category.value}
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start px-4 py-3 rounded-md text-gray bg-blue2 hover:bg-blue-700 transition duration-300 ease-in-out font-medium text-sm md:text-base",
                                                activeCategory === category.value && "bg-blue ring-2 ring-blue-400"
                                            )}
                                            onClick={() => handleCategorySelect(category.value)}
                                        >
                                            {category.name} ({category.value === 'tunes' ? filterTunes(category.parts).length : category.parts.length})
                                        </Button>
                                    ))}
                                     {categorizedParts.length === 0 && !loadingParts && (
                                         <p className="text-muted-foreground p-4 text-center bg-card rounded-md">No parts available for {selectedCar}. Try a different selection or check back later.</p>
                                     )}
                                </div>

                                <div className="part-selection md:col-span-6 overflow-y-auto max-h-[calc(100vh-12rem)] bg-card p-3 rounded-md border">
                                    {activeCategory ? (
                                        categorizedParts
                                            .filter(cat => cat.value === activeCategory)
                                            .map((category) => {
                                                const partsToDisplay = category.value === 'tunes'
                                                    ? filterTunes(category.parts)
                                                    : category.parts;

                                                return (
                                                    <div key={category.value} className="space-y-4">
                                                        <h2 className="text-2xl font-semibold text-foreground mb-4 sticky top-0 bg-card py-2 z-10 border-b">
                                                            {category.name}
                                                        </h2>

                                                        {/* Add Tune Filters only for the Tunes category */}
                                                        {category.value === 'tunes' && (
                                                            <div className="flex flex-col sm:flex-row gap-4 mb-4 p-2 border-b">
                                                                <Select value={selectedTurbo} onValueChange={setSelectedTurbo}>
                                                                    <SelectTrigger className="w-full sm:w-[180px] bg-background text-foreground">
                                                                        <SelectValue placeholder="Select Turbo" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {TURBO_OPTIONS.map(option => (
                                                                            <SelectItem key={option} value={option}>
                                                                                {option} {option !== 'All' && 'Turbo'}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                                                                    <SelectTrigger className="w-full sm:w-[180px] bg-background text-foreground">
                                                                        <SelectValue placeholder="Select Transmission" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {TRANSMISSION_OPTIONS.map(option => (
                                                                            <SelectItem key={option} value={option}>
                                                                                {option} {option !== 'All' && 'Transmission'}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}

                                                        {partsToDisplay.length === 0 ? (
                                                             <div className="text-center text-muted-foreground py-8">
                                                                 <p className="text-lg">No parts available matching the current filters in &quot;{category.name}&quot; for {selectedCar}.</p>
                                                             </div>
                                                        ) : (
                                                            partsToDisplay.map(part => (
                                                                <div key={part.id} className="part-item bg-background/70 backdrop-blur-sm p-4 rounded-lg shadow-md border border-border hover:border-primary transition-all duration-300">
                                                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                                                        <div className="mb-3 sm:mb-0 flex-grow">
                                                                            <h3 className="text-lg font-semibold text-foreground">{part.manufacturer} - {part.name}</h3>
                                                                            <p className="text-md text-blue-500 font-medium">${part.price.toFixed(2)}</p>
                                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                                Category: {CATEGORY_DEFINITIONS.find(cd => cd.value === part.category)?.name || part.category}
                                                                            </p>
                                                                            {part.model_designator && <p className="text-xs text-amber-500 mt-1">Fits: {part.model_designator}</p>}
                                                                        </div>
                                                                        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 items-stretch sm:items-center flex-shrink-0">
                                                                            {part.url && (
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => handleIndividualBuyNow(part)}
                                                                                    className="w-full sm:w-auto text-primary border-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                                                                                >
                                                                                    View Details
                                                                                </Button>
                                                                            )}
                                                                            <Button
                                                                                variant={selectedParts[part.id] ? "destructive" : "customblue"}
                                                                                size="sm"
                                                                                onClick={() => handlePartSelect(part)}
                                                                                className="w-full sm:w-auto transition-colors duration-200"
                                                                            >
                                                                                {selectedParts[part.id] ? 'Remove' : 'Add to Build'}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="text-center text-muted-foreground text-xl mt-8 flex flex-col items-center justify-center h-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-circle mb-4"><circle cx="12" cy="12" r="10"/><path d="M16 12H8"/><path d="m12 8-4 4 4 4"/></svg>
                                            Select a category from the left to view available parts.
                                        </div>
                                    )}
                                </div>


                                <div className="selected-parts md:col-span-3 bg-blue-700/80 backdrop-blur-md rounded-md shadow-xl p-4 md:p-6 space-y-4 text-white max-h-[calc(100vh-12rem)] overflow-y-auto">
                                    <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-blue-700/80 py-2 z-10">
                                        Your Build
                                    </h2>
                                    <ul id="selected-parts-list" className="space-y-3">
                                        {Object.keys(selectedParts).length === 0 ? (
                                            <li className="text-blue-200 text-sm">No parts selected yet.</li>
                                        ) : (
                                            Object.entries(selectedParts).map(([partId, part]) => (
                                                <li
                                                    key={partId}
                                                    className="flex justify-between items-center text-sm bg-blue-600/50 p-2 rounded-md"
                                                >
                                                    <span className="flex-1 mr-2 truncate" title={`${part.manufacturer} - ${part.name}`}>{part.manufacturer} - {part.name}</span>
                                                    <div className='flex items-center gap-2'>
                                                        <span className="font-medium text-blue-100">
                                                            ${part.price.toFixed(2)}
                                                        </span>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => {
                                                                setSelectedParts((prev: { [key: string]: Part }) => {
                                                                    const { [partId]: removed, ...rest } = prev;
                                                                    return rest;
                                                                });
                                                            }}
                                                            className="h-6 w-6 text-xs"
                                                        >
                                                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                    <div className="summary-section border-t border-blue-500 pt-4 space-y-3 sticky bottom-0 bg-blue-700/80 py-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-semibold text-white">Total Price:</h3>
                                            <p id="total-price" className="text-xl font-bold text-blue-200">
                                                ${totalPrice.toFixed(2)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out text-sm"
                                            onClick={clearAllParts}
                                        >
                                            Clear All Parts
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out text-sm"
                                            onClick={() => setIsBuyNowPopupOpen(true)}
                                            disabled={Object.keys(selectedParts).length === 0}
                                        >
                                            Review & Buy Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SidebarInset>

            <Dialog open={isBuyNowPopupOpen} onOpenChange={setIsBuyNowPopupOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-card text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Confirm Your Build</DialogTitle>
                        <DialogDescription>
                            Review the parts in your build. Clicking &quot;Proceed to Checkout&quot; will open each part&apos;s URL.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        {selectedPartsByCategory.length === 0 ? (
                            <p className="text-muted-foreground">No parts selected for purchase.</p>
                        ) : (
                            selectedPartsByCategory.map(category => (
                                <div key={category.value} className="space-y-3">
                                    <h3 className="text-lg font-semibold border-b border-border pb-2 text-primary">{category.name}</h3>
                                    <ul className="space-y-2">
                                        {category.parts.map(part => (
                                            <li key={part.id} className="text-sm border-b border-border/50 pb-2 last:border-b-0">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium mr-2 text-foreground">{part.manufacturer} - {part.name}</span>
                                                    <span className="text-primary font-medium">${part.price.toFixed(2)}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate mt-1">
                                                    <a href={part.url} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                                                        {part.url}
                                                    </a>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4 pt-4 border-t border-border">
                        <div className="text-lg font-bold text-foreground">Total: ${totalPrice.toFixed(2)}</div>
                        <Button
                            onClick={handleBuyNowClick}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={Object.keys(selectedParts).length === 0}
                        >
                            Proceed to Checkout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
};

export default AutomotiveBuildConfigurator;
