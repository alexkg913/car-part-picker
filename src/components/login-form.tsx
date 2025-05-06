"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/firebase"; // Import db
import { signInWithEmailAndPassword } from "firebase/auth";
import { redirect } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import Firestore functions

export function SignInForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"form">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        let redirectPath = '#';
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const username = email.split('@')[0];
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    username: username,
                });
                console.log("User document created with username:", username);
            } else {
                const userData = userDoc.data();
                if (!userData.username) {
                  await setDoc(userRef, {
                    ...userData,
                    username: username
                  });
                  console.log("Username added to existing user doc:", username)
                }
            }

            console.log("User signed in:", user);
            redirectPath = '/'
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
            redirect(redirectPath);

        }
    };

    return (
        <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Log in to your account</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Enter your email and password to log in
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging In..." : "Log In"}
                </Button>
                <div className="text-center text-sm">
                    Don't have an account?{" "}
                    <a href="signup" className="underline underline-offset-4">
                        Sign Up
                    </a>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
    );
}
