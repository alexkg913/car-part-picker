import React, { useState, useEffect } from 'react';
import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarFooter,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { NavUser } from "@/components/nav-user";
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Auth
import { doc, getDoc, getFirestore } from 'firebase/firestore';  // Import Firestore

const data = {
    cars: ["VW/Audi MQB AWD", "VW/Audi MQB FWD"],
    navMain: [
        {
            title: "Builder",
            url: "../builder",
            items: [
                {
                    title: "Build configurator",
                    url: "../builder/configurator",
                }
            ]
        },
        {
            title: "Parts",
            url: "../parts",
            items: [
                {
                    title: "Engine Parts",
                    url: "../parts/engine-parts",
                },
                {
                    title: "Downpipes",
                    url: "../parts/downpipes",
                },
                {
                    title: "Intakes",
                    url: "../parts/intakes",
                },
                {
                    title: "Turbo Parts",
                    url: "../parts/turbos",
                },
                {
                    title: "Suspension Parts",
                    url: "../parts/suspension-parts",
                },
                {
                    title: "Brake Parts",
                    url: "../parts/brake-parts",
                },
                {
                    title: "Wheels",
                    url: "../parts/wheels",
                },
                {
                    title: "Exhaust Systems",
                    url: "../parts/exhaust-systems",
                },
                {
                    title: "Miscellanious Parts",
                    url: "../parts/misc-parts",
                }
            ],
        },
        {
            title: "Upgrade Paths",
            url: "#",
            items: [
                {
                    title: "Bolt On Upgrades",
                    url: "../upgrade-paths/bolt-ons",
                },
            ],

        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [user, setUser] = useState<{ name: string; email: string; avatar: string }>({
        name: "Guest",
        email: "",
        avatar: "/default.jpg",
    });
    const db = getFirestore();

    useEffect(() => {
        const auth = getAuth(); // Initialize Firebase Auth
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => { 
            if (firebaseUser) {
                let username = firebaseUser.displayName || "User"; // Default
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userRef); 

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    username = userData.username || username; 
                }

                setUser({
                    name: username, 
                    email: firebaseUser.email || "",
                    avatar: firebaseUser.photoURL || "/default.jpg",
                });
            } else {
                setUser({
                    name: "Guest",
                    email: "",
                    avatar: "/default.jpg",
                });
            }
        });

        return () => unsubscribe();
    }, [db]);

    return (
        <Sidebar {...props}>
            <SidebarHeader>
            </SidebarHeader>
            <SidebarContent>
                {data.navMain.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={item.isActive}>
                                            <a href={item.url}>{item.title}</a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
            <SidebarFooter>
                <ModeToggle />
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    );
}

