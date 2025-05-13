"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/firebase";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion";
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
import { firebaseConfig, app } from "@/lib/firebase/firebase"
import { initializeApp } from 'firebase/app';

interface UserData {
    uid: string;
    email: string;
    username: string;
    profilePicture: string | null;
    bio?: string;
}

const AccountSettingsPage = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [newUsername, setNewUsername] = useState("");
    const [newBio, setNewBio] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false); // Track editing state


    const user = auth.currentUser;

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) {
                console.log("User is not logged in.");
                return; 
            }
            setIsLoading(true);
            try {
                console.log("Fetching user data for UID:", user.uid); // Add this line
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    console.log("User data found:", userDoc.data()); // Add this line
                    setUserData(userDoc.data() as UserData);
                    setNewUsername(userDoc.data().username || "");
                    setNewBio(userDoc.data().bio || "");
                } else {
                    console.log("User document does not exist in Firestore."); // Add this line
                    setError("User data not found.");
                }
            } catch (err: any) {
                console.error("Error fetching user data:", err); // Add this line
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [user]);



    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!user) {
            setError("User not authenticated.");
            setIsLoading(false);
            return;
        }

        try {
            const userRef = doc(db, 'users', user.uid);
            const updateData: Partial<UserData> = {
                username: newUsername,
                bio: newBio
            };

            await setDoc(userRef, {
                ...userData, 
                ...updateData
            });

            if (newUsername !== userData?.username) {
                await updateProfile(user, {
                    displayName: newUsername,
                });
            }


            // 4. Update local state
            setUserData(prev => ({
                ...prev!,
                username: newUsername,
                bio: newBio
            }));
            setIsEditing(false);
            console.log("Profile updated successfully!");

        } catch (error: any) {
            setError(error.message);
            console.error("Error updating profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setNewUsername(userData?.username || "");
        setNewBio(userData?.bio || "");
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>No user data found.  Please log in.</p>
            </div>
        );
    }

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
                  Home
              </BreadcrumbItem>
              <BreadcrumbSeparator/>
              <BreadcrumbItem className="hidden md:block">
                Account
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-1 items-end justify-end gap-4 p-4">
          </div>
        </header>
       <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                        <AvatarImage src={userData.profilePicture || undefined} alt="Profile picture" />
                        <AvatarFallback>{userData.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={userData.email}
                            disabled
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        {isEditing ? (
                            <Input
                                id="username"
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        ) : (
                            <Input
                                id="username"
                                type="text"
                                value={userData.username}
                                disabled
                            />
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                        <Textarea
                            id="bio"
                            value={newBio}
                            onChange={(e) => setNewBio(e.target.value)}
                            rows={3}
                            disabled={isLoading}
                        />
                    ) : (
                        <Textarea
                            id="bio"
                            value={userData.bio || ""}
                            rows={3}
                            disabled
                        />
                    )}
                </div>
                <AnimatePresence>
                    {isEditing ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex gap-4"
                        >
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                                Cancel
                            </Button>
                        </motion.div>
                    ) : (
                        <Button type="button" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </AnimatePresence>
                {error && <p className="text-red-500">{error}</p>}
            </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
        
    );
};

export default AccountSettingsPage;

