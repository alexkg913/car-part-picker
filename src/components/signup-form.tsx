"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { auth, db } from "@/lib/firebase/firebase"; // Import db
import { createUserWithEmailAndPassword } from "firebase/auth";
import { redirect } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions

export function SignUpForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"form">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false); // Add loading state

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        let redirectPath = '#';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const username = email.split('@')[0];

        
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                username: username, 
            });
            console.log("User signed up and document created with username:", username);
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
                <h1 className="text-2xl font-bold">Sign up for an account</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Enter your email below to sign up for an account
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
                    {isLoading ? "Signing Up..." : "Sign Up"}
                </Button>
                <div className="text-center text-sm">
                    Already Have an account?{" "}
                    <a href="login" className="underline underline-offset-4">
                        Log In
                    </a>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
    );
}
