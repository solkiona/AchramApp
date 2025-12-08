// src/components/app/screens/AssigningScreen.tsx
'use client';

import { Loader } from 'lucide-react';
import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter"

interface RequestStatusProp {
  status: 'loading' | 'accepted' | 'no-driver' | 'error' | null;
}
export default function AssigningScreen({status,}: RequestStatusProp) {
    const isNoDriver = status === "no-driver";
    const error = status === "error";
  //if (status == 'no-driver') // I want to change the spinner to stop spinning 
  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col items-center justify-center px-6">
      {/* Spinner using ACHRAMS primary color */
      }
      <div className="h-screen bg-achrams-bg-primary flex flex-col items-center justify-center px-6">
      {/* Spinner */}
      <div
        className={`w-20 h-20 border-4 border-achrams-primary-solid border-t-transparent rounded-full mb-8 ${
          isNoDriver || error ? "" : "animate-spin"
        }` 
      
      } 
      ></div>

      <h2 className="text-2xl font-bold mb-2 text-achrams-text-primary">
        {isNoDriver ? "No Driver Available" : "Please hold on"}
        {error ? status : "" }
      </h2>

      <p className="text-achrams-text-secondary">
        {isNoDriver || error ? "Try again shortly" : "Assigning a driver"}
      </p>
    </div>
    <ACHRAMFooter />
    </div>
  );
}