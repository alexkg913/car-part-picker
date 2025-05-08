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

// Initialize Firebase client app if not already initialized
let firebaseApp: FirebaseApp;
if (typeof window !== 'undefined' && getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
} else if (typeof window !== 'undefined' && getApps().length > 0) {
    firebaseApp = getApps()[0];
}

// Firestore instance using the client app
let clientDb: Firestore | undefined;
if (typeof window !== 'undefined' && firebaseApp) {
    clientDb = getFirestore(firebaseApp);
}

// Updated Part interface to match the Firestore data structure
interface Part {
    id: string; // Firestore document ID
    name: string;
    price: number;
    category: string; // Stored as lowercase-hyphenated
    manufacturer: string;
    model_designator: string; // Keep in interface as it's in DB, but won't display
    url: string;
}

// The Category interface for structuring displayed data
interface DisplayCategory {
    name: string; // Display name (e.g., "Cold Air Intake")
    value: string; // Firestore collection name (e.g., "cold-air-intake")
    parts: Part[];
}

// Define the known categories and their display names and collection values
// Ensure the 'value' matches the lowercase-hyphenated category names in Firestore
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
    { name: 'Miscellaneous', value: 'miscellaneous' }, // Include miscellaneous category
];


const AutomotiveBuildConfigurator = () => {
    const [selectedParts, setSelectedParts] = useState<{ [key: string]: Part }>({});
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [firestoreParts, setFirestoreParts] = useState<Part[]>([]);
    const [loadingParts, setLoadingParts] = useState(true);
    const [refreshingParts, setRefreshingParts] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null); // State for initial fetch error


    // Auth State Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Parts from Firestore (from multiple collections)
    const fetchParts = async () => {
        setLoadingParts(true);
        setFetchError(null); // Clear previous fetch errors
        setFirestoreParts([]); // Clear existing parts while loading

        if (!clientDb) {
            console.error("Firestore client is not initialized.");
            setLoadingParts(false);
            setFetchError("Firestore client is not initialized.");
            return;
        }

        try {
            const allParts: Part[] = [];
            // Fetch from each known category collection
            for (const categoryDef of CATEGORY_DEFINITIONS) {
                const collectionRef = collection(clientDb, categoryDef.value); // Use category value as collection name
                const querySnapshot = await getDocs(collectionRef);
                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Validate data structure against the updated Part interface
                    if (
                        typeof data.id === 'string' &&
                        typeof data.name === 'string' &&
                        typeof data.price === 'number' &&
                        typeof data.category === 'string' &&
                        typeof data.manufacturer === 'string' &&
                        typeof data.model_designator === 'string' && // Validate this field too, even if not displayed
                        typeof data.url === 'string'
                    ) {
                         allParts.push({
                             id: doc.id, // Use Firestore doc ID as the primary ID
                             name: data.name,
                             price: data.price,
                             category: data.category,
                             manufacturer: data.manufacturer,
                             model_designator: data.model_designator,
                             url: data.url,
                         });
                    } else {
                         console.warn(`Skipping invalid part data from collection ${categoryDef.value} (missing/incorrect fields):`, data);
                    }
                });
            }
            setFirestoreParts(allParts);
            setLoadingParts(false);
        } catch (error: any) {
            console.error('Error fetching parts from Firestore:', error);
            setLoadingParts(false);
            setFetchError(`Error fetching parts: ${error.message || 'Unknown error'}`);
        }
    };

    // Fetch parts on component mount
    useEffect(() => {
        fetchParts();
    }, []); // Empty dependency array means this runs once on mount

    // Calculate total price whenever selected parts change
    useEffect(() => {
        const newTotalPrice = Object.values(selectedParts).reduce((sum, part) => sum + part.price, 0);
        setTotalPrice(newTotalPrice);
    }, [selectedParts]);

    // Group parts by category for display
    const categorizedParts: DisplayCategory[] = useMemo(() => {
        const categoriesMap = new Map<string, { name: string; parts: Part[] }>();

        // Initialize map with all known categories
        CATEGORY_DEFINITIONS.forEach(catDef => {
            categoriesMap.set(catDef.value, { name: catDef.name, parts: [] });
        });

        // Populate categories with fetched parts
        firestoreParts.forEach(part => {
            const categoryDef = CATEGORY_DEFINITIONS.find(def => def.value === part.category);
            if (categoryDef) {
                 categoriesMap.get(categoryDef.value)?.parts.push(part);
            } else {
                // Handle parts with categories not in CATEGORY_DEFINITIONS (should go to Miscellaneous)
                const miscCategory = categoriesMap.get('miscellaneous');
                if (miscCategory) {
                    miscCategory.parts.push(part);
                } else {
                    console.warn(`Part with unknown category "${part.category}" found and 'miscellaneous' category not defined:`, part);
                }
            }
        });

        // Convert map to sorted array and sort parts within each category
        const sortedCategories = Array.from(categoriesMap.entries())
            .map(([value, { name, parts }]) => ({
                name,
                value,
                parts,
            }))
             .sort((a, b) => a.name.localeCompare(b.name)); // Sort categories alphabetically by name

        sortedCategories.forEach(cat => {
            cat.parts.sort((a, b) => a.name.localeCompare(b.name)); // Sort parts alphabetically by name
        });

        return sortedCategories;

    }, [firestoreParts]);

    const handlePartSelect = (part: Part) => {
        setSelectedParts((prevSelectedParts) => {
            const partId = part.id;
            // If the part is already selected, remove it
            if (prevSelectedParts[partId]) {
                const { [partId]: removed, ...rest } = prevSelectedParts;
                return rest;
            } else {
                // If the part is not selected, add it
                return { ...prevSelectedParts, [partId]: part };
            }
        });
    };

    const handleCategorySelect = (categoryValue: string) => {
        setActiveCategory(categoryValue);
    };

    const clearAllParts = () => {
        setSelectedParts({});
        setActiveCategory(null);
    };

    const handleRefreshPartsList = async () => {
        setRefreshingParts(true);
        setRefreshError(null);
        setFetchError(null); // Clear fetch error on refresh attempt
        try {
            // Call your API route to run the Python script and update Firestore
            const response = await fetch('/api/refresh-parts', {
                method: 'POST',
                // Include headers if your API route requires authentication or content type
                headers: {
                     'Content-Type': 'application/json',
                     // 'Authorization': `Bearer ${await user?.getIdToken()}`, // Example if API requires user auth
                },
                // Include a body if your API route expects one, e.g., { refresh: true }
                // body: JSON.stringify({ refresh: true }),
            });

            if (!response.ok) {
                // Attempt to read error message from response body if available
                const errorData = await response.json().catch(() => ({ message: 'API call failed with non-JSON response' }));
                throw new Error(errorData.message || `API call failed with status: ${response.status}`);
            }

            const result = await response.json();
            console.log(result.message);

            // After successful API call, refetch parts from Firestore to update the UI
            await fetchParts();

        } catch (error: any) {
            console.error('Error refreshing parts list:', error);
            setRefreshError(error.message || 'An unexpected error occurred during refresh.');
        } finally {
            setRefreshingParts(false);
        }
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
                                alt="CarPartPicker Logo"
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
                           {/* Refresh Parts Button - Only show if Firestore client is initialized */}
                           {clientDb ? (
                                <Button
                                    variant="outline"
                                    onClick={handleRefreshPartsList}
                                    disabled={refreshingParts || loadingParts} // Disable while refreshing or initially loading
                                    className={cn(
                                        "bg-green-500 hover:bg-green-700 text-white",
                                        buttonVariants({ variant: "outline" })
                                    )}
                                >
                                    {refreshingParts ? 'Refreshing...' : 'Refresh Parts List'}
                                </Button>
                           ) : null}


                         {/* Display refresh error if any */}
                         {refreshError && (
                             <div className="text-red-500 text-sm">{refreshError}</div>
                         )}

                        {/* Login/Loading Auth Status */}
                        {loadingAuth ? (
                            <div className="text-white">Loading Auth...</div>
                        ) : user ? (
                            <div className="text-white">Logged in as {user.email}</div>
                        ) : (
                            <Link href="/login" className={cn("items-end", buttonVariants({ variant: "customblue" }))}>Log in!</Link>
                        )}
                    </div>
                </header>
                <div className="font-inter min-h-screen">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8">
                        <h1 className="text-3xl font-semibold text-blue mb-6 text-center">
                            CarPartPicker Build Configurator
                        </h1>

                        {/* Display initial fetch error if any */}
                        {fetchError && (
                            <div className="text-red-500 mb-4 text-center text-xl">{fetchError}</div>
                        )}

                        {/* Loading state for initial parts fetch */}
                        {loadingParts ? (
                             <div className="text-center text-blue text-xl">Loading parts...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                                {/* Category Selection */}
                                <div className="category-selection flex flex-col space-y-2 md:space-y-3 lg:space-y-4">
                                    {categorizedParts.map((category) => (
                                        <Button
                                            key={category.value}
                                            variant="ghost"
                                            className={cn(
                                                "px-4 py-2 rounded-md text-white bg-blue hover:bg-blue2 transition duration-300 ease-in-out font-medium text-sm md:text-base lg:text-lg",
                                                activeCategory === category.value && "bg-blue2"
                                            )}
                                            onClick={() => handleCategorySelect(category.value)}
                                        >
                                            {category.name} ({category.parts.length}) {/* Display part count */}
                                        </Button>
                                    ))}
                                </div>

                                {/* Part Selection */}
                                <div className="part-selection col-span-2 md:col-span-2 lg:col-span-3">
                                     {/* Display refresh error within the part selection area */}
                                     {refreshError && (
                                         <div className="text-red-500 mb-4 text-center">{refreshError}</div>
                                     )}
                                    {/* Render part lists only for the active category */}
                                    {categorizedParts.map((category) => (
                                        activeCategory === category.value && (
                                            <div
                                                key={category.value}
                                                id={category.value}
                                                className="part-list bg-blue2 rounded-md shadow-md p-4 md:p-6 lg:p-8 space-y-3 md:space-y-4 lg:space-y-5"
                                            >
                                                <h2 className="text-xl font-semibold text-blue-500 mb-4 md:mb-5 lg:mb-6">
                                                    {category.name}
                                                </h2>
                                                <ul className="space-y-2 md:space-y-3 lg:space-y-4">
                                                    {category.parts.length === 0 ? (
                                                         <li className="text-white text-sm md:text-base lg:text-lg">No parts available in this category.</li>
                                                    ) : (
                                                         category.parts.map((part) => (
                                                             <li
                                                                 key={part.id}
                                                                 className={cn(
                                                                     "part-item px-4 py-2 rounded-md text-white hover:bg-blue transition duration-300 ease-in-out cursor-pointer text-sm md:text-base lg:text-lg",
                                                                     selectedParts[part.id] && "bg-blue text-white"
                                                                 )}
                                                                 onClick={() => handlePartSelect(part)}
                                                                 data-part={part.id}
                                                             >
                                                                 {/* Display Manufacturer, Name, Price, and Category */}
                                                                 <div className="flex justify-between items-center">
                                                                     <span className="font-medium">{part.manufacturer} - {part.name}</span>
                                                                     <span className="part-price font-medium">${part.price.toFixed(2)}</span>
                                                                 </div>
                                                                 {/* Optional: Display URL or Category below the name */}
                                                                 {/* <div className="text-xs text-gray-300">{part.category} | <a href={part.url} target="_blank" rel="noopener noreferrer" className="underline">{part.url}</a></div> */}
                                                             </li>
                                                         ))
                                                    )}
                                                </ul>
                                            </div>
                                        )
                                    ))}
                                     {/* Message if no category is selected */}
                                     {!activeCategory && (
                                         <div className="text-center text-white text-xl mt-8">Select a category to view parts.</div>
                                     )}
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
                                                     {/* Display Manufacturer and Name for selected parts */}
                                                     <span className="flex-1 mr-2 truncate">{part.manufacturer} - {part.name}</span>
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
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default AutomotiveBuildConfigurator;
