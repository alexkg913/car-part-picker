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
import { auth, firebaseConfig } from "@/lib/firebase/firebase" // Assuming firebase.ts or .js
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
// Initialize Firebase app only on the client side
if (typeof window !== 'undefined') {
    if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApps()[0];
    }
}

let clientDb: Firestore | undefined;
// Initialize Firestore client only on the client side and if firebaseApp is initialized
if (typeof window !== 'undefined' && firebaseApp) {
    clientDb = getFirestore(firebaseApp);
}

interface Part {
    id: string;
    name: string;
    price: number;
    category: string; // Should match one of the CATEGORY_DEFINITIONS values
    manufacturer: string;
    model_designator: string; // e.g., "VW MQB AWD", "VW MQB FWD", "VW MQB", or empty
    url: string;
}

interface DisplayCategory {
    name: string; // Display name, e.g., "Intakes"
    value: string; // Key value, e.g., "intakes"
    parts: Part[];
}

// Definitions for part categories and their corresponding Firestore collection names
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

// Available car versions for filtering parts
const CAR_VERSIONS = ['VW/Audi MQB AWD', 'VW/Audi MQB FWD'];

// Helper function to determine if a part is compatible with the selected car version
const isPartCompatible = (part: Part, currentSelectedCar: string): boolean => {
    const partDesignator = part.model_designator ? part.model_designator.toLowerCase().trim() : "";
    const lowerSelectedCar = currentSelectedCar.toLowerCase().trim(); // e.g., "vw/audi mqb awd"

    // Case 1: Part is universal (no specific designator in Firestore or empty string)
    if (!partDesignator) {
        return true;
    }

    // Case 2: Part is "VW MQB" - always show, compatible with both "VW/Audi MQB AWD" and "VW/Audi MQB FWD"
    if (partDesignator === "vw mqb") {
        return true;
    }

    // Case 3: Part is "VW MQB AWD" - only compatible if "VW/Audi MQB AWD" is selected
    if (partDesignator === "vw mqb awd") {
        return lowerSelectedCar === "vw/audi mqb awd";
    }

    // Case 4: Part is "VW MQB FWD" - only compatible if "VW/Audi MQB FWD" is selected
    if (partDesignator === "vw mqb fwd") {
        return lowerSelectedCar === "vw/audi mqb fwd";
    }

    // Fallback: If the part's designator doesn't match any of the above specific rules,
    // and it's not a universal part, then it's considered not compatible by default.
    return false;
};


const AutomotiveBuildConfigurator = () => {
    // State for selected parts, keyed by part ID
    const [selectedParts, setSelectedParts] = useState<{ [key: string]: Part }>({});
    // State for the total price of selected parts
    const [totalPrice, setTotalPrice] = useState<number>(0);
    // State for the currently active (selected) category value
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    // State for the authenticated Firebase user
    const [user, setUser] = useState<User | null>(null);
    // State to track authentication loading status
    const [loadingAuth, setLoadingAuth] = useState(true);
    // State to store all parts fetched from Firestore
    const [firestoreParts, setFirestoreParts] = useState<Part[]>([]);
    // State to track loading status of parts from Firestore
    const [loadingParts, setLoadingParts] = useState(true);
    // State to store any error messages during part fetching
    const [fetchError, setFetchError] = useState<string | null>(null);
    // State to control the visibility of the "Buy Now" confirmation dialog
    const [isBuyNowPopupOpen, setIsBuyNowPopupOpen] = useState(false);
    // State for the currently selected car version
    const [selectedCar, setSelectedCar] = useState<string>(CAR_VERSIONS[0]);


    // Effect to subscribe to Firebase authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe(); // Cleanup subscription on component unmount
    }, []);

    // Function to fetch parts from Firestore based on CATEGORY_DEFINITIONS
    const fetchParts = async () => {
        setLoadingParts(true);
        setFetchError(null);
        setFirestoreParts([]); // Clear previous parts

        if (!clientDb) {
            console.error("Firestore client is not initialized.");
            setLoadingParts(false);
            setFetchError("Database connection error. Please try again later.");
            return;
        }

        try {
            const allParts: Part[] = [];
            // Iterate over each category definition to fetch parts from its collection
            for (const categoryDef of CATEGORY_DEFINITIONS) {
                const collectionRef = collection(clientDb, categoryDef.value);
                const querySnapshot = await getDocs(collectionRef);
                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Basic validation for part data structure
                    if (
                        typeof data.name === 'string' &&
                        typeof data.price === 'number' &&
                        typeof data.category === 'string' &&
                        typeof data.manufacturer === 'string' &&
                        // model_designator can be a string (possibly empty), null, or undefined from Firestore
                        (typeof data.model_designator === 'string' || data.model_designator === null || typeof data.model_designator === 'undefined') &&
                        typeof data.url === 'string'
                    ) {
                        allParts.push({
                            id: doc.id, // Use Firestore document ID as part ID
                            name: data.name,
                            price: data.price,
                            category: data.category,
                            manufacturer: data.manufacturer,
                            model_designator: data.model_designator || "", // Ensure it's a string, default to empty if null/undefined
                            url: data.url,
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

    // Effect to fetch parts when the component mounts
    useEffect(() => {
        fetchParts();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Effect to recalculate total price whenever selectedParts changes
    useEffect(() => {
        const newTotalPrice = Object.values(selectedParts).reduce((sum, part) => sum + part.price, 0);
        setTotalPrice(newTotalPrice);
    }, [selectedParts]);

    // Memoized computation to categorize and filter parts based on the selected car version
    const categorizedParts: DisplayCategory[] = useMemo(() => {
        const categoriesMap = new Map<string, { name: string; parts: Part[] }>();

        // Initialize map with all defined categories
        CATEGORY_DEFINITIONS.forEach(catDef => {
            categoriesMap.set(catDef.value, { name: catDef.name, parts: [] });
        });

        // Filter parts based on compatibility with the selected car
        const filteredParts = firestoreParts.filter(part => isPartCompatible(part, selectedCar));

        // Distribute filtered parts into their respective categories
        filteredParts.forEach(part => {
            const categoryData = categoriesMap.get(part.category);
            if (categoryData) {
                categoryData.parts.push(part);
            } else {
                // Fallback to miscellaneous if part's category is not in CATEGORY_DEFINITIONS
                const miscCategory = categoriesMap.get('miscellaneous');
                if (miscCategory) {
                    miscCategory.parts.push(part);
                } else {
                    console.warn(`Part with unknown category "${part.category}" (ID: ${part.id}) and 'miscellaneous' category not defined.`);
                }
            }
        });

        // Convert map to array, filter out empty categories, and sort
        const sortedCategories = Array.from(categoriesMap.entries())
            .map(([value, { name, parts }]) => ({
                name,
                value,
                parts,
            }))
            .filter(category => category.parts.length > 0) // Only show categories with parts for the selected car
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort categories by name

        // Sort parts within each category by name
        sortedCategories.forEach(cat => {
            cat.parts.sort((a, b) => a.name.localeCompare(b.name));
        });

        return sortedCategories;
    }, [firestoreParts, selectedCar]); // Re-calculate when parts data or selected car changes

    // Memoized computation to group selected parts by category for the confirmation dialog
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
    }, [selectedParts]); // Re-calculate when selected parts change

    // Handler to add or remove a part from the selection
    const handlePartSelect = (part: Part) => {
        setSelectedParts((prevSelectedParts) => {
            const partId = part.id;
            if (prevSelectedParts[partId]) { // Part is already selected, so remove it
                const { [partId]: removed, ...rest } = prevSelectedParts;
                return rest;
            } else { // Part is not selected, so add it
                // Safeguard: Check compatibility before adding, though list is already filtered
                if (isPartCompatible(part, selectedCar)) {
                    return { ...prevSelectedParts, [partId]: part };
                } else {
                    console.warn(`Attempted to add incompatible part (safeguard): ${part.name} (${part.model_designator}) to ${selectedCar}`);
                    // Optionally, show a user-facing notification here
                    return prevSelectedParts; // Do not add the incompatible part
                }
            }
        });
    };

    // Handler to open the part's URL in a new tab
    const handleIndividualBuyNow = (part: Part) => {
        if (part.url) {
            window.open(part.url, '_blank', 'noopener,noreferrer');
        } else {
            console.warn(`No URL available for part: ${part.name}`);
            // Optionally, show a user-facing notification
        }
    };

    // Handler to set the active category for displaying parts
    const handleCategorySelect = (categoryValue: string) => {
        setActiveCategory(categoryValue);
    };

    // Handler to clear all selected parts and reset active category
    const clearAllParts = () => {
        setSelectedParts({});
        setActiveCategory(null); // Optionally reset active category view
    };

    // Handler for the "Buy Now" button in the confirmation dialog
    const handleBuyNowClick = () => {
        console.log("Initiating purchase for selected parts:", selectedParts);
        setIsBuyNowPopupOpen(false);
        Object.values(selectedParts).forEach(part => {
            if(part.url) window.open(part.url, '_blank', 'noopener,noreferrer');
        });
    };


    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {/* Header section with logo, breadcrumbs, car selector, and auth status */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-50">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-start">
                        <Link href="/" className="flex items-start">
                            <Image
                                src="/CPP-Letter.png" // Ensure this image is in the /public folder
                                width={160}
                                height={80} // Adjusted for typical logo aspect ratio
                                alt="CarPartPicker Logo"
                                priority // Preload logo image
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
                        {/* Car Version Select Dropdown */}
                        <Select value={selectedCar} onValueChange={(value) => {
                            setSelectedCar(value);
                            setActiveCategory(null); // Reset active category when car changes
                            // setSelectedParts({}); // Uncomment if you want to clear selected parts on car change
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

                        {/* Authentication Status/Login Button */}
                        {loadingAuth ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : user ? (
                            <div className="text-sm text-foreground">Logged in as {user.email}</div>
                        ) : (
                            <Link href="/login" className={cn("items-end", buttonVariants({ variant: "customblue" }))}>Log in!</Link>
                        )}
                    </div>
                </header>

                {/* Main content area */}
                <div className="font-inter min-h-[calc(100vh-4rem)] bg-background text-foreground"> {/* Adjusted min-h for sticky header */}
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
                            // Grid layout for categories, parts list, and selected parts summary
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
                                {/* Category Selection Column */}
                                <div className="category-selection md:col-span-3 flex flex-col space-y-2 md:space-y-3 lg:space-y-4">
                                    {categorizedParts.map((category) => (
                                        <Button
                                            key={category.value}
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start px-4 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-300 ease-in-out font-medium text-sm md:text-base",
                                                activeCategory === category.value && "bg-blue-800 ring-2 ring-blue-400" // Highlight active category
                                            )}
                                            onClick={() => handleCategorySelect(category.value)}
                                        >
                                            {category.name} ({category.parts.length})
                                        </Button>
                                    ))}
                                     {categorizedParts.length === 0 && !loadingParts && (
                                        <p className="text-muted-foreground p-4 text-center bg-card rounded-md">No parts available for {selectedCar}. Try a different selection or check back later.</p>
                                    )}
                                </div>

                                {/* Part Selection Column (Main content) */}
                                <div className="part-selection md:col-span-6 overflow-y-auto max-h-[calc(100vh-12rem)] bg-card p-3 rounded-md border">
                                    {activeCategory ? (
                                        categorizedParts.find(cat => cat.value === activeCategory)?.parts.length === 0 ? (
                                             <div className="text-center text-muted-foreground py-8">
                                                <p className="text-lg">No parts available in &quot;{categorizedParts.find(cat => cat.value === activeCategory)?.name}&quot; for {selectedCar}.</p>
                                            </div>
                                        ) : (
                                            categorizedParts.map((category) => (
                                                activeCategory === category.value ? (
                                                    <div key={category.value} className="space-y-4">
                                                        <h2 className="text-2xl font-semibold text-foreground mb-4 sticky top-0 bg-card py-2 z-10 border-b">
                                                            {category.name}
                                                        </h2>
                                                        {category.parts.map(part => (
                                                            <div key={part.id} className="part-item bg-background/70 backdrop-blur-sm p-4 rounded-lg shadow-md border border-border hover:border-primary transition-all duration-300">
                                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                                                    <div className="mb-3 sm:mb-0 flex-grow">
                                                                        <h3 className="text-lg font-semibold text-foreground">{part.manufacturer} - {part.name}</h3>
                                                                        <p className="text-md text-blue-500 font-medium">${part.price.toFixed(2)}</p>
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            Category: {CATEGORY_DEFINITIONS.find(cd => cd.value === part.category)?.name || part.category}
                                                                        </p>
                                                                         {/* Display model designator for clarity during testing/dev */}
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
                                                        ))}
                                                    </div>
                                                ) : null
                                            ))
                                        )
                                    ) : (
                                        <div className="text-center text-muted-foreground text-xl mt-8 flex flex-col items-center justify-center h-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-circle mb-4"><circle cx="12" cy="12" r="10"/><path d="M16 12H8"/><path d="m12 8-4 4 4 4"/></svg>
                                            Select a category from the left to view available parts.
                                        </div>
                                    )}
                                </div>


                                {/* Selected Parts Summary Column */}
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
                                                            size="icon" // Made icon size for compactness
                                                            onClick={() => {
                                                                setSelectedParts((prev: { [key: string]: Part }) => {
                                                                    const { [partId]: removed, ...rest } = prev;
                                                                    return rest;
                                                                });
                                                            }}
                                                            className="h-6 w-6 text-xs" // Custom small size
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

            {/* Confirmation Dialog for "Buy Now" */}
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

